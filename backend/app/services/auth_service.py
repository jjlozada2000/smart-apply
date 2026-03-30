import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, current_app
from app.models import User

def generate_token(user_id: int) -> str:
    expiry = datetime.now(timezone.utc) + timedelta(hours=current_app.config['JWT_EXPIRY_HOURS'])
    return jwt.encode(
        {'user_id': user_id, 'exp': expiry},
        current_app.config['SECRET_KEY'],
        algorithm=current_app.config['JWT_ALGORITHM'],
    )

def decode_token(token: str) -> dict:
    return jwt.decode(
        token,
        current_app.config['SECRET_KEY'],
        algorithms=[current_app.config['JWT_ALGORITHM']],
    )

def require_auth(f):
    """Decorator that injects current_user into the route."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'message': 'Missing token'}), 401
        token = auth_header[7:]
        try:
            payload = decode_token(token)
            user = User.query.get(payload['user_id'])
            if not user:
                return jsonify({'message': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
        return f(user, *args, **kwargs)
    return decorated
