#!/bin/bash

# Ensure script runs from the project root directory
cd "$(dirname "$0")"

echo "🚀 Initialising Local LLM Workspace..."

# 1. Check if native Ollama host service is reachable
if ! curl -s http://localhost:11434/api/version > /dev/null; then
    echo "⚠️  Ollama is not running on your Mac!"
    echo "    Opening Ollama application..."
    open -a Ollama
    
    # Wait until Ollama API comes online
    echo "⏳ Waiting for Ollama service to start..."
    until curl -s http://localhost:11434/api/version > /dev/null; do
        sleep 2
    done
    echo "✅ Ollama is ready."
fi

# 2. Build and launch containerised Flask backend
echo "📦 Starting Docker containers..."
docker compose up -d --build

# 3. Output status and access link
if [ $? -eq 0 ]; then
    echo "--------------------------------------------------"
    echo "🎉 Workspace is live!"
    echo "👉 URL: http://localhost:5000"
    echo "--------------------------------------------------"
else
    echo "❌ Failed to start Docker containers."
    exit 1
fi