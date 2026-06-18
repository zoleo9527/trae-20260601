from sqlalchemy.orm import Session
from backend.database import engine, SessionLocal, Base
from backend.models.user import User, UserRole
from backend.models.activity import Activity, ActivityStatus
from backend.models.application import Application, ApplicationStatus
from backend.models.post import Post, PostStatus
from backend.utils.auth import get_password_hash

def init_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        if not db.query(User).filter(User.username == "social").first():
            db.add(User(
                username="social",
                password=get_password_hash("123456"),
                name="站点社工",
                phone="13800138001",
                role=UserRole.SOCIAL_WORKER,
                department="志愿服务站"
            ))
        
        if not db.query(User).filter(User.username == "leader").first():
            db.add(User(
                username="leader",
                password=get_password_hash("123456"),
                name="志愿队长",
                phone="13800138002",
                role=UserRole.VOLUNTEER_LEADER,
                department="志愿者团队"
            ))
        
        if not db.query(User).filter(User.username == "official").first():
            db.add(User(
                username="official",
                password=get_password_hash("123456"),
                name="社区干部",
                phone="13800138003",
                role=UserRole.COMMUNITY_OFFICIAL,
                department="社区居委会"
            ))
        
        if not db.query(User).filter(User.username == "volunteer1").first():
            db.add(User(
                username="volunteer1",
                password=get_password_hash("123456"),
                name="志愿者张三",
                phone="13800138010",
                role=UserRole.VOLUNTEER
            ))
        
        if not db.query(User).filter(User.username == "volunteer2").first():
            db.add(User(
                username="volunteer2",
                password=get_password_hash("123456"),
                name="志愿者李四",
                phone="13800138011",
                role=UserRole.VOLUNTEER
            ))
        
        if not db.query(User).filter(User.username == "volunteer3").first():
            db.add(User(
                username="volunteer3",
                password=get_password_hash("123456"),
                name="志愿者王五",
                phone="13800138012",
                role=UserRole.VOLUNTEER
            ))
        
        db.commit()
        
        if not db.query(Activity).first():
            activity1 = Activity(
                title="社区环保志愿活动",
                description="组织志愿者进行社区环境卫生清理，包括垃圾分类宣传、绿化带维护等",
                location="阳光社区中心广场",
                start_time="2025-07-20 09:00:00",
                end_time="2025-07-20 12:00:00",
                duration=3.0,
                status=ActivityStatus.PUBLISHED,
                max_participants=20,
                required_skills="沟通能力,体力劳动",
                organizer_id=1
            )
            db.add(activity1)
            db.commit()
            db.refresh(activity1)
            
            post1 = Post(
                activity_id=activity1.id,
                name="垃圾分类宣传岗",
                description="负责向居民宣传垃圾分类知识",
                required_skills="沟通能力",
                shift="上午",
                capacity=5
            )
            post2 = Post(
                activity_id=activity1.id,
                name="绿化维护岗",
                description="负责社区绿化带修剪和维护",
                required_skills="体力劳动",
                shift="上午",
                capacity=8
            )
            post3 = Post(
                activity_id=activity1.id,
                name="垃圾清理岗",
                description="负责社区公共区域垃圾清理",
                required_skills="体力劳动",
                shift="上午",
                capacity=7
            )
            db.add_all([post1, post2, post3])
            db.commit()
            
            app1 = Application(
                activity_id=activity1.id,
                volunteer_id=4,
                status=ApplicationStatus.APPROVED,
                remarks="有垃圾分类工作经验，可负责讲解",
                preferred_shift="上午",
                assigned_post_id=post1.id,
                processed_by=1,
                processed_at="2025-07-15 10:00:00"
            )
            app2 = Application(
                activity_id=activity1.id,
                volunteer_id=5,
                status=ApplicationStatus.PENDING,
                remarks="周末有空，可以参加",
                preferred_shift="上午"
            )
            app3 = Application(
                activity_id=activity1.id,
                volunteer_id=6,
                status=ApplicationStatus.APPROVED,
                remarks="体力好，适合户外工作",
                preferred_shift="上午",
                assigned_post_id=post2.id,
                processed_by=1,
                processed_at="2025-07-15 10:30:00"
            )
            db.add_all([app1, app2, app3])
            db.commit()
        
        print("初始化数据完成")
        
    finally:
        db.close()

if __name__ == "__main__":
    init_data()