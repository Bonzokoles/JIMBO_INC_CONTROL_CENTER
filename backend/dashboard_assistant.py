"""
JIMBO Dashboard Assistant AI
Lightweight AI model integration for dashboard management and user guidance
"""

import requests
import json
import os
from typing import Optional, Dict, Any, List
import logging

class DashboardAssistant:
    """
    AI Assistant specialized for JIMBO dashboard management and user guidance
    Supports multiple deployment options: Ollama, local models, or cloud APIs
    """
    
    def __init__(self, config_path: str = None):
        self.config = self._load_config(config_path)
        self.model_type = self.config.get('model_type', 'ollama')  # ollama, local, openai
        self.model_name = self.config.get('model_name', 'phi3:3b')  # Default lightweight model
        self.base_url = self.config.get('base_url', 'http://localhost:11434')
        self.system_prompt = self._get_system_prompt()
        
        # Initialize model based on type
        self._initialize_model()
    
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load configuration from file or return defaults"""
        default_config = {
            'model_type': 'ollama',
            'model_name': 'phi3:3b',  # Lightweight 3B parameter model
            'base_url': 'http://localhost:11434',
            'temperature': 0.3,
            'max_tokens': 512,
            'context_window': 2048
        }
        
        if config_path and os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    user_config = json.load(f)
                default_config.update(user_config)
            except Exception as e:
                logging.warning(f"Failed to load config: {e}")
        
        return default_config
    
    def _get_system_prompt(self) -> str:
        """System prompt optimized for dashboard assistant role"""
        return """You are JIMBO Dashboard Assistant - an AI specialized in helping users navigate and utilize the JIMBO Inc business platform.

Your role:
- Guide users through dashboard features and capabilities
- Suggest relevant actions based on current context
- Provide concise, actionable instructions
- Help optimize workflow and productivity
- Monitor system performance and suggest improvements

Dashboard sections you manage:
- Business Intelligence (metrics, charts, KPIs)
- Digital Asset Management (3D models, files)
- Client Management (projects, communications)
- AI Automation (agents, workflows)
- System Monitoring (performance, resources)
- Libraries (business documents, knowledge)

Communication style:
- Concise and practical
- Focus on actionable advice
- Use bullet points for multiple suggestions
- Mention specific UI elements when relevant
- Prioritize user's immediate needs

Always respond in Polish when user communicates in Polish.
Keep responses under 3 sentences unless detailed explanation is requested."""

    def _initialize_model(self):
        """Initialize the AI model based on configuration"""
        if self.model_type == 'ollama':
            self._check_ollama_connection()
        elif self.model_type == 'local':
            self._initialize_local_model()
        # Add other model types as needed
    
    def _check_ollama_connection(self) -> bool:
        """Check if Ollama is running and model is available"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json().get('models', [])
                available_models = [model['name'] for model in models]
                
                if self.model_name in available_models:
                    logging.info(f"Ollama model {self.model_name} is available")
                    return True
                else:
                    logging.warning(f"Model {self.model_name} not found. Available: {available_models}")
                    return False
            else:
                logging.error(f"Ollama not responding: {response.status_code}")
                return False
        except Exception as e:
            logging.error(f"Failed to connect to Ollama: {e}")
            return False
    
    def _initialize_local_model(self):
        """Initialize local model (placeholder for future implementation)"""
        logging.info("Local model initialization - not implemented yet")
    
    def get_dashboard_guidance(self, 
                             current_section: str, 
                             user_query: str = "", 
                             context: Dict[str, Any] = None) -> str:
        """
        Get AI guidance for current dashboard section
        
        Args:
            current_section: Current dashboard section (e.g., 'business_intelligence')
            user_query: Optional user question
            context: Additional context (system stats, recent actions, etc.)
        """
        
        prompt = self._build_guidance_prompt(current_section, user_query, context)
        
        if self.model_type == 'ollama':
            return self._query_ollama(prompt)
        elif self.model_type == 'local':
            return self._query_local_model(prompt)
        else:
            return "Dashboard Assistant niedostępny. Sprawdź konfigurację AI."
    
    def _build_guidance_prompt(self, 
                              current_section: str, 
                              user_query: str, 
                              context: Dict[str, Any]) -> str:
        """Build appropriate prompt based on section and context"""
        
        section_info = {
            'dashboard': 'główny dashboard z przeglądem systemu',
            'business_intelligence': 'analiza biznesowa i metryki',
            'assets': 'zarządzanie zasobami 3D i plikami',
            'clients': 'zarządzanie klientami i projektami',
            'ai_tools': 'narzędzia AI i automatyzacja',
            'system': 'monitoring systemu i wydajności',
            'libraries': 'biblioteki dokumentów i wiedzy'
        }
        
        current_info = section_info.get(current_section, 'nieznana sekcja')
        
        prompt = f"""Sekcja: {current_info}

Kontekst systemu:"""
        
        if context:
            if 'cpu_usage' in context:
                prompt += f"\n- CPU: {context['cpu_usage']}%"
            if 'memory_usage' in context:
                prompt += f"\n- RAM: {context['memory_usage']}%"
            if 'active_projects' in context:
                prompt += f"\n- Aktywne projekty: {context['active_projects']}"
        
        if user_query:
            prompt += f"\n\nPytanie użytkownika: {user_query}"
        else:
            prompt += f"\n\nCo można zrobić w sekcji '{current_info}'? Podaj 2-3 konkretne sugestie."
        
        return prompt
    
    def _query_ollama(self, prompt: str) -> str:
        """Query Ollama API"""
        try:
            payload = {
                "model": self.model_name,
                "prompt": f"{self.system_prompt}\n\n{prompt}",
                "stream": False,
                "options": {
                    "temperature": self.config.get('temperature', 0.3),
                    "num_predict": self.config.get('max_tokens', 512)
                }
            }
            
            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get('response', 'Brak odpowiedzi z modelu').strip()
            else:
                return f"Błąd API: {response.status_code}"
                
        except Exception as e:
            return f"Błąd połączenia z AI: {str(e)}"
    
    def _query_local_model(self, prompt: str) -> str:
        """Query local model (placeholder)"""
        return "Lokalne modele AI - w przygotowaniu"
    
    def suggest_actions(self, section: str, system_stats: Dict[str, Any] = None) -> List[str]:
        """Get contextual action suggestions for current section"""
        
        suggestions = {
            'dashboard': [
                '📊 Sprawdź wydajność systemu',
                '📈 Przejrzyj ostatnie metryki biznesowe',
                '🔧 Uruchom narzędzia AI'
            ],
            'business_intelligence': [
                '📊 Utwórz nowy dashboard',
                '📈 Dodaj widget metryki',
                '💹 Eksportuj raport'
            ],
            'assets': [
                '📁 Przeglądaj bibliotekę 3D',
                '⬆️ Wgraj nowy model',
                '🏷️ Dodaj tagi do zasobów'
            ],
            'clients': [
                '👥 Dodaj nowego klienta',
                '📋 Utwórz projekt',
                '📧 Wyślij komunikat'
            ],
            'ai_tools': [
                '🤖 Uruchom agenta AI',
                '⚙️ Skonfiguruj workflow',
                '📝 Trenuj model'
            ],
            'system': [
                '🧹 Oczyść pliki tymczasowe',
                '📊 Sprawdź logi systemu',
                '🔄 Zrestartuj usługi'
            ],
            'libraries': [
                '📚 Przeglądaj dokumenty',
                '🔍 Wyszukaj w bazie wiedzy',
                '📄 Dodaj nowy dokument'
            ]
        }
        
        base_suggestions = suggestions.get(section, ['Eksploruj dostępne opcje'])
        
        # Add performance-based suggestions
        if system_stats:
            cpu_usage = system_stats.get('cpu_percent', 0)
            memory_usage = system_stats.get('memory_percent', 0)
            
            if cpu_usage > 80:
                base_suggestions.append('⚠️ Wysokie zużycie CPU - sprawdź procesy')
            if memory_usage > 85:
                base_suggestions.append('⚠️ Wysokie zużycie RAM - oczyść pamięć')
        
        return base_suggestions
    
    def get_feature_explanation(self, feature_name: str) -> str:
        """Get explanation of specific dashboard feature"""
        
        explanations = {
            'dashboard': 'Główny widok z przeglądem całego systemu JIMBO Inc',
            'widgets': 'Komponenty UI wyświetlające metryki biznesowe w czasie rzeczywistym',
            'ai_agents': 'Autonomiczne programy AI wykonujące zadania biznesowe',
            'libraries': 'Zorganizowane systemy plików z dokumentami biznesowymi',
            'voice_control': 'Sterowanie głosem - powiedz "Jimbo" i wydaj polecenie',
            '3d_creator': 'Aplikacja do tworzenia i edycji modeli 3D',
            'system_monitor': 'Monitoring wydajności CPU, RAM, dysku i sieci'
        }
        
        return explanations.get(feature_name, f'Funkcja {feature_name} - skontaktuj się z administratorem')

