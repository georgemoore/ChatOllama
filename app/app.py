import os
import requests
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Ensure template changes reload immediately without restarting Flask
app.config['TEMPLATES_AUTO_RELOAD'] = True

# Environment configuration with native defaults
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://host.docker.internal:11434")
MODEL_NAME = os.getenv("MODEL_NAME", "gemma4:26b-a4b")


@app.route("/")
def index():
    """Renders the main chat workspace UI and passes the active model name."""
    return render_template("index.html", model_name=MODEL_NAME)


@app.route("/api/chat", methods=["POST"])
def chat():
    """Proxies multi-turn conversation payloads between the web frontend and Ollama."""
    data = request.json or {}
    messages = data.get("messages", [])

    # Payload structured specifically for Ollama's stateful /api/chat endpoint
    payload = {
        "model": MODEL_NAME,
        "messages": messages,
        "stream": False
    }

    try:
        response = requests.post(f"{OLLAMA_URL}/api/chat", json=payload, timeout=120)
        response.raise_for_status()
        ollama_json = response.json()

        # Extract message object and assistant text content
        message_obj = ollama_json.get("message", {})
        content = message_obj.get("content", "")

        # Return structured response ensuring backwards and forwards payload compatibility
        return jsonify({
            "response": content,
            "message": message_obj,
            "content": content
        })

    except requests.exceptions.RequestException as err:
        print(f"[Ollama Backend Error]: {err}", flush=True)
        return jsonify({"error": f"Failed to communicate with Ollama: {str(err)}"}), 500


if __name__ == "__main__":
    # Bound to 0.0.0.0 for containerised execution
    app.run(host="0.0.0.0", port=5000, debug=True)