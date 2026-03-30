from flask import Blueprint, request, jsonify
from app import db
from app.models import Profile, GeneratedContent
from app.services.auth_service import require_auth
from app.services.generator_service import generate_cover_letter, generate_resume_bullets

generator_bp = Blueprint('generator', __name__)


def _get_profile(user_id: int) -> dict:
    profile = Profile.query.filter_by(user_id=user_id).first()
    return profile.to_dict() if profile else {}


@generator_bp.route('/cover-letter', methods=['POST'])
@require_auth
def cover_letter(current_user):
    data = request.get_json()
    job_description = (data.get('job_description') or '').strip()
    if not job_description:
        return jsonify({'message': 'job_description is required'}), 400

    profile = _get_profile(current_user.id)
    content = generate_cover_letter(job_description, profile)

    # Persist
    gen = GeneratedContent(
        user_id        = current_user.id,
        application_id = data.get('application_id'),
        type           = 'cover_letter',
        content        = content,
    )
    db.session.add(gen)
    db.session.commit()

    return jsonify({'content': content, 'id': gen.id})


@generator_bp.route('/resume', methods=['POST'])
@require_auth
def resume_bullets(current_user):
    data = request.get_json()
    job_description = (data.get('job_description') or '').strip()
    if not job_description:
        return jsonify({'message': 'job_description is required'}), 400

    profile = _get_profile(current_user.id)
    content = generate_resume_bullets(job_description, profile)

    gen = GeneratedContent(
        user_id        = current_user.id,
        application_id = data.get('application_id'),
        type           = 'resume',
        content        = content,
    )
    db.session.add(gen)
    db.session.commit()

    return jsonify({'content': content, 'id': gen.id})
