import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY        = os.environ.get('SECRET_KEY', 'dev-secret-change-in-prod')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/smart_apply')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT
    JWT_ALGORITHM    = 'HS256'
    JWT_EXPIRY_HOURS = 24 * 7  # 7 days

    # Anthropic
    ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')

    # JSearch (RapidAPI)
    JSEARCH_API_KEY = os.environ.get('JSEARCH_API_KEY', '')

    # Google OAuth
    GOOGLE_CLIENT_ID     = os.environ.get('GOOGLE_CLIENT_ID', '')
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')
    GOOGLE_REDIRECT_URI  = os.environ.get('GOOGLE_REDIRECT_URI', 'http://localhost:5001/auth/callback')
    GOOGLE_SCOPES        = [
        'openid',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/gmail.readonly',
    ]

    # Frontend URL (for OAuth post-redirect)
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

    # Background sync interval in minutes
    EMAIL_SYNC_INTERVAL_MINUTES = int(os.environ.get('EMAIL_SYNC_INTERVAL_MINUTES', '20'))