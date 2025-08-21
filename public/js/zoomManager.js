// Zoom animation manager using GSAP
class ZoomManager {
    constructor(config, stripRenderer) {
        this.config = config;
        this.stripRenderer = stripRenderer;
        this.canvas = document.getElementById('zoomCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.setupCanvas();
        
        this.isZooming = false;
        this.isZoomedIn = false;
        this.zoomTimer = null;
        this.currentZoom = {
            element: null,
            startTime: 0,
            duration: 0
        };
        
        this.nextZoomTime = Date.now() + this.config.zoom.frequency;
    }
    
    setupCanvas() {
        // Match the main canvas sizing
        this.updateCanvasSize();
        
        // Listen for window resize
        window.addEventListener('resize', () => this.updateCanvasSize());
        
        // Smooth rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }
    
    updateCanvasSize() {
        // Copy sizing from main canvas
        const mainCanvas = document.getElementById('mainCanvas');
        
        this.canvas.width = this.config.display.width;
        this.canvas.height = this.config.display.height;
        
        this.canvas.style.width = mainCanvas.style.width;
        this.canvas.style.height = mainCanvas.style.height;
        this.canvas.style.left = mainCanvas.style.left;
        this.canvas.style.top = mainCanvas.style.top;
    }
    
    update(currentTime) {
        // Check if it's time for a new zoom
        if (!this.isZooming && this.config.zoom.enabled && currentTime >= this.nextZoomTime) {
            this.triggerZoom();
        }
        
        // Render zoom if active
        if (this.isZoomedIn && this.currentZoom.element) {
            this.renderLiveZoom();
        }
    }
    
    triggerZoom() {
        // Try to find actual image elements on screen first
        let targetElement = null;
        const maxAttempts = 20;
        
        // Sample points across the screen to find actual elements
        for (let i = 0; i < maxAttempts; i++) {
            const randomX = Math.random() * this.config.display.width;
            const randomY = Math.random() * this.config.display.height;
            
            const element = this.stripRenderer.getElementAt(randomX, randomY);
            if (element && element.element && (element.element.type === 'image')) {
                targetElement = element;
                console.log(`Found image element at (${element.centerX}, ${element.centerY})`);
                break;
            }
        }
        
        // If no image element found, fall back to finding any element
        if (!targetElement) {
            for (let i = 0; i < maxAttempts; i++) {
                const randomX = Math.random() * this.config.display.width;
                const randomY = Math.random() * this.config.display.height;
                
                const element = this.stripRenderer.getElementAt(randomX, randomY);
                if (element) {
                    targetElement = element;
                    console.log(`Found fallback element at (${element.centerX}, ${element.centerY})`);
                    break;
                }
            }
        }
        
        // Last resort: pick a position in the middle of a random strip
        if (!targetElement) {
            const stripIndex = Math.floor(Math.random() * 3);
            targetElement = {
                centerX: this.config.display.width / 2,
                centerY: stripIndex * this.config.display.stripHeight + this.config.display.stripHeight / 2,
                element: null,
                strip: this.config.strips[stripIndex]
            };
            console.log(`Using fallback position at (${targetElement.centerX}, ${targetElement.centerY})`);
        }
        
        this.startZoom(targetElement);
    }
    
    startZoom(targetElement) {
        this.isZooming = true;
        this.isZoomedIn = true;
        this.currentZoom = {
            element: targetElement,
            startTime: Date.now(),
            duration: this.config.zoom.duration,
            targetX: targetElement.centerX,
            targetY: targetElement.centerY,
            scale: this.config.zoom.scale
        };
        
        console.log(`Starting zoom to element at (${targetElement.centerX}, ${targetElement.centerY})`);
        
        // Set timer to cut back to full view after staying zoomed
        this.zoomTimer = setTimeout(() => {
            this.cutToFullView();
        }, 2000); // Stay zoomed for 2 seconds
    }
    
    renderLiveZoom() {
        // Clear zoom canvas
        this.ctx.clearRect(0, 0, this.config.display.width, this.config.display.height);
        
        if (!this.currentZoom || !this.isZoomedIn) return;
        
        this.ctx.save();
        
        // Get current main canvas content (live, updated each frame)
        const mainCanvas = document.getElementById('mainCanvas');
        
        // Calculate zoom target position (centered on screen)
        const targetX = this.config.display.width / 2 - this.currentZoom.targetX;
        const targetY = this.config.display.height / 2 - this.currentZoom.targetY;
        
        // Apply zoom transformation to show a magnified portion
        this.ctx.translate(this.config.display.width / 2, this.config.display.height / 2);
        this.ctx.scale(this.currentZoom.scale, this.currentZoom.scale);
        this.ctx.translate(-this.config.display.width / 2 + targetX / this.currentZoom.scale, 
                        -this.config.display.height / 2 + targetY / this.currentZoom.scale);
        
        // Draw the live zoomed content
        this.ctx.drawImage(mainCanvas, 0, 0);
        
        this.ctx.restore();
    }
    
    
    cutToFullView() {
        // Clear zoom canvas to show full view
        this.ctx.clearRect(0, 0, this.config.display.width, this.config.display.height);
        this.isZoomedIn = false;
        
        // End zoom after a brief moment
        setTimeout(() => {
            this.endZoom();
        }, 50); // Very brief delay before scheduling next zoom
    }
    
    endZoom() {
        this.isZooming = false;
        this.isZoomedIn = false;
        this.currentZoom.element = null;
        
        // Clear any existing timer
        if (this.zoomTimer) {
            clearTimeout(this.zoomTimer);
            this.zoomTimer = null;
        }
        
        // Clear zoom canvas
        this.ctx.clearRect(0, 0, this.config.display.width, this.config.display.height);
        
        // Schedule next zoom
        this.nextZoomTime = Date.now() + this.config.zoom.frequency;
        
        console.log('Zoom sequence complete');
    }
    
    forceZoom() {
        if (!this.isZooming) {
            this.triggerZoom();
        }
    }
    
    updateFrequency(frequency) {
        this.config.zoom.frequency = frequency * 1000; // Convert to milliseconds
        
        // Update next zoom time if not currently zooming
        if (!this.isZooming) {
            this.nextZoomTime = Date.now() + this.config.zoom.frequency;
        }
    }
    
    updateDuration(duration) {
        this.config.zoom.duration = duration * 1000; // Convert to milliseconds
    }
    
    updateScale(scale) {
        this.config.zoom.scale = scale;
    }
    
    toggle() {
        this.config.zoom.enabled = !this.config.zoom.enabled;
        return this.config.zoom.enabled;
    }
}

// Export as global
window.ZoomManager = ZoomManager;