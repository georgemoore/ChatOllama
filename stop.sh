#!/bin/bash

# Ensure script runs from the project root directory
cd "$(dirname "$0")"

MODEL_NAME="gemma4:26b-a4b"

echo "🛑 Stopping Local LLM Workspace..."

# 1. Bring down Docker Compose containers
docker compose down

# 2. Free up Mac Mini VRAM by unloading the Ollama model
echo "🧠 Unloading $MODEL_NAME from Mac unified memory..."
ollama stop "$MODEL_NAME" 2>/dev/null || true

# 3. Optional: Clean dangling Docker resources
echo "🧹 Cleaning unused Docker build cache..."
docker image prune -f > /dev/null 2>&1

echo "--------------------------------------------------"
echo "✅ Everything is stopped and memory has been freed!"
echo "--------------------------------------------------"