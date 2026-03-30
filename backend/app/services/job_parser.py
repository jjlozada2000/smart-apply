import re
from typing import List

# Common tech skills to detect
SKILL_PATTERNS = [
    'python', 'javascript', 'typescript', 'java', 'c\+\+', 'c#', 'go', 'rust', 'ruby', 'swift',
    'react', 'vue', 'angular', 'next\.js', 'node\.js', 'express', 'fastapi', 'flask', 'django', 'spring',
    'postgresql', 'mysql', 'mongodb', 'redis', 'sqlite', 'dynamodb',
    'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'terraform', 'ci/cd', 'github actions',
    'rest api', 'graphql', 'grpc', 'websocket',
    'machine learning', 'deep learning', 'pytorch', 'tensorflow', 'scikit-learn', 'pandas', 'numpy',
    'git', 'linux', 'agile', 'scrum',
]


def extract_keywords(job_description: str) -> List[str]:
    """Extract skill keywords from a job description."""
    text = job_description.lower()
    found = []
    for skill in SKILL_PATTERNS:
        if re.search(r'\b' + skill + r'\b', text):
            # Return display-friendly version
            found.append(skill.replace(r'\.', '.').replace(r'\+', '+').replace(r'\#', '#'))
    return list(dict.fromkeys(found))  # dedupe, preserve order


def extract_requirements(job_description: str) -> dict:
    """Parse experience level and other signals from a JD."""
    text = job_description.lower()

    # Seniority
    seniority = 'mid'
    if any(w in text for w in ['senior', 'sr.', 'lead', 'principal', 'staff']):
        seniority = 'senior'
    elif any(w in text for w in ['junior', 'jr.', 'entry', 'new grad', 'intern']):
        seniority = 'junior'

    # Years of experience
    years_match = re.search(r'(\d+)\+?\s*(?:to\s*\d+\s*)?years?\s*(?:of\s*)?(?:experience|exp)', text)
    years = int(years_match.group(1)) if years_match else None

    return {
        'keywords':  extract_keywords(job_description),
        'seniority': seniority,
        'years':     years,
    }
