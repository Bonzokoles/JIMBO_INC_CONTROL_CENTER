# Dashboard Assistant Integration for JIMBO Inc Control Center

from flask import request, jsonify
from dashboard_assistant import DashboardAssistant, get_model_recommendations, install_recommended_model
import json
import psutil
import requests
import os
from datetime import datetime

# Import app from server module
from server import app

@app.route('/api/assistant/guidance', methods=['POST'])
def get_assistant_guidance():
    """Get AI guidance for current dashboard section"""
    try:
        data = request.json
        current_section = data.get('section', 'dashboard')
        user_query = data.get('query', '')
        
        # Get current system stats for context
        context = {
            'cpu_usage': psutil.cpu_percent(interval=0.1),
            'memory_usage': psutil.virtual_memory().percent,
            'timestamp': datetime.now().strftime('%H:%M:%S')
        }
        
        # Initialize assistant
        assistant = DashboardAssistant()
        
        # Get guidance
        guidance = assistant.get_dashboard_guidance(
            current_section=current_section,
            user_query=user_query,
            context=context
        )
        
        # Get action suggestions
        suggestions = assistant.suggest_actions(current_section, context)
        
        return jsonify({
            'guidance': guidance,
            'suggestions': suggestions,
            'section': current_section,
            'timestamp': context['timestamp']
        })
        
    except Exception as e:
        return jsonify({
            'error': f'Błąd asystenta AI: {str(e)}',
            'guidance': 'Asystent AI tymczasowo niedostępny',
            'suggestions': ['Sprawdź konfigurację AI', 'Skontaktuj się z administratorem']
        }), 500

@app.route('/api/assistant/models', methods=['GET'])
def get_assistant_models():
    """Get recommended models and current status"""
    try:
        recommendations = get_model_recommendations()
        
        # Check Ollama status
        ollama_status = False
        available_models = []
        
        try:
            response = requests.get('http://localhost:11434/api/tags', timeout=5)
            if response.status_code == 200:
                ollama_status = True
                models_data = response.json().get('models', [])
                available_models = [model['name'] for model in models_data]
        except:
            pass
        
        return jsonify({
            'recommendations': recommendations,
            'ollama_running': ollama_status,
            'available_models': available_models,
            'status': 'connected' if ollama_status else 'disconnected'
        })
        
    except Exception as e:
        return jsonify({'error': f'Błąd sprawdzania modeli: {str(e)}'}), 500

@app.route('/api/assistant/install-model', methods=['POST'])
def install_assistant_model():
    """Install recommended model for dashboard assistant"""
    try:
        data = request.json
        model_name = data.get('model_name', 'phi3:3b')
        
        # Start installation in background
        def install_model_background():
            success = install_recommended_model('ollama', model_name)
            # Here you could save status to database or file
            
        import threading
        thread = threading.Thread(target=install_model_background)
        thread.start()
        
        return jsonify({
            'success': True,
            'message': f'Rozpoczęto instalację modelu {model_name}',
            'model_name': model_name
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Błąd instalacji modelu: {str(e)}'
        }), 500

@app.route('/api/assistant/explain/<feature>', methods=['GET'])
def explain_feature(feature):
    """Get explanation of specific dashboard feature"""
    try:
        assistant = DashboardAssistant()
        explanation = assistant.get_feature_explanation(feature)
        
        return jsonify({
            'feature': feature,
            'explanation': explanation
        })
        
    except Exception as e:
        return jsonify({
            'error': f'Błąd wyjaśnienia funkcji: {str(e)}'
        }), 500

@app.route('/api/assistant/config', methods=['GET', 'POST'])
def assistant_config():
    """Get or update assistant configuration"""
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'assistant_config.json')
    
    if request.method == 'GET':
        try:
            if os.path.exists(config_path):
                with open(config_path, 'r') as f:
                    config = json.load(f)
            else:
                config = {
                    'model_type': 'ollama',
                    'model_name': 'phi3:3b',
                    'enabled': True,
                    'auto_suggestions': True
                }
            
            return jsonify(config)
            
        except Exception as e:
            return jsonify({'error': f'Błąd odczytu konfiguracji: {str(e)}'}), 500
    
    elif request.method == 'POST':
        try:
            config = request.json
            
            # Create config directory if doesn't exist
            os.makedirs(os.path.dirname(config_path), exist_ok=True)
            
            # Save configuration
            with open(config_path, 'w') as f:
                json.dump(config, f, indent=4)
            
            return jsonify({
                'success': True,
                'message': 'Konfiguracja zapisana'
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Błąd zapisu konfiguracji: {str(e)}'
            }), 500

# Add libraries launcher button endpoint
@app.route('/api/libraries/launch', methods=['POST'])
def launch_libraries():
    """Launch libraries management interface"""
    try:
        data = request.json
        library_type = data.get('type', 'business')  # business, technical, 3d
        
        libraries_path = os.path.join(os.path.dirname(__file__), '..', 'LIBRARIES')
        
        # Create libraries structure if doesn't exist
        library_paths = {
            'business': os.path.join(libraries_path, 'BUSINESS_DOCS'),
            'technical': os.path.join(libraries_path, 'TECHNICAL_DOCS'),
            '3d': os.path.join(libraries_path, '3D_MODELS'),
            'templates': os.path.join(libraries_path, 'TEMPLATES'),
            'archives': os.path.join(libraries_path, 'ARCHIVES')
        }
        
        # Create directories
        for path in library_paths.values():
            os.makedirs(path, exist_ok=True)
        
        # Get library contents
        selected_path = library_paths.get(library_type, libraries_path)
        
        if os.path.exists(selected_path):
            items = []
            for item in os.listdir(selected_path):
                item_path = os.path.join(selected_path, item)
                is_dir = os.path.isdir(item_path)
                size = 0 if is_dir else os.path.getsize(item_path)
                
                items.append({
                    'name': item,
                    'path': item_path,
                    'is_directory': is_dir,
                    'size': size,
                    'type': library_type
                })
            
            return jsonify({
                'success': True,
                'library_type': library_type,
                'path': selected_path,
                'items': items,
                'available_types': list(library_paths.keys())
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Ścieżka biblioteki nie istnieje'
            }), 404
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Błąd uruchamiania bibliotek: {str(e)}'
        }), 500

@app.route('/api/libraries/create', methods=['POST'])
def create_library_item():
    """Create new item in library"""
    try:
        data = request.json
        library_type = data.get('type', 'business')
        item_name = data.get('name', '')
        item_type = data.get('item_type', 'folder')  # folder, document
        
        libraries_path = os.path.join(os.path.dirname(__file__), '..', 'LIBRARIES')
        library_paths = {
            'business': os.path.join(libraries_path, 'BUSINESS_DOCS'),
            'technical': os.path.join(libraries_path, 'TECHNICAL_DOCS'),
            '3d': os.path.join(libraries_path, '3D_MODELS'),
            'templates': os.path.join(libraries_path, 'TEMPLATES')
        }
        
        base_path = library_paths.get(library_type, libraries_path)
        item_path = os.path.join(base_path, item_name)
        
        if item_type == 'folder':
            os.makedirs(item_path, exist_ok=True)
            message = f'Folder "{item_name}" utworzony'
        else:
            # Create empty document
            with open(item_path, 'w', encoding='utf-8') as f:
                f.write(f'# {item_name}\n\nNowy dokument utworzony {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
            message = f'Dokument "{item_name}" utworzony'
        
        return jsonify({
            'success': True,
            'message': message,
            'path': item_path
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Błąd tworzenia elementu: {str(e)}'
        }), 500
