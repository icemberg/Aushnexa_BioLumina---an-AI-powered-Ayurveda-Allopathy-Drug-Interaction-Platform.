"""
Pydantic Schemas for Authentication API
"""

from pydantic import BaseModel, Field, EmailStr, field_validator
import re


class RegisterRequest(BaseModel):
    """Request body for POST /api/v1/auth/register"""
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(default="", max_length=255)
    role: str = Field(default="PATIENT", pattern="^(PATIENT|CLINICIAN|PHARMACIST|RESEARCHER)$")

    @field_validator('password')
    def validate_password(cls, v):
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character")
        return v


class LoginRequest(BaseModel):
    """Request body for POST /api/v1/auth/login"""
    email: EmailStr
    password: str = Field(min_length=1)


class UserInfo(BaseModel):
    """User info embedded in token response."""
    id: str
    email: str
    role: str
    full_name: str | None = None


class TokenResponse(BaseModel):
    """JWT token response after successful login."""
    access_token: str
    token_type: str = "bearer"
    user: UserInfo


class UserResponse(BaseModel):
    """Public user profile data."""
    id: str
    email: str
    full_name: str | None
    role: str
    is_active: bool


class ProfileResponse(BaseModel):
    """Extended profile response."""
    id: str
    email: str
    full_name: str | None
    role: str
    is_active: bool = True
    total_queries: int = 0
    created_at: str
