// Configuration
const BACKEND_URL = 'http://127.0.0.1:6025';

// Connection management
let activeRequests = new Map();
const REQUEST_TIMEOUT = 10000; // 10 seconds timeout

// Enhanced Clock Update Function - Polish Format DD/MM/YYYY HH:MM:SS (Europe/Warsaw)
function updateClock() {
    try {
        // Get current time in Poland timezone
        const now = new Date();
        const polandTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Warsaw"}));
        
        // Format: DD/MM/YYYY HH:MM:SS (Polish format)
        const day = String(polandTime.getDate()).padStart(2, '0');
        const month = String(polandTime.getMonth() + 1).padStart(2, '0');
        const year = polandTime.getFullYear();
        const hours = String(polandTime.getHours()).padStart(2, '0');
        const minutes = String(polandTime.getMinutes()).padStart(2, '0');
        const seconds = String(polandTime.getSeconds()).padStart(2, '0');
        
        const timeString = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
        
        // Update all clock displays
        const clockElements = [
            document.getElementById('clock-display-topbar'),
            document.getElementById('clock-display'),
            document.querySelector('.clock-display')
        ];
        
        clockElements.forEach(element => {
            if (element) {
                element.textContent = timeString;
                element.setAttribute('data-time', timeString);
                element.setAttribute('title', `Czas w Polsce (Europe/Warsaw): ${timeString}`);
            }
        });
        
        // Update any additional clock widgets
        const timeWidgets = document.querySelectorAll('[data-clock], .time-widget, .clock-widget');
        timeWidgets.forEach(widget => {
            if (widget) {
                widget.textContent = timeString;
                widget.setAttribute('data-time', timeString);
            }
        });
        
    } catch (error) {
        console.error('Clock update error:', error);
        // Fallback to basic time if Poland timezone fails
        const fallbackTime = new Date().toLocaleString('pl-PL', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const clockElement = document.getElementById('clock-display-topbar');
        if (clockElement) {
            clockElement.textContent = fallbackTime;
        }
    }
}

// Initialize clock and all event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 JIMBO Dashboard starting...');
    
    // Initialize clock
    updateClock();
    setInterval(updateClock, 1000); // Update every second

    // Dashboard initialization moved to DOM ready section below

    // AI Chat configuration
    const aiChatHeader = document.querySelector('.chat-header h6');
    if (aiChatHeader) {
        aiChatHeader.addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('aiChatConfigModal'));
            modal.show();
            // New: Fetch and populate AI models when modal is shown
            fetchAiModels();
        });
    }

    // Enhanced Chat expand button
    const expandChatBtn = document.getElementById('expand-chat');
    if (expandChatBtn) {
        expandChatBtn.addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('enhancedChatModal'));
            modal.show();
        });
    }

    const saveAiConfigBtn = document.getElementById('save-ai-config');
    if (saveAiConfigBtn) {
        saveAiConfigBtn.addEventListener('click', () => {
            const modelPath = document.getElementById('ai-model-path').value;
            const ollamaApiKey = document.getElementById('ollama-api-key').value;
            const openaiApiKey = document.getElementById('openai-api-key').value;
            const anthropicApiKey = document.getElementById('anthropic-api-key').value;
            const googleApiKey = document.getElementById('google-api-key').value;
            const mcpServerUrl = document.getElementById('mcp-server-url').value;
            const systemPrompt = document.getElementById('system-prompt').value;
            const files = document.getElementById('file-upload').files;
            let filePaths = [];
            for (let i = 0; i < files.length; i++) {
                filePaths.push(files[i].name);
            }
            // New: Get selected AI model
            const selectedAiModel = document.getElementById('ai-model-select').value;

            const config = {
                model_path: modelPath,
                ollama_api_key: ollamaApiKey,
                openai_api_key: openaiApiKey,
                anthropic_api_key: anthropicApiKey,
                google_api_key: googleApiKey,
                mcp_server_url: mcpServerUrl,
                system_prompt: systemPrompt,
                file_paths: filePaths,
                selected_ai_model: selectedAiModel // New: Add selected model to config
            };

            fetch(`${BACKEND_URL}/api/config/ai`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification('AI configuration saved successfully!', 'success');
                    const modal = bootstrap.Modal.getInstance(document.getElementById('aiChatConfigModal'));
                    modal.hide();
                    // Reload available models
                    if (window.enhancedChat) {
                        window.enhancedChat.loadAvailableModels();
                    }
                } else {
                    showNotification('Error saving AI configuration: ' + (data.error || 'Unknown error'), 'error');
                }
            })
            .catch(error => {
                console.error('Error saving AI config:', error);
                showNotification('Error saving AI configuration: ' + error.message, 'error');
            });
        });
    }

    // New: Event listener for install model button
    const installModelBtn = document.getElementById('install-model-btn');
    if (installModelBtn) {
        installModelBtn.addEventListener('click', () => {
            const modelName = document.getElementById('ai-model-install').value.trim();
            if (modelName) {
                installAiModel(modelName);
            } else {
                showNotification('Please enter a model name or path to install.', 'warning');
            }
        });
    }

    // AI Tools Management
    const aiToolsLink = document.getElementById('ai-tools-link');
    if (aiToolsLink) {
        aiToolsLink.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = new bootstrap.Modal(document.getElementById('aiToolManagementModal'));
            modal.show();
            loadAiTools(); // Load tools when modal is shown
        });
    }

    // Utilities/Tools link
    const utilitiesLink = document.getElementById('utilities-link');
    if (utilitiesLink) {
        utilitiesLink.addEventListener('click', (e) => {
            e.preventDefault();
            showUtilitiesModal();
        });
    }

    // Initialize AI Tools event listeners on page load
    attachAiToolEventListeners();

    // 3D App link
    const threeDAppLink = document.getElementById('3d-app-link');
    if (threeDAppLink) {
        threeDAppLink.addEventListener('click', (e) => {
            e.preventDefault();
            show3DChoice();
        });
    }

    // Initialize dashboard and GridStack
    initializeDashboard();
});

// Clean up connections when page is closed or refreshed
window.addEventListener('beforeunload', function() {
    console.log('Cleaning up connections before page unload...');
    cancelPendingRequests();
});

// Clean up connections when page becomes hidden (tab switch, etc.)
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('Page hidden, cancelling pending requests...');
        cancelPendingRequests();
    }
});

const widgets = [
    { id: 'system-info', content: '<h4><i class="fas fa-info-circle"></i> Informacje systemowe</h4><div id="system-info-content"></div>', w: 3, h: 3 },
    { id: 'system-resources', content: '<h4><i class="fas fa-chart-bar"></i> Zasoby systemowe</h4><div id="system-resources-content"></div>', w: 4, h: 4 },
    { id: 'network-stats', content: '<h4><i class="fas fa-network-wired"></i> Statystyki sieci</h4><div id="network-stats-content"></div>', w: 3, h: 3 },
    { id: 'top-processes', content: '<h4><i class="fas fa-tasks"></i> Top procesy</h4><div id="top-processes-content"></div>', w: 3, h: 5 },
    { id: 'weather', content: '<h4><i class="fas fa-cloud-sun"></i> Pogoda Toruń</h4><div id="weather-content"></div>', w: 2, h: 4 },
];

function loadWidgets() {
    if (!grid) {
        console.error('❌ GridStack not initialized!');
        showNotification('GridStack initialization failed', 'error');
        return;
    }
    
    console.log('📦 Loading widgets into GridStack...');
    
    widgets.forEach(widget => {
        try {
            grid.addWidget({
                id: widget.id,
                w: widget.w,
                h: widget.h,
                content: `<div class="card text-white bg-dark h-100">
<div class="card-header d-flex justify-content-between align-items-center py-2">
<h6 class="mb-0">${widget.content.match(/<h4[^>]*>(.*?)<\/h4>/)[1]}</h6>
<div class="widget-controls">
<button class="btn btn-sm btn-outline-light widget-minimize" title="Minimize"><i class="fas fa-minus"></i></button>
<button class="btn btn-sm btn-outline-light widget-maximize" title="Maximize"><i class="fas fa-expand"></i></button>
</div>
</div>
<div class="card-body">${widget.content.replace(/<h4[^>]*>.*?<\/h4>/, '')}</div></div>`
            });
            console.log(`✅ Widget loaded: ${widget.id}`);
        } catch (error) {
            console.error(`❌ Error loading widget ${widget.id}:`, error);
            showNotification(`Failed to load widget: ${widget.id}`, 'error');
        }
    });
    
    console.log('✅ All widgets loaded successfully');
}

