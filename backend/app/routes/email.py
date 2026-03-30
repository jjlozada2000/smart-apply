from flask import Blueprint, jsonify
from app import db
from app.models import Application
from app.services.auth_service import require_auth
from app.services.email_service import sync_inbox, dict_to_credentials, get_gmail_email
import json

email_bp = Blueprint('email', __name__)


@email_bp.route('/status', methods=['GET'])
@require_auth
def email_status(current_user):
    if not current_user.gmail_credentials:
        return jsonify({'connected': False})
    creds = dict_to_credentials(json.loads(current_user.gmail_credentials))
    email = get_gmail_email(creds)
    return jsonify({'connected': True, 'email': email})


@email_bp.route('/sync', methods=['POST'])
@require_auth
def sync_email(current_user):
    if not current_user.gmail_credentials:
        return jsonify({'message': 'Gmail not connected — please sign out and sign in again'}), 400
    applications = Application.query.filter_by(user_id=current_user.id).all()
    updated = sync_inbox(current_user, applications)
    db.session.commit()
    return jsonify({'updated': updated})
