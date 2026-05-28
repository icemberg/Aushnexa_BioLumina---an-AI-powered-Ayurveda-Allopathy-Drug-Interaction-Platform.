FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if required for compiling certain python packages
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend app and data pipeline
COPY backend/app ./app
COPY data_pipeline ./data_pipeline

EXPOSE 8000

# Set Python path to include the app directory
ENV PYTHONPATH=/app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