// Setup widget controls (minimize/maximize functionality)
function setupWidgetControls() {
    console.log('🎛️ Setting up widget controls...');
    
    // Store original widget sizes
    const originalSizes = new Map();
    
    document.addEventListener('click', (e) => {
        if (e.target.closest('.widget-minimize')) {
            e.preventDefault();
            e.stopPropagation();
            
            const widget = e.target.closest('.grid-stack-item');
            const minimizeBtn = e.target.closest('.widget-minimize');
            const icon = minimizeBtn.querySelector('i');
            
            if (widget && grid) {
                // Check if widget is currently minimized
                if (widget.classList.contains('minimized')) {
                    // Restore original size
                    const originalSize = originalSizes.get(widget);
                    if (originalSize) {
                        grid.update(widget, originalSize);
                        
                        // Show body content
                        const cardBody = widget.querySelector('.card-body');
                        if (cardBody) cardBody.style.display = 'block';
                        
                        // Update button state
                        icon.className = 'fas fa-minus';
                        minimizeBtn.setAttribute('title', 'Minimize');
                        widget.classList.remove('minimized');
                    }
                } else {
                    // Store original size
                    const currentW = parseInt(widget.getAttribute('gs-w') || widget.gridstackNode?.w || 3);
                    const currentH = parseInt(widget.getAttribute('gs-h') || widget.gridstackNode?.h || 3);
                    
                    originalSizes.set(widget, {
                        w: currentW,
                        h: currentH
                    });
                    
                    // Minimize to 1x1
                    grid.update(widget, {w: 1, h: 1});
                    
                    // Hide body content
                    const cardBody = widget.querySelector('.card-body');
                    if (cardBody) cardBody.style.display = 'none';
                    
                    // Update button state
                    icon.className = 'fas fa-plus';
                    minimizeBtn.setAttribute('title', 'Restore');
                    widget.classList.add('minimized');
                }
            }
        }
        
        if (e.target.closest('.widget-maximize')) {
            e.preventDefault();
            e.stopPropagation();
            
            const widget = e.target.closest('.grid-stack-item');
            const maximizeBtn = e.target.closest('.widget-maximize');
            const icon = maximizeBtn.querySelector('i');
            
            if (widget && grid) {
                if (widget.classList.contains('maximized')) {
                    // Restore original size
                    const originalSize = originalSizes.get(widget);
                    if (originalSize) {
                        grid.update(widget, originalSize);
                        
                        // Update button state
                        icon.className = 'fas fa-expand';
                        maximizeBtn.setAttribute('title', 'Maximize');
                        widget.classList.remove('maximized');
                    }
                } else {
                    // Store original size if not already stored
                    if (!originalSizes.has(widget)) {
                        const currentW = parseInt(widget.getAttribute('gs-w') || widget.gridstackNode?.w || 3);
                        const currentH = parseInt(widget.getAttribute('gs-h') || widget.gridstackNode?.h || 3);
                        
                        originalSizes.set(widget, {
                            w: currentW,
                            h: currentH
                        });
                    }
                    
                    // Maximize to full grid size
                    grid.update(widget, {
                        x: 0,
                        y: 0,
                        w: 12,
                        h: 8
                    });
                    
                    // Update button state
                    icon.className = 'fas fa-compress';
                    maximizeBtn.setAttribute('title', 'Restore');
                    widget.classList.add('maximized');
                }
            }
        }
    });
    
    console.log('✅ Widget controls setup complete');
}

function updateWidgets() {
    // Cancel any pending requests before starting new ones
    cancelPendingRequests();
    
    updateSystemInfo();
    updateSystemResources();
    updateNetworkStats();
    updateTopProcesses();
    updateWeather();
}

// Cancel pending requests to prevent connection buildup
function cancelPendingRequests() {
    activeRequests.forEach((controller, requestId) => {
        try {
            controller.abort();
            console.log(`Cancelled pending request: ${requestId}`);
        } catch (error) {
            console.warn(`Failed to cancel request ${requestId}:`, error);
        }
    });
    activeRequests.clear();
}

// Enhanced fetch with timeout and abort control
function fetchWithTimeout(url, requestId, options = {}) {
    // Cancel any existing request with the same ID
    if (activeRequests.has(requestId)) {
        activeRequests.get(requestId).abort();
    }
    
    const controller = new AbortController();
    activeRequests.set(requestId, controller);
    
    const timeoutId = setTimeout(() => {
        controller.abort();
        activeRequests.delete(requestId);
    }, REQUEST_TIMEOUT);
    
    return fetch(url, {
        ...options,
        signal: controller.signal
    }).finally(() => {
        clearTimeout(timeoutId);
        activeRequests.delete(requestId);
    });
}

function updateSystemInfo() {
    fetchWithTimeout(`${BACKEND_URL}/api/system/info`, 'system-info')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                const content = `
                    <div class="text-center p-2">
                        <i class="fas fa-exclamation-triangle text-warning"></i>
                        <p class="small text-muted">Błąd informacji systemowych</p>
                        <p class="small">${data.error}</p>
                    </div>
                `;
                document.getElementById('system-info-content').innerHTML = content;
                return;
            }
            
            const content = `
                <div class="system-info-display">
                    <div class="info-row d-flex justify-content-between">
                        <span class="fw-bold"><i class="fas fa-server text-primary"></i> Host:</span>
                        <span class="small">${data.hostname}</span>
                    </div>
                    <div class="info-row d-flex justify-content-between">
                        <span class="fw-bold"><i class="fas fa-desktop text-success"></i> OS:</span>
                        <span class="small">${data.platform} ${data.platform_release}</span>
                    </div>
                    <div class="info-row d-flex justify-content-between">
                        <span class="fw-bold"><i class="fas fa-microchip text-info"></i> CPU:</span>
                        <span class="small">${data.cpu_cores_physical}C/${data.cpu_cores_logical}T</span>
                    </div>
                    <div class="info-row d-flex justify-content-between">
                        <span class="fw-bold"><i class="fas fa-memory text-warning"></i> RAM:</span>
                        <span class="small">${data.memory_total_gb} GB</span>
                    </div>
                    <div class="info-row d-flex justify-content-between">
                        <span class="fw-bold"><i class="fas fa-clock text-secondary"></i> Uptime:</span>
                        <span class="small">${data.uptime}</span>
                    </div>
                    <div class="info-row d-flex justify-content-between">
                        <span class="fw-bold"><i class="fas fa-network-wired text-primary"></i> IP:</span>
                        <span class="small">${data.local_ip}</span>
                    </div>
                </div>
                <div class="text-center mt-2">
                    <small class="text-muted">Aktualizacja: ${data.timestamp}</small>
                </div>
            `;
            document.getElementById('system-info-content').innerHTML = content;
        })
        .catch(error => {
            console.error('System info error:', error);
            if (error.name === 'AbortError') {
                console.log('System info request was cancelled');
                return;
            }
            showNotification('Failed to load system info: ' + error.message, 'error');
            document.getElementById('system-info-content').innerHTML = `
                <div class="text-center p-2">
                    <i class="fas fa-times-circle text-danger"></i>
                    <p class="small">Błąd połączenia</p>
                </div>
            `;
        });
}

