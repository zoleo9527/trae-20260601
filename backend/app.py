from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from backend.extensions import db
from backend.config import Config

jwt = JWTManager()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app, resources={r"/api/*": {"origins": config_class.CORS_ORIGINS}})
    db.init_app(app)
    jwt.init_app(app)

    from backend.api.auth import auth_bp
    from backend.api.discount import discount_bp
    from backend.api.price_report import price_report_bp
    from backend.api.operation_log import log_bp
    from backend.api.batch import batch_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(discount_bp, url_prefix='/api/discount')
    app.register_blueprint(price_report_bp, url_prefix='/api/price-report')
    app.register_blueprint(log_bp, url_prefix='/api/logs')
    app.register_blueprint(batch_bp, url_prefix='/api/batch')

    @app.route('/api/health')
    def health_check():
        return {'status': 'ok', 'message': '奥特莱斯运营系统运行正常'}

    with app.app_context():
        db.create_all()
        from backend.models import init_test_data
        init_test_data()

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5001, debug=True)
