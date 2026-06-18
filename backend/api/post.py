from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.post import Post, PostStatus
from backend.models.application import Application, ApplicationStatus
from backend.models.exception import ExceptionRecord, ExceptionType, ExceptionStatus
from backend.schemas.post import PostCreate, PostUpdate, PostResponse

router = APIRouter(prefix="/posts", tags=["posts"])

@router.post("/", response_model=PostResponse)
def create_post(post: PostCreate, db: Session = Depends(get_db)):
    new_post = Post(
        activity_id=post.activity_id,
        name=post.name,
        description=post.description,
        required_skills=post.required_skills,
        shift=post.shift,
        capacity=post.capacity
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

@router.get("/", response_model=list[PostResponse])
def get_posts(activity_id: int | None = None, status: PostStatus | None = None, db: Session = Depends(get_db)):
    query = db.query(Post)
    if activity_id:
        query = query.filter(Post.activity_id == activity_id)
    if status:
        query = query.filter(Post.status == status)
    return query.all()

@router.get("/{post_id}", response_model=PostResponse)
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.put("/{post_id}/assign/{application_id}")
def assign_post(post_id: int, application_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    application = db.query(Application).filter(Application.id == application_id).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if application.status != ApplicationStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Only approved applications can be assigned")
    if post.current_count >= post.capacity:
        raise HTTPException(status_code=400, detail="Post is already full")
    
    application.assigned_post_id = post_id
    post.current_count += 1
    
    if post.current_count >= post.capacity:
        post.status = PostStatus.FILLED
    
    db.commit()
    db.refresh(application)
    db.refresh(post)
    
    return {"post": post, "application": application}

@router.put("/{post_id}", response_model=PostResponse)
def update_post(post_id: int, post: PostUpdate, db: Session = Depends(get_db)):
    db_post = db.query(Post).filter(Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    for field, value in post.dict(exclude_unset=True).items():
        setattr(db_post, field, value)
    
    db.commit()
    db.refresh(db_post)
    return db_post