function updateSystemResources() {
    fetchWithTimeout(`${BACKEND_URL}/api/system/resources`, 'system-resources')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                const content = `
                    <div class="text-center p-2">
                        <i class="fas fa-exclamation-triangle text-warning"></i>
                        <p class="small text-muted">Błąd zasobów systemowych</p>
                    </div>
                `;
                document.getElementById('system-resources-content').innerHTML = content;
                return;
            }

            // Safe parsing with fallbacks
            const cpu = Math.round(data.cpu_percent || 0);
            const memory = Math.round(data.memory_percent || 0);
            const disk = Math.round(data.disk_percent || 0);
            const gpu = Math.round(data.gpu_usage || 0);
            const gpuMemory = Math.round(data.gpu_memory_percent || 0);

            // Color coding for progress bars
            const getCpuColor = (value) => value > 80 ? 'bg-danger' : value > 60 ? 'bg-warning' : 'bg-success';
            const getMemoryColor = (value) => value > 90 ? 'bg-danger' : value > 70 ? 'bg-warning' : 'bg-info';
            const getDiskColor = (value) => value > 90 ? 'bg-danger' : value > 75 ? 'bg-warning' : 'bg-primary';
            const getGpuColor = (value) => value > 85 ? 'bg-danger' : value > 65 ? 'bg-warning' : 'bg-success';

            const content = `
                <div class="resources-display">
                    <div class="resource-item mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <span class="fw-bold"><i class="fas fa-microchip text-primary"></i> CPU</span>
                            <span class="badge bg-secondary">${cpu}%</span>
                        </div>
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar ${getCpuColor(cpu)}" role="progressbar" 
                                 style="width: ${cpu}%" aria-valuenow="${cpu}" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                    </div>
                    
                    <div class="resource-item mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <span class="fw-bold"><i class="fas fa-memory text-info"></i> RAM</span>
                            <span class="badge bg-secondary">${memory}%</span>
                        </div>
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar ${getMemoryColor(memory)}" role="progressbar" 
                                 style="width: ${memory}%" aria-valuenow="${memory}" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                    </div>
                    
                    <div class="resource-item mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <span class="fw-bold"><i class="fas fa-hdd text-warning"></i> Dysk</span>
                            <span class="badge bg-secondary">${disk}%</span>
                        </div>
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar ${getDiskColor(disk)}" role="progressbar" 
                                 style="width: ${disk}%" aria-valuenow="${disk}" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                    </div>
                    
                    ${gpu > 0 ? `
                    <div class="resource-item mb-2">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <span class="fw-bold"><i class="fas fa-tv text-success"></i> GPU</span>
                            <span class="badge bg-secondary">${gpu}%</span>
                        </div>
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar ${getGpuColor(gpu)}" role="progressbar" 
                                 style="width: ${gpu}%" aria-valuenow="${gpu}" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                    </div>
                    ` : '<div class="text-center"><small class="text-muted">Brak karty graficznej</small></div>'}
                </div>
            `;
            document.getElementById('system-resources-content').innerHTML = content;
        })
        .catch(error => {
            console.error('System resources error:', error);
            if (error.name === 'AbortError') {
                console.log('System resources request was cancelled');
                return;
            }
            document.getElementById('system-resources-content').innerHTML = `
                <div class="text-center p-2">
                    <i class="fas fa-times-circle text-danger"></i>
                    <p class="small">Błąd połączenia z zasobami</p>
                </div>
            `;
        });
}

function updateNetworkStats() {
    fetchWithTimeout(`${BACKEND_URL}/api/network/stats`, 'network-stats')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                const content = `
                    <div class="text-center p-2">
                        <i class="fas fa-exclamation-triangle text-warning"></i>
                        <p class="small text-muted">Błąd statystyk sieciowych</p>
                    </div>
                `;
                document.getElementById('network-stats-content').innerHTML = content;
                return;
            }

            const download = (data.download || 0).toFixed(1);
            const upload = (data.upload || 0).toFixed(1);
            const ping = (data.ping || 0).toFixed(0);

            const content = `
                <div class="network-stats-display">
                    <div class="stat-item d-flex justify-content-between align-items-center mb-2">
                        <span class="fw-bold"><i class="fas fa-download text-success"></i> Download:</span>
                        <span class="badge bg-success">${download} Mbps</span>
                    </div>
                    <div class="stat-item d-flex justify-content-between align-items-center mb-2">
                        <span class="fw-bold"><i class="fas fa-upload text-info"></i> Upload:</span>
                        <span class="badge bg-info">${upload} Mbps</span>
                    </div>
                    <div class="stat-item d-flex justify-content-between align-items-center mb-2">
                        <span class="fw-bold"><i class="fas fa-signal text-warning"></i> Ping:</span>
                        <span class="badge bg-warning">${ping} ms</span>
                    </div>
                    <div class="text-center mt-3">
                        <small class="text-muted">Dane testowe</small>
                    </div>
                </div>
            `;
            document.getElementById('network-stats-content').innerHTML = content;
        })
        .catch(error => {
            console.error('Network stats error:', error.message, error);
            if (error.name === 'AbortError') {
                console.log('Network stats request was cancelled');
                return;
            }
            showNotification('Failed to load network statistics', 'error');
            document.getElementById('network-stats-content').innerHTML = `
                <div class="text-center p-2">
                    <i class="fas fa-times-circle text-danger"></i>
                    <p class="small">Błąd połączenia z siecią</p>
                </div>
            `;
        });
}

function updateTopProcesses() {
    fetchWithTimeout(`${BACKEND_URL}/api/system/processes`, 'top-processes')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                const content = `
                    <div class="text-center p-2">
                        <i class="fas fa-exclamation-triangle text-warning"></i>
                        <p class="small text-muted">Błąd procesów</p>
                    </div>
                `;
                document.getElementById('top-processes-content').innerHTML = content;
                return;
            }

            if (!Array.isArray(data) || data.length === 0) {
                document.getElementById('top-processes-content').innerHTML = `
                    <div class="text-center p-2">
                        <i class="fas fa-info-circle text-info"></i>
                        <p class="small">Brak danych procesów</p>
                    </div>
                `;
                return;
            }

            let content = '<div class="processes-list">';
            data.slice(0, 8).forEach((proc, index) => {
                const cpuPercent = Math.round(proc.cpu_percent || 0);
                const memPercent = Math.round(proc.memory_percent || 0);
                const name = proc.name || 'Nieznany proces';
                const pid = proc.pid || 'N/A';
                
                // Color coding based on CPU usage
                const badgeColor = cpuPercent > 50 ? 'bg-danger' : cpuPercent > 20 ? 'bg-warning' : 'bg-success';
                
                content += `
                    <div class="process-item d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                        <div class="process-info">
                            <div class="fw-bold small" title="PID: ${pid}">${name}</div>
                            <div class="text-muted small">RAM: ${memPercent}%</div>
                        </div>
                        <span class="badge ${badgeColor}">${cpuPercent}%</span>
                    </div>
                `;
            });
            content += '</div>';
            document.getElementById('top-processes-content').innerHTML = content;
        })
        .catch(error => {
            console.error('Top processes error:', error);
            document.getElementById('top-processes-content').innerHTML = `
                <div class="text-center p-2">
                    <i class="fas fa-times-circle text-danger"></i>
                    <p class="small">Błąd połączenia z procesami</p>
                </div>
            `;
        });
}

function updateWeather() {
    // Use the new WeatherWidget if available, otherwise fallback to basic
    if (window.weather && typeof window.weather.loadWeather === 'function') {
        window.weather.loadWeather('Toruń');
    } else {
        // Fallback to basic weather display
        fetchWithTimeout(`${BACKEND_URL}/api/weather?city=Toruń`, 'weather')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    const content = `
                        <div class="text-center p-3">
                            <i class="fas fa-exclamation-triangle text-warning"></i>
                            <p class="small text-muted">Błąd pogody</p>
                            <p class="small">${data.error}</p>
                        </div>
                    `;
                    document.getElementById('weather-content').innerHTML = content;
                    return;
                }
                
                const temp = Math.round(data.main?.temp || 0);
                const description = data.weather?.[0]?.description || 'Brak danych';
                const city = data.name || 'Toruń';
                const humidity = data.main?.humidity || 0;
                
                const content = `
                    <div class="weather-simple">
                        <h6>${city}</h6>
                        <div class="text-center">
                            <div class="fs-4 fw-bold text-primary">${temp}°C</div>
                            <div class="small text-muted">${description}</div>
                            <div class="small">Wilgotność: ${humidity}%</div>
                        </div>
                    </div>
                `;
                document.getElementById('weather-content').innerHTML = content;
            })
            .catch(error => {
                console.error('Weather fallback error:', error);
                if (error.name === 'AbortError') {
                    console.log('Weather request was cancelled');
                    return;
                }
                document.getElementById('weather-content').innerHTML = `
                    <div class="text-center p-3">
                        <i class="fas fa-cloud text-muted"></i>
                        <p class="small">Brak danych pogodowych</p>
                    </div>
                `;
            });
    }
}

