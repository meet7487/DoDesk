class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id           = Column(Integer, primary_key=True)
    user_id      = Column(Integer, ForeignKey("users.id"))
    action       = Column(String)   # "created_task", "updated_task"
    entity_type  = Column(String)   # "task", "project"
    entity_id    = Column(Integer)
    description  = Column(String)   # Human-readable summary
    timestamp    = Column(DateTime, default=datetime.utcnow)
    user         = relationship("User")