# Recommended models for dashboard assistant role
RECOMMENDED_MODELS = {
    'ollama': [
        'phi3:3b',      # Microsoft Phi-3 Mini - excellent for instruction following
        'llama3.2:3b',  # Meta Llama 3.2 3B - good balance of capability and speed  
        'gemma2:2b',    # Google Gemma 2 2B - very lightweight and efficient
        'qwen2.5:3b',   # Alibaba Qwen 2.5 3B - strong reasoning capabilities
        'mistral:7b'    # Mistral 7B - higher capability if resources allow
    ],
    'huggingface': [
        'microsoft/DialoGPT-medium',
        'microsoft/Phi-3-mini-4k-instruct',
        'google/gemma-2b-it'
    ]
}

def install_recommended_model(model_type: str = 'ollama', model_name: str = 'phi3:3b') -> bool:
    """Install recommended model for dashboard assistant"""
    
    if model_type == 'ollama':
        try:
            import subprocess
            result = subprocess.run(['ollama', 'pull', model_name], 
                                  capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                logging.info(f"Successfully installed {model_name}")
                return True
            else:
                logging.error(f"Failed to install {model_name}: {result.stderr}")
                return False
                
        except Exception as e:
            logging.error(f"Error installing model: {e}")
            return False
    
    return False

def get_model_recommendations() -> Dict[str, Any]:
    """Get model recommendations based on system capabilities"""
    
    import psutil
    
    # Get system specs
    memory_gb = psutil.virtual_memory().total / (1024**3)
    cpu_count = psutil.cpu_count()
    
    recommendations = {
        'lightweight': 'phi3:3b',      # < 8GB RAM
        'balanced': 'llama3.2:3b',     # 8-16GB RAM  
        'performance': 'mistral:7b'    # 16GB+ RAM
    }
    
    if memory_gb < 8:
        recommended = recommendations['lightweight']
        reason = 'Ograniczona pamięć RAM'
    elif memory_gb < 16:
        recommended = recommendations['balanced'] 
        reason = 'Średnia ilość RAM'
    else:
        recommended = recommendations['performance']
        reason = 'Wysoka wydajność systemu'
    
    return {
        'recommended_model': recommended,
        'reason': reason,
        'memory_gb': round(memory_gb, 1),
        'cpu_cores': cpu_count,
        'all_options': recommendations
    }
