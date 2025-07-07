// JIMBO Weather Widget - Toruń, Poland
// Updated: 04/07/2025
Dclass WeatherWidget {
    constructor(containerId = 'weather-content') {
        this.containerId = containerId;
        this.apiUrl = `${BACKEND_URL}/api/weather`;
        this.updateInterval = 10 * 60 * 1000; // 10 minutes
        this.init();
    }

    init() {
        console.log('🌤️ Initializing Weather Widget for Toruń');
        this.loadWeather();
        setInterval(() => this.loadWeather(), this.updateInterval);
    }

    async loadWeather(city = 'Toruń') {
        try {
            const container = document.getElementById(this.containerId);
            if (!container) {
                console.warn('Weather container not found');
                return;
            }

            // Show loading state
            container.innerHTML = this.getLoadingHTML();

            const response = await fetch(`${this.apiUrl}?city=${encodeURIComponent(city)}`);
            const data = await response.json();

            if (data.error) {
                container.innerHTML = this.getErrorHTML(data.error);
                return;
            }

            container.innerHTML = this.getWeatherHTML(data);
            console.log(`✅ Weather loaded for ${city}`);

        } catch (error) {
            console.error('❌ Weather loading error:', error);
            const container = document.getElementById(this.containerId);
            if (container) {
                container.innerHTML = this.getErrorHTML('Błąd połączenia z serwisem pogodowym');
            }
        }
    }

    getLoadingHTML() {
        return `
            <div class="weather-loading text-center p-3">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Ładowanie...</span>
                </div>
                <p class="mt-2 mb-0 small text-muted">Pobieranie danych pogodowych...</p>
            </div>
        `;
    }

    getErrorHTML(error) {
        return `
            <div class="weather-error text-center p-3">
                <i class="fas fa-exclamation-triangle text-warning mb-2"></i>
                <p class="small text-muted mb-1">Błąd pogody</p>
                <p class="small text-danger">${error}</p>
                <button class="btn btn-sm btn-outline-primary" onclick="weather.loadWeather()">
                    <i class="fas fa-sync-alt"></i> Spróbuj ponownie
                </button>
            </div>
        `;
    }

    getWeatherHTML(data) {
        const temp = Math.round(data.main?.temp || 0);
        const feelsLike = Math.round(data.main?.feels_like || 0);
        const humidity = data.main?.humidity || 0;
        const pressure = data.main?.pressure || 0;
        const windSpeed = Math.round((data.wind?.speed || 0) * 3.6); // m/s to km/h
        const description = data.weather?.[0]?.description || 'Brak danych';
        const icon = data.weather?.[0]?.icon || '01d';
        const city = data.name || data.city_display || 'Toruń';
        const country = data.sys?.country || 'PL';

        // Get weather icon from OpenWeather
        const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

        return `
            <div class="weather-display">
                <div class="weather-header d-flex align-items-center justify-content-between mb-2">
                    <div class="city-info">
                        <h6 class="mb-0">${city}, ${country}</h6>
                        <small class="text-muted">${description}</small>
                    </div>
                    <img src="${iconUrl}" alt="${description}" class="weather-icon" style="width: 50px; height: 50px;">
                </div>
                
                <div class="weather-main d-flex align-items-center justify-content-between mb-3">
                    <div class="temperature">
                        <span class="temp-main fs-3 fw-bold text-primary">${temp}°C</span>
                        <div class="temp-feels small text-muted">Odczuwalna: ${feelsLike}°C</div>
                    </div>
                </div>
                
                <div class="weather-details">
                    <div class="row g-2">
                        <div class="col-6">
                            <div class="detail-item text-center p-2 bg-light rounded">
                                <i class="fas fa-tint text-info"></i>
                                <div class="small fw-bold">${humidity}%</div>
                                <div class="small text-muted">Wilgotność</div>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="detail-item text-center p-2 bg-light rounded">
                                <i class="fas fa-gauge-high text-warning"></i>
                                <div class="small fw-bold">${pressure} hPa</div>
                                <div class="small text-muted">Ciśnienie</div>
                            </div>
                        </div>
                        <div class="col-12">
                            <div class="detail-item text-center p-2 bg-light rounded">
                                <i class="fas fa-wind text-success"></i>
                                <div class="small fw-bold">${windSpeed} km/h</div>
                                <div class="small text-muted">Wiatr</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="weather-footer mt-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">Ostatnia aktualizacja: ${this.getCurrentTime()}</small>
                        <button class="btn btn-sm btn-outline-secondary" onclick="weather.loadWeather()" title="Odśwież pogodę">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getCurrentTime() {
        const now = new Date();
        const polandTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Warsaw"}));
        
        const hours = String(polandTime.getHours()).padStart(2, '0');
        const minutes = String(polandTime.getMinutes()).padStart(2, '0');
        
        return `${hours}:${minutes}`;
    }

    // Method to change city
    changeCity(newCity) {
        console.log(`🌍 Changing weather city to: ${newCity}`);
        this.loadWeather(newCity);
    }
}

// Initialize weather widget when DOM is ready
let weather;

document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for other elements to load
    setTimeout(() => {
        weather = new WeatherWidget();
    }, 1000);
});

// Make it available globally
window.weather = weather;
