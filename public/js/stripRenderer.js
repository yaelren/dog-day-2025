// Strip renderer for three ticker strips using Canvas API
class StripRenderer {
    constructor(config, imageManager) {
        this.config = config;
        this.imageManager = imageManager;
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.setupCanvas();
        this.initStrips();
        
        this.lastTime = 0;
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
    }
    
    setupCanvas() {
        // Set fixed canvas dimensions
        this.canvas.width = this.config.display.width;
        this.canvas.height = this.config.display.canvasHeight;
        
        // Canvas is scaled by the container, not internally
        this.scale = 1; // Always render at 1:1 scale
        
        // Smooth rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }
    
    updateCanvasSize() {
        // Fixed dimensions - no responsive scaling here
        // The entire layout is scaled by the scaler.js
        this.canvas.width = this.config.display.width;
        this.canvas.height = this.config.display.canvasHeight;
        this.scale = 1;
        
        // Set canvas size to actual design dimensions for internal calculations
        this.canvas.width = this.config.display.width;
        this.canvas.height = this.config.display.height;
        
        // Set CSS size to fit window
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';
        
        // Center the canvas horizontally, position below header
        this.canvas.style.left = (windowWidth - displayWidth) / 2 + 'px';
        this.canvas.style.top = '64px'; // Always 64px below top for header
        
        // Store scale for reference
        this.displayScale = scale;
        
        console.log(`Canvas scaled to ${displayWidth}x${displayHeight} (scale: ${scale.toFixed(2)})`);
        
        // Also scale text and image sizes based on display scale
        this.updateElementSizes();
        
        // Re-initialize strips with new sizes
        if (this.strips) {
            this.initStrips();
        }
    }
    
    updateElementSizes() {
        // Scale element sizes based on display scale
        const baseFontSize = 280;
        
        // Update config with scaled font size
        this.config.text.fontSize = baseFontSize * this.displayScale;
        
        // Scale image sizes
        this.config.images.largeSize.width *= this.displayScale;
        this.config.images.largeSize.height *= this.displayScale;
        this.config.images.croppedSize.width *= this.displayScale;
        this.config.images.croppedSize.height *= this.displayScale;
        
        console.log(`Scaled font size: ${this.config.text.fontSize.toFixed(0)}px`);
        console.log(`Scaled large image size: ${this.config.images.largeSize.width.toFixed(0)}x${this.config.images.largeSize.height.toFixed(0)}px`);
        console.log(`Scaled cropped image size: ${this.config.images.croppedSize.width.toFixed(0)}x${this.config.images.croppedSize.height.toFixed(0)}px`);
    }
    
    initStrips() {
        this.strips = this.config.strips.map(stripConfig => {
            return new Strip(stripConfig, this.config, this.imageManager);
        });
    }
    
    render(currentTime) {
        // Calculate FPS
        this.frameCount++;
        if (currentTime - this.lastFPSUpdate > 1000) {
            this.config.performance.currentFPS = Math.round(this.frameCount * 1000 / (currentTime - this.lastFPSUpdate));
            this.updateFPSDisplay();
            this.frameCount = 0;
            this.lastFPSUpdate = currentTime;
        }
        
        // Clear canvas with brown background
        this.ctx.fillStyle = this.config.text.colors.brown || 'rgba(123, 66, 53, 1)';
        this.ctx.fillRect(0, 0, this.config.display.width, this.config.display.canvasHeight);
        
        // Render each strip
        let totalElements = 0;
        for (const strip of this.strips) {
            strip.update(currentTime);
            totalElements += strip.render(this.ctx);
        }
        
        // Update element count
        this.config.performance.elementCount = totalElements;
        this.updateElementCount();
        
        this.lastTime = currentTime;
    }
    
    updateFPSDisplay() {
        const fpsElement = document.getElementById('fps');
        if (fpsElement) {
            fpsElement.textContent = this.config.performance.currentFPS;
        }
    }
    
    updateElementCount() {
        const countElement = document.getElementById('elementCount');
        if (countElement) {
            countElement.textContent = this.config.performance.elementCount;
        }
    }
    
    getElementAt(x, y) {
        // Find which strip and element is at the given coordinates
        for (const strip of this.strips) {
            const element = strip.getElementAt(x, y);
            if (element) return element;
        }
        return null;
    }
    
    handleNewImage(newImageInfo) {
        // Try to replace an off-screen image in one of the strips
        for (const strip of this.strips) {
            if (strip.replaceOffscreenImageWithNew(newImageInfo)) {
                return true; // Successfully replaced
            }
        }
        return false; // No off-screen slots available
    }
}

// Individual strip class
class Strip {
    constructor(stripConfig, config, imageManager) {
        this.config = config;
        this.stripConfig = stripConfig;
        this.imageManager = imageManager;
        
        this.elements = [];
        this.imageElements = []; // Keep track of image elements for swapping
        this.elementSpacing = this.config.images.spacing || 40; // Use exact spacing from config
        this.totalWidth = 0;
        
        // Track used images to prevent duplicates
        this.usedImages = new Set();
        
        this.initElements();
    }
    
    initElements() {
        // Build strip based on pattern array
        const pattern = this.stripConfig.pattern;
        let currentX = 0;
        
        console.log(`Initializing strip ${this.stripConfig.id} with pattern:`, pattern);
        console.log(`Available images: ${this.imageManager.config.images.queue.length}`);
        
        let letterIndex = 0; // Track letter index for alternating colors
        
        // Create elements based on pattern
        for (let i = 0; i < pattern.length; i++) {
            const item = pattern[i];
            
            if (item === 'large' || item === 'cropped') {
                // Add image element
                const size = item === 'large' ? this.config.images.largeSize : this.config.images.croppedSize;
                const imageElement = {
                    type: 'image',
                    imageType: item,
                    x: currentX,
                    width: size.width,
                    height: size.height,
                    imageInfo: null // Will be populated below
                };
                
                // Pre-load a unique image for this slot
                if (this.imageManager.config.images.queue.length > 0) {
                    imageElement.imageInfo = this.imageManager.getUniqueImage(item, this.usedImages);
                    if (imageElement.imageInfo?.filename) {
                        this.usedImages.add(imageElement.imageInfo.filename);
                    }
                }
                
                this.elements.push(imageElement);
                this.imageElements.push(imageElement); // Keep reference for swapping
                
                currentX += size.width + this.elementSpacing;
            } else {
                // Add letter element
                this.elements.push({
                    type: 'letter',
                    content: item.toUpperCase(),
                    x: currentX,
                    width: this.calculateLetterWidth(item),
                    height: this.config.display.stripHeight,
                    color: this.config.getAlternatingColor(letterIndex++)
                });
                
                currentX += this.calculateLetterWidth(item) + this.elementSpacing;
            }
        }
        
        this.baseWidth = currentX; // Store the original width
        
        // Calculate how many copies we need for seamless scrolling
        // We want at least 2.5x the display width to ensure no gaps
        const minTotalWidth = this.config.display.width * 2.5;
        const copiesNeeded = Math.max(2, Math.ceil(minTotalWidth / this.baseWidth));
        
        console.log(`Strip needs ${copiesNeeded} copies for seamless scrolling (base: ${this.baseWidth}px, target: ${minTotalWidth}px)`);
        
        // Store original elements before duplication
        const originalElements = [...this.elements];
        
        // Create multiple copies for seamless infinite scrolling
        for (let copy = 1; copy < copiesNeeded; copy++) {
            originalElements.forEach(element => {
                const duplicatedElement = {
                    ...element,
                    x: element.x + (this.baseWidth + this.elementSpacing * 2) * copy
                };
                
                this.elements.push(duplicatedElement);
                
                // If it's an image, add to imageElements array
                if (element.type === 'image') {
                    this.imageElements.push(duplicatedElement);
                }
            });
        }
        
        this.totalWidth = this.baseWidth * copiesNeeded;
        
        console.log(`Strip ${this.stripConfig.id} initialized:`);
        console.log(`  - ${this.elements.length} total elements`);
        console.log(`  - ${this.imageElements.length} image slots`);
        console.log(`  - Total width: ${this.totalWidth}px`);
    }
    
    calculateLetterWidth(letter) {
        // Create a temporary canvas to measure exact text width
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = `${this.config.text.fontWeight} ${this.config.text.fontSize}px ${this.config.text.fontFamily}`;
        
        const metrics = ctx.measureText(letter.toUpperCase());
        return metrics.width;
    }
    
    update(currentTime) {
        const speed = this.stripConfig.speed * (currentTime - (this.lastTime || currentTime)) / 1000 * 60;
        this.lastTime = currentTime;
        
        // Update element positions
        for (const element of this.elements) {
            if (this.stripConfig.direction === 'left') {
                element.x -= speed;
                
                // Wrap around when element goes off screen
                if (element.x + element.width < -this.config.display.width / 2) {
                    element.x += this.baseWidth + this.elementSpacing * 2;
                }
            } else {
                element.x += speed;
                
                // Wrap around when element goes off screen
                if (element.x > this.config.display.width + this.config.display.width / 2) {
                    element.x -= this.baseWidth + this.elementSpacing * 2;
                }
            }
        }
        
        // Images are now static - no periodic swapping
    }
    
    replaceOffscreenImageWithNew(newImageInfo) {
        // Find off-screen image elements that can be replaced
        const offscreenElements = this.imageElements.filter(element => {
            // Element is off-screen if it's completely outside the visible area
            return element.x + element.width < -100 || element.x > this.config.display.width + 100;
        });
        
        if (offscreenElements.length > 0) {
            // Pick a random off-screen element to replace
            const elementToReplace = offscreenElements[Math.floor(Math.random() * offscreenElements.length)];
            
            // Remove old image from used set if it exists
            if (elementToReplace.imageInfo?.filename) {
                this.usedImages.delete(elementToReplace.imageInfo.filename);
            }
            
            // Assign new image and mark as used
            elementToReplace.imageInfo = newImageInfo;
            if (newImageInfo?.filename) {
                this.usedImages.add(newImageInfo.filename);
            }
            
            console.log(`Replaced off-screen image with ${newImageInfo?.filename}`);
            return true;
        }
        
        return false; // No off-screen elements found
    }
    
    render(ctx) {
        let renderedElements = 0;
        
        ctx.save();
        
        // Debug: Log first few elements on first render
        if (renderedElements === 0 && this.elements.length > 0) {
            // console.log(`Strip ${this.stripConfig.id} rendering ${this.elements.length} elements. First element:`, this.elements[0]);
        }
        
        for (const element of this.elements) {
            // Skip elements completely off screen
            if (element.x + element.width < -100 || element.x > this.config.display.width + 100) {
                continue;
            }
            
            const centerY = this.stripConfig.y + this.config.display.stripHeight / 2;
            
            if (element.type === 'letter') {
                this.renderLetter(ctx, element, centerY);
            } else if (element.type === 'image' && element.imageInfo?.canvas) {
                this.renderImage(ctx, element, centerY);
            }
            
            renderedElements++;
        }
        
        ctx.restore();
        return renderedElements;
    }
    
    renderLetter(ctx, element, centerY) {
        // Apply exact font specifications
        ctx.font = `${this.config.text.fontWeight} ${this.config.text.fontSize}px ${this.config.text.fontFamily}`;
        ctx.letterSpacing = `${this.config.text.letterSpacing}px`;
        
        ctx.fillStyle = element.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Transform to uppercase as specified
        const text = element.content.toUpperCase();
        
        // Add text stroke for better visibility
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 4;
        ctx.strokeText(text, element.x + element.width / 2, centerY);
        ctx.fillText(text, element.x + element.width / 2, centerY);
    }
    
    renderImage(ctx, element, centerY) {
        const imageY = centerY - element.height / 2;
        const x = element.x;
        const y = imageY;
        const width = element.width;
        const height = element.height;
        
        // Draw the image directly (no rounded corners, no border)
        ctx.drawImage(element.imageInfo.canvas, x, y, width, height);
    }
    
    getElementAt(x, y) {
        // Check if coordinates are within this strip
        if (y < this.stripConfig.y || y > this.stripConfig.y + this.config.display.stripHeight) {
            return null;
        }
        
        // Find element at x coordinate
        for (const element of this.elements) {
            if (x >= element.x && x <= element.x + element.width) {
                return {
                    element: element,
                    strip: this.stripConfig,
                    centerX: element.x + element.width / 2,
                    centerY: this.stripConfig.y + this.config.display.stripHeight / 2
                };
            }
        }
        
        return null;
    }
}

// Export as global
window.StripRenderer = StripRenderer;