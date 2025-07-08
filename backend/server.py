from flask import Flask, request, jsonify, render_template, Response, stream_template
from flask_cors import CORS
import os
from chatbot_simple import AIChat
from weather_integration import WeatherAPI
from dotenv import load_dotenv
import psutil
import GPUtil
import tempfile
import shutil
from datetime import datetime
import json
import requests
# import speedtest
# import ping3
import platform
import subprocess
import threading
import time
import socket

# Load environment variables
load_dotenv()

app = Flask(__name__,
    template_folder='../frontend/templates',
    static_folder='../frontend/static'
)

# Configure Flask for better connection handling
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 300  # 5 minutes cache for static files
app.config['PERMANENT_SESSION_LIFETIME'] = 1800  # 30 minutes session timeout

CORS(app, resources={
    r"/api/*": {
        "origins": ["http://127.0.0.1:5041", "http://localhost:5041"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Initialize AI Chat and Weather API (consider initializing once if possible)
# Initialize only if needed, or handle potential errors if Ollama/API key are missing
ai_chat_instance = AIChat()
weather_api_instance = WeatherAPI(os.getenv('WEATHER_API_KEY'))


@app.route('/')
def index():
    return render_template('dashboard.html')

@app.route('/scraper')
def scraper_page():
    return render_template('scraper.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    """Legacy chat endpoint for backwards compatibility"""
    data = request.json
    user_message = data.get('message', '')
    response = ai_chat_instance.get_response(user_message)
    return jsonify({'response': response})

# ========== NEW CHAT API ENDPOINTS ==========

@app.route('/api/chat/send', methods=['POST'])
def chat_send():
    """Send a message and get AI response"""
    try:
        data = request.json
        user_message = data.get('message', '')
        conversation_id = data.get('conversation_id', None)
        stream = data.get('stream', False)
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        if stream:
            return Response(
                ai_chat_instance.get_response(user_message, conversation_id, stream=True),
                mimetype='text/plain'
            )
        else:
            response = ai_chat_instance.get_response(user_message, conversation_id, stream=False)
            return jsonify({
                'response': response,
                'conversation_id': ai_chat_instance.conversation_id
            })
            
    except Exception as e:
        print(f"Error in chat_send: {e}")
        return jsonify({'error': 'Failed to process message'}), 500

@app.route('/api/chat/conversations', methods=['GET'])
def get_conversations():
    """Get list of all conversations"""
    try:
        conversations = ai_chat_instance.get_conversations_list()
        return jsonify({'conversations': conversations})
    except Exception as e:
        print(f"Error getting conversations: {e}")
        return jsonify({'error': 'Failed to get conversations'}), 500

@app.route('/api/chat/conversations', methods=['POST'])
def create_conversation():
    """Create a new conversation"""
    try:
        data = request.json
        title = data.get('title', None)
        conversation_id = ai_chat_instance.create_conversation(title)
        return jsonify({'conversation_id': conversation_id})
    except Exception as e:
        print(f"Error creating conversation: {e}")
        return jsonify({'error': 'Failed to create conversation'}), 500

@app.route('/api/chat/conversations/<conversation_id>', methods=['GET'])
def get_conversation_history(conversation_id):
    """Get conversation history"""
    try:
        history = ai_chat_instance.get_conversation_history(conversation_id)
        return jsonify({'history': history})
    except Exception as e:
        print(f"Error getting conversation history: {e}")
        return jsonify({'error': 'Failed to get conversation history'}), 500

@app.route('/api/chat/conversations/<conversation_id>', methods=['DELETE'])
def delete_conversation(conversation_id):
    """Delete a conversation"""
    try:
        success = ai_chat_instance.delete_conversation(conversation_id)
        if success:
            return jsonify({'success': True})
        else:
            return jsonify({'error': 'Failed to delete conversation'}), 500
    except Exception as e:
        print(f"Error deleting conversation: {e}")
        return jsonify({'error': 'Failed to delete conversation'}), 500

@app.route('/api/chat/conversations/<conversation_id>/export', methods=['GET'])
def export_conversation(conversation_id):
    """Export conversation"""
    try:
        format_type = request.args.get('format', 'json')
        export_data = ai_chat_instance.export_conversation(conversation_id, format_type)
        
        if format_type.lower() == 'json':
            return Response(export_data, mimetype='application/json')
        else:
            return Response(export_data, mimetype='text/plain')
            
    except Exception as e:
        print(f"Error exporting conversation: {e}")
        return jsonify({'error': 'Failed to export conversation'}), 500

@app.route('/api/chat/models', methods=['GET'])
def get_available_models():
    """Get available AI models for all providers"""
    try:
        models = ai_chat_instance.get_available_models()
        return jsonify({'models': models})
    except Exception as e:
        print(f"Error getting available models: {e}")
        return jsonify({'error': 'Failed to get available models'}), 500

@app.route('/api/chat/config', methods=['GET'])
def get_chat_config():
    """Get current chat configuration"""
    try:
        config = ai_chat_instance.config
        # Remove sensitive information
        safe_config = {
            'selected_ai_model': config.get('selected_ai_model', ''),
            'system_prompt': config.get('system_prompt', ''),
            'current_provider': ai_chat_instance.current_provider,
            'current_model': ai_chat_instance.model,
            'has_openai_key': bool(config.get('openai_api_key')),
            'has_anthropic_key': bool(config.get('anthropic_api_key')),
            'has_google_key': bool(config.get('google_api_key')),
            'has_ollama': bool(config.get('ollama_api_key')),
        }
        return jsonify(safe_config)
    except Exception as e:
        print(f"Error getting chat config: {e}")
        return jsonify({'error': 'Failed to get chat config'}), 500

@app.route('/api/weather', methods=['GET'])
def weather():
    """Pobierz dane pogodowe dla Torunia (domyślnie) lub innego miasta"""
    city = request.args.get('city', 'Toruń')  # Domyślnie Toruń
    try:
        weather_data = weather_api_instance.get_weather(city)
        
        # Dodaj dodatkowe informacje dla lepszego wyświetlania
        if 'error' not in weather_data:
            weather_data['city_display'] = city
            weather_data['timestamp'] = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
            weather_data['timezone'] = 'Europe/Warsaw'
            
        return jsonify(weather_data)
    except Exception as e:
        return jsonify({
            'error': f'Błąd pobierania pogody: {str(e)}',
            'city': city,
            'timestamp': datetime.now().strftime('%d/%m/%Y %H:%M:%S')
        }), 500

@app.route('/api/system/resources', methods=['GET'])
def system_resources():
    try:
        # Get CPU usage
        cpu_percent = psutil.cpu_percent(interval=0.1)
        
        # Get memory usage
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        
        # Get disk usage - handle Windows properly
        try:
            if platform.system() == 'Windows':
                disk_path = os.path.splitdrive(os.getcwd())[0] + '\\'
            else:
                disk_path = '/'
            disk = psutil.disk_usage(disk_path)
            disk_percent = (disk.used / disk.total) * 100
        except Exception as disk_error:
            print(f"Disk usage error: {disk_error}")
            disk_percent = 0
        
        # Get GPU usage - handle missing GPU gracefully
        gpu_usage = 0
        gpu_memory_percent = 0
        try:
            gpus = GPUtil.getGPUs()
            if gpus and len(gpus) > 0:
                gpu_usage = gpus[0].load * 100
                gpu_memory_percent = gpus[0].memoryUtil * 100
        except Exception as gpu_error:
            print(f"GPU usage error: {gpu_error}")
            # Use default values of 0

        return jsonify({
            'cpu_percent': float(cpu_percent),
            'memory_percent': float(memory_percent),
            'disk_percent': float(disk_percent),
            'gpu_usage': float(gpu_usage),
            'gpu_memory_percent': float(gpu_memory_percent),
            'timestamp': int(time.time())
        })
        
    except Exception as e:
        print(f"Error fetching system resources: {e}")
        # Return default values instead of error
        return jsonify({
            'cpu_percent': 0.0,
            'memory_percent': 0.0,
            'disk_percent': 0.0,
            'gpu_usage': 0.0,
            'gpu_memory_percent': 0.0,
            'timestamp': int(time.time()),
            'error': 'Could not fetch complete system resources'
        })

@app.route('/api/system-stats', methods=['GET'])
def system_stats():
    try:
        # Basic system info
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        
        # Disk usage - handle Windows properly
        try:
            if platform.system() == 'Windows':
                disk_path = os.path.splitdrive(os.getcwd())[0] + '\\'
            else:
                disk_path = '/'
            disk = psutil.disk_usage(disk_path)
        except Exception as disk_error:
            print(f"Disk usage error: {disk_error}")
            # Fallback to C: drive on Windows
            disk = psutil.disk_usage('C:\\' if platform.system() == 'Windows' else '/')
        
        return jsonify({
            'cpu_percent': cpu_percent,
            'memory_percent': memory.percent,
            'memory_used': memory.used,
            'memory_total': memory.total,
            'memory_available': memory.available,
            'disk_percent': (disk.used / disk.total) * 100,
            'disk_used': disk.used,
            'disk_total': disk.total,
            'disk_free': disk.free,
            'platform': platform.system(),
            'architecture': platform.architecture()[0],
            'processor': platform.processor(),
            'hostname': socket.gethostname(),
            'uptime': time.time() - psutil.boot_time(),
            'timestamp': datetime.now().strftime('%d/%m/%Y %H:%M:%S')
        })
    except Exception as e:
        print(f"Error getting system stats: {e}")
        return jsonify({'error': 'Could not get system stats'}), 500

@app.route('/api/system/cleanup', methods=['POST'])
def cleanup_system():
    try:
        temp_dir = tempfile.gettempdir()
        for filename in os.listdir(temp_dir):
            file_path = os.path.join(temp_dir, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.unlink(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                print(f'Failed to delete {file_path}. Reason: {e}')
        return jsonify({'message': 'System cleanup successful'})
    except Exception as e:
        print(f"Error during system cleanup: {e}")
        return jsonify({'error': 'Could not perform system cleanup'}), 500

@app.route('/api/config/ai', methods=['POST'])
def save_ai_config():
    try:
        config_data = request.json
        config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'config.json')
        
        # Create the directory if it doesn't exist
        os.makedirs(os.path.dirname(config_path), exist_ok=True)

        with open(config_path, 'w') as f:
            json.dump(config_data, f, indent=4)
        
        # Reinitialize AI Chat with new config
        global ai_chat_instance
        ai_chat_instance = AIChat()
            
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error saving AI config: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/config/ai', methods=['GET'])
def get_ai_config():
    try:
        config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'config.json')
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                config = json.load(f)
            # Remove sensitive keys for frontend
            safe_config = {
                'model_path': config.get('model_path', ''),
                'mcp_server_url': config.get('mcp_server_url', ''),
                'system_prompt': config.get('system_prompt', ''),
                'file_paths': config.get('file_paths', []),
                'selected_ai_model': config.get('selected_ai_model', ''),
                'has_openai_key': bool(config.get('openai_api_key')),
                'has_anthropic_key': bool(config.get('anthropic_api_key')),
                'has_google_key': bool(config.get('google_api_key')),
                'has_ollama_key': bool(config.get('ollama_api_key')),
            }
            return jsonify(safe_config)
        else:
            return jsonify({})
    except Exception as e:
        print(f"Error getting AI config: {e}")
        return jsonify({'error': 'Could not get AI config'}), 500

# @app.route('/api/network/stats', methods=['GET'])
# def network_stats():
#     try:
#         s = speedtest.Speedtest()
#         s.get_best_server()
#         s.download()
#         s.upload()
#         res = s.results.dict()
#         return jsonify({
#             'download': res['download'] / 1024 / 1024,  # Mbps
#             'upload': res['upload'] / 1024 / 1024,  # Mbps
#             'ping': res['ping']
#         })
#     except Exception as e:
#         print(f"Error getting network stats: {e}")
#         return jsonify({'error': 'Could not get network stats'}), 500

@app.route('/api/network/stats', methods=['GET'])
def network_stats_simple():
    try:
        # Simplified network stats without speedtest
        return jsonify({
            'download': 50.0,  # Mock value - Mbps
            'upload': 10.0,    # Mock value - Mbps  
            'ping': 25         # Mock value - ms
        })
    except Exception as e:
        print(f"Error getting network stats: {e}")
        return jsonify({'error': 'Could not get network stats'}), 500

@app.route('/api/system/processes', methods=['GET'])
def system_processes():
    try:
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'username', 'cpu_percent', 'memory_percent']):
            processes.append(proc.info)
        # Sort by cpu_percent by default
        processes = sorted(processes, key=lambda p: p['cpu_percent'], reverse=True)[:10]
        return jsonify(processes)
    except Exception as e:
        print(f"Error getting system processes: {e}")
        return jsonify({'error': 'Could not get system processes'}), 500

@app.route('/api/system/info', methods=['GET'])
def system_info():
    """Pobierz podstawowe informacje o systemie"""
    try:
        # Basic system information
        boot_time = datetime.fromtimestamp(psutil.boot_time())
        uptime_seconds = time.time() - psutil.boot_time()
        uptime_hours = int(uptime_seconds // 3600)
        uptime_minutes = int((uptime_seconds % 3600) // 60)
        
        # Network info
        hostname = socket.gethostname()
        try:
            local_ip = socket.gethostbyname(hostname)
        except:
            local_ip = "Niedostępne"
        
        # CPU info
        cpu_count = psutil.cpu_count()
        cpu_count_logical = psutil.cpu_count(logical=True)
        
        system_info = {
            'hostname': hostname,
            'platform': platform.system(),
            'platform_release': platform.release(),
            'platform_version': platform.version(),
            'architecture': platform.machine(),
            'processor': platform.processor(),
            'python_version': platform.python_version(),
            'local_ip': local_ip,
            'boot_time': boot_time.strftime('%d/%m/%Y %H:%M:%S'),
            'uptime': f"{uptime_hours}h {uptime_minutes}m",
            'uptime_seconds': uptime_seconds,
            'cpu_cores_physical': cpu_count,
            'cpu_cores_logical': cpu_count_logical,
            'memory_total_gb': round(psutil.virtual_memory().total / (1024**3), 2),
            'timestamp': datetime.now().strftime('%d/%m/%Y %H:%M:%S')
        }
        
        return jsonify(system_info)
        
    except Exception as e:
        print(f"Error getting system info: {e}")
        return jsonify({
            'error': f'Błąd pobierania informacji systemowych: {str(e)}',
            'timestamp': datetime.now().strftime('%d/%m/%Y %H:%M:%S')
        }), 500

@app.route('/api/ai/list_models', methods=['GET'])
def list_ai_models():
    try:
        # Placeholder for listing Ollama models
        ollama_models = ["llama2", "mistral", "codellama"]
        
        # Placeholder for listing local models from a directory
        local_models_path = os.path.join(os.path.dirname(__file__), '..', 'models')
        local_models = []
        if os.path.exists(local_models_path):
            for f in os.listdir(local_models_path):
                if f.endswith(('.bin', '.gguf')):
                    local_models.append(f)

        all_models = sorted(list(set(ollama_models + local_models)))
        return jsonify({'models': all_models})
    except Exception as e:
        print(f"Error listing AI models: {e}")
        return jsonify({'error': 'Could not list AI models'}), 500

@app.route('/api/ai/install_model', methods=['POST'])
def install_ai_model():
    try:
        data = request.json
        model_name = data.get('model_name')
        if not model_name:
            return jsonify({'success': False, 'error': 'Model name not provided'}), 400

        # Check if it's an Ollama model or a local path
        if '/' in model_name or '\\' in model_name or '.' in model_name: # Simple check for path/file
            # Assume it's a local path, copy the file to the models directory
            # This is a simplified example, proper file handling and security is needed
            source_path = model_name
            destination_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
            os.makedirs(destination_dir, exist_ok=True)
            destination_path = os.path.join(destination_dir, os.path.basename(source_path))
            shutil.copy(source_path, destination_path)
            return jsonify({'success': True, 'message': f'Local model {model_name} installed.'})
        else:
            # Assume it's an Ollama model, run ollama pull
            command = ["ollama", "pull", model_name]
            process = subprocess.run(command, capture_output=True, text=True, check=True)
            return jsonify({'success': True, 'message': process.stdout.strip()})
    except subprocess.CalledProcessError as e:
        print(f"Error installing Ollama model: {e.stderr}")
        return jsonify({'success': False, 'error': e.stderr.strip()}), 500
    except Exception as e:
        print(f"Error installing AI model: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


def get_ai_tools_config():
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'ai_tools.json')
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            return json.load(f)
    return []

def save_ai_tools_config(tools):
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'ai_tools.json')
    os.makedirs(os.path.dirname(config_path), exist_ok=True)
    with open(config_path, 'w') as f:
        json.dump(tools, f, indent=4)

@app.route('/api/ai_tools', methods=['GET'])
def list_ai_tools():
    try:
        tools = get_ai_tools_config()
        return jsonify(tools)
    except Exception as e:
        print(f"Error listing AI tools: {e}")
        return jsonify({'error': 'Could not list AI tools'}), 500

@app.route('/api/ai_tools', methods=['POST'])
def add_ai_tool():
    try:
        new_tool = request.json
        tools = get_ai_tools_config()
        tools.append(new_tool)
        save_ai_tools_config(tools)
        return jsonify({'success': True, 'message': 'AI tool added successfully'}), 201
    except Exception as e:
        print(f"Error adding AI tool: {e}")
        return jsonify({'success': False, 'error': 'Could not add AI tool'}), 500

@app.route('/api/ai_tools/<tool_id>', methods=['PUT'])
def update_ai_tool(tool_id):
    try:
        updated_tool = request.json
        tools = get_ai_tools_config()
        
        # Convert tool_id to int if it's numeric, otherwise treat as string
        try:
            tool_id = int(tool_id)
        except ValueError:
            pass
        
        # Find tool by ID
        tool_index = None
        for i, tool in enumerate(tools):
            if tool.get('id') == tool_id:
                tool_index = i
                break
        
        if tool_index is None:
            return jsonify({'success': False, 'error': 'Tool not found'}), 404
            
        tools[tool_index] = updated_tool
        save_ai_tools_config(tools)
        return jsonify({'success': True, 'message': 'AI tool updated successfully'})
    except Exception as e:
        print(f"Error updating AI tool: {e}")
        return jsonify({'success': False, 'error': 'Could not update AI tool'}), 500

@app.route('/api/ai_tools/<tool_id>', methods=['DELETE'])
def delete_ai_tool(tool_id):
    try:
        tools = get_ai_tools_config()
        
        # Convert tool_id to int if it's numeric, otherwise treat as string
        try:
            tool_id = int(tool_id)
        except ValueError:
            pass
        
        # Find tool by ID
        tool_index = None
        for i, tool in enumerate(tools):
            if tool.get('id') == tool_id:
                tool_index = i
                break
        
        if tool_index is None:
            return jsonify({'success': False, 'error': 'Tool not found'}), 404
            
        del tools[tool_index]
        save_ai_tools_config(tools)
        return jsonify({'success': True, 'message': 'AI tool deleted successfully'})
    except Exception as e:
        print(f"Error deleting AI tool: {e}")
        return jsonify({'success': False, 'error': 'Could not delete AI tool'}), 500

# ========== WEB SCRAPER API ==========

@app.route('/api/scrape', methods=['POST'])
def scrape_website():
    try:
        data = request.json
        url = data.get('url')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Validate URL format
        if not (url.startswith('http://') or url.startswith('https://')):
            url = 'https://' + url
        
        # Hyperbrowser API integration
        hyperbrowser_api_key = 'hb_2184b34e1926353ef4c7837edace'
        
        # Use Hyperbrowser API for web scraping
        scrape_response = scrape_with_hyperbrowser(url, hyperbrowser_api_key)
        
        if scrape_response:
            return jsonify(scrape_response)
        else:
            # Fallback to basic requests scraping
            return basic_scrape_fallback(url)
            
    except Exception as e:
        print(f"Error scraping website: {e}")
        return jsonify({'error': f'Scraping failed: {str(e)}'}), 500

def scrape_with_hyperbrowser(url, api_key):
    """
    Scrape website using Hyperbrowser API
    """
    try:
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        # Hyperbrowser API endpoint for web scraping
        api_url = 'https://api.hyperbrowser.ai/v1/scrape'
        
        payload = {
            'url': url,
            'extract': {
                'title': True,
                'content': True,
                'links': True,
                'images': True,
                'metadata': True
            },
            'format': 'json'
        }
        
        response = requests.post(api_url, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            
            # Process and format the response
            formatted_result = {
                'url': url,
                'title': result.get('title', 'No title found'),
                'content': result.get('content', 'No content extracted'),
                'links': result.get('links', []),
                'images': result.get('images', []),
                'metadata': result.get('metadata', {}),
                'timestamp': time.time(),
                'source': 'hyperbrowser'
            }
            
            return formatted_result
        else:
            print(f"Hyperbrowser API error: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"Hyperbrowser scraping error: {e}")
        return None

def basic_scrape_fallback(url):
    """
    Fallback basic scraping using requests and BeautifulSoup
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Simple text extraction without BeautifulSoup for now
        content_preview = response.text[:2000] if len(response.text) > 2000 else response.text
        
        # Basic title extraction
        title_start = response.text.find('<title>')
        title_end = response.text.find('</title>')
        title = 'No title found'
        
        if title_start != -1 and title_end != -1:
            title = response.text[title_start + 7:title_end].strip()
        
        # Basic link extraction (simplified)
        import re
        links = re.findall(r'href=[\'"]?([^\'" >]+)', response.text)
        links = [link for link in links if link.startswith(('http://', 'https://', '//'))][:20]  # Limit to 20 links
        
        result = {
            'url': url,
            'title': title,
            'content': content_preview,
            'links': links,
            'images': [],
            'metadata': {
                'status_code': response.status_code,
                'content_type': response.headers.get('content-type', 'unknown')
            },
            'timestamp': time.time(),
            'source': 'basic_fallback'
        }
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Basic scraping fallback error: {e}")
        return jsonify({
            'error': f'Failed to scrape website: {str(e)}',
            'url': url,
            'timestamp': time.time()
        }), 500

@app.route('/api/joke', methods=['GET'])
def get_joke():
    try:
        headers = {'Accept': 'application/json'}
        response = requests.get('https://icanhazdadjoke.com/', headers=headers)
        response.raise_for_status()  # Raise an exception for bad status codes
        joke_data = response.json()
        return jsonify({'joke': joke_data['joke']})
    except requests.exceptions.RequestException as e:
        print(f"Error fetching joke: {e}")
        return jsonify({'error': 'Could not fetch joke'}), 500


# Import dashboard assistant routes
# Moved to end to avoid circular import
# from assistant_routes import *

if __name__ == '__main__':
    # Import assistant routes after app initialization
    try:
        from assistant_routes import *
        print("Assistant routes loaded successfully")
    except Exception as e:
        print(f"Warning: Could not load assistant routes: {e}")
    
    print("Starting JIMBODASH Flask server...")
    print("AI Chat System Enhanced with Multiple Providers")
    print("Dashboard Assistant AI Integration")
    print("Available endpoints:")
    print("- Chat: /api/chat/send")
    print("- Conversations: /api/chat/conversations")
    print("- Models: /api/chat/models")
    print("- Config: /api/config/ai")
    print("- Assistant: /api/assistant/guidance")
    print("- Libraries: /api/libraries/launch")
    app.run(debug=True, port=6025, host='127.0.0.1')# Enhanced Utilities Section - JIMBO Dashboard
# Tools: File Manager, System Cleaner, Network Tools, Process Manager, Text Editor, Calculator, QR Code, Password Gen

@app.route('/api/tools/file-manager', methods=['GET', 'POST'])
def file_manager():
    """File Manager Tool"""
    try:
        if request.method == 'GET':
            path = request.args.get('path', os.getcwd())
            try:
                items = []
                for item in os.listdir(path):
                    item_path = os.path.join(path, item)
                    is_dir = os.path.isdir(item_path)
                    size = 0 if is_dir else os.path.getsize(item_path)
                    modified = os.path.getmtime(item_path)
                    
                    items.append({
                        'name': item,
                        'path': item_path,
                        'is_directory': is_dir,
                        'size': size,
                        'modified': datetime.fromtimestamp(modified).strftime('%d/%m/%Y %H:%M:%S')
                    })
                
                return jsonify({
                    'current_path': path,
                    'items': sorted(items, key=lambda x: (not x['is_directory'], x['name'].lower()))
                })
            except PermissionError:
                return jsonify({'error': 'Brak uprawnień do tego folderu'}), 403
            except Exception as e:
                return jsonify({'error': f'Błąd odczytu folderu: {str(e)}'}), 500
        
        elif request.method == 'POST':
            data = request.json
            action = data.get('action')
            
            if action == 'create_folder':
                folder_path = data.get('path')
                os.makedirs(folder_path, exist_ok=True)
                return jsonify({'success': True, 'message': 'Folder utworzony'})
            
            elif action == 'delete':
                file_path = data.get('path')
                if os.path.isdir(file_path):
                    shutil.rmtree(file_path)
                else:
                    os.remove(file_path)
                return jsonify({'success': True, 'message': 'Plik/folder usunięty'})
            
            elif action == 'rename':
                old_path = data.get('old_path')
                new_path = data.get('new_path')
                os.rename(old_path, new_path)
                return jsonify({'success': True, 'message': 'Zmieniono nazwę'})
                
    except Exception as e:
        return jsonify({'error': f'Błąd file managera: {str(e)}'}), 500

@app.route('/api/tools/system-cleaner', methods=['POST'])
def system_cleaner():
    """System Cleaner Tool"""
    try:
        data = request.json
        action = data.get('action', 'scan')
        
        if action == 'scan':
            temp_files = []
            temp_dirs = [tempfile.gettempdir(), os.path.expanduser('~/AppData/Local/Temp')]
            
            total_size = 0
            for temp_dir in temp_dirs:
                if os.path.exists(temp_dir):
                    for root, dirs, files in os.walk(temp_dir):
                        for file in files:
                            try:
                                file_path = os.path.join(root, file)
                                size = os.path.getsize(file_path)
                                total_size += size
                                temp_files.append({
                                    'path': file_path,
                                    'size': size,
                                    'name': file
                                })
                            except (OSError, FileNotFoundError):
                                continue
            
            return jsonify({
                'temp_files_count': len(temp_files),
                'total_size_mb': round(total_size / (1024*1024), 2),
                'temp_files': temp_files[:100]  # Limit for performance
            })
        
        elif action == 'clean':
            cleaned_files = 0
            cleaned_size = 0
            
            temp_dirs = [tempfile.gettempdir()]
            for temp_dir in temp_dirs:
                if os.path.exists(temp_dir):
                    for root, dirs, files in os.walk(temp_dir):
                        for file in files:
                            try:
                                file_path = os.path.join(root, file)
                                size = os.path.getsize(file_path)
                                os.remove(file_path)
                                cleaned_files += 1
                                cleaned_size += size
                            except (OSError, PermissionError):
                                continue
            
            return jsonify({
                'cleaned_files': cleaned_files,
                'cleaned_size_mb': round(cleaned_size / (1024*1024), 2),
                'success': True
            })
            
    except Exception as e:
        return jsonify({'error': f'Błąd system cleaner: {str(e)}'}), 500

@app.route('/api/tools/network-tools', methods=['GET', 'POST'])
def network_tools():
    """Network Tools"""
    try:
        if request.method == 'GET':
            # Get network interfaces
            interfaces = psutil.net_if_addrs()
            network_info = {}
            
            for interface, addresses in interfaces.items():
                network_info[interface] = []
                for addr in addresses:
                    network_info[interface].append({
                        'family': str(addr.family),
                        'address': addr.address,
                        'netmask': addr.netmask,
                        'broadcast': addr.broadcast
                    })
            
            # Get network stats
            net_stats = psutil.net_io_counters()
            
            return jsonify({
                'interfaces': network_info,
                'stats': {
                    'bytes_sent': net_stats.bytes_sent,
                    'bytes_recv': net_stats.bytes_recv,
                    'packets_sent': net_stats.packets_sent,
                    'packets_recv': net_stats.packets_recv
                }
            })
        
        elif request.method == 'POST':
            data = request.json
            action = data.get('action')
            
            if action == 'ping':
                host = data.get('host', 'google.com')
                try:
                    # Simple ping using subprocess
                    result = subprocess.run(['ping', '-n', '4', host], 
                                          capture_output=True, text=True, timeout=10)
                    return jsonify({
                        'success': True,
                        'output': result.stdout,
                        'host': host
                    })
                except Exception as e:
                    return jsonify({'error': f'Ping failed: {str(e)}'}), 500
                    
    except Exception as e:
        return jsonify({'error': f'Błąd network tools: {str(e)}'}), 500

@app.route('/api/tools/calculator', methods=['POST'])
def calculator():
    """Simple Calculator Tool"""
    try:
        data = request.json
        expression = data.get('expression', '')
        
        # Basic security - only allow safe characters
        allowed_chars = '0123456789+-*/.() '
        if not all(c in allowed_chars for c in expression):
            return jsonify({'error': 'Niedozwolone znaki w wyrażeniu'}), 400
        
        try:
            result = eval(expression)
            return jsonify({
                'expression': expression,
                'result': result,
                'success': True
            })
        except ZeroDivisionError:
            return jsonify({'error': 'Dzielenie przez zero'}), 400
        except Exception as e:
            return jsonify({'error': f'Błąd obliczeń: {str(e)}'}), 400
            
    except Exception as e:
        return jsonify({'error': f'Błąd kalkulatora: {str(e)}'}), 500

@app.route('/api/tools/password-generator', methods=['POST'])
def password_generator():
    """Password Generator Tool"""
    try:
        data = request.json
        length = data.get('length', 12)
        include_uppercase = data.get('uppercase', True)
        include_lowercase = data.get('lowercase', True)
        include_numbers = data.get('numbers', True)
        include_symbols = data.get('symbols', True)
        
        import string
        import random
        
        chars = ''
        if include_lowercase:
            chars += string.ascii_lowercase
        if include_uppercase:
            chars += string.ascii_uppercase
        if include_numbers:
            chars += string.digits
        if include_symbols:
            chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'
        
        if not chars:
            return jsonify({'error': 'Wybierz przynajmniej jeden typ znaków'}), 400
        
        password = ''.join(random.choice(chars) for _ in range(length))
        
        return jsonify({
            'password': password,
            'length': length,
            'strength': 'Strong' if length >= 12 and len(set(chars)) > 20 else 'Medium' if length >= 8 else 'Weak'
        })
        
    except Exception as e:
        return jsonify({'error': f'Błąd generatora haseł: {str(e)}'}), 500

@app.route('/api/open-folder', methods=['POST'])
def open_folder():
    """Open a folder in Windows Explorer"""
    try:
        data = request.get_json()
        if not data or 'path' not in data:
            return jsonify({
                'success': False,
                'error': 'Brak ścieżki folderu'
            }), 400
        
        folder_path = data['path']
        
        # Sprawdź czy folder istnieje
        if not os.path.exists(folder_path):
            return jsonify({
                'success': False,
                'error': f'Folder nie istnieje: {folder_path}'
            }), 404
        
        # Otwórz folder w Eksploratorze Windows
        if platform.system() == 'Windows':
            os.startfile(folder_path)
        elif platform.system() == 'Darwin':  # macOS
            subprocess.run(['open', folder_path])
        else:  # Linux
            subprocess.run(['xdg-open', folder_path])
        
        return jsonify({
            'success': True,
            'message': f'Folder otwarty: {folder_path}'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Błąd otwierania folderu: {str(e)}'
        }), 500

@app.route('/api/start-3d-app', methods=['POST'])
def start_3d_app():
    """Start 3D Creator App"""
    try:
        # Check if port 3050 is free
        def is_port_free(port):
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.settimeout(1)
                    result = s.connect_ex(('localhost', port))
                    return result != 0
            except Exception:
                return False
        
        port = 3050
        if not is_port_free(port):
            return jsonify({
                'success': False,
                'error': f'Port {port} jest już zajęty. Aplikacja 3D może już działać.',
                'port_status': 'occupied'
            }), 400
        
        # Check if 3D_APP directory exists
        app_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), '3D_APP')
        if not os.path.exists(app_dir):
            return jsonify({
                'success': False,
                'error': 'Folder 3D_APP nie został znaleziony.',
                'app_dir': app_dir
            }), 404
        
        # Launch the 3D app using batch launcher
        try:
            batch_launcher = os.path.join(app_dir, 'launch_3d_creator.bat')
            
            # Check if batch launcher exists
            if not os.path.exists(batch_launcher):
                return jsonify({
                    'success': False,
                    'error': 'Batch launcher nie został znaleziony.',
                    'launcher_path': batch_launcher
                }), 404
            
            # Launch using batch file for better Windows compatibility
            if platform.system() == 'Windows':
                process = subprocess.Popen(
                    [batch_launcher],
                    cwd=app_dir,
                    creationflags=subprocess.CREATE_NEW_CONSOLE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    shell=True
                )
            else:
                # Fallback for non-Windows systems
                process = subprocess.Popen(
                    ['pnpm', 'dev', '-p', str(port)],
                    cwd=app_dir,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
            
            # Give it a moment to start
            time.sleep(2)
            
            # Check if the process is still running
            if process.poll() is None:
                return jsonify({
                    'success': True,
                    'message': f'Aplikacja 3D została uruchomiona na porcie {port}',
                    'port': port,
                    'url': f'http://localhost:{port}',
                    'pid': process.pid
                })
            else:
                # Process ended quickly, likely an error
                stdout, stderr = process.communicate()
                return jsonify({
                    'success': False,
                    'error': 'Nie udało się uruchomić aplikacji 3D',
                    'details': stderr.decode() if stderr else 'Nieznany błąd',
                    'stdout': stdout.decode() if stdout else ''
                }), 500
                
        except FileNotFoundError:
            return jsonify({
                'success': False,
                'error': 'pnpm nie został znaleziony. Upewnij się, że Node.js i pnpm są zainstalowane.',
                'suggestion': 'Zainstaluj Node.js i pnpm: npm install -g pnpm'
            }), 500
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Błąd podczas uruchamiania aplikacji 3D: {str(e)}'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Ogólny błąd endpointu 3D: {str(e)}'
        }), 500

# Add connection management middleware
@app.before_request
def before_request():
    # Add connection close header for short-lived connections
    request.environ.setdefault('wsgi.url_scheme', 'http')

@app.after_request
def after_request(response):
    # Add headers to prevent connection pooling issues
    response.headers['Connection'] = 'close'
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response
