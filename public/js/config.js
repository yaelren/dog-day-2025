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
                text: 'WHO',
                direction: 'left',
                speed: 2,
                y: 0
            },
            {
                id: 2,
                text: 'OOOOOOOO',
                direction: 'right',
                speed: 2.5,
                y: 551
            },
            {
                id: 3,
                text: 'OF!',
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
            elementSize: {
                width: 400, // Exact image width in pixels
                height: 400 // Exact image height in pixels
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
        
        this.wsUrl = `ws://localhost:3000`;
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