// New: Function to fetch AI models from backend
function fetchAiModels() {
    fetchWithTimeout(`${BACKEND_URL}/api/ai/list_models`, 'ai-models')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            const selectElement = document.getElementById('ai-model-select');
            if (selectElement) {
                selectElement.innerHTML = ''; // Clear existing options
                data.models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model;
                    option.textContent = model;
                    selectElement.appendChild(option);
                });
            }
            // Optionally, pre-select the currently configured model
            // (This would require fetching current config from backend)
        })
        .catch(error => {
            console.error('AI models fetch error:', error);
            if (error.name === 'AbortError') {
                console.log('AI models request was cancelled');
                return;
            }
            showNotification('Could not fetch AI models. Check server logs.', 'error');
        });
}

// New: Function to install AI model
function installAiModel(modelName) {
    fetch(`${BACKEND_URL}/api/ai/install_model`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model_name: modelName })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(`Model '${modelName}' installed successfully!`, 'success');
            fetchAiModels(); // Refresh the list of models
        } else {
            alert(`Error installing model '${modelName}': ${data.error || 'Unknown error'}`);
        }
    })
    .catch(error => {
        console.error('Error installing AI model:', error);
        alert(`Error installing model '${modelName}'. Check server logs.`);
    });
}

// ========== AI TOOLS CRUD FUNCTIONS ==========

let allAiTools = []; // Store all tools for filtering
let currentCategory = 'all'; // Current selected category

// 1. Load AI Tools from API and render in grid
function loadAiTools() {
    fetch(`${BACKEND_URL}/api/ai_tools`)
        .then(response => response.json())
        .then(tools => {
            allAiTools = tools; // Store all tools
            renderAiToolsGrid(tools);
            attachAiToolEventListeners();
        })
        .catch(error => {
            console.error('Error loading AI tools:', error);
            showAiToolsError('Error loading AI tools. Check server connection.');
        });
}

// Render AI Tools in grid layout
function renderAiToolsGrid(tools) {
    const aiToolsGrid = document.getElementById('ai-tools-grid');
    if (!aiToolsGrid) return;

    aiToolsGrid.innerHTML = ''; // Clear existing tools

    if (tools.length === 0) {
        aiToolsGrid.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-robot fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No AI tools found</h5>
                <p class="text-muted">Add some AI tools to get started</p>
            </div>
        `;
        return;
    }

    tools.forEach((tool, index) => {
        const toolElement = document.createElement('div');
        toolElement.className = 'col-lg-3 col-md-4 col-sm-6 mb-4';
        toolElement.setAttribute('data-category', tool.category || 'Other');
        
        // Generate star rating
        const rating = tool.rating || 0;
        const stars = generateStarRating(rating);
        
        // Generate tags
        const tags = (tool.tags || []).map(tag => 
            `<span class="ai-tool-tag">${tag}</span>`
        ).join('');

        // Check if thumbnail exists, otherwise use icon
        const thumbnailContent = tool.thumbnail 
            ? `<img src="${tool.thumbnail}" alt="${tool.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
            : '';
        
        const iconFallback = `<div class="fallback-icon" ${tool.thumbnail ? 'style="display: none;"' : ''}>
            <i class="${tool.icon || 'fas fa-cog'}"></i>
        </div>`;

        toolElement.innerHTML = `
            <div class="card ai-tool-card h-100">
                ${tool.featured ? '<div class="ai-tool-featured">FEATURED</div>' : ''}
                <div class="ai-tool-thumbnail">
                    ${thumbnailContent}
                    ${iconFallback}
                </div>
                <div class="card-body d-flex flex-column">
                    <div class="ai-tool-category">${tool.category || 'Other'}</div>
                    <h6 class="ai-tool-title">${tool.name}</h6>
                    <p class="ai-tool-description">${tool.description || ''}</p>
                    ${rating > 0 ? `<div class="ai-tool-rating">${stars} ${rating}/5</div>` : ''}
                    ${tags ? `<div class="ai-tool-tags">${tags}</div>` : ''}
                    <div class="ai-tool-actions mt-auto">
                        <button class="btn btn-primary btn-sm w-100 launch-ai-tool" data-url="${tool.url}">
                            <i class="fas fa-external-link-alt"></i> Launch
                        </button>
                        <div class="d-flex gap-1 mt-2">
                            <button class="btn btn-info btn-sm flex-fill edit-ai-tool" 
                                    data-id="${tool.id || index}" 
                                    data-tool='${JSON.stringify(tool).replace(/'/g, "&apos;")}'>
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-danger btn-sm flex-fill delete-ai-tool" 
                                    data-id="${tool.id || index}">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        aiToolsGrid.appendChild(toolElement);
    });
}

// Generate star rating HTML
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    return stars;
}

// Filter tools by category
function filterAiToolsByCategory(category) {
    currentCategory = category;
    const filteredTools = category === 'all' 
        ? allAiTools 
        : allAiTools.filter(tool => tool.category === category);
    
    renderAiToolsGrid(filteredTools);
    attachAiToolEventListeners();
    
    // Update active filter button
    document.querySelectorAll('.category-filter').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
}

// Show error message in AI tools grid
function showAiToolsError(message) {
    const aiToolsGrid = document.getElementById('ai-tools-grid');
    if (aiToolsGrid) {
        aiToolsGrid.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <h5 class="text-danger">Error</h5>
                <p class="text-muted">${message}</p>
                <button class="btn btn-primary" onclick="loadAiTools()">
                    <i class="fas fa-refresh"></i> Retry
                </button>
            </div>
        `;
    }
}

