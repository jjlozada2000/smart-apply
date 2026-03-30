import anthropic
from flask import current_app
from app.services.job_parser import extract_requirements
from app.services.matcher import build_context


def _client():
    return anthropic.Anthropic(api_key=current_app.config['ANTHROPIC_API_KEY'])


def _basics_block(basics: dict) -> str:
    if not basics:
        return ''
    parts = []
    if basics.get('name'):     parts.append(f"Name: {basics['name']}")
    if basics.get('headline'): parts.append(f"Title: {basics['headline']}")
    if basics.get('email'):    parts.append(f"Email: {basics['email']}")
    if basics.get('phone'):    parts.append(f"Phone: {basics['phone']}")
    if basics.get('location'): parts.append(f"Location: {basics['location']}")
    if basics.get('linkedin'): parts.append(f"LinkedIn: {basics['linkedin']}")
    if basics.get('github'):   parts.append(f"GitHub: {basics['github']}")
    if basics.get('website'):  parts.append(f"Portfolio: {basics['website']}")
    if basics.get('summary'):  parts.append(f"Summary: {basics['summary']}")
    return '\n'.join(parts)


def generate_cover_letter(job_description: str, profile: dict) -> str:
    reqs    = extract_requirements(job_description)
    context = build_context(profile, reqs)
    basics  = profile.get('basics', {})

    experience_block = '\n'.join(
        f"{e['role']} at {e['company']} ({e['start']} to {e['end']}). {'. '.join(e['bullets'][:2])}"
        for e in context['top_experience']
    ) or 'No experience data provided.'

    projects_block = '\n'.join(
        f"{p['name']}. {p['description']}. Technologies used include {', '.join(p['tech'])}."
        for p in context['top_projects']
    ) or 'No project data provided.'

    skills_block  = ', '.join(context['matched_skills']) or 'No matched skills.'
    prewritten    = context['prewritten_answers']
    extra_context = '\n'.join(f"{k}: {v}" for k, v in prewritten.items()) if prewritten else ''
    basics_section = _basics_block(basics)

    header_instruction = ''
    if basics.get('name'):
        contact_parts = filter(None, [
            basics.get('email'), basics.get('phone'),
            basics.get('location'), basics.get('linkedin'),
            basics.get('github'), basics.get('website'),
        ])
        contact_line = '   '.join(contact_parts)
        header_instruction = f"""
HEADER (place at the very top, before the letter body):
{basics['name']}
{basics.get('headline', '')}
{contact_line}

"""

    prompt = f"""You are writing a professional cover letter for a job application. Follow these rules strictly.

TONE AND STYLE:
- Formal and polished. This is a professional document, not a casual message.
- Confident and direct without being arrogant. The writing should reflect a highly competent candidate.
- No buzzwords. Do not use words like "passionate", "synergy", "leverage", "impactful", "excited to", "thrilled", "dynamic", or "innovative".
- No cliches. Do not open with "I am writing to express my interest" or any variation of it.
- First person throughout.
- Sentences should be complete and well-constructed. Vary sentence length for readability.
- The letter should read as though written by an experienced professional, not a recent graduate.
- 3 paragraphs. Under 300 words total.

PUNCTUATION RULES (strictly enforced):
- Do not use dashes of any kind. No hyphens used as separators, no em dashes, no en dashes.
- Do not use semicolons.
- Do not use colons anywhere in the letter body.
- Do not use forward slashes or backslashes.
- Do not use ampersands. Write "and" instead.
- Use only periods, commas, and question marks as punctuation.
{header_instruction}
STRUCTURE:
Paragraph 1: State the role you are applying for and make a direct, substantive case for why your background is a strong match. Do not simply say you are interested. Demonstrate it with a specific claim.
Paragraph 2: Expand on your most relevant experience and a specific project that demonstrates your ability to do the work this role requires. Reference these skills naturally: {skills_block}.
Paragraph 3: Close with a clear, professional expression of your interest in continuing the conversation. One to two sentences only.

CANDIDATE DATA:
{basics_section}

Relevant experience:
{experience_block}

Relevant projects:
{projects_block}

Matched skills: {skills_block}

{f"Additional context:{chr(10)}{extra_context}" if extra_context else ""}

JOB DESCRIPTION:
{job_description[:2000]}

Output the header if provided above, then the letter body with no subject line and no salutation. Do not wrap in quotes."""

    message = _client().messages.create(
        model='claude-opus-4-5',
        max_tokens=750,
        messages=[{'role': 'user', 'content': prompt}],
    )
    return message.content[0].text.strip()


def generate_resume_bullets(job_description: str, profile: dict) -> str:
    reqs    = extract_requirements(job_description)
    context = build_context(profile, reqs)
    basics  = profile.get('basics', {})

    experience_raw = '\n'.join(
        f"Company: {e['company']}. Role: {e['role']}.\nBullets: {chr(10).join('  ' + b for b in e['bullets'])}"
        for e in context['top_experience']
    ) or 'No experience data provided.'

    projects_raw = '\n'.join(
        f"Project: {p['name']}. {p['description']}. Tech: {', '.join(p['tech'])}"
        for p in context['top_projects']
    ) or 'No project data provided.'

    basics_section = _basics_block(basics)

    header_block = ''
    if basics.get('name'):
        contact_parts = filter(None, [
            basics.get('email'), basics.get('phone'),
            basics.get('location'), basics.get('linkedin'),
            basics.get('github'), basics.get('website'),
        ])
        contact_line = '   '.join(contact_parts)
        header_block = f"""== Header ==
{basics['name']}
{basics.get('headline', '')}
{contact_line}

"""

    prompt = f"""You are tailoring resume content to match a job description. Follow these rules:

- Each bullet starts with a strong action verb (Built, Designed, Led, Reduced, Increased, Architected, Delivered, Optimized).
- Include metrics where plausible (percentages, response times, user counts, request volumes). Reasonable estimates are acceptable.
- Weave in these keywords naturally: {', '.join(context['all_keywords'][:10])}.
- 2 to 3 bullets per experience entry, 1 to 2 per project.
- Do not use dashes as separators, semicolons, colons, slashes, or ampersands anywhere in the output.
- Use plain text only. No markdown formatting.

CANDIDATE INFO:
{basics_section}

CANDIDATE EXPERIENCE:
{experience_raw}

CANDIDATE PROJECTS:
{projects_raw}

JOB DESCRIPTION:
{job_description[:1500]}

Output format:
{header_block}== Experience ==
[Company, Role]
bullet
bullet

== Projects ==
[Project Name]
bullet

== Skills ==
[comma separated relevant skills]

Write only the formatted content. No introduction or explanation."""

    message = _client().messages.create(
        model='claude-opus-4-5',
        max_tokens=800,
        messages=[{'role': 'user', 'content': prompt}],
    )
    return message.content[0].text.strip()