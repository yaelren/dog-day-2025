// Main application controller
class App {
    constructor() {
        this.config = null;
        this.imageManager = null;
        this.stripRenderer = null;
        this.zoomManager = null;
        this.devUI = null;
        
        this.animationId = null;
        this.isRunning = false;
        
        this.init();
    }
    
    async init() {
        try {
            console.log('Initializing Strike A Pawse application...');
            
            // Initialize configuration
            this.config = new window.Config();
            
            // Initialize image manager
            this.imageManager = new window.ImageManager(this.config);
            
            // Wait a moment for initial image loading
            await this.waitForImages();
            
            // Initialize strip renderer
            this.stripRenderer = new window.StripRenderer(this.config, this.imageManager);
            
            // Make stripRenderer globally accessible for image updates
            window.stripRenderer = this.stripRenderer;
            
            // Initialize zoom manager
            this.zoomManager = new window.ZoomManager(this.config, this.stripRenderer);
            
            // Initialize development UI
            this.devUI = new window.DevUI(this.config, this.stripRenderer, this.zoomManager, this.imageManager);
            
            // Try to load saved configuration
            this.devUI.loadConfiguration();
            
            // Wait for font to load before starting
            await this.waitForFont();
            
            // Start animation loop
            this.start();
            
            console.log('Application initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize application. Check console for details.');
        }
    }
    
    async waitForImages() {
        // Give image manager a moment to load initial images
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, 1000);
        });
    }
    
    async waitForFont() {
        // Wait for the custom font to load
        if ('fonts' in document) {
            try {
                await document.fonts.load('400 16px WixMadeforDisplay');
                console.log('WixMadeforDisplay font loaded successfully');
            } catch (error) {
                console.error('Font loading failed:', error);
            }
        } else {
            // Fallback for browsers without Font Loading API
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        console.log('Starting animation loop...');
        
        // Ensure we have a clean start
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.animate();
    }
    
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        console.log('Animation loop stopped');
    }
    
    animate = (currentTime) => {
        if (!this.isRunning) return;
        
        try {
            // Update zoom manager
            if (this.zoomManager) {
                this.zoomManager.update(currentTime);
            }
            
            // Render strips
            if (this.stripRenderer) {
                this.stripRenderer.render(currentTime);
            }
            
            // Continue animation loop
            this.animationId = requestAnimationFrame(this.animate);
            
        } catch (error) {
            console.error('Animation error:', error);
            this.stop();
            this.showError('Animation error occurred. Check console for details.');
        }
    }
    
    showError(message) {
        // Create error overlay
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 left-4 right-4 bg-red-900/90 border border-red-700 text-white p-4 rounded-lg z-50 backdrop-blur-sm';
        errorDiv.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-bold text-lg mb-2">Error</h3>
                    <p class="text-sm">${message}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="text-red-400 hover:text-red-300 text-xl">&times;</button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 10000);
    }
    
    // Public API methods
    toggleAnimation() {
        if (this.isRunning) {
            this.stop();
        } else {
            this.start();
        }
        return this.isRunning;
    }
    
    forceZoom() {
        if (this.zoomManager) {
            this.zoomManager.forceZoom();
        }
    }
    
    refreshImages() {
        if (this.imageManager) {
            this.imageManager.refreshImages();
        }
    }
    
    resetStrips() {
        if (this.stripRenderer) {
            // Reinitialize strips
            this.stripRenderer.initStrips();
        }
    }
    
    saveConfiguration() {
        if (this.devUI) {
            this.devUI.saveConfiguration();
        }
    }
    
    // Debug methods
    getPerformanceInfo() {
        return {
            fps: this.config?.performance?.currentFPS || 0,
            elementCount: this.config?.performance?.elementCount || 0,
            imageCount: this.config?.images?.queue?.length || 0,
            isRunning: this.isRunning,
            zoomEnabled: this.config?.zoom?.enabled || false
        };
    }
    
    logStatus() {
        const info = this.getPerformanceInfo();
        console.log('App Status:', info);
        return info;
    }
}

// Initialize application when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Make app globally accessible for debugging
    window.app = new App();
    
    // Add global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Debug shortcuts (Ctrl/Cmd + Shift + key)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
            switch(e.key.toLowerCase()) {
                case 's':
                    e.preventDefault();
                    window.app.logStatus();
                    break;
                    
                case 'p':
                    e.preventDefault();
                    const isRunning = window.app.toggleAnimation();
                    console.log(`Animation ${isRunning ? 'started' : 'stopped'}`);
                    break;
                    
                case 'r':
                    e.preventDefault();
                    window.app.resetStrips();
                    console.log('Strips reset');
                    break;
            }
        }
    });
    
    console.log('Strike A Pawse - Dog Day 2025 loaded');
    console.log('Debug commands:');
    console.log('  Ctrl/Cmd+Shift+S: Log status');
    console.log('  Ctrl/Cmd+Shift+P: Toggle animation');
    console.log('  Ctrl/Cmd+Shift+R: Reset strips');
    console.log('  Ctrl/Cmd+H: Toggle dev panel');
    console.log('  Ctrl/Cmd+Z: Force zoom');
});

// Visibility change handler removed - animation stays running always

// Handle window resize (though this shouldn't happen with fixed dimensions)
window.addEventListener('resize', () => {
    // In a real deployment, this would be for debugging only
    console.log('Window resized - application designed for 4640x1760');
});

// Export for debugging
window.App = App;