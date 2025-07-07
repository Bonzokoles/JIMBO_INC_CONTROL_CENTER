import json
import os
import sqlite3
import datetime
from typing import List, Dict, Optional
import requests
import uuid

class AIChat:
    def __init__(self):
        self.config = self.load_config()
        self.model = None
        self.current_provider = None
        self.conversation_id = None
        self.initialize_model()
        self.init_database()

    def load_config(self):
        """Load configuration from file"""
        config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'config.json')
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            return {}

    def initialize_model(self):
        """Initialize AI model based on configuration - Simple version"""
        selected_model = self.config.get('selected_ai_model', '')
        
        # Simple fallback to Ollama or mock response
        self.current_provider = 'mock'
        self.model = 'mock-model'

    def init_database(self):
        """Initialize SQLite database for chat history"""
        db_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'chat_history.db')
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.cursor = self.conn.cursor()
        
        # Create tables if they don't exist
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                title TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id TEXT,
                role TEXT,
                content TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations (id)
            )
        ''')
        
        self.conn.commit()

    def get_response(self, message: str, conversation_id: str = None, stream: bool = False):
        """Get AI response - simplified version"""
        if not conversation_id:
            conversation_id = self.create_conversation()
        
        self.conversation_id = conversation_id
        
        # Save user message
        self.save_message(conversation_id, 'user', message)
        
        # Generate simple response
        response = f"Otrzymano wiadomość: {message}. To jest mock odpowiedź z JIMBO AI."
        
        # Save AI response
        self.save_message(conversation_id, 'assistant', response)
        
        if stream:
            yield f"data: {json.dumps({'response': response})}\n\n"
        else:
            return response

    def save_message(self, conversation_id: str, role: str, content: str):
        """Save message to database"""
        self.cursor.execute('''
            INSERT INTO messages (conversation_id, role, content)
            VALUES (?, ?, ?)
        ''', (conversation_id, role, content))
        self.conn.commit()

    def create_conversation(self, title: str = None):
        """Create new conversation"""
        conversation_id = str(uuid.uuid4())
        if not title:
            title = f"Rozmowa {datetime.datetime.now().strftime('%d/%m/%Y %H:%M')}"
        
        self.cursor.execute('''
            INSERT INTO conversations (id, title)
            VALUES (?, ?)
        ''', (conversation_id, title))
        self.conn.commit()
        
        return conversation_id

    def get_conversations_list(self):
        """Get list of conversations"""
        self.cursor.execute('''
            SELECT id, title, created_at 
            FROM conversations 
            ORDER BY created_at DESC
        ''')
        return [{'id': row[0], 'title': row[1], 'created_at': row[2]} for row in self.cursor.fetchall()]

    def get_conversation_history(self, conversation_id: str):
        """Get conversation history"""
        self.cursor.execute('''
            SELECT role, content, timestamp 
            FROM messages 
            WHERE conversation_id = ? 
            ORDER BY timestamp ASC
        ''', (conversation_id,))
        return [{'role': row[0], 'content': row[1], 'timestamp': row[2]} for row in self.cursor.fetchall()]

    def delete_conversation(self, conversation_id: str):
        """Delete conversation"""
        try:
            self.cursor.execute('DELETE FROM messages WHERE conversation_id = ?', (conversation_id,))
            self.cursor.execute('DELETE FROM conversations WHERE id = ?', (conversation_id,))
            self.conn.commit()
            return True
        except Exception as e:
            print(f"Error deleting conversation: {e}")
            return False

    def export_conversation(self, conversation_id: str, format_type: str = 'json'):
        """Export conversation"""
        history = self.get_conversation_history(conversation_id)
        
        if format_type.lower() == 'json':
            return json.dumps(history, indent=2)
        else:
            text_export = ""
            for msg in history:
                text_export += f"{msg['role'].upper()}: {msg['content']}\n\n"
            return text_export

    def get_available_models(self):
        """Get available models - simplified"""
        return {
            'mock': ['mock-model'],
            'ollama': ['llama2', 'codellama'],
            'openai': ['gpt-3.5-turbo', 'gpt-4'],
            'anthropic': ['claude-3-sonnet', 'claude-3-haiku'],
            'google': ['gemini-pro', 'gemini-pro-vision']
        }
