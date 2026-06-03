from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/todo", tags=["待办事项"])

@router.get("/my", response_model=List[schemas.TodoItem], summary="获取我的待办")
def read_my_todos(
    x_user_id: int = Header(..., description="操作用户ID"),
    completed: bool = False,
    db: Session = Depends(get_db)
):
    todos = crud.get_user_todos(db, user_id=x_user_id, completed=completed)
    return todos

@router.post("/{todo_id}/complete", response_model=schemas.TodoItem, summary="完成待办")
def complete_todo_item(todo_id: int, db: Session = Depends(get_db)):
    todo = crud.complete_todo(db, todo_id=todo_id)
    if todo is None:
        raise HTTPException(status_code=404, detail="待办不存在")
    return todo
