"""
SQLAlchemy ORM Models for PostgreSQL

Tables: users, query_history, clinical_feedback
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    String,
    Integer,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    JSON,
    Float,
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


class Institution(Base):
    """Organizations or entities accessing the platform."""
    
    __tablename__ = "institutions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=True) # e.g. Clinical Center, Bio Laboratory
    domain = Column(String(255), nullable=True, index=True) # e.g. aiims.edu
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="institution", lazy="dynamic")
    queries = relationship("QueryHistory", back_populates="institution", lazy="dynamic")


class User(Base):
    """User account for authentication and history tracking."""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), nullable=False, default="PATIENT")
    is_active = Column(Boolean, default=True)
    institution_id = Column(UUID(as_uuid=True), ForeignKey("institutions.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    queries = relationship("QueryHistory", back_populates="user", lazy="dynamic")
    institution = relationship("Institution", back_populates="users")


class QueryHistory(Base):
    """Stores each interaction check query and its results."""

    __tablename__ = "query_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    institution_id = Column(UUID(as_uuid=True), ForeignKey("institutions.id"), nullable=True, index=True)
    ip_address = Column(String(45), nullable=True)
    query_protocol = Column(String(255), nullable=True)
    risk_status = Column(String(50), nullable=True) # e.g. verified, anomaly, unverified
    anomaly_reason = Column(String(255), nullable=True)
    
    items = Column(JSON, nullable=False)  # Retained per user feedback
    items_checked = Column(ARRAY(String), nullable=True)  # New field
    language = Column(String(10), default="en")
    patient_context = Column(JSON, nullable=True)  # Retained per user feedback
    request_json = Column(JSON, nullable=True)  # New field
    overall_risk = Column(String(50), nullable=True)
    risk_score = Column(Float, nullable=True)  # Retained per user feedback
    overall_score = Column(Float, nullable=True)  # New field
    interactions_found = Column(Integer, nullable=True)  # New field
    response_json = Column(JSON, nullable=True)  # Full API response
    processing_time_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="queries")
    institution = relationship("Institution", back_populates="queries")
    feedback = relationship("ClinicalFeedback", back_populates="query", lazy="selectin")


class ClinicalFeedback(Base):
    """
    Clinical review feedback on interaction results.
    Used by doctors/reviewers to validate or correct AI output.
    """

    __tablename__ = "clinical_feedback"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    query_id = Column(UUID(as_uuid=True), ForeignKey("query_history.id"), nullable=False, index=True)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    interaction_pair = Column(String(255), nullable=True)  # e.g., "Ashwagandha + Metformin"
    is_accurate = Column(Boolean, nullable=True)
    severity_correction = Column(String(50), nullable=True)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    query = relationship("QueryHistory", back_populates="feedback")
