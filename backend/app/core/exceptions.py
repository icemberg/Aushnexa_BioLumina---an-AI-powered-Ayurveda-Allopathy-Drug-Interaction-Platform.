"""
Custom HTTP Exceptions for Aushnexa API

Provides consistent error responses across all endpoints.
"""

from fastapi import HTTPException, status
from pydantic import BaseModel

class ErrorResponse(BaseModel):
    error: str        # human-readable message
    code: str         # machine-readable code
    status: int       # HTTP status code

class EntityNotFoundError(HTTPException):
    """Raised when a drug, herb, or compound cannot be identified."""

    def __init__(self, entity_name: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "ENTITY_NOT_FOUND",
                "error": f"Could not identify '{entity_name}'. Please check the spelling or try an alternative name."
            },
        )


class InsufficientItemsError(HTTPException):
    """Raised when fewer than 2 items are provided for interaction check."""

    def __init__(self):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "INSUFFICIENT_ITEMS",
                "error": "At least 2 medications or herbs are required to check interactions.",
            },
        )


class GraphConnectionError(HTTPException):
    """Raised when Neo4j is unreachable."""

    def __init__(self):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "GRAPH_UNAVAILABLE",
                "error": "Knowledge graph is temporarily unavailable. Please try again.",
            },
        )


class ExternalServiceError(HTTPException):
    """Raised when external API calls fail."""

    def __init__(self, service_name: str, detail_msg: str = ""):
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "code": "EXTERNAL_SERVICE_ERROR",
                "error": f"{service_name} service is temporarily unavailable. {detail_msg}".strip(),
            },
        )


class DuplicateUserError(HTTPException):
    """Raised when registering with an already-used email."""

    def __init__(self):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "DUPLICATE_USER",
                "error": "An account with this email already exists.",
            },
        )


class InvalidCredentialsError(HTTPException):
    """Raised on login with wrong email/password."""

    def __init__(self, error_msg: str = "Incorrect email or password."):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "INVALID_CREDENTIALS",
                "error": error_msg,
            },
            headers={"WWW-Authenticate": "Bearer"},
        )


class AushNexaException(Exception):
    """Base exception for AushNexa custom exceptions."""
    def __init__(self, message: str, code: str = "INTERNAL_SERVER_ERROR", status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(self.message)


class EntityNormalizationError(AushNexaException):
    """Raised when an entity cannot be normalized."""
    def __init__(self, message: str = "Unable to normalize one or more entities."):
        super().__init__(message, code="ENTITY_NORMALIZATION_ERROR", status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)


class GraphQueryError(AushNexaException):
    """Raised when a Neo4j query fails."""
    def __init__(self, message: str = "Database query failed."):
        super().__init__(message, code="GRAPH_QUERY_ERROR", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)


class ExplanationServiceError(AushNexaException):
    """Raised when LLM API call fails."""
    def __init__(self, message: str = "Explanation service is temporarily unavailable."):
        super().__init__(message, code="EXPLANATION_SERVICE_ERROR", status_code=status.HTTP_502_BAD_GATEWAY)


class TranslationServiceError(AushNexaException):
    """Raised when translation API call fails."""
    def __init__(self, message: str = "Translation service is temporarily unavailable."):
        super().__init__(message, code="TRANSLATION_SERVICE_ERROR", status_code=status.HTTP_502_BAD_GATEWAY)


