from typing import List


def match_skills(profile_skills: List[str], keywords: List[str]) -> List[str]:
    """Return profile skills that overlap with JD keywords."""
    kw_lower = [k.lower() for k in keywords]
    return [s for s in profile_skills if s.lower() in kw_lower]


def match_experience(experience: list, keywords: List[str]) -> list:
    """Score and sort experience entries by keyword overlap."""
    kw_lower = set(k.lower() for k in keywords)

    def score(exp):
        text = ' '.join([exp.get('role', ''), exp.get('company', '')] + exp.get('bullets', [])).lower()
        return sum(1 for kw in kw_lower if kw in text)

    return sorted(experience, key=score, reverse=True)


def match_projects(projects: list, keywords: List[str]) -> list:
    """Score and sort projects by keyword overlap."""
    kw_lower = set(k.lower() for k in keywords)

    def score(proj):
        text = ' '.join([
            proj.get('name', ''),
            proj.get('description', ''),
            ' '.join(proj.get('tech', [])),
        ]).lower()
        return sum(1 for kw in kw_lower if kw in text)

    return sorted(projects, key=score, reverse=True)


def build_context(profile: dict, jd_requirements: dict) -> dict:
    """Assemble the most relevant profile data for a given job."""
    keywords  = jd_requirements.get('keywords', [])
    skills    = match_skills(profile.get('skills', []), keywords)
    experience = match_experience(profile.get('experience', []), keywords)
    projects   = match_projects(profile.get('projects', []), keywords)

    return {
        'matched_skills': skills or profile.get('skills', [])[:8],
        'top_experience': experience[:3],
        'top_projects':   projects[:3],
        'prewritten_answers': profile.get('prewritten_answers', {}),
        'seniority': jd_requirements.get('seniority', 'mid'),
        'all_keywords': keywords,
    }
