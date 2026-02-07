#!/usr/bin/env python3
"""
ChatGPT-like Python Flask Backend using Groq API
Provides a /chat endpoint that accepts user messages and returns Groq responses
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from dotenv import load_dotenv
from groq import Groq

# Load environment variables from .env file
load_dotenv()

# Get the directory where app.py is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=BASE_DIR, static_url_path='')
CORS(app)

# Initialize Groq client
api_key = os.getenv('GROQ_API_KEY')
if not api_key:
    print("⚠️  Warning: GROQ_API_KEY not set. Set it in .env or environment variables.")
client = Groq(api_key=api_key)


@app.route('/chat', methods=['POST'])
def chat():
    """
    Main chat endpoint
    Expects JSON: { "messages": [{"role": "user", "content": "Your question here"}] }
    Returns JSON: { "reply": "OpenAI response" }
    """
    try:
        data = request.get_json()
        
        if not data or 'messages' not in data:
            return jsonify({"error": "Missing 'messages' in request body"}), 400
        
        if not api_key:
            return jsonify({"error": "Server missing Groq API key"}), 500
        
        messages = data.get('messages', [])
        model = data.get('model', 'mixtral-8x7b-32768')  # Groq's fast model
        temperature = data.get('temperature', 0.6)
        max_tokens = data.get('max_tokens', 800)
        
        # Call Groq API
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        # Extract response text
        reply = response.choices[0].message.content.strip()
        
        return jsonify({"reply": reply}), 200
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "Python ChatGPT backend is running"}), 200


@app.route('/', methods=['GET'])
def home():
    """Serve the main chat interface"""
    return send_from_directory(BASE_DIR, 'index.html')


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"🚀 Starting Python Groq backend on http://localhost:{port}")
    print(f"📝 API Key Status: {'✅ Loaded' if api_key else '❌ Not loaded'}")
    app.run(debug=True, port=port, host='0.0.0.0')