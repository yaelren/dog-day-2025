// Development UI controller
class DevUI {
    constructor(config, stripRenderer, zoomManager, imageManager) {
        this.config = config;
        this.stripRenderer = stripRenderer;
        this.zoomManager = zoomManager;
        this.imageManager = imageManager;
        
        this.panel = document.getElementById('devPanel');
        this.showButton = document.getElementById('showPanel');
        this.isVisible = true;
        
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.initializeControls();
    }
    
    setupEventListeners() {
        // Panel toggle buttons
        document.getElementById('togglePanel').addEventListener('click', () => this.hidePanel());
        this.showButton.addEventListener('click', () => this.showPanel());
        
        // Strip controls
        for (let i = 1; i <= 3; i++) {
            // Direction controls
            document.getElementById(`strip${i}Direction`).addEventListener('change', (e) => {
                this.config.updateStrip(i, 'direction', e.target.value);
            });
            
            // Speed controls
            const speedSlider = document.getElementById(`strip${i}Speed`);
            const speedValue = document.getElementById(`strip${i}SpeedValue`);
            
            speedSlider.addEventListener('input', (e) => {
                const speed = parseFloat(e.target.value);
                speedValue.textContent = speed.toFixed(1);
                this.config.updateStrip(i, 'speed', speed);
            });
        }
        
        // Zoom controls
        const zoomFrequency = document.getElementById('zoomFrequency');
        const zoomFrequencyValue = document.getElementById('zoomFrequencyValue');
        
        zoomFrequency.addEventListener('input', (e) => {
            const frequency = parseInt(e.target.value);
            zoomFrequencyValue.textContent = frequency;
            this.zoomManager.updateFrequency(frequency);
        });
        
        const zoomDuration = document.getElementById('zoomDuration');
        const zoomDurationValue = document.getElementById('zoomDurationValue');
        
        zoomDuration.addEventListener('input', (e) => {
            const duration = parseFloat(e.target.value);
            zoomDurationValue.textContent = duration;
            this.zoomManager.updateDuration(duration);
        });
        
        const zoomScale = document.getElementById('zoomScale');
        const zoomScaleValue = document.getElementById('zoomScaleValue');
        
        zoomScale.addEventListener('input', (e) => {
            const scale = parseFloat(e.target.value);
            zoomScaleValue.textContent = scale.toFixed(1);
            this.zoomManager.updateScale(scale);
        });
        
        // Zoom trigger button
        document.getElementById('triggerZoom').addEventListener('click', () => {
            this.zoomManager.forceZoom();
        });
        
        // Image management
        document.getElementById('refreshImages').addEventListener('click', () => {
            this.imageManager.refreshImages();
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Check for modifier keys (Ctrl/Cmd)
            const isModifier = e.ctrlKey || e.metaKey;
            
            if (isModifier) {
                switch(e.key.toLowerCase()) {
                    case 'h':
                        e.preventDefault();
                        this.togglePanel();
                        break;
                        
                    case 'z':
                        e.preventDefault();
                        this.zoomManager.forceZoom();
                        break;
                        
                    case 'r':
                        e.preventDefault();
                        this.imageManager.refreshImages();
                        break;
                }
            }
            
            // ESC to hide panel
            if (e.key === 'Escape') {
                this.hidePanel();
            }
        });
    }
    
    initializeControls() {
        // Set initial values from config
        this.config.strips.forEach((strip, index) => {
            const stripNum = index + 1;
            document.getElementById(`strip${stripNum}Direction`).value = strip.direction;
            document.getElementById(`strip${stripNum}Speed`).value = strip.speed;
            document.getElementById(`strip${stripNum}SpeedValue`).textContent = strip.speed.toFixed(1);
        });
        
        // Set zoom values
        document.getElementById('zoomFrequency').value = this.config.zoom.frequency / 1000;
        document.getElementById('zoomFrequencyValue').textContent = this.config.zoom.frequency / 1000;
        document.getElementById('zoomDuration').value = this.config.zoom.duration / 1000;
        document.getElementById('zoomDurationValue').textContent = this.config.zoom.duration / 1000;
        document.getElementById('zoomScale').value = this.config.zoom.scale;
        document.getElementById('zoomScaleValue').textContent = this.config.zoom.scale.toFixed(1);
    }
    
    togglePanel() {
        if (this.isVisible) {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    }
    
    hidePanel() {
        this.panel.style.transform = 'translateX(340px)';
        this.showButton.style.display = 'block';
        this.isVisible = false;
    }
    
    showPanel() {
        this.panel.style.transform = 'translateX(0)';
        this.showButton.style.display = 'none';
        this.isVisible = true;
    }
    
    updatePerformanceMetrics() {
        // These are updated by the strip renderer
        // This method exists for future enhancements
    }
    
    // Method to show notifications (for future use)
    showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Could implement toast notifications here in the future
        // For now, just log to console
    }
    
    // Method to update image-related UI elements
    updateImageStatus(count, maxCount, folderPath) {
        const countElement = document.getElementById('imageCount');
        const maxElement = document.getElementById('maxImages');
        const folderElement = document.getElementById('watchFolder');
        
        if (countElement) countElement.textContent = count;
        if (maxElement) maxElement.textContent = maxCount;
        if (folderElement) folderElement.textContent = folderPath;
    }
    
    // Save current configuration to localStorage
    saveConfiguration() {
        const config = {
            strips: this.config.strips,
            zoom: this.config.zoom,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('pawse-config', JSON.stringify(config));
            this.showNotification('Configuration saved', 'success');
        } catch (error) {
            this.showNotification('Failed to save configuration', 'error');
        }
    }
    
    // Load configuration from localStorage
    loadConfiguration() {
        try {
            const saved = localStorage.getItem('pawse-config');
            if (saved) {
                const config = JSON.parse(saved);
                
                // Update config object
                this.config.strips = config.strips;
                this.config.zoom = { ...this.config.zoom, ...config.zoom };
                
                // Update UI controls
                this.initializeControls();
                
                this.showNotification('Configuration loaded', 'success');
                return true;
            }
        } catch (error) {
            this.showNotification('Failed to load configuration', 'error');
        }
        
        return false;
    }
}

// Export as global
window.DevUI = DevUI;