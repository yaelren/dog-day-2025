// Image loading and management system with FIFO replacement
class ImageManager {
    constructor(config) {
        this.config = config;
        this.pollingInterval = 3000; // Poll every 3 seconds
        
        // Track all 22 image slots with their current content
        this.imageSlots = new Array(22).fill(null);
        this.realImagesQueue = []; // FIFO queue of real images (not placeholders)
        this.nextSlotToReplace = 0; // Track which slot to replace next
        
        this.startPolling();
    }
    
    async startPolling() {
        // Load placeholder images first
        await this.loadPlaceholders();
        
        // Then start checking for real images
        this.fetchImages();
        this.updateUI();
        
        // Set up polling interval
        setInterval(() => {
            this.fetchImages();
        }, this.pollingInterval);
    }
    
    async loadPlaceholders() {
        try {
            // Load placeholder images from /api/placeholders endpoint
            const response = await fetch('/api/placeholders');
            const data = await response.json();
            
            
            // Load up to 22 placeholders
            const placeholdersToLoad = data.images.slice(0, 22);
            
            for (let i = 0; i < Math.min(22, placeholdersToLoad.length); i++) {
                const imageInfo = placeholdersToLoad[i];
                const processed = await this.loadImage(imageInfo, true); // true = isPlaceholder
                this.imageSlots[i] = processed;
            }
            
            // If we have fewer than 22 placeholders, fill remaining with duplicates
            if (placeholdersToLoad.length < 22 && placeholdersToLoad.length > 0) {
                for (let i = placeholdersToLoad.length; i < 22; i++) {
                    const imageInfo = placeholdersToLoad[i % placeholdersToLoad.length];
                    const processed = await this.loadImage(imageInfo, true);
                    this.imageSlots[i] = processed;
                }
            }
            this.updateImageCount();
            
        } catch (error) {
            console.error('Failed to load placeholders:', error);
            // Fill with empty slots if placeholders fail
            for (let i = 0; i < 22; i++) {
                if (!this.imageSlots[i]) {
                    this.imageSlots[i] = null;
                }
            }
        }
    }
    
    async fetchImages() {
        try {
            const response = await fetch('/api/images');
            const data = await response.json();
            
            // Check for new real images
            const newImages = data.images.filter(img => 
                !this.realImagesQueue.some(existing => existing.filename === img.filename)
            );
            
            if (newImages.length > 0) {
                
                for (const imageInfo of newImages) {
                    await this.handleNewRealImage(imageInfo);
                }
            }
            
        } catch (error) {
            console.error('Failed to fetch images:', error);
        }
    }
    
    async handleNewRealImage(imageInfo) {
        
        // Load the new image
        const processedImage = await this.loadImage(imageInfo, false); // false = not placeholder
        
        // Add to real images queue
        this.realImagesQueue.push(processedImage);
        
        // Replace the next slot in rotation
        const slotToReplace = this.nextSlotToReplace;
        const oldImage = this.imageSlots[slotToReplace];
        
        
        // Update the slot with new image
        this.imageSlots[slotToReplace] = processedImage;
        
        // Move to next slot for next replacement (circular)
        this.nextSlotToReplace = (this.nextSlotToReplace + 1) % 22;
        
        // If we've replaced all 22 slots and this is the 23rd+ image, 
        // remove the oldest real image from queue (FIFO)
        if (this.realImagesQueue.length > 22) {
            const removedImage = this.realImagesQueue.shift();
        }
        
        // Notify strip renderer to update
        if (window.stripRenderer) {
            window.stripRenderer.updateImageSlots(this.imageSlots);
        }
        
        this.updateImageCount();
    }
    
    async loadImage(imageInfo, isPlaceholder = false) {
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
                    isPlaceholder: isPlaceholder,
                    processedAt: Date.now()
                };
                
                resolve(processedImageInfo);
            };
            
            img.onerror = () => {
                console.error(`Failed to load image: ${imageInfo.filename}`);
                reject(new Error(`Failed to load image: ${imageInfo.filename}`));
            };
            
            // Use appropriate endpoint based on image type
            const endpoint = isPlaceholder ? 'placeholders' : 'images';
            img.src = `/${endpoint}/${encodeURIComponent(imageInfo.filename)}`;
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
    
    // Get all current images for initial strip setup
    getAllImages() {
        return this.imageSlots.filter(slot => slot !== null);
    }
    
    // Get image by index (for strips to access specific slots)
    getImageByIndex(index) {
        if (index >= 0 && index < 22) {
            return this.imageSlots[index];
        }
        return null;
    }
    
    refreshImages() {
        // Force a fetch
        this.fetchImages();
    }
    
    updateImageCount() {
        const countElement = document.getElementById('imageCount');
        if (countElement) {
            // Count real images (not placeholders)
            const realImageCount = this.imageSlots.filter(slot => slot && !slot.isPlaceholder).length;
            countElement.textContent = realImageCount;
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
            
            // Update max images (always 22 now)
            const maxElement = document.getElementById('maxImages');
            if (maxElement) {
                maxElement.textContent = '22';
            }
        } catch (error) {
            console.error('Failed to fetch config:', error);
        }
    }
}

// Export as global
window.ImageManager = ImageManager;