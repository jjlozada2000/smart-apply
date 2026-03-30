from app import db
from datetime import datetime, timezone


class User(db.Model):
    __tablename__ = 'users'

    id                = db.Column(db.Integer, primary_key=True)
    email             = db.Column(db.String(255), unique=True, nullable=False)
    name              = db.Column(db.String(255), nullable=True)
    google_id         = db.Column(db.String(255), unique=True, nullable=False)
    avatar_url        = db.Column(db.Text, nullable=True)
    gmail_credentials = db.Column(db.Text, nullable=True)  # JSON: token + refresh_token
    resume_pdf        = db.Column(db.LargeBinary, nullable=True)
    resume_filename   = db.Column(db.String(255), nullable=True)
    created_at        = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    applications = db.relationship('Application', backref='user', lazy=True, cascade='all, delete-orphan')
    profile      = db.relationship('Profile', backref='user', uselist=False, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id':              self.id,
            'email':           self.email,
            'name':            self.name,
            'avatar_url':      self.avatar_url,
            'has_resume':      self.resume_pdf is not None,
            'resume_filename': self.resume_filename,
        }