FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Set working directory
WORKDIR /app

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1
ENV PYTHONPATH=/app

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies
# --frozen: sync with uv.lock
# --no-install-project: only install dependencies, not the app itself yet
# --no-dev: production dependencies only
RUN uv sync --frozen --no-install-project --no-dev

# Copy application code
COPY . .

# Install the project
RUN uv sync --frozen --no-dev

# Use uvicorn to run the app
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
