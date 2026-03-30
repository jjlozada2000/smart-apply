from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')

    db.init_app(app)
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

    from app.routes.auth         import auth_bp
    from app.routes.applications import applications_bp
    from app.routes.generator    import generator_bp
    from app.routes.profile      import profile_bp
    from app.routes.email        import email_bp
    from app.routes.jobs         import jobs_bp

    app.register_blueprint(auth_bp,         url_prefix='/auth')
    app.register_blueprint(applications_bp, url_prefix='/applications')
    app.register_blueprint(generator_bp,    url_prefix='/generate')
    app.register_blueprint(profile_bp,      url_prefix='/profile')
    app.register_blueprint(email_bp,        url_prefix='/email')
    app.register_blueprint(jobs_bp,         url_prefix='/jobs')

    with app.app_context():
        db.create_all()

    # Start background email sync scheduler
    from app.services.scheduler import start_scheduler
    start_scheduler(app)

    return app
