from flask import Blueprint, request, jsonify, send_file, current_app
from app import db
from app.models import Profile
from app.services.auth_service import require_auth
import anthropic
import json
import base64
import io

profile_bp = Blueprint('profile', __name__)


@profile_bp.route('', methods=['GET'])
@require_auth
def get_profile(current_user):
    profile = Profile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        return jsonify({'projects': [], 'experience': [], 'skills': [], 'prewritten_answers': {}})
    return jsonify(profile.to_dict())


@profile_bp.route('', methods=['PUT'])
@require_auth
def save_profile(current_user):
    data = request.get_json()

    profile = Profile.query.filter_by(user_id=current_user.id).first()
    if profile:
        profile.data = data
    else:
        profile = Profile(user_id=current_user.id, data=data)
        db.session.add(profile)

    db.session.commit()
    return jsonify(profile.to_dict())


@profile_bp.route('/parse-resume', methods=['POST'])
@require_auth
def parse_resume(current_user):
    if 'resume' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['resume']
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are supported'}), 400

    pdf_bytes = file.read()
    if len(pdf_bytes) > 10 * 1024 * 1024:
        return jsonify({'error': 'File too large (max 10MB)'}), 400

    # Store the PDF on the user record
    current_user.resume_pdf = pdf_bytes
    current_user.resume_filename = file.filename
    db.session.commit()

    pdf_b64 = base64.standard_b64encode(pdf_bytes).decode('utf-8')

    prompt = """Extract all information from this resume and return it as structured JSON.

Return ONLY valid JSON with exactly this structure, no other text:
{
  "basics": {
    "name": "",
    "headline": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "github": "",
    "website": "",
    "summary": ""
  },
  "experience": [
    {
      "company": "",
      "role": "",
      "start": "",
      "end": "",
      "bullets": ["bullet 1", "bullet 2"]
    }
  ],
  "projects": [
    {
      "name": "",
      "description": "",
      "tech": ["tech1", "tech2"]
    }
  ],
  "skills": ["skill1", "skill2"]
}

Rules:
- headline: infer from most recent role or stated objective (e.g. "Full-Stack Engineer")
- experience: most recent first, bullets as individual strings
- projects: include any side projects, academic projects, or open source work mentioned
- skills: flat list of all technical and professional skills mentioned anywhere in the resume
- If a field has no data, use empty string or empty array
- Do not invent or infer data not present in the resume
- Return ONLY the JSON object, no markdown, no explanation"""

    try:
        client = anthropic.Anthropic(api_key=current_app.config.get('ANTHROPIC_API_KEY', ''))
        message = client.messages.create(
            model='claude-opus-4-5',
            max_tokens=4000,
            messages=[{
                'role': 'user',
                'content': [
                    {
                        'type': 'document',
                        'source': {
                            'type': 'base64',
                            'media_type': 'application/pdf',
                            'data': pdf_b64,
                        }
                    },
                    {
                        'type': 'text',
                        'text': prompt
                    }
                ]
            }]
        )

        text = message.content[0].text.strip()
        if text.startswith('```'):
            text = text.split('\n', 1)[1]
            text = text.rsplit('```', 1)[0].strip()

        parsed = json.loads(text)

        basics = parsed.get('basics', {})
        experience = [
            {
                'company': str(e.get('company', '')),
                'role':    str(e.get('role', '')),
                'start':   str(e.get('start', '')),
                'end':     str(e.get('end', 'Present')),
                'bullets': [str(b) for b in e.get('bullets', []) if b],
            }
            for e in parsed.get('experience', []) if isinstance(e, dict)
        ]
        projects = [
            {
                'name':        str(p.get('name', '')),
                'description': str(p.get('description', '')),
                'tech':        [str(t) for t in p.get('tech', []) if t],
            }
            for p in parsed.get('projects', []) if isinstance(p, dict)
        ]
        skills = [str(s) for s in parsed.get('skills', []) if s]

        return jsonify({
            'basics':     basics,
            'experience': experience,
            'projects':   projects,
            'skills':     skills,
        })

    except json.JSONDecodeError as e:
        return jsonify({'error': f'Failed to parse resume: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@profile_bp.route('/resume', methods=['GET'])
@require_auth
def download_resume(current_user):
    if not current_user.resume_pdf:
        return jsonify({'error': 'No resume on file'}), 404

    filename = current_user.resume_filename or 'resume.pdf'
    return send_file(
        io.BytesIO(current_user.resume_pdf),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=filename,
    )


@profile_bp.route('/match', methods=['POST'])
@require_auth
def match_profile(current_user):
    body = request.get_json()
    job_description = body.get('job_description', '').strip()
    if not job_description:
        return jsonify({'error': 'job_description is required'}), 400

    profile = Profile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        return jsonify({'score': 0, 'covered': [], 'partial': [], 'missing': []})

    data = profile.to_dict()
    skills     = data.get('skills', [])
    experience = data.get('experience', [])
    projects   = data.get('projects', [])
    answers    = data.get('prewritten_answers', {})

    experience_text = '\n'.join(
        f"- {e.get('role', '')} at {e.get('company', '')}: {' '.join(e.get('bullets', []))}"
        for e in experience
    )
    projects_text = '\n'.join(
        f"- {p.get('name', '')}: {p.get('description', '')} (Tech: {', '.join(p.get('tech', []))})"
        for p in projects
    )
    answers_text = '\n'.join(f"- {k}: {v}" for k, v in answers.items())

    prompt = f"""You are analyzing how well a candidate's profile matches a job description.

JOB DESCRIPTION:
{job_description[:3000]}

CANDIDATE PROFILE:
Skills: {', '.join(skills)}

Experience:
{experience_text}

Projects:
{projects_text}

Pre-written answers:
{answers_text}

Analyze the job description and identify the key requirements. Categorize each:
- covered: candidate clearly has this
- partial: candidate has some evidence but not strongly
- missing: no evidence in profile

Give an overall match score 0-100.

Respond ONLY with valid JSON, no other text:
{{
  "score": <integer 0-100>,
  "covered": ["requirement 1", "requirement 2"],
  "partial": ["requirement 3"],
  "missing": ["requirement 4", "requirement 5"]
}}

Keep each requirement short (2-5 words). Max 5 items per category."""

    try:
        client = anthropic.Anthropic(api_key=current_app.config.get('ANTHROPIC_API_KEY', ''))
        message = client.messages.create(
            model='claude-opus-4-5',
            max_tokens=600,
            messages=[{'role': 'user', 'content': prompt}]
        )
        text = message.content[0].text.strip()
        result = json.loads(text)
        return jsonify({
            'score':   int(result.get('score', 0)),
            'covered': result.get('covered', []),
            'partial': result.get('partial', []),
            'missing': result.get('missing', []),
        })
    except json.JSONDecodeError:
        return jsonify({'error': 'Failed to parse AI response'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500