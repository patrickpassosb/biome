#!/bin/bash

echo "Stopping existing services..."
docker compose down --remove-orphans

echo "Building Docker images for backend and frontend..."
docker compose build

echo "Starting backend and frontend services..."
docker compose up
