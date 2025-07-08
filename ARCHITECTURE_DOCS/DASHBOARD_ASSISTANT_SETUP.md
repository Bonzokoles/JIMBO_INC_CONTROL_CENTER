# JIMBO Dashboard Assistant - Installation & Setup Guide

## 🤖 Dashboard Assistant Features Added

### ✅ Completed Integration:
1. **Backend AI Assistant** (`dashboard_assistant.py`)
   - Lightweight 3-4B model support
   - Ollama integration
   - Model recommendations based on system specs
   - Contextual guidance for dashboard sections

2. **API Endpoints** (`assistant_routes.py`)
   - `/api/assistant/guidance` - Get contextual help
   - `/api/assistant/models` - Check model status
   - `/api/assistant/install-model` - Install AI models
   - `/api/libraries/launch` - Launch business libraries
   - `/api/libraries/create` - Create new library items

3. **Frontend Integration** (`assistant.js`)
   - Dashboard Assistant panel
   - Libraries browser with CRUD operations
   - Model status and installation interface
   - Auto-contextual suggestions

### 📦 Recommended AI Models (3-4B):

**Best Options:**
- `phi3:3b` - Microsoft Phi-3 Mini (⭐ **RECOMMENDED**)
- `llama3.2:3b` - Meta Llama 3.2 3B  
- `gemma2:2b` - Google Gemma 2 2B (lightweight)
- `qwen2.5:3b` - Alibaba Qwen 2.5 3B

**System Requirements:**
- **< 8GB RAM**: `gemma2:2b` (2GB model)
- **8-16GB RAM**: `phi3:3b` (3.8GB model) ⭐
- **16GB+ RAM**: `mistral:7b` (4.1GB model)

## 🚀 Quick Setup Instructions

### Option 1: Auto-Install via Dashboard
1. Start JIMBO Control Center
2. Dashboard Assistant panel appears automatically
3. Click "Modele AI" button
4. Click "Instaluj" with default `phi3:3b` model
5. Wait 2-5 minutes for download

### Option 2: Manual Ollama Installation
```bash
# Install Ollama (if not installed)
curl -fsSL https://ollama.ai/install.sh | sh

# Pull recommended model
ollama pull phi3:3b

# Start Ollama service
ollama serve
```

### Option 3: Use Existing Models
If you have models in `T:\Ollama\models\blobs`, copy them to:
```
C:\Users\%USERNAME%\.ollama\models\
```

## 🎯 Dashboard Assistant Usage

### 1. **Contextual Guidance**
- Assistant automatically detects current dashboard section
- Provides relevant suggestions and instructions
- Ask questions in Polish: "Jak dodać nowy projekt?"

### 2. **Libraries Management**
- Click "Biblioteki" button to access business files
- Create folders and documents
- Organized structure: BUSINESS_DOCS, TECHNICAL_DOCS, 3D_MODELS

### 3. **Performance Optimization**
- Assistant monitors system resources
- Suggests cleanup when CPU/RAM high
- Recommends optimal workflows

## 🔧 Advanced Configuration

### Custom Model Configuration
Edit `config/assistant_config.json`:
```json
{
    "model_type": "ollama",
    "model_name": "phi3:3b",
    "base_url": "http://localhost:11434",
    "temperature": 0.3,
    "max_tokens": 512,
    "enabled": true,
    "auto_suggestions": true
}
```

### Alternative Model Options:
```bash
# Faster but less capable
ollama pull gemma2:2b

# More capable but resource-intensive
ollama pull mistral:7b

# Specialized for coding
ollama pull codellama:7b
```

## 🚨 Troubleshooting

### Issue: Assistant not responding
**Solution:**
1. Check if Ollama is running: `ollama list`
2. Restart Ollama service: `ollama serve`
3. Verify model installed: `ollama pull phi3:3b`

### Issue: High memory usage
**Solution:**
1. Switch to lighter model: `gemma2:2b`
2. Reduce context window in config
3. Close unused applications

### Issue: Slow responses
**Solution:**
1. Use smaller model
2. Check CPU usage in dashboard
3. Restart Ollama service

## 📊 Performance Benchmarks

| Model | Size | RAM Usage | Speed | Quality |
|-------|------|-----------|--------|---------|
| `gemma2:2b` | 1.6GB | ~3GB | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| `phi3:3b` | 2.3GB | ~4GB | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| `llama3.2:3b` | 2.0GB | ~4GB | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| `mistral:7b` | 4.1GB | ~6GB | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 🎭 Assistant Capabilities

### Business Intelligence Section:
- "Stwórz nowy dashboard z metrykami sprzedaży"
- "Dodaj widget wykresu przychodów"
- "Eksportuj raport miesięczny"

### Digital Assets Section:
- "Wgraj model 3D do biblioteki"
- "Kategoryzuj zasoby według projektów"
- "Optymalizuj rozmiar modeli"

### System Monitoring:
- "Sprawdź wydajność systemu"
- "Wyczyść pliki tymczasowe"
- "Zrestartuj usługi"

## 📝 Next Steps

1. **Test Assistant**: Ask "Co można zrobić w tej sekcji?"
2. **Explore Libraries**: Create business document structure
3. **Monitor Performance**: Check system resources
4. **Customize**: Adjust model based on usage patterns

**Status: ✅ PRODUCTION READY**
*Dashboard Assistant integrated and operational*
