// Configuration management for Strike A Pawse
class Config {
    constructor() {
        this.display = {
            width: 4640,
            height: 1760,
            headerHeight: 106,
            canvasHeight: 1654, // 1760 - 106 header
            stripHeight: 551 // Approximately: 1654 / 3 strips
        };
        
        this.strips = [
            {
                id: 1,
                pattern: ['large','W', 'large', 'H', 'large', 'O', 'large', 'W', 'large', 'H', 'large', 'O'], // W-H-O with large images
                direction: 'left',
                speed: 2,
                y: 0
            },
            {
                id: 2,
                pattern: ['O', 'cropped', 'large', 'O', 'large', 'O', 'cropped', 'O', 'cropped', 'large', 'O', 'large', 'O', 'cropped'], // Second row pattern
                direction: 'right',
                speed: 2.5,
                y: 551
            },
            {
                id: 3,
                pattern: ['large', 'O', 'cropped', 'large', 'F', 'large', '!', 'large', 'O', 'cropped', 'large', 'F', 'large', '!'], // Last row pattern
                direction: 'left',
                speed: 1.8,
                y: 1102
            }
        ];
        
        this.zoom = {
            frequency: 10000, // 10 seconds
            duration: 2000, // 2 seconds
            scale: 2.5,
            enabled: true,
            lastZoom: 0
        };
        
        this.images = {
            maxCount: 10,
            queue: [],
            loaded: new Map(),
            largeSize: {
                width: 727,
                height: 484
            },
            croppedSize: {
                width: 365.79,
                height: 484
            },
            spacing: 40 // Exact spacing between images in pixels
        };
        
        this.text = {
            fontSize: 602.15, // Exact font size: 602.15px
            fontFamily: 'WixMadeforDisplay',
            fontWeight: 700, // Bold
            fontStyle: 'Bold',
            letterSpacing: 0, // 0% letter spacing
            lineHeight: 1, // 100% line height
            textTransform: 'uppercase',
            colors: {
                yellow: 'rgba(253, 255, 203, 1)',
                pink: 'rgba(220, 192, 255, 1)',
                brown: 'rgba(123, 66, 53, 1)'
            }
        };
        
        this.performance = {
            targetFPS: 60,
            currentFPS: 0,
            elementCount: 0
        };
        
        // WebSocket removed - using HTTP polling instead
    }
    
    updateStrip(id, property, value) {
        const strip = this.strips.find(s => s.id === id);
        if (strip) {
            strip[property] = value;
        }
    }
    
    updateZoom(property, value) {
        this.zoom[property] = value;
    }
    
    getAlternatingColor(index) {
        // Alternates between yellow and pink
        return index % 2 === 0 ? this.text.colors.yellow : this.text.colors.pink;
    }
    
    getRandomColor() {
        // For backwards compatibility, randomly choose yellow or pink
        return Math.random() < 0.5 ? this.text.colors.yellow : this.text.colors.pink;
    }
}


// Export as global
window.Config = Config;