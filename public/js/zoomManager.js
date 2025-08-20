// Zoom animation manager using GSAP
class ZoomManager {
    constructor(config, stripRenderer) {
        this.config = config;
        this.stripRenderer = stripRenderer;
        this.canvas = document.getElementById('zoomCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.setupCanvas();
        
        this.isZooming = false;
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
        
        // Update current zoom animation
        if (this.isZooming) {
            this.updateZoom(currentTime);
        }
    }
    
    triggerZoom() {
        // Find a random element to zoom to
        const randomX = Math.random() * this.config.display.width;
        const randomY = Math.random() * this.config.display.height;
        
        // Get element near this position
        let targetElement = this.stripRenderer.getElementAt(randomX, randomY);
        
        // If no element found, try a few more times
        if (!targetElement) {
            for (let i = 0; i < 10; i++) {
                const x = Math.random() * this.config.display.width;
                const y = Math.random() * this.config.display.height;
                targetElement = this.stripRenderer.getElementAt(x, y);
                if (targetElement) break;
            }
        }
        
        // If still no element found, pick a random position
        if (!targetElement) {
            const stripIndex = Math.floor(Math.random() * 3);
            targetElement = {
                centerX: Math.random() * this.config.display.width,
                centerY: stripIndex * this.config.display.stripHeight + this.config.display.stripHeight / 2,
                element: null,
                strip: this.config.strips[stripIndex]
            };
        }
        
        this.startZoom(targetElement);
    }
    
    startZoom(targetElement) {
        this.isZooming = true;
        this.currentZoom = {
            element: targetElement,
            startTime: Date.now(),
            duration: this.config.zoom.duration
        };
        
        console.log(`Starting zoom to element at (${targetElement.centerX}, ${targetElement.centerY})`);
        
        // Use GSAP for smooth zoom animation
        const zoomData = {
            scale: 1,
            x: 0,
            y: 0,
            opacity: 1
        };
        
        // Calculate zoom target position (centered on screen)
        const targetX = this.config.display.width / 2 - targetElement.centerX;
        const targetY = this.config.display.height / 2 - targetElement.centerY;
        
        // Create zoom in animation
        gsap.timeline()
            .to(zoomData, {
                duration: this.config.zoom.duration / 2000, // Convert to seconds
                scale: this.config.zoom.scale,
                x: targetX,
                y: targetY,
                ease: "power2.inOut",
                onUpdate: () => {
                    this.renderZoom(zoomData);
                }
            })
            .to(zoomData, {
                duration: this.config.zoom.duration / 2000, // Convert to seconds
                scale: 1,
                x: 0,
                y: 0,
                ease: "power2.inOut",
                onUpdate: () => {
                    this.renderZoom(zoomData);
                },
                onComplete: () => {
                    this.endZoom();
                }
            });
    }
    
    renderZoom(zoomData) {
        // Clear zoom canvas
        this.ctx.clearRect(0, 0, this.config.display.width, this.config.display.height);
        
        if (zoomData.scale > 1.01) { // Only render if actually zooming
            this.ctx.save();
            
            // Apply zoom transformation
            this.ctx.translate(this.config.display.width / 2, this.config.display.height / 2);
            this.ctx.scale(zoomData.scale, zoomData.scale);
            this.ctx.translate(-this.config.display.width / 2 + zoomData.x / zoomData.scale, 
                            -this.config.display.height / 2 + zoomData.y / zoomData.scale);
            
            // Copy main canvas content
            const mainCanvas = document.getElementById('mainCanvas');
            this.ctx.globalAlpha = zoomData.opacity;
            this.ctx.drawImage(mainCanvas, 0, 0);
            
            // Add zoom overlay effect
            this.ctx.globalAlpha = 0.1;
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(0, 0, this.config.display.width, this.config.display.height);
            
            this.ctx.restore();
        }
    }
    
    updateZoom(currentTime) {
        const elapsed = currentTime - this.currentZoom.startTime;
        
        // Check if zoom animation should be complete
        if (elapsed >= this.currentZoom.duration) {
            this.endZoom();
        }
    }
    
    endZoom() {
        this.isZooming = false;
        this.currentZoom.element = null;
        
        // Clear zoom canvas
        this.ctx.clearRect(0, 0, this.config.display.width, this.config.display.height);
        
        // Schedule next zoom
        this.nextZoomTime = Date.now() + this.config.zoom.frequency;
        
        console.log('Zoom animation complete');
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