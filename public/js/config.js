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
                pattern: [
                    'large',
                    { type: 'letter', letter: 'W', color: 'Yellow' },
                    'large',
                    { type: 'letter', letter: 'H', color: 'Purple' },
                    'large',
                    { type: 'letter', letter: 'O', color: 'Yellow' },
                    'large',
                    { type: 'letter', letter: 'W', color: 'Yellow' },
                    'large',
                    { type: 'letter', letter: 'H', color: 'Purple' },
                    'large',
                    { type: 'letter', letter: 'O', color: 'Yellow' }
                ],
                direction: 'left',
                speed: 2,
                y: 0
            },
            {
                id: 2,
                pattern: [
                    { type: 'letter', letter: 'O', color: 'Yellow' },
                    'cropped',
                    'large',
                    { type: 'letter', letter: 'O', color: 'Purple' },
                    'large',
                    { type: 'letter', letter: 'O', color: 'Yellow' },
                    'cropped',
                    { type: 'letter', letter: 'O', color: 'Purple' },
                    'cropped',
                    'large',
                    { type: 'letter', letter: 'O', color: 'Yellow' },
                    'large',
                    { type: 'letter', letter: 'O', color: 'Purple' },
                    'cropped'
                ],
                direction: 'right',
                speed: 2.5,
                y: 551
            },
            {
                id: 3,
                pattern: [
                    'large',
                    { type: 'letter', letter: 'O', color: 'Yellow' },
                    'cropped',
                    'large',
                    { type: 'letter', letter: 'F', color: 'Purple' },
                    'large',
                    { type: 'letter', letter: '!', color: 'Yellow' },
                    'large',
                    { type: 'letter', letter: 'O', color: 'Purple' },
                    'cropped',
                    'large',
                    { type: 'letter', letter: 'F', color: 'Purple' },
                    'large',
                    { type: 'letter', letter: '!', color: 'Yellow' }
                ],
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
        
        this.letters = {
            basePath: 'assets/letters/',
            dimensions: {
                'W': { width: 646, height: 484 },
                'H': { width: 454, height: 484 },
                'O': { width: 521, height: 484 },
                'F': { width: 357, height: 484 },
                '!': { width: 158, height: 484 }
            }
        };
        
        this.background = {
            color: 'rgba(123, 66, 53, 1)' // Brown background
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
    
}


// Export as global
window.Config = Config;