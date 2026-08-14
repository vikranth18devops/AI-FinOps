# ==============================================================================
# UI_Script Provisioner Studio Dockerfile
# ==============================================================================
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies & Azure/AWS/GCP CLI tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    git \
    bash \
    lsof \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements & install dependencies
COPY application/backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt uvicorn fastapi pydantic

# Copy UI_Script files and infrastructure scripts
COPY application/UI_Script /app/application/UI_Script
COPY script_to_create_Az /app/script_to_create_Az

# Grant execution permissions
RUN chmod +x /app/script_to_create_Az/*.sh /app/application/UI_Script/*.sh

EXPOSE 8500

WORKDIR /app/application/UI_Script
CMD ["python", "server.py"]
