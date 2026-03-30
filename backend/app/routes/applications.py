from flask import Blueprint, request, jsonify
from datetime import date
from app import db
from app.models import Application
from app.services.auth_service import require_auth

applications_bp = Blueprint('applications', __name__)

VALID_STATUSES = {'applied', 'interview', 'rejected', 'offer'}


@applications_bp.route('', methods=['GET'])
@require_auth
def list_applications(current_user):
    apps = Application.query.filter_by(user_id=current_user.id)\
               .order_by(Application.date_applied.desc()).all()
    return jsonify([a.to_dict() for a in apps])


@applications_bp.route('', methods=['POST'])
@require_auth
def create_application(current_user):
    data = request.get_json()

    if not data.get('company') or not data.get('role'):
        return jsonify({'message': 'Company and role are required'}), 400

    status = data.get('status', 'applied')
    if status not in VALID_STATUSES:
        return jsonify({'message': f'Invalid status. Must be one of: {", ".join(VALID_STATUSES)}'}), 400

    date_applied = data.get('date_applied')
    try:
        parsed_date = date.fromisoformat(date_applied) if date_applied else date.today()
    except ValueError:
        parsed_date = date.today()

    app = Application(
        user_id      = current_user.id,
        company      = data['company'].strip(),
        role         = data['role'].strip(),
        job_link     = data.get('job_link'),
        status       = status,
        date_applied = parsed_date,
        notes        = data.get('notes'),
    )
    db.session.add(app)
    db.session.commit()
    return jsonify(app.to_dict()), 201


@applications_bp.route('/<int:app_id>', methods=['PATCH'])
@require_auth
def update_application(current_user, app_id):
    app = Application.query.filter_by(id=app_id, user_id=current_user.id).first_or_404()
    data = request.get_json()

    if 'company'      in data: app.company  = data['company'].strip()
    if 'role'         in data: app.role     = data['role'].strip()
    if 'job_link'     in data: app.job_link = data['job_link']
    if 'notes'        in data: app.notes    = data['notes']
    if 'status'       in data:
        if data['status'] not in VALID_STATUSES:
            return jsonify({'message': 'Invalid status'}), 400
        app.status = data['status']
    if 'date_applied' in data:
        try: app.date_applied = date.fromisoformat(data['date_applied'])
        except ValueError: pass

    db.session.commit()
    return jsonify(app.to_dict())


@applications_bp.route('/<int:app_id>', methods=['DELETE'])
@require_auth
def delete_application(current_user, app_id):
    app = Application.query.filter_by(id=app_id, user_id=current_user.id).first_or_404()
    db.session.delete(app)
    db.session.commit()
    return '', 204
