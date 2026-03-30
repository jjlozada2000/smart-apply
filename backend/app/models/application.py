from app import db
from datetime import datetime, timezone

class Application(db.Model):
    __tablename__ = 'applications'

    id           = db.Column(db.Integer, primary_key=True)
    user_id      = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    company      = db.Column(db.String(255), nullable=False)
    role         = db.Column(db.String(255), nullable=False)
    job_link     = db.Column(db.Text, nullable=True)
    status       = db.Column(db.String(50), default='applied')  # applied|interview|rejected|offer
    date_applied = db.Column(db.Date, nullable=False, default=lambda: datetime.now(timezone.utc).date())
    notes        = db.Column(db.Text, nullable=True)
    created_at   = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at   = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    generated_content = db.relationship('GeneratedContent', backref='application', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id':           self.id,
            'company':      self.company,
            'role':         self.role,
            'job_link':     self.job_link,
            'status':       self.status,
            'date_applied': self.date_applied.isoformat(),
            'notes':        self.notes,
        }


class GeneratedContent(db.Model):
    __tablename__ = 'generated_content'

    id             = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id'), nullable=True)
    user_id        = db.Column(db.Integer, nullable=False)
    type           = db.Column(db.String(50), nullable=False)  # resume | cover_letter
    content        = db.Column(db.Text, nullable=False)
    created_at     = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id, 'type': self.type,
            'content': self.content, 'created_at': self.created_at.isoformat(),
        }