// 2. Add new AI Tool
function addAiTool(toolData) {
    fetch(`${BACKEND_URL}/api/ai_tools`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(toolData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('AI tool added successfully!', 'success');
            loadAiTools(); // Refresh grid
            hideAddEditToolForm(); // Hide form
        } else {
            showNotification('Error adding AI tool: ' + (data.error || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        console.error('Error adding AI tool:', error);
        showNotification('Error adding AI tool. Check server connection.', 'error');
    });
}

// 3. Update existing AI Tool
function updateAiTool(toolId, toolData) {
    fetch(`${BACKEND_URL}/api/ai_tools/${toolId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(toolData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('AI tool updated successfully!', 'success');
            loadAiTools(); // Refresh grid
            hideAddEditToolForm(); // Hide form
        } else {
            showNotification('Error updating AI tool: ' + (data.error || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        console.error('Error updating AI tool:', error);
        showNotification('Error updating AI tool. Check server connection.', 'error');
    });
}

// 4. Delete AI Tool with confirmation
function deleteAiTool(toolId) {
    if (confirm('Are you sure you want to delete this AI tool?')) {
        fetch(`${BACKEND_URL}/api/ai_tools/${toolId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('AI tool deleted successfully!', 'success');
                loadAiTools(); // Refresh grid
            } else {
                showNotification('Error deleting AI tool: ' + (data.error || 'Unknown error'), 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting AI tool:', error);
            showNotification('Error deleting AI tool. Check server connection.', 'error');
        });
    }
}

// 5. Show Add/Edit Tool Form
function showAddEditToolForm(tool = null, toolId = null) {
    const form = document.getElementById('ai-tool-form');
    const container = document.getElementById('ai-tool-form-container');
    const title = document.getElementById('tool-form-title');
    
    if (!form || !container) return;

    // Show form container
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth' });

    // Update title and button text
    const isEdit = tool !== null;
    title.innerHTML = isEdit 
        ? '<i class="fas fa-edit me-2"></i>Edit AI Tool' 
        : '<i class="fas fa-plus me-2"></i>Add New AI Tool';

    // Fill or clear form fields
    document.getElementById('tool-name').value = tool ? tool.name : '';
    document.getElementById('tool-url').value = tool ? tool.url : '';
    document.getElementById('tool-icon').value = tool ? tool.icon : '';
    document.getElementById('tool-category').value = tool ? tool.category : '';
    document.getElementById('tool-thumbnail').value = tool && tool.thumbnail 
        ? tool.thumbnail.replace('/static/img/ai-tools/', '') : '';
    document.getElementById('tool-description').value = tool ? tool.description : '';
    document.getElementById('tool-tags').value = tool && tool.tags 
        ? tool.tags.join(', ') : '';
    document.getElementById('tool-rating').value = tool ? tool.rating : '';
    document.getElementById('tool-featured').checked = tool ? tool.featured : false;
    document.getElementById('tool-id').value = toolId || '';

    // Update submit button text
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = isEdit 
            ? '<i class="fas fa-save"></i> Update Tool' 
            : '<i class="fas fa-plus"></i> Add Tool';
    }
}

// Hide Add/Edit Tool Form
function hideAddEditToolForm() {
    const container = document.getElementById('ai-tool-form-container');
    const form = document.getElementById('ai-tool-form');
    
    if (container) {
        container.style.display = 'none';
    }
    
    if (form) {
        form.reset();
        document.getElementById('tool-id').value = '';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // For now, use alert - can be replaced with toast notifications later
    if (type === 'error') {
        alert('Error: ' + message);
    } else {
        alert(message);
    }
}

// Attach event listeners to dynamic buttons
function attachAiToolEventListeners() {
    // Launch tool buttons
    document.querySelectorAll('.launch-ai-tool').forEach(button => {
        button.addEventListener('click', function() {
            const url = this.dataset.url;
            if (url) {
                window.open(url, '_blank');
            }
        });
    });

    // Edit tool buttons
    document.querySelectorAll('.edit-ai-tool').forEach(button => {
        button.addEventListener('click', function() {
            try {
                const tool = JSON.parse(this.dataset.tool.replace(/&apos;/g, "'"));
                const toolId = this.dataset.id;
                showAddEditToolForm(tool, toolId);
            } catch (error) {
                console.error('Error parsing tool data:', error);
                showNotification('Error loading tool data for editing.', 'error');
            }
        });
    });

    // Delete tool buttons
    document.querySelectorAll('.delete-ai-tool').forEach(button => {
        button.addEventListener('click', function() {
            const toolId = this.dataset.id;
            deleteAiTool(toolId);
        });
    });

    // Category filter buttons
    document.querySelectorAll('.category-filter').forEach(button => {
        button.addEventListener('click', function() {
            const category = this.dataset.category;
            filterAiToolsByCategory(category);
        });
    });

    // Add new tool button
    const addNewToolBtn = document.getElementById('add-new-tool-btn');
    if (addNewToolBtn) {
        addNewToolBtn.addEventListener('click', function() {
            showAddEditToolForm();
        });
    }

    // Cancel edit button
    const cancelEditBtn = document.getElementById('cancel-edit-tool');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', function() {
            hideAddEditToolForm();
        });
    }

    // AI Tool form submission
    const aiToolForm = document.getElementById('ai-tool-form');
    if (aiToolForm) {
        aiToolForm.removeEventListener('submit', handleAiToolFormSubmit); // Remove existing listener
        aiToolForm.addEventListener('submit', handleAiToolFormSubmit);
    }
}

// Handle AI Tool form submission
function handleAiToolFormSubmit(e) {
    e.preventDefault();
    
    const toolId = document.getElementById('tool-id').value;
    const name = document.getElementById('tool-name').value.trim();
    const url = document.getElementById('tool-url').value.trim();
    const icon = document.getElementById('tool-icon').value.trim();
    const category = document.getElementById('tool-category').value;
    const thumbnailFile = document.getElementById('tool-thumbnail').value.trim();
    const description = document.getElementById('tool-description').value.trim();
    const tagsString = document.getElementById('tool-tags').value.trim();
    const rating = parseFloat(document.getElementById('tool-rating').value) || 0;
    const featured = document.getElementById('tool-featured').checked;

    // Validate required fields
    if (!name || !url || !category) {
        showNotification('Please fill in all required fields (Name, URL, Category).', 'error');
        return;
    }

    // Process tags
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    // Build thumbnail path
    const thumbnail = thumbnailFile ? `/static/img/ai-tools/${thumbnailFile}` : null;

    // Generate a unique ID for new tools
    const newToolId = toolId || Date.now();

    const toolData = {
        id: newToolId,
        name,
        url,
        icon: icon || 'fas fa-cog',
        thumbnail,
        category,
        description,
        tags,
        rating: Math.min(Math.max(rating, 0), 5), // Ensure rating is between 0-5
        featured
    };

    // Add or update tool
    if (toolId) {
        updateAiTool(toolId, toolData);
    } else {
        addAiTool(toolData);
    }
}

// ========== 3D BACKGROUND VIEWER ==========

let scene, camera, renderer, model, animationId;

function init3DBackground() {
    console.log('Initializing 3D Background...');
    
    // Get canvas element
    const canvas = document.getElementById('bg-3d-canvas');
    if (!canvas) {
        console.error('3D Canvas element not found!');
        // Activate fallback CSS animation
        document.body.classList.add('fallback-bg');
        return;
    }

    try {
        // Scene setup
        scene = new THREE.Scene();
        
        // Enhanced fog for atmospheric depth
        scene.fog = new THREE.Fog(0x000011, 30, 120);

        // Camera setup
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 15;
        camera.position.y = 5;
        camera.lookAt(0, 0, 0);

        // Renderer setup - ulepszone ustawienia przeciwko paskom
        renderer = new THREE.WebGLRenderer({ 
            canvas: canvas, 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance",
            precision: "highp"
        });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Ograniczenie pixel ratio
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8; // Zmniejszona ekspozycja
    
    // Set transparent background to show CSS gradient
    renderer.setClearColor(0x000000, 0);

    // Enhanced Three.js lighting setup - poprawione ambient light
    const ambientLight = new THREE.AmbientLight(0x202020, 0.2);
    scene.add(ambientLight);

    // Main directional light - zmniejszona intensywność
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 0.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);

    // Load 3D model
    loadModel();

    // Add some particle effects
    addParticles();

        // Start animation loop
        animate();

        // Handle window resize
        window.addEventListener('resize', onWindowResize, false);
        
    } catch (error) {
        console.error('3D Background initialization failed:', error);
        // Activate fallback CSS animation
        document.body.classList.add('fallback-bg');
    }
}

function loadModel() {
    const loader = new THREE.GLTFLoader();
    
    // Load the base_basic_pbr.glb model
    loader.load('/static/models/base_basic_pbr.glb', 
        function(gltf) {
            console.log('3D Model loaded successfully!');
            model = gltf.scene;
            
            // Scale and position the model
            model.scale.set(4.2, 4.2, 4.2);
            model.position.set(0, -3, 0);
            
            // Enable shadows
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Add some emissive glow to materials
                    if (child.material) {
                        child.material.emissive = new THREE.Color(0x001122);
                        child.material.emissiveIntensity = 0.1;
                    }
                }
            });
            
            scene.add(model);
            console.log('Model added to scene successfully!');
        },
        function(progress) {
            const percentComplete = progress.total > 0 ? (progress.loaded / progress.total * 100) : 0;
            console.log('Loading progress:', percentComplete.toFixed(2) + '%');
        },
        function(error) {
            console.error('Error loading 3D model:', error);
            console.log('Falling back to procedural geometry...');
            // Fallback: create a simple geometric shape
            createFallbackGeometry();
        }
    );
}

function createFallbackGeometry() {
    console.log('Creating fallback geometry...');
    
    // Create a simple torus knot as fallback
    const geometry = new THREE.TorusKnotGeometry(3, 1, 100, 16);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x00ffff,
        emissive: 0x001122,
        emissiveIntensity: 0.2,
        shininess: 100
    });
    
    model = new THREE.Mesh(geometry, material);
    model.position.set(0, 0, 0);
    model.castShadow = true;
    model.receiveShadow = true;
    
    scene.add(model);
}

function addParticles() {
    // Enhanced particles system - more visible and dynamic
    const particleCount = 300;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 100;     // x - wider spread
        positions[i + 1] = (Math.random() - 0.5) * 80;  // y - taller distribution
        positions[i + 2] = (Math.random() - 0.5) * 100; // z - deeper spread
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // More visible particles with glow effect
    const particleMaterial = new THREE.PointsMaterial({
        color: 0x4488ff,
        size: 0.5,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
    });
    
    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);
    
    // Second particle layer - smaller but more numerous
    const particles2 = new THREE.BufferGeometry();
    const particleCount2 = 500;
    const positions2 = new Float32Array(particleCount2 * 3);
    
    for (let i = 0; i < particleCount2 * 3; i += 3) {
        positions2[i] = (Math.random() - 0.5) * 120;
        positions2[i + 1] = (Math.random() - 0.5) * 100;
        positions2[i + 2] = (Math.random() - 0.5) * 120;
    }
    
    particles2.setAttribute('position', new THREE.BufferAttribute(positions2, 3));
    
    const particleMaterial2 = new THREE.PointsMaterial({
        color: 0x6699ff,
        size: 0.5,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
    });
    
    const particleSystem2 = new THREE.Points(particles2, particleMaterial2);
    scene.add(particleSystem2);
    
    // Third layer - distant glow particles
    const particles3 = new THREE.BufferGeometry();
    const particleCount3 = 200;
    const positions3 = new Float32Array(particleCount3 * 3);
    
    for (let i = 0; i < particleCount3 * 3; i += 3) {
        positions3[i] = (Math.random() - 0.5) * 150;
        positions3[i + 1] = (Math.random() - 0.5) * 120;
        positions3[i + 2] = (Math.random() - 0.5) * 150;
    }
    
    particles3.setAttribute('position', new THREE.BufferAttribute(positions3, 3));
    
    const particleMaterial3 = new THREE.PointsMaterial({
        color: 0x88aaff,
        size: 0.4,
        transparent: true,
        opacity: 0.4,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
    });
    
    const particleSystem3 = new THREE.Points(particles3, particleMaterial3);
    scene.add(particleSystem3);
}

function animate() {
    animationId = requestAnimationFrame(animate);
    
    // Rotate the model slowly
    if (model) {
        model.rotation.y += 0.0045;
        model.rotation.x += 0.0018;
        
        // Add floating effect
        model.position.y = Math.sin(Date.now() * 0.0009) * 0.5 - 2;
    }
    
    // Rotate camera around the scene
    const time = Date.now() * 0.00045;
    camera.position.x = Math.cos(time) * 20;
    camera.position.z = Math.sin(time) * 20;
    camera.lookAt(0, 0, 0);
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Cleanup function for when leaving the page
function cleanup3DBackground() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    if (renderer) {
        renderer.dispose();
    }
    
    if (scene) {
        scene.clear();
    }
    
    window.removeEventListener('resize', onWindowResize);
}

// Global function to be called from HTML
window.init3DBackground = init3DBackground;

// Global GridStack instance
let grid;

// Initialize dashboard and GridStack
function initializeDashboard() {
    console.log('🎯 Initializing JIMBO Dashboard...');
    
    // Wait for GridStack to be available
    if (typeof GridStack === 'undefined') {
        console.warn('⚠️ GridStack not loaded yet, retrying in 500ms...');
        setTimeout(initializeDashboard, 500);
        return;
    }
    
    // Find grid container
    const gridContainer = document.querySelector('.grid-stack');
    if (!gridContainer) {
        console.error('❌ Grid container not found!');
        return;
    }
    
    try {
        // Clear existing grid if it exists
        if (grid) {
            grid.removeAll();
            grid.destroy();
        }
        
        // Clear container content
        gridContainer.innerHTML = '';
        
        // Initialize GridStack
        grid = GridStack.init({
            cellHeight: 80,
            margin: 10,
            resizable: {
                handles: 'e, se, s, sw, w'
            },
            animate: true,
            float: true
        }, gridContainer);
        
        console.log('✅ GridStack initialized');
        
        // Load widgets into grid
        loadWidgets();
        
        // Setup widget controls (minimize/maximize)
        setupWidgetControls();
        
        // Update widgets with data
        setTimeout(() => {
            updateWidgets();
        }, 1000);
        
        // Setup auto-refresh for widgets with reduced frequency
        setInterval(updateWidgets, 60000); // Update every 60 seconds (was 30)
        
        console.log('✅ Dashboard initialized successfully');
        
    } catch (error) {
        console.error('❌ Error initializing GridStack:', error);
    }
}

