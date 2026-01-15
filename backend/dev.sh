#!/bin/bash
cd "$(dirname "$0")/.."
export PYTHONPATH=$PYTHONPATH:.
uv run --project backend uvicorn backend.main:app --reload
