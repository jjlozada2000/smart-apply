from app import db
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import JSONB

class Profile(db.Model):
    __tablename__ = 'profiles'

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    data       = db.Column(JSONB, nullable=False, default=dict)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return self.data or {
            'projects': [],
            'experience': [],
            'skills': [],
            'prewritten_answers': {},
        }
