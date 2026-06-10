from sqlalchemy.orm import sessionmaker, scoped_session
from .models import init_engine, Staff, RoleEnum

_engine = None
_session_factory = None
_scoped = None


def _ensure_init():
    global _engine, _session_factory, _scoped
    if _scoped is not None:
        return
    _engine = init_engine()
    _session_factory = sessionmaker(bind=_engine)
    _scoped = scoped_session(_session_factory)
    session = _scoped()
    _seed_staff(session)
    session.commit()
    _scoped.remove()


def get_session():
    _ensure_init()
    return _scoped()


def close_session():
    if _scoped is not None:
        _scoped.remove()


def _seed_staff(session):
    count = session.query(Staff).count()
    if count > 0:
        return
    seeds = [
        Staff(name="张主管", role=RoleEnum.ranch_supervisor.value, shift="白班"),
        Staff(name="李主管", role=RoleEnum.ranch_supervisor.value, shift="夜班"),
        Staff(name="王挤奶员", role=RoleEnum.milker.value, shift="白班"),
        Staff(name="赵挤奶员", role=RoleEnum.milker.value, shift="夜班"),
        Staff(name="刘兽医", role=RoleEnum.veterinarian.value, shift="白班"),
        Staff(name="陈兽医", role=RoleEnum.veterinarian.value, shift="夜班"),
    ]
    for s in seeds:
        session.add(s)
