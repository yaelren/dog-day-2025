// Image loading and management system
class ImageManager {
    constructor(config) {
        this.config = config;
        this.ws = null;
        this.reconnectInterval = 5000;
        this.maxReconnectAttempts = 5;
        this.reconnectAttempts = 0;
        
        this.initWebSocket();
    }
    
    initWebSocket() {
        try {
            this.ws = new WebSocket(this.config.wsUrl);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
            };
            
            this.ws.onmessage = (event) => {
                this.handleMessage(JSON.parse(event.data));
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.attemptReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this.attemptReconnect();
        }
    }
    
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.initWebSocket(), this.reconnectInterval);
        }
    }
    
    handleMessage(data) {
        switch(data.type) {
            case 'initialImages':
                this.loadInitialImages(data.images);
                this.updateUI(data.config);
                break;
                
            case 'newImage':
                this.addNewImage(data.image);
                this.updateImageCount();
                break;
                
            case 'queueCleared':
                this.clearImages();
                break;
        }
    }
    
    async loadInitialImages(images) {
        console.log(`Loading ${images.length} initial images`);
        
        for (const imageInfo of images) {
            await this.loadImage(imageInfo);
        }
        
        this.updateImageCount();
    }
    
    async addNewImage(imageInfo) {
        console.log(`Adding new image: ${imageInfo.filename}`);
        
        // Remove oldest if at capacity
        if (this.config.images.queue.length >= this.config.images.maxCount) {
            const oldest = this.config.images.queue.shift();
            this.config.images.loaded.delete(oldest.filename);
        }
        
        await this.loadImage(imageInfo);
    }
    
    async loadImage(imageInfo) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                // Create canvas for consistent sizing
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const { width, height } = this.config.images.elementSize;
                canvas.width = width;
                canvas.height = height;
                
                // Calculate aspect ratio and center the image
                const imgAspect = img.width / img.height;
                const canvasAspect = width / height;
                
                let drawWidth, drawHeight, drawX, drawY;
                
                if (imgAspect > canvasAspect) {
                    // Image is wider than canvas
                    drawHeight = height;
                    drawWidth = height * imgAspect;
                    drawX = (width - drawWidth) / 2;
                    drawY = 0;
                } else {
                    // Image is taller than canvas
                    drawWidth = width;
                    drawHeight = width / imgAspect;
                    drawX = 0;
                    drawY = (height - drawHeight) / 2;
                }
                
                // Fill background with dark color
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(0, 0, width, height);
                
                // Draw image
                ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                
                // Store processed image data
                const processedImageInfo = {
                    ...imageInfo,
                    canvas: canvas,
                    processedAt: Date.now()
                };
                
                this.config.images.queue.push(processedImageInfo);
                this.config.images.loaded.set(imageInfo.filename, processedImageInfo);
                
                resolve(processedImageInfo);
            };
            
            img.onerror = () => {
                console.error(`Failed to load image: ${imageInfo.filename}`);
                reject(new Error(`Failed to load image: ${imageInfo.filename}`));
            };
            
            // Use absolute URL to backend server for images
            img.src = `http://localhost:3000/images/${encodeURIComponent(imageInfo.filename)}`;
        });
    }
    
    clearImages() {
        this.config.images.queue = [];
        this.config.images.loaded.clear();
        this.updateImageCount();
    }
    
    refreshImages() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'getImages' }));
        }
    }
    
    getRandomImage() {
        if (this.config.images.queue.length === 0) return null;
        return this.config.images.queue[Math.floor(Math.random() * this.config.images.queue.length)];
    }
    
    updateImageCount() {
        const countElement = document.getElementById('imageCount');
        if (countElement) {
            countElement.textContent = this.config.images.queue.length;
        }
    }
    
    updateUI(serverConfig) {
        if (serverConfig) {
            // Update watch folder display
            const folderElement = document.getElementById('watchFolder');
            if (folderElement) {
                folderElement.textContent = serverConfig.imageDirectory;
            }
            
            // Update max images
            const maxElement = document.getElementById('maxImages');
            if (maxElement) {
                maxElement.textContent = serverConfig.maxImages;
            }
        }
    }
}

// Export as global
window.ImageManager = ImageManager;