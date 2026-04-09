# user_model.py
from pydantic import BaseModel, EmailStr

class UserSignup(BaseModel):
    name: str
    username: str
    email: EmailStr
    address: str
    gender: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleLogin(BaseModel):
    token: str