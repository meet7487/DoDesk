class TimeLog(Base):
    __tablename__ = "time_logs"
    id         = Column(Integer, primary_key=True)
    task_id    = Column(Integer, ForeignKey("tasks.id"))
    user_id    = Column(Integer, ForeignKey("users.id"))
    started_at = Column(DateTime, nullable=False)
    stopped_at = Column(DateTime, nullable=True)
    # stopped_at - started_at = duration