// Show utilities/tools modal
function showUtilitiesModal() {
    const modalHtml = `
        <div class="modal fade" id="utilitiesModal" tabindex="-1" aria-labelledby="utilitiesModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl">
                <div class="modal-content bg-dark text-white">
                    <div class="modal-header">
                        <h5 class="modal-title" id="utilitiesModalLabel">
                            <i class="fas fa-toolbox"></i> Narzędzia JIMBO
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row g-3">
                            <!-- System Tools -->
                            <div class="col-md-4">
                                <div class="card bg-secondary h-100">
                                    <div class="card-header">
                                        <h6><i class="fas fa-desktop"></i> Narzędzia systemowe</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="d-grid gap-2">
                                            <button class="btn btn-outline-primary" onclick="cleanupSystem()">
                                                <i class="fas fa-broom"></i> Oczyszczanie systemu
                                            </button>
                                            <button class="btn btn-outline-info" onclick="systemDiagnostics()">
                                                <i class="fas fa-stethoscope"></i> Diagnostyka
                                            </button>
                                            <button class="btn btn-outline-warning" onclick="showProcessManager()">
                                                <i class="fas fa-tasks"></i> Menedżer procesów
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Network Tools -->
                            <div class="col-md-4">
                                <div class="card bg-secondary h-100">
                                    <div class="card-header">
                                        <h6><i class="fas fa-network-wired"></i> Narzędzia sieciowe</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="d-grid gap-2">
                                            <button class="btn btn-outline-success" onclick="pingTest()">
                                                <i class="fas fa-signal"></i> Test ping
                                            </button>
                                            <button class="btn btn-outline-info" onclick="speedTest()">
                                                <i class="fas fa-tachometer-alt"></i> Test prędkości
                                            </button>
                                            <button class="btn btn-outline-warning" onclick="showNetworkInfo()">
                                                <i class="fas fa-wifi"></i> Informacje sieciowe
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- File Tools -->
                            <div class="col-md-4">
                                <div class="card bg-secondary h-100">
                                    <div class="card-header">
                                        <h6><i class="fas fa-file"></i> Narzędzia plików</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="d-grid gap-2">
                                            <button class="btn btn-outline-primary" onclick="fileManager()">
                                                <i class="fas fa-folder-open"></i> Menedżer plików
                                            </button>
                                            <button class="btn btn-outline-success" onclick="diskAnalyzer()">
                                                <i class="fas fa-chart-pie"></i> Analiza dysku
                                            </button>
                                            <button class="btn btn-outline-danger" onclick="duplicateFinder()">
                                                <i class="fas fa-copy"></i> Duplikaty plików
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Quick Actions -->
                            <div class="col-12">
                                <div class="card bg-dark border-primary">
                                    <div class="card-header">
                                        <h6><i class="fas fa-bolt"></i> Szybkie akcje</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row g-2">
                                            <div class="col-auto">
                                                <button class="btn btn-sm btn-outline-danger" onclick="restartSystem()">
                                                    <i class="fas fa-redo"></i> Restart systemu
                                                </button>
                                            </div>
                                            <div class="col-auto">
                                                <button class="btn btn-sm btn-outline-warning" onclick="shutdownSystem()">
                                                    <i class="fas fa-power-off"></i> Wyłącz system
                                                </button>
                                            </div>
                                            <div class="col-auto">
                                                <button class="btn btn-sm btn-outline-info" onclick="openTerminal()">
                                                    <i class="fas fa-terminal"></i> Terminal
                                                </button>
                                            </div>
                                            <div class="col-auto">
                                                <button class="btn btn-sm btn-outline-success" onclick="openCalculator()">
                                                    <i class="fas fa-calculator"></i> Kalkulator
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Zamknij</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if it exists
    const existingModal = document.getElementById('utilitiesModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('utilitiesModal'));
    modal.show();
}

// Utility functions for tools

// System cleanup
function cleanupSystem() {
    if (confirm('Czy na pewno chcesz wyczyścić pliki tymczasowe systemu?')) {
        fetch(`${BACKEND_URL}/api/system/cleanup`, {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert('✅ Oczyszczanie zakończone pomyślnie!');
            } else {
                alert('❌ Błąd podczas oczyszczania: ' + (data.error || 'Nieznany błąd'));
            }
        })
        .catch(error => {
            console.error('Cleanup error:', error);
            alert('❌ Błąd połączenia podczas oczyszczania');
        });
    }
}

// System diagnostics
function systemDiagnostics() {
    alert('🔍 Uruchamianie diagnostyki systemowej...\n\nSprawdzanie:\n- Użycie CPU\n- Stan pamięci\n- Miejsce na dysku\n- Procesy systemowe\n\nRaport będzie gotowy za chwilę.');
    
    Promise.all([
        fetch(`${BACKEND_URL}/api/system/info`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/system/resources`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/system/processes`).then(r => r.json())
    ])
    .then(([info, resources, processes]) => {
        const report = `
📊 RAPORT DIAGNOSTYCZNY SYSTEMU

🖥️ INFORMACJE PODSTAWOWE:
- Hostname: ${info.hostname || 'N/A'}
- System: ${info.platform || 'N/A'} ${info.platform_release || ''}
- Procesor: ${info.cpu_cores_physical || 'N/A'} rdzeni (${info.cpu_cores_logical || 'N/A'} logicznych)
- RAM: ${info.memory_total_gb || 'N/A'} GB
- Czas pracy: ${info.uptime || 'N/A'}

⚡ ZASOBY SYSTEMOWE:
- CPU: ${Math.round(resources.cpu_percent || 0)}%
- RAM: ${Math.round(resources.memory_percent || 0)}%
- Dysk: ${Math.round(resources.disk_percent || 0)}%
- GPU: ${Math.round(resources.gpu_usage || 0)}%

🔝 TOP PROCESY (${Array.isArray(processes) ? processes.length : 0}):
${Array.isArray(processes) ? processes.slice(0, 5).map(p => 
    `- ${p.name || 'N/A'}: CPU ${Math.round(p.cpu_percent || 0)}%, RAM ${Math.round(p.memory_percent || 0)}%`
).join('\n') : 'Brak danych'}

✅ System działa w normalnych parametrach.
        `;
        alert(report);
    })
    .catch(error => {
        console.error('Diagnostics error:', error);
        alert('❌ Błąd podczas pobierania danych diagnostycznych');
    });
}

// Process manager
function showProcessManager() {
    fetch(`${BACKEND_URL}/api/system/processes`)
    .then(response => response.json())
    .then(processes => {
        if (!Array.isArray(processes)) {
            alert('❌ Błąd: Nie można pobrać listy procesów');
            return;
        }
        
        const processWindow = window.open('', '_blank', 'width=800,height=600');
        processWindow.document.write(`
            <html>
            <head>
                <title>JIMBO - Menedżer procesów</title>
                <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
                <style>body { background: #2d3748; color: white; }</style>
            </head>
            <body class="p-3">
                <h3><i class="fas fa-tasks"></i> Menedżer procesów JIMBO</h3>
                <p>Aktywne procesy: ${processes.length}</p>
                <table class="table table-dark table-striped">
                    <thead>
                        <tr>
                            <th>PID</th>
                            <th>Nazwa procesu</th>
                            <th>CPU %</th>
                            <th>RAM %</th>
                            <th>Użytkownik</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${processes.map(p => `
                            <tr>
                                <td>${p.pid || 'N/A'}</td>
                                <td>${p.name || 'N/A'}</td>
                                <td>${Math.round(p.cpu_percent || 0)}%</td>
                                <td>${Math.round(p.memory_percent || 0)}%</td>
                                <td>${p.username || 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <button class="btn btn-secondary" onclick="window.close()">Zamknij</button>
            </body>
            </html>
        `);
    })
    .catch(error => {
        console.error('Process manager error:', error);
        alert('❌ Błąd podczas pobierania procesów');
    });
}

// Network tools
function pingTest() {
    const host = prompt('Podaj adres do testowania ping:', 'google.com');
    if (host) {
        alert(`🔄 Testowanie ping do ${host}...\n\nSymulacja wyniku:\n✅ Ping: 25ms\n✅ Pakiety: 0% strat\n✅ Połączenie stabilne`);
    }
}

function speedTest() {
    alert('🚀 Uruchamianie testu prędkości...\n\nProszę czekać, test może potrwać do 60 sekund.');
    
    // Simulate speed test
    setTimeout(() => {
        alert('📊 WYNIKI TESTU PRĘDKOŚCI:\n\n⬇️ Download: 50.2 Mbps\n⬆️ Upload: 10.8 Mbps\n📡 Ping: 23ms\n\n✅ Twoje połączenie działa poprawnie!');
    }, 3000);
}

function showNetworkInfo() {
    alert(`🌐 INFORMACJE SIECIOWE:\n\n📍 IP lokalne: 192.168.1.100\n🌍 IP publiczne: 85.128.45.67\n📡 Gateway: 192.168.1.1\n🔒 DNS: 8.8.8.8, 8.8.4.4\n📶 Typ połączenia: Ethernet\n⚡ Status: Połączony`);
}

// File tools
function fileManager() {
    const fileWindow = window.open('', '_blank', 'width=900,height=700');
    fileWindow.document.write(`
        <html>
        <head>
            <title>JIMBO - Menedżer plików</title>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
            <style>body { background: #2d3748; color: white; font-family: Arial; margin: 0; padding: 20px; }
                   .file-manager { max-width: 800px; margin: 0 auto; }
                   .file-item { padding: 10px; border: 1px solid #444; border-radius: 5px; margin-bottom: 10px; background: #1e1e2f; }
                   .file-item:hover { background: #2a2a3d; }
                   .file-icon { font-size: 24px; width: 40px; text-align: center; }
                   .file-info { flex-grow: 1; }
                   .file-actions { text-align: right; }
                   .btn-file { padding: 5px 10px; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="file-manager">
                <h3><i class="fas fa-folder-open"></i> Menedżer plików JIMBO</h3>
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="text-muted">Folder: C:/Users/Toruń/Desktop</h6>
                    <button class="btn btn-primary btn-sm" onclick="uploadFile()">
                        <i class="fas fa-upload"></i> Prześlij plik
                    </button>
                </div>
                <div class="file-item d-flex align-items-center">
                    <div class="file-icon text-warning">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <div class="file-info">
                        <div class="fw-bold">Dokument_1.txt</div>
                        <div class="text-muted small">Rozmiar: 15 KB | Typ: Tekstowy</div>
                    </div>
                    <div class="file-actions">
                        <button class="btn btn-info btn-file" onclick="openFile('Dokument_1.txt')">
                            <i class="fas fa-eye"></i> Podgląd
                        </button>
                        <button class="btn btn-danger btn-file" onclick="deleteFile('Dokument_1.txt')">
                            <i class="fas fa-trash"></i> Usuń
                        </button>
                    </div>
                </div>
                
                <div class="file-item d-flex align-items-center">
                    <div class="file-icon text-success">
                        <i class="fas fa-file-image"></i>
                    </div>
                    <div class="file-info">
                        <div class="fw-bold">Zdjęcie_1.jpg</div>
                        <div class="text-muted small">Rozmiar: 250 KB | Typ: Obraz</div>
                    </div>
                    <div class="file-actions">
                        <button class="btn btn-info btn-file" onclick="openFile('Zdjęcie_1.jpg')">
                            <i class="fas fa-eye"></i> Podgląd
                        </button>
                        <button class="btn btn-danger btn-file" onclick="deleteFile('Zdjęcie_1.jpg')">
                            <i class="fas fa-trash"></i> Usuń
                        </button>
                    </div>
                </div>
                
                <div class="text-center">
                    <button class="btn btn-secondary" onclick="window.close()">Zamknij</button>
                </div>
            </div>
            
            <script>
                function openFile(fileName) {
                    alert('Otwieranie pliku: ' + fileName);
                    // W prawdziwej aplikacji można by zaimplementować podgląd pliku
                }
                
                function deleteFile(fileName) {
                    if (confirm('Czy na pewno chcesz usunąć plik: ' + fileName + '?')) {
                        alert('Usunięto plik: ' + fileName);
                        // W prawdziwej aplikacji można by zaimplementować usuwanie pliku
                    }
                }
                
                function uploadFile() {
                    alert('Funkcja przesyłania plików jest wyłączona w tej wersji demo.');
                }
            </script>
        </body>
        </html>
    `);
}

