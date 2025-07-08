/* JIMBO Dashboard Assistant Integration */

class DashboardAssistant {
    constructor() {
        this.assistantEnabled = false;
        this.currentSection = 'dashboard';
        this.initializeAssistant();
    }

    async initializeAssistant() {
        try {
            const response = await fetch('/api/assistant/config');
            const config = await response.json();
            this.assistantEnabled = config.enabled !== false;
            
            if (this.assistantEnabled) {
                this.addAssistantUI();
                this.loadModelStatus();
            }
        } catch (error) {
            console.log('Assistant not available:', error);
        }
    }

    addAssistantUI() {
        // Add assistant panel to dashboard
        const assistantPanel = `
            <div id="assistant-panel" class="card mb-3" style="border-left: 4px solid #007bff;">
                <div class="card-header bg-light">
                    <h6 class="mb-0">
                        <i class="fas fa-robot"></i> JIMBO Assistant
                        <button class="btn btn-sm btn-outline-primary float-end" onclick="assistant.togglePanel()">
                            <i class="fas fa-chevron-up" id="assistant-toggle-icon"></i>
                        </button>
                    </h6>
                </div>
                <div class="card-body" id="assistant-body">
                    <div id="assistant-guidance" class="mb-2">
                        <small class="text-muted">Ładowanie sugestii...</small>
                    </div>
                    <div id="assistant-suggestions" class="mb-2"></div>
                    <div class="input-group input-group-sm">
                        <input type="text" class="form-control" id="assistant-query" 
                               placeholder="Zapytaj asystenta..." onkeypress="if(event.key==='Enter') assistant.askAssistant()">
                        <button class="btn btn-primary" onclick="assistant.askAssistant()">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                    <div class="mt-2">
                        <button class="btn btn-sm btn-outline-success" onclick="assistant.showLibraries()">
                            <i class="fas fa-books"></i> Biblioteki
                        </button>
                        <button class="btn btn-sm btn-outline-info" onclick="assistant.showModelStatus()">
                            <i class="fas fa-brain"></i> Modele AI
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Find appropriate place to insert assistant panel
        const mainContent = document.querySelector('.container-fluid') || document.body;
        if (mainContent) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = assistantPanel;
            mainContent.insertBefore(tempDiv.firstElementChild, mainContent.firstChild);
        }
    }

    async loadModelStatus() {
        try {
            const response = await fetch('/api/assistant/models');
            const data = await response.json();
            
            this.updateModelStatus(data);
            this.loadGuidance();
        } catch (error) {
            console.error('Error loading model status:', error);
        }
    }

    updateModelStatus(data) {
        const statusIndicator = data.ollama_running ? 
            '<span class="badge bg-success">AI Połączony</span>' : 
            '<span class="badge bg-warning">AI Rozłączony</span>';
        
        // Update header if needed
        const header = document.querySelector('#assistant-panel .card-header h6');
        if (header) {
            header.innerHTML = `<i class="fas fa-robot"></i> JIMBO Assistant ${statusIndicator}`;
        }
    }

    async loadGuidance() {
        try {
            const response = await fetch('/api/assistant/guidance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    section: this.currentSection,
                    query: ''
                })
            });
            
            const data = await response.json();
            this.displayGuidance(data);
        } catch (error) {
            console.error('Error loading guidance:', error);
            this.displayError('Nie można załadować sugestii AI');
        }
    }

    displayGuidance(data) {
        const guidanceEl = document.getElementById('assistant-guidance');
        const suggestionsEl = document.getElementById('assistant-suggestions');
        
        if (guidanceEl) {
            guidanceEl.innerHTML = `<small class="text-info">${data.guidance}</small>`;
        }
        
        if (suggestionsEl && data.suggestions) {
            const suggestionsHTML = data.suggestions.map(suggestion => 
                `<small class="badge bg-light text-dark me-1 mb-1">${suggestion}</small>`
            ).join('');
            suggestionsEl.innerHTML = suggestionsHTML;
        }
    }

    async askAssistant() {
        const queryInput = document.getElementById('assistant-query');
        const query = queryInput.value.trim();
        
        if (!query) return;
        
        try {
            // Show loading
            this.displayGuidance({ guidance: 'Przetwarzanie...', suggestions: [] });
            
            const response = await fetch('/api/assistant/guidance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    section: this.currentSection,
                    query: query
                })
            });
            
            const data = await response.json();
            this.displayGuidance(data);
            queryInput.value = '';
            
        } catch (error) {
            console.error('Error asking assistant:', error);
            this.displayError('Błąd komunikacji z asystentem AI');
        }
    }

    async showLibraries() {
        try {
            const response = await fetch('/api/libraries/launch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'business' })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.openLibrariesModal(data);
            } else {
                alert('Błąd: ' + data.error);
            }
        } catch (error) {
            console.error('Error launching libraries:', error);
            alert('Nie można uruchomić bibliotek');
        }
    }

    openLibrariesModal(data) {
        const modalHTML = `
            <div class="modal fade" id="librariesModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-books"></i> Biblioteki JIMBO
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-3">
                                    <div class="list-group" id="library-types">
                                        ${data.available_types.map(type => 
                                            `<button class="list-group-item list-group-item-action ${type === data.library_type ? 'active' : ''}"
                                                     onclick="assistant.switchLibraryType('${type}')">${type.toUpperCase()}</button>`
                                        ).join('')}
                                    </div>
                                    <button class="btn btn-success btn-sm mt-2 w-100" onclick="assistant.createLibraryItem()">
                                        <i class="fas fa-plus"></i> Nowy element
                                    </button>
                                </div>
                                <div class="col-md-9">
                                    <div id="library-contents">
                                        ${this.renderLibraryContents(data.items)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if present
        const existingModal = document.getElementById('librariesModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add new modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('librariesModal'));
        modal.show();
    }

    renderLibraryContents(items) {
        if (!items || items.length === 0) {
            return '<p class="text-muted">Biblioteka jest pusta</p>';
        }
        
        return `
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Nazwa</th>
                            <th>Typ</th>
                            <th>Rozmiar</th>
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr>
                                <td>
                                    <i class="fas fa-${item.is_directory ? 'folder' : 'file'}"></i>
                                    ${item.name}
                                </td>
                                <td>${item.is_directory ? 'Folder' : 'Plik'}</td>
                                <td>${item.is_directory ? '-' : this.formatFileSize(item.size)}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary" onclick="assistant.openLibraryItem('${item.path}')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    async switchLibraryType(type) {
        try {
            const response = await fetch('/api/libraries/launch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: type })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update active button
                document.querySelectorAll('#library-types .list-group-item').forEach(btn => {
                    btn.classList.remove('active');
                });
                event.target.classList.add('active');
                
                // Update contents
                document.getElementById('library-contents').innerHTML = this.renderLibraryContents(data.items);
            }
        } catch (error) {
            console.error('Error switching library type:', error);
        }
    }

    async createLibraryItem() {
        const name = prompt('Nazwa nowego elementu:');
        if (!name) return;
        
        const type = document.querySelector('#library-types .active').textContent.toLowerCase();
        const itemType = confirm('Czy utworzyć folder?\n(Anuluj = dokument)') ? 'folder' : 'document';
        
        try {
            const response = await fetch('/api/libraries/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: type,
                    name: name,
                    item_type: itemType
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert(data.message);
                // Refresh current library view
                this.switchLibraryType(type);
            } else {
                alert('Błąd: ' + data.error);
            }
        } catch (error) {
            console.error('Error creating library item:', error);
            alert('Nie można utworzyć elementu');
        }
    }

    openLibraryItem(path) {
        // Placeholder for opening files/folders
        console.log('Opening:', path);
        alert('Funkcja otwierania plików w przygotowaniu');
    }

    async showModelStatus() {
        try {
            const response = await fetch('/api/assistant/models');
            const data = await response.json();
            
            this.openModelStatusModal(data);
        } catch (error) {
            console.error('Error getting model status:', error);
            alert('Nie można pobrać statusu modeli AI');
        }
    }

    openModelStatusModal(data) {
        const modalHTML = `
            <div class="modal fade" id="modelStatusModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-brain"></i> Status Modeli AI
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert ${data.ollama_running ? 'alert-success' : 'alert-warning'}">
                                <strong>Ollama:</strong> ${data.ollama_running ? 'Połączony' : 'Rozłączony'}
                            </div>
                            
                            <h6>Zalecane modele:</h6>
                            <div class="mb-3">
                                <p><strong>Zalecany:</strong> ${data.recommendations.recommended_model}</p>
                                <p><small class="text-muted">${data.recommendations.reason}</small></p>
                                <p><small>RAM: ${data.recommendations.memory_gb}GB | CPU: ${data.recommendations.cpu_cores} rdzeni</small></p>
                            </div>
                            
                            <h6>Dostępne modele:</h6>
                            <div class="list-group">
                                ${data.available_models.length > 0 ? 
                                    data.available_models.map(model => 
                                        `<div class="list-group-item">${model}</div>`
                                    ).join('') :
                                    '<div class="list-group-item text-muted">Brak zainstalowanych modeli</div>'
                                }
                            </div>
                            
                            <div class="mt-3">
                                <div class="input-group">
                                    <input type="text" class="form-control" id="model-to-install" 
                                           placeholder="Nazwa modelu (np. phi3:3b)" value="phi3:3b">
                                    <button class="btn btn-primary" onclick="assistant.installModel()">
                                        <i class="fas fa-download"></i> Instaluj
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if present
        const existingModal = document.getElementById('modelStatusModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add new modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('modelStatusModal'));
        modal.show();
    }

    async installModel() {
        const modelName = document.getElementById('model-to-install').value.trim();
        if (!modelName) {
            alert('Podaj nazwę modelu');
            return;
        }
        
        try {
            const response = await fetch('/api/assistant/install-model', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model_name: modelName })
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert(data.message + '\n\nInstalacja może potrwać kilka minut.');
                // Close modal
                bootstrap.Modal.getInstance(document.getElementById('modelStatusModal')).hide();
            } else {
                alert('Błąd instalacji: ' + data.error);
            }
        } catch (error) {
            console.error('Error installing model:', error);
            alert('Nie można zainstalować modelu');
        }
    }

    togglePanel() {
        const body = document.getElementById('assistant-body');
        const icon = document.getElementById('assistant-toggle-icon');
        
        if (body.style.display === 'none') {
            body.style.display = 'block';
            icon.className = 'fas fa-chevron-up';
        } else {
            body.style.display = 'none';
            icon.className = 'fas fa-chevron-down';
        }
    }

    displayError(message) {
        const guidanceEl = document.getElementById('assistant-guidance');
        if (guidanceEl) {
            guidanceEl.innerHTML = `<small class="text-danger">${message}</small>`;
        }
    }

    setSectionContext(section) {
        this.currentSection = section;
        if (this.assistantEnabled) {
            this.loadGuidance();
        }
    }
}

// Initialize assistant when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.assistant = new DashboardAssistant();
});

// Auto-detect section changes
document.addEventListener('click', function(e) {
    if (e.target.matches('[data-section]') && window.assistant) {
        const section = e.target.getAttribute('data-section');
        window.assistant.setSectionContext(section);
    }
});
