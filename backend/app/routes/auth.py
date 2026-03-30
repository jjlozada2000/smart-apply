import json
from flask import Blueprint, request, jsonify, redirect, current_app
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from app import db
from app.models import User
from app.services.auth_service import generate_token
from app.services.email_service import credentials_to_dict

auth_bp = Blueprint('auth', __name__)


def _get_flow():
    cfg = current_app.config
    return Flow.from_client_config(
        {
            'web': {
                'client_id':     cfg['GOOGLE_CLIENT_ID'],
                'client_secret': cfg['GOOGLE_CLIENT_SECRET'],
                'auth_uri':      'https://accounts.google.com/o/oauth2/auth',
                'token_uri':     'https://oauth2.googleapis.com/token',
                'redirect_uris': [cfg['GOOGLE_REDIRECT_URI']],
            }
        },
        scopes=cfg['GOOGLE_SCOPES'],
        redirect_uri=cfg['GOOGLE_REDIRECT_URI'],
    )


@auth_bp.route('/google', methods=['GET'])
def google_login():
    """Return the Google OAuth URL for the frontend to redirect to."""
    flow = _get_flow()
    auth_url, _ = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent',          # always show consent so we get refresh_token
    )
    return jsonify({'auth_url': auth_url})


@auth_bp.route('/callback', methods=['GET'])
def google_callback():
    """
    Google redirects here after sign-in.
    Exchange code → credentials → upsert user → issue JWT → redirect to frontend.
    """
    code  = request.args.get('code')
    error = request.args.get('error')
    frontend = current_app.config['FRONTEND_URL']

    if error or not code:
        return redirect(f'{frontend}/login?error=oauth_cancelled')

    try:
        flow  = _get_flow()
        flow.fetch_token(code=code)
        creds = flow.credentials

        # Fetch Google profile
        service  = build('oauth2', 'v2', credentials=creds)
        userinfo = service.userinfo().get().execute()

        google_id = userinfo['id']
        email     = userinfo['email']
        name      = userinfo.get('name', '')
        avatar    = userinfo.get('picture', '')

        # Upsert user
        user = User.query.filter_by(google_id=google_id).first()
        if not user:
            # Also check by email in case they had an old account
            user = User.query.filter_by(email=email).first()
        if not user:
            user = User(google_id=google_id, email=email, name=name, avatar_url=avatar)
            db.session.add(user)
        else:
            user.google_id  = google_id
            user.name       = name
            user.avatar_url = avatar

        # Always update Gmail credentials (refreshes tokens)
        user.gmail_credentials = json.dumps(credentials_to_dict(creds))
        db.session.commit()

        token = generate_token(user.id)
        return redirect(f'{frontend}/auth/success?token={token}')

    except Exception as e:
        return redirect(f'{frontend}/login?error={str(e)}')


@auth_bp.route('/me', methods=['GET'])
def me():
    """Lightweight endpoint to validate a token and return user info."""
    from app.services.auth_service import require_auth
    from flask import g

    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return jsonify({'message': 'Missing token'}), 401

    import jwt
    try:
        payload = jwt.decode(
            auth_header[7:],
            current_app.config['SECRET_KEY'],
            algorithms=[current_app.config['JWT_ALGORITHM']],
        )
        user = User.query.get(payload['user_id'])
        if not user:
            return jsonify({'message': 'User not found'}), 401
        return jsonify(user.to_dict())
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401