# Context7: https://github.com/docker/docs/blob/main/content/manuals/build/building/multi-stage.md
FROM python:3.12-slim AS builder

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


# --no-install-project: skip installing the current project
RUN uv sync --frozen --no-dev --no-install-project

# Stage 2: Runtime
FROM python:3.12-slim

WORKDIR /app

# Copy uv into runtime image so install/run commands are available.
COPY --from=builder /bin/uv /bin/uv

# Ensure the venv's interpreter path exists at runtime.
# Context7: https://github.com/astral-sh/uv/blob/main/docs/pip/environments.md
RUN ln -s /usr/local/bin/python3.12 /usr/bin/python3.12

# Copy the virtual environment from the builder
COPY --from=builder /app/.venv /app/.venv

# Copy application code
COPY . .

# Install the project
RUN uv sync --frozen --no-dev

# Use uvicorn to run the app
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
