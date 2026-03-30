import json
import base64
from typing import Optional
from flask import current_app
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

STATUS_KEYWORDS = {
    'interview': ['interview', 'schedule', 'next steps', 'move forward', 'phone screen', 'video call', 'meet with', 'invite you to'],
    'offer':     ['offer', 'pleased to offer', 'congratulations', 'salary', 'start date', 'onboarding', 'offer letter'],
    'rejected':  ['unfortunately', 'regret to inform', 'not moving forward', 'other candidates', 'position has been filled', 'not selected', 'decided to move'],
}


def credentials_to_dict(creds: Credentials) -> dict:
    return {
        'token':         creds.token,
        'refresh_token': creds.refresh_token,
        'token_uri':     creds.token_uri,
        'client_id':     creds.client_id,
        'client_secret': creds.client_secret,
        'scopes':        list(creds.scopes) if creds.scopes else [],
    }


def dict_to_credentials(d: dict) -> Credentials:
    return Credentials(
        token=d.get('token'),
        refresh_token=d.get('refresh_token'),
        token_uri=d.get('token_uri', 'https://oauth2.googleapis.com/token'),
        client_id=d.get('client_id'),
        client_secret=d.get('client_secret'),
        scopes=d.get('scopes'),
    )


def refresh_credentials(creds: Credentials, user) -> Credentials:
    """Refresh expired credentials and persist back to user row."""
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        user.gmail_credentials = json.dumps(credentials_to_dict(creds))
        from app import db
        db.session.commit()
    return creds


def get_gmail_email(creds: Credentials) -> str:
    service = build('gmail', 'v1', credentials=creds)
    profile = service.users().getProfile(userId='me').execute()
    return profile.get('emailAddress', '')


def detect_status_from_text(text: str) -> Optional[str]:
    text_lower = text.lower()
    for status, keywords in STATUS_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            return status
    return None


def _decode_body(payload: dict) -> str:
    if payload.get('body', {}).get('data'):
        return base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8', errors='ignore')
    for part in payload.get('parts', []):
        text = _decode_body(part)
        if text:
            return text
    return ''


def sync_inbox(user, applications: list) -> int:
    """
    Scan user's Gmail for recruiter emails and update application statuses.
    Returns count of applications updated.
    """
    if not user.gmail_credentials:
        return 0

    creds = dict_to_credentials(json.loads(user.gmail_credentials))
    creds = refresh_credentials(creds, user)  # auto-refresh if expired

    service  = build('gmail', 'v1', credentials=creds)
    results  = service.users().messages().list(userId='me', maxResults=75, q='').execute()
    messages = results.get('messages', [])

    updated_count = 0

    for msg_meta in messages:
        msg     = service.users().messages().get(userId='me', id=msg_meta['id'], format='full').execute()
        headers = {h['name'].lower(): h['value'] for h in msg.get('payload', {}).get('headers', [])}
        subject = headers.get('subject', '')
        sender  = headers.get('from', '')
        body    = _decode_body(msg.get('payload', {}))
        full_text = f"{subject} {body}"

        new_status = detect_status_from_text(full_text)
        if not new_status:
            continue

        for app in applications:
            if app.status in ('offer',):  # don't downgrade an offer
                continue
            company_lower = app.company.lower()
            if company_lower in subject.lower() or company_lower in sender.lower():
                if app.status != new_status:
                    app.status = new_status
                    updated_count += 1
                break

    return updated_count
