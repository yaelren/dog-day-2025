// Proportional Scaling Manager
class Scaler {
    constructor() {
        // Fixed design dimensions
        this.designWidth = 4640;
        this.designHeight = 1760;
        
        // Get the layout container
        this.container = document.querySelector('.fixed-layout');
        
        // Initialize scaling
        this.updateScale();
        
        // Add resize listener
        window.addEventListener('resize', () => this.updateScale());
    }
    
    updateScale() {
        // Get current viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Calculate scale factors
        const scaleX = viewportWidth / this.designWidth;
        const scaleY = viewportHeight / this.designHeight;
        
        // Use the smaller scale to maintain aspect ratio
        const scale = Math.min(scaleX, scaleY);
        
        // Apply the scale transform
        if (this.container) {
            this.container.style.transform = `scale(${scale})`;
            
            // Center the scaled content if there's extra space
            const scaledWidth = this.designWidth * scale;
            const scaledHeight = this.designHeight * scale;
            
            // Calculate centering offsets
            const offsetX = (viewportWidth - scaledWidth) / 2;
            const offsetY = (viewportHeight - scaledHeight) / 2;
            
            // Apply positioning
            this.container.style.position = 'absolute';
            this.container.style.left = `${offsetX}px`;
            this.container.style.top = `${offsetY}px`;
            
            // Store current scale for other components
            window.currentScale = scale;
            
            // Dispatch custom event for scale change
            window.dispatchEvent(new CustomEvent('scaleChanged', { 
                detail: { 
                    scale, 
                    offsetX, 
                    offsetY,
                    scaledWidth,
                    scaledHeight
                } 
            }));
        }
    }
    
    getScale() {
        return window.currentScale || 1;
    }
    
    getDesignDimensions() {
        return {
            width: this.designWidth,
            height: this.designHeight
        };
    }
}

// Initialize scaler when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.scaler = new Scaler();
});

// Export for use in other modules
window.Scaler = Scaler;