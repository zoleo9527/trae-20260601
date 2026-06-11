from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from backend.models import User
from backend.extensions import db
from backend.api.utils import get_current_user, log_operation

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({'error': '请提供用户名和密码'}), 400

    user = User.query.filter_by(username=data['username']).first()
    if not user or not user.check_password(data['password']):
        return jsonify({'error': '用户名或密码错误'}), 401

    access_token = create_access_token(identity=str(user.id))
    log_operation('auth', 'login', target_id=user.id, target_type='user',
                  detail={'username': user.username, 'role': user.role},
                  operator=user)
    db.session.commit()

    return jsonify({
        'access_token': access_token,
        'user': user.to_dict()
    })

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user_info():
    user = get_current_user()
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    return jsonify(user.to_dict())

@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    user = get_current_user()
    log_operation('auth', 'logout', target_id=user.id, target_type='user')
    db.session.commit()
    return jsonify({'message': '登出成功'})