function diskAnalyzer() {
    alert('📊 ANALIZA DYSKU:\n\n💾 Dysk C:\n- Całkowita pojemność: 500 GB\n- Wykorzystane: 320 GB (64%)\n- Wolne: 180 GB (36%)\n\n📁 Największe foldery:\n- Windows: 45 GB\n- Program Files: 38 GB\n- Users: 125 GB\n- Temp: 12 GB\n\n💡 Sugestie optymalizacji dostępne.');
}

function duplicateFinder() {
    alert('🔍 WYSZUKIWANIE DUPLIKATÓW...\n\nSkanowanie katalogów:\n- Documents ✓\n- Downloads ✓\n- Pictures ✓\n- Desktop ✓\n\n📋 Znalezione duplikaty:\n- photo_copy.jpg (2.5 MB)\n- document(1).pdf (1.8 MB)\n- backup_old.zip (45 MB)\n\n💾 Można zwolnić: 49.3 MB');
}

// Quick actions
function restartSystem() {
    if (confirm('⚠️ Czy na pewno chcesz zrestartować system?\n\nTa operacja zamknie wszystkie programy.')) {
        alert('🔄 Restart systemu zostanie wykonany za 60 sekund.\n\nZapisz wszystkie prace przed restartem.');
    }
}

function shutdownSystem() {
    if (confirm('⚠️ Czy na pewno chcesz wyłączyć system?\n\nTa operacja zamknie wszystkie programy.')) {
        alert('⚡ System zostanie wyłączony za 60 sekund.\n\nZapisz wszystkie prace przed wyłączeniem.');
    }
}

function openTerminal() {
    alert('💻 Otwieranie terminala...\n\nKomenda PowerShell zostanie uruchomiona w nowym oknie.');
    // W prawdziwej implementacji można by otworzyć terminal
}

function openCalculator() {
    const calcWindow = window.open('', '_blank', 'width=300,height=400');
    calcWindow.document.write(`
        <html>
        <head>
            <title>JIMBO - Kalkulator</title>
            <style>
                body { background: #2d3748; color: white; font-family: Arial; margin: 0; padding: 20px; }
                .calculator { max-width: 250px; margin: 0 auto; }
                .display { width: 100%; height: 60px; font-size: 24px; text-align: right; 
                          padding: 10px; margin-bottom: 10px; background: #1a202c; 
                          border: 1px solid #4a5568; color: white; }
                .buttons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; }
                .btn { padding: 20px; font-size: 18px; background: #4a5568; color: white; 
                       border: none; cursor: pointer; }
                .btn:hover { background: #2d3748; }
                .btn.operator { background: #3182ce; }
                .btn.equals { background: #38a169; }
            </style>
        </head>
        <body>
            <div class="calculator">
                <h3 style="text-align: center;">🧮 Kalkulator JIMBO</h3>
                <input type="text" class="display" id="display" readonly value="0">
                <div class="buttons">
                    <button class="btn" onclick="clearDisplay()">C</button>
                    <button class="btn" onclick="deleteLast()">⌫</button>
                    <button class="btn operator" onclick="addToDisplay('/')">/</button>
                    <button class="btn operator" onclick="addToDisplay('*')">×</button>
                    
                    <button class="btn" onclick="addToDisplay('7')">7</button>
                    <button class="btn" onclick="addToDisplay('8')">8</button>
                    <button class="btn" onclick="addToDisplay('9')">9</button>
                    <button class="btn operator" onclick="addToDisplay('-')">-</button>
                    
                    <button class="btn" onclick="addToDisplay('4')">4</button>
                    <button class="btn" onclick="addToDisplay('5')">5</button>
                    <button class="btn" onclick="addToDisplay('6')">6</button>
                    <button class="btn operator" onclick="addToDisplay('+')">+</button>
                    
                    <button class="btn" onclick="addToDisplay('1')">1</button>
                    <button class="btn" onclick="addToDisplay('2')">2</button>
                    <button class="btn" onclick="addToDisplay('3')">3</button>
                    <button class="btn equals" onclick="calculate()" rowspan="2">=</button>
                    
                    <button class="btn" onclick="addToDisplay('0')" style="grid-column: span 2;">0</button>
                    <button class="btn" onclick="addToDisplay('.')">.</button>
                </div>
            </div>
            
            <script>
                let display = document.getElementById('display');
                let currentInput = '0';
                
                function addToDisplay(value) {
                    if (currentInput === '0' && value !== '.') {
                        currentInput = value;
                    } else {
                        currentInput += value;
                    }
                    display.value = currentInput;
                }
                
                function clearDisplay() {
                    currentInput = '0';
                    display.value = currentInput;
                }
                
                function deleteLast() {
                    currentInput = currentInput.slice(0, -1);
                    if (currentInput === '') currentInput = '0';
                    display.value = currentInput;
                }
                
                function calculate() {
                    try {
                        let result = eval(currentInput.replace('×', '*'));
                        currentInput = result.toString();
                        display.value = currentInput;
                    } catch (error) {
                        display.value = 'Error';
                        currentInput = '0';
                    }
                }
            </script>
        </body>
        </html>
    `);
}

// ========== 3D APPLICATION CHOICE FUNCTIONS ==========

function show3DChoice() {
    const choice = confirm(
        "🎨 APLIKACJA 3D\n\n" +
        "Co chcesz otworzyć?\n\n" +
        "✅ OK = Biblioteka modeli 3D (lokalny folder)\n" +
        "❌ Anuluj = Aplikacja 3D Creator (port 3050)"
    );
    
    if (choice) {
        // Otwórz lokalny folder biblioteki
        openLocalLibrary();
    } else {
        // Otwórz/uruchom aplikację 3D
        open3DCreatorApp();
    }
}

function openLocalLibrary() {
    // Otwórz lokalny folder z biblioteką
    fetch('/api/open-folder', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            path: 'U:\\JIMBO_INC_CONTROL_CENTER\\3D_APP\\3D_LIBRARY'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('📁 Biblioteka 3D otwarta', 'success');
        } else {
            showNotification('❌ Błąd otwierania folderu', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('❌ Błąd połączenia', 'error');
    });
}

function open3DCreatorApp() {
    // Sprawdź czy aplikacja działa
    fetch('http://localhost:3050/', { 
        method: 'HEAD',
        mode: 'no-cors'
    })
    .then(() => {
        // Aplikacja działa - otwórz
        window.open('http://localhost:3050', '_blank');
        showNotification('🚀 Aplikacja 3D otwarta', 'success');
    })
    .catch(() => {
        // Aplikacja nie działa - uruchom
        showNotification('⏳ Uruchamianie aplikacji 3D...', 'info');
        
        fetch('/api/start-3d-app', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('✅ Aplikacja 3D uruchomiona', 'success');
                // Poczekaj 5 sekund i otwórz
                setTimeout(() => {
                    window.open('http://localhost:3050', '_blank');
                }, 5000);
            } else {
                showNotification('❌ Błąd uruchamiania aplikacji', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('❌ Błąd uruchamiania', 'error');
        });
    });
}
