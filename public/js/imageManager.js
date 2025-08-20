// Image loading and management system
class ImageManager {
    constructor(config) {
        this.config = config;
        this.pollingInterval = 3000; // Poll every 3 seconds
        this.lastImageCount = 0;
        
        this.startPolling();
    }
    
    startPolling() {
        // Load initial images and config
        this.fetchImages();
        this.updateUI();
        
        // Set up polling interval
        setInterval(() => {
            this.fetchImages();
        }, this.pollingInterval);
    }
    
    async fetchImages() {
        try {
            const response = await fetch('/api/images');
            const data = await response.json();
            
            if (data.images.length !== this.lastImageCount) {
                if (this.lastImageCount === 0) {
                    // Initial load
                    await this.loadInitialImages(data.images);
                } else if (data.images.length > this.lastImageCount) {
                    // New images added
                    const newImages = data.images.slice(this.lastImageCount);
                    for (const imageInfo of newImages) {
                        await this.handleNewImage(imageInfo);
                    }
                } else if (data.images.length < this.lastImageCount) {
                    // Images were cleared
                    this.clearImages();
                    await this.loadInitialImages(data.images);
                }
                
                this.lastImageCount = data.images.length;
                this.updateImageCount();
            }
        } catch (error) {
            console.error('Failed to fetch images:', error);
        }
    }
    
    async handleNewImage(imageInfo) {
        console.log(`New image detected: ${imageInfo.filename}`);
        
        // Load the new image
        const processedImageInfo = await this.loadImage(imageInfo);
        
        // Notify strip renderer to replace an off-screen image
        if (window.stripRenderer) {
            window.stripRenderer.handleNewImage(processedImageInfo);
        }
    }
    
    async loadInitialImages(images) {
        console.log(`Loading ${images.length} initial images`);
        
        for (const imageInfo of images) {
            await this.loadImage(imageInfo);
        }
        
        this.updateImageCount();
    }
    
    // Method removed - replaced by handleNewImage
    
    async loadImage(imageInfo) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                // Create both large and cropped versions
                const largeCanvas = this.createImageCanvas(img, this.config.images.largeSize);
                const croppedCanvas = this.createImageCanvas(img, this.config.images.croppedSize);
                
                // Store processed image data with both versions
                const processedImageInfo = {
                    ...imageInfo,
                    largeCanvas: largeCanvas,
                    croppedCanvas: croppedCanvas,
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
            
            // Use relative URL to current server for images
            img.src = `/images/${encodeURIComponent(imageInfo.filename)}`;
        });
    }
    
    createImageCanvas(img, targetSize) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = targetSize.width;
        canvas.height = targetSize.height;
        
        // Calculate scaling to crop and fit
        const imgAspect = img.width / img.height;
        const canvasAspect = targetSize.width / targetSize.height;
        
        let sourceWidth, sourceHeight, sourceX, sourceY;
        
        if (imgAspect > canvasAspect) {
            // Image is wider - crop horizontally
            sourceHeight = img.height;
            sourceWidth = img.height * canvasAspect;
            sourceX = (img.width - sourceWidth) / 2;
            sourceY = 0;
        } else {
            // Image is taller - crop vertically
            sourceWidth = img.width;
            sourceHeight = img.width / canvasAspect;
            sourceX = 0;
            sourceY = (img.height - sourceHeight) / 2;
        }
        
        // Draw cropped and scaled image to fill entire canvas
        ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetSize.width, targetSize.height);
        
        return canvas;
    }
    
    clearImages() {
        this.config.images.queue = [];
        this.config.images.loaded.clear();
        this.updateImageCount();
    }
    
    refreshImages() {
        // Force a fetch
        this.fetchImages();
    }
    
    getRandomImage(size = 'large') {
        if (this.config.images.queue.length === 0) return null;
        const imageInfo = this.config.images.queue[Math.floor(Math.random() * this.config.images.queue.length)];
        return {
            ...imageInfo,
            canvas: size === 'large' ? imageInfo.largeCanvas : imageInfo.croppedCanvas,
            size: size
        };
    }
    
    getUniqueImage(size = 'large', usedImages = new Set()) {
        if (this.config.images.queue.length === 0) return null;
        
        // Filter out already used images
        const availableImages = this.config.images.queue.filter(img => !usedImages.has(img.filename));
        
        // If all images are used, fall back to any image
        const imagePool = availableImages.length > 0 ? availableImages : this.config.images.queue;
        const imageInfo = imagePool[Math.floor(Math.random() * imagePool.length)];
        
        return {
            ...imageInfo,
            canvas: size === 'large' ? imageInfo.largeCanvas : imageInfo.croppedCanvas,
            size: size
        };
    }
    
    updateImageCount() {
        const countElement = document.getElementById('imageCount');
        if (countElement) {
            countElement.textContent = this.config.images.queue.length;
        }
    }
    
    async updateUI() {
        try {
            const response = await fetch('/api/config');
            const serverConfig = await response.json();
            
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
        } catch (error) {
            console.error('Failed to fetch config:', error);
        }
    }
}

// Export as global
window.ImageManager = ImageManager;