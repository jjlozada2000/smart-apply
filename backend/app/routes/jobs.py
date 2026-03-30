import requests
from flask import Blueprint, request, jsonify, current_app
from app.services.auth_service import require_auth

jobs_bp = Blueprint('jobs', __name__)

JSEARCH_BASE = 'https://jsearch.p.rapidapi.com'


@jobs_bp.route('/search', methods=['GET'])
@require_auth
def search_jobs(current_user):
    api_key = current_app.config.get('JSEARCH_API_KEY', '')
    if not api_key:
        return jsonify({'error': 'JSearch API key not configured'}), 500

    query       = request.args.get('query', '')
    location    = request.args.get('location', '')
    remote      = request.args.get('remote_only', 'false')
    employment  = request.args.get('employment_type', '')
    date_posted = request.args.get('date_posted', '')
    salary_min  = request.args.get('salary_min', '')
    salary_max  = request.args.get('salary_max', '')
    sort_by     = request.args.get('sort_by', 'relevance')
    page        = request.args.get('page', '1')
    num_pages   = request.args.get('num_pages', '1')

    params = {
        'query':     query,
        'page':      page,
        'num_pages': num_pages,
        'country':   'us',
    }

    if location:
        params['location'] = location.split(',')[0].strip()

    if remote == 'true':
        params['remote_jobs_only'] = 'true'
    if employment:
        params['employment_types'] = employment
    if date_posted:
        params['date_posted'] = date_posted
    if sort_by == 'date':
        params['date_posted'] = params.get('date_posted', 'all')
    if salary_min:
        params['job_salary_min'] = salary_min
    if salary_max:
        params['job_salary_max'] = salary_max

    headers = {
        'X-RapidAPI-Key':  api_key,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
    }

    try:
        resp = requests.get(f'{JSEARCH_BASE}/search', headers=headers, params=params, timeout=20)
        resp.raise_for_status()
        data = resp.json()

        jobs = []
        for job in data.get('data', []):
            jobs.append({
                'id':              job.get('job_id'),
                'title':           job.get('job_title'),
                'company':         job.get('employer_name'),
                'location':        (job.get('job_city') or '') + (', ' + job.get('job_state') if job.get('job_state') else ''),
                'country':         job.get('job_country'),
                'is_remote':       job.get('job_is_remote', False),
                'employment_type': job.get('job_employment_type'),
                'description':     job.get('job_description'),
                'apply_link':      job.get('job_apply_link'),
                'posted_at':       job.get('job_posted_at_datetime_utc'),
                'salary_min':      job.get('job_min_salary'),
                'salary_max':      job.get('job_max_salary'),
                'salary_currency': job.get('job_salary_currency', 'USD'),
                'salary_period':   job.get('job_salary_period'),
                'company_logo':    job.get('employer_logo'),
                'publisher':       job.get('job_publisher'),
                'highlights':      job.get('job_highlights', {}),
            })

        return jsonify({
            'jobs':   jobs,
            'count':  len(jobs),
            'status': data.get('status'),
        })

    except requests.exceptions.Timeout:
        return jsonify({'error': 'JSearch request timed out'}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 502