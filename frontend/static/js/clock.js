// Enhanced Clock with Real-time Updates - Polish Format
// Format: DD/MM/YYYY HH:MM:SS (Europe/Warsaw)
// Updated: 04/07/2025

function initializeClock() {
    console.log('🕐 Initializing JIMBO Clock - Poland timezone');
    updateClock();
    setInterval(updateClock, 1000); // Update every second
    
    // Also update on window focus to ensure accuracy
    window.addEventListener('focus', updateClock);
}

function updateClock() {
    try {
        // Get current time in Poland timezone (Europe/Warsaw)
        const now = new Date();
        const polandTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Warsaw"}));
        
        // Format: DD/MM/YYYY HH:MM:SS (Polish standard)
        const day = String(polandTime.getDate()).padStart(2, '0');
        const month = String(polandTime.getMonth() + 1).padStart(2, '0');
        const year = polandTime.getFullYear();
        const hours = String(polandTime.getHours()).padStart(2, '0');
        const minutes = String(polandTime.getMinutes()).padStart(2, '0');
        const seconds = String(polandTime.getSeconds()).padStart(2, '0');
        
        const timeString = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
        const dayName = polandTime.toLocaleDateString('pl-PL', { weekday: 'long' });
        
        // Update all possible clock elements
        const clockElements = [
            document.getElementById('clock-display-topbar'),
            document.getElementById('clock-display'),
            document.querySelector('.clock-display'),
            ...document.querySelectorAll('[data-clock]'),
            ...document.querySelectorAll('.time-widget'),
            ...document.querySelectorAll('.clock-widget')
        ];
        
        clockElements.forEach(element => {
            if (element) {
                element.textContent = timeString;
                element.setAttribute('data-time', timeString);
                element.setAttribute('title', `${dayName}, ${timeString} (Europe/Warsaw)`);
                element.setAttribute('data-timezone', 'Europe/Warsaw');
                element.setAttribute('data-format', 'DD/MM/YYYY HH:MM:SS');
            }
        });
        
        // Update any time widgets with data attributes
        const timeWidgets = document.querySelectorAll('[data-time-update]');
        timeWidgets.forEach(widget => {
            if (widget) {
                widget.textContent = timeString;
                widget.setAttribute('data-last-update', timeString);
            }
        });
        
        // Debug log every minute for verification
        if (seconds === '00') {
            console.log(`🕐 Clock update: ${timeString} (${dayName})`);
        }
        
    } catch (error) {
        console.error('❌ Clock update error:', error);
        
        // Fallback to browser's built-in Polish formatting
        try {
            const fallbackTime = new Date().toLocaleString('pl-PL', {
                timeZone: 'Europe/Warsaw',
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }).replace(',', '');
            
            const clockElement = document.getElementById('clock-display-topbar');
            if (clockElement) {
                clockElement.textContent = fallbackTime;
                clockElement.setAttribute('title', 'Fallback time format');
            }
        } catch (fallbackError) {
            console.error('❌ Fallback clock error:', fallbackError);
        }
    }
}

// Auto-initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeClock);
} else {
    initializeClock();
}

// Initialize clock when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeClock();
});

// Export for other modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initializeClock, updateClock };
}
