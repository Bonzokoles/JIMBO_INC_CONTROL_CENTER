// Web Scraper JavaScript
class WebScraper {
    constructor() {
        this.history = JSON.parse(localStorage.getItem('scraper-history') || '[]');
        this.init();
        this.init3DBackground();
    }

    init() {
        this.bindEvents();
        this.loadHistory();
    }

    bindEvents() {
        document.getElementById('scrape-btn').addEventListener('click', () => this.scrapeWebsite());
        document.getElementById('export-json').addEventListener('click', () => this.exportResults('json'));
        document.getElementById('export-txt').addEventListener('click', () => this.exportResults('txt'));
        
        // Enter key support
        document.getElementById('url-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.scrapeWebsite();
        });
    }

    async scrapeWebsite() {
        const url = document.getElementById('url-input').value.trim();
        if (!url) {
            alert('Please enter a valid URL');
            return;
        }

        this.showLoading(true);
        
        try {
            const response = await fetch('/api/scrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: url })
            });

            const result = await response.json();
            
            if (response.ok) {
                this.displayResults(result);
                this.addToHistory(url, result);
            } else {
                throw new Error(result.error || 'Scraping failed');
            }
        } catch (error) {
            console.error('Scraping error:', error);
            alert('Error: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    displayResults(data) {
        const resultsSection = document.getElementById('results-section');
        const resultsContent = document.getElementById('results-content');
        
        let content = '';
        if (data.title) content += `<h4>Title: ${data.title}</h4>`;
        if (data.content) content += `<div><strong>Content:</strong><br>${data.content.substring(0, 2000)}...</div>`;
        if (data.links) content += `<div><strong>Links Found:</strong> ${data.links.length}</div>`;
        
        resultsContent.innerHTML = content;
        resultsSection.style.display = 'block';
        
        // Store current results for export
        this.currentResults = data;
    }

    showLoading(show) {
        const btn = document.getElementById('scrape-btn');
        if (show) {
            btn.innerHTML = '<div class="spinner"></div> Scraping...';
            btn.disabled = true;
        } else {
            btn.innerHTML = 'Scrape Website';
            btn.disabled = false;
        }
    }

    addToHistory(url, data) {
        const historyItem = {
            url: url,
            title: data.title || 'Untitled',
            timestamp: new Date().toISOString(),
            preview: (data.content || '').substring(0, 100) + '...'
        };
        
        this.history.unshift(historyItem);
        if (this.history.length > 10) this.history.pop(); // Keep only 10 items
        
        localStorage.setItem('scraper-history', JSON.stringify(this.history));
        this.loadHistory();
    }

    loadHistory() {
        const historyList = document.getElementById('history-list');
        
        if (this.history.length === 0) {
            historyList.innerHTML = '<p class="text-muted">No scraping history yet.</p>';
            return;
        }
        
        historyList.innerHTML = this.history.map(item => `
            <div class="history-item" onclick="document.getElementById('url-input').value='${item.url}'">
                <strong>${item.title}</strong><br>
                <small class="text-muted">${item.url}</small><br>
                <small>${new Date(item.timestamp).toLocaleString()}</small>
            </div>
        `).join('');
    }

    exportResults(format) {
        if (!this.currentResults) {
            alert('No results to export');
            return;
        }

        let content, filename, mimeType;
        
        if (format === 'json') {
            content = JSON.stringify(this.currentResults, null, 2);
            filename = 'scraper-results.json';
            mimeType = 'application/json';
        } else if (format === 'txt') {
            content = `Title: ${this.currentResults.title || 'N/A'}\n\n`;
            content += `Content:\n${this.currentResults.content || 'N/A'}\n\n`;
            content += `Links:\n${(this.currentResults.links || []).join('\n')}`;
            filename = 'scraper-results.txt';
            mimeType = 'text/plain';
        }

        // Create download
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    init3DBackground() {
        // Initialize 3D background similar to dashboard
        const canvas = document.getElementById('bg-3d-canvas');
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0.1);
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 0.5);
        scene.add(directionalLight);
        
        // Add particles
        const particlesCount = 500;
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesPositions = new Float32Array(particlesCount * 3);
        
        for (let i = 0; i < particlesCount * 3; i++) {
            particlesPositions[i] = (Math.random() - 0.5) * 50;
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));
        
        const particlesMaterial = new THREE.PointsMaterial({
            color: 0x4fc3f7,
            size: 2,
            transparent: true,
            opacity: 0.6
        });
        
        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particles);
        
        camera.position.z = 5;
        
        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            particles.rotation.x += 0.001;
            particles.rotation.y += 0.002;
            renderer.render(scene, camera);
        }
        animate();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WebScraper();
});