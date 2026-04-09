from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from db import Base

class Comment(Base):
    __tablename__ = "comments"
    id         = Column(Integer, primary_key=True)
    task_id    = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    author_id  = Column(Integer, ForeignKey("users.id"), nullable=False)
    content    = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    author     = relationship("User")