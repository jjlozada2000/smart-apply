"""
Background email sync scheduler.
Runs every EMAIL_SYNC_INTERVAL_MINUTES and syncs all users with Gmail connected.
Uses APScheduler (lightweight, no Redis needed for a single-server deploy).
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import logging

logger = logging.getLogger(__name__)
_scheduler = None


def sync_all_users(app):
    """Called by scheduler — runs inside app context."""
    with app.app_context():
        from app import db
        from app.models import User, Application
        from app.services.email_service import sync_inbox

        users = User.query.filter(User.gmail_credentials.isnot(None)).all()
        logger.info(f'[scheduler] Syncing {len(users)} users')

        for user in users:
            try:
                applications = Application.query.filter_by(user_id=user.id).all()
                updated = sync_inbox(user, applications)
                if updated:
                    db.session.commit()
                    logger.info(f'[scheduler] user {user.id}: {updated} apps updated')
            except Exception as e:
                logger.error(f'[scheduler] user {user.id} error: {e}')
                db.session.rollback()


def start_scheduler(app):
    global _scheduler
    if _scheduler and _scheduler.running:
        return

    interval = app.config.get('EMAIL_SYNC_INTERVAL_MINUTES', 20)
    _scheduler = BackgroundScheduler(daemon=True)
    _scheduler.add_job(
        func=sync_all_users,
        trigger=IntervalTrigger(minutes=interval),
        args=[app],
        id='email_sync',
        replace_existing=True,
    )
    _scheduler.start()
    logger.info(f'[scheduler] Email sync started — every {interval} min')


def stop_scheduler():
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
