#!/usr/bin/env python3
"""
JIMBO INC CONTROL CENTER - MCP Server
AI Business Automation Platform
Port: 6020
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import sys

# Dodaj backend do ścieżki
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
if backend_path not in sys.path:
    sys.path.append(backend_path)

app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET'])
def root():
    """Główny endpoint MCP Server"""
    return jsonify({
        "server": "JIMBO MCP Server",
        "version": "1.0.0",
        "status": "running",
        "port": 3000,
        "endpoints": [
            "/health",
            "/status",
            "/config",
            "/chat",
            "/tools"
        ]
    })

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "server": "JIMBO MCP",
        "timestamp": "2025-07-04"
    })

@app.route('/status', methods=['GET'])
def status():
    """Status systemu"""
    try:
        # Sprawdź czy główny serwer działa
        import requests
        main_server_status = "unknown"
        try:
            response = requests.get("http://127.0.0.1:5041", timeout=2)
            main_server_status = "running" if response.status_code == 200 else "error"
        except:
            main_server_status = "offline"
        
        return jsonify({
            "mcp_server": "running",
            "main_server": main_server_status,
            "main_server_url": "http://127.0.0.1:5041",
            "config_loaded": os.path.exists("config/config.json")
        })
    except Exception as e:
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

@app.route('/config', methods=['GET'])
def get_config():
    """Pobierz konfigurację"""
    try:
        config_path = "config/config.json"
        if os.path.exists(config_path):
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            return jsonify(config)
        else:
            return jsonify({"error": "Config file not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/chat', methods=['POST'])
def mcp_chat():
    """MCP Chat endpoint"""
    try:
        data = request.json
        message = data.get('message', '')
        
        # Przekaż do głównego serwera
        import requests
        response = requests.post(
            "http://127.0.0.1:5041/api/chat",
            json={"message": message},
            timeout=10
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({
                "error": "Main server error",
                "status_code": response.status_code
            }), 500
            
    
    
    \
            {
                "name": "config",
                "description": "Konfiguracja systemu",
                "endpoint": "/config"
            }
        ]
    })

if __name__ == '__main__':
    print("🚀 Uruchamianie JIMBO MCP Server...")
    print("📡 Port: 3000")
    print("🔗 URL: http://localhost:3000")
    print("💬 Gotowy do komunikacji MCP!")
    
    app.run(
        debug=True,
        port=3000,
        host='127.0.0.1'
    )
