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
    
    initStrips() {
        // Randomly distribute the 22 image slots among strips
        // Strip 1 needs 6 images, Strip 2 needs 8 images, Strip 3 needs 8 images
        
        // Create an array of all 22 slot indices
        const allSlots = Array.from({ length: 22 }, (_, i) => i);
        
        // Shuffle the slots randomly
        for (let i = allSlots.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allSlots[i], allSlots[j]] = [allSlots[j], allSlots[i]];
        }
        
        // Distribute shuffled slots to strips
        this.imageSlotMapping = {
            1: { slots: allSlots.slice(0, 6), count: 6 },     // Strip 1 gets 6 random slots
            2: { slots: allSlots.slice(6, 14), count: 8 },    // Strip 2 gets 8 random slots
            3: { slots: allSlots.slice(14, 22), count: 8 }    // Strip 3 gets 8 random slots
        };
        
        console.log('Random slot distribution:');
        console.log('Strip 1 slots:', this.imageSlotMapping[1].slots);
        console.log('Strip 2 slots:', this.imageSlotMapping[2].slots);
        console.log('Strip 3 slots:', this.imageSlotMapping[3].slots);
        
        this.strips = this.config.strips.map(stripConfig => {
            return new Strip(stripConfig, this.config, this.imageManager, this.imageSlotMapping[stripConfig.id]);
        });
    }
    
    updateImageSlots(imageSlots) {
        // When image slots are updated, refresh all strips
        for (const strip of this.strips) {
            strip.updateImages(imageSlots);
        }
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
}

// Individual strip class
class Strip {
    constructor(stripConfig, config, imageManager, slotMapping) {
        this.config = config;
        this.stripConfig = stripConfig;
        this.imageManager = imageManager;
        this.slotMapping = slotMapping; // Which image slots this strip uses
        
        this.elements = [];
        this.elementSpacing = this.config.images.spacing || 40;
        this.totalWidth = 0;
        
        this.initElements();
    }
    
    initElements() {
        // Build strip based on pattern array
        const pattern = this.stripConfig.pattern;
        let currentX = 0;
        
        console.log(`Initializing strip ${this.stripConfig.id} with pattern:`, pattern);
        console.log(`Using image slots:`, this.slotMapping.slots);
        
        let letterIndex = 0; // Track letter index for alternating colors
        let imageSlotIndex = 0; // Track which slot to use for this strip
        
        // Create elements based on pattern
        for (let i = 0; i < pattern.length; i++) {
            const item = pattern[i];
            
            if (item === 'large' || item === 'cropped') {
                // Add image element
                const size = item === 'large' ? this.config.images.largeSize : this.config.images.croppedSize;
                
                // Get the global slot index from the randomly assigned slots
                const globalSlotIndex = this.slotMapping.slots[imageSlotIndex];
                
                const imageElement = {
                    type: 'image',
                    imageType: item,
                    x: currentX,
                    width: size.width,
                    height: size.height,
                    slotIndex: globalSlotIndex // Store which slot this element uses
                };
                
                this.elements.push(imageElement);
                imageSlotIndex++;
                
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
        
        // Remove the extra spacing after the last element
        this.baseWidth = currentX - this.elementSpacing; // Store the original width without trailing space
        
        // Calculate how many copies we need for seamless scrolling
        const minTotalWidth = this.config.display.width * 2.5;
        const copiesNeeded = Math.max(2, Math.ceil(minTotalWidth / this.baseWidth));
        
        console.log(`Strip needs ${copiesNeeded} copies for seamless scrolling (base: ${this.baseWidth}px, target: ${minTotalWidth}px)`);
        
        // Store original elements before duplication
        const originalElements = [...this.elements];
        
        // Create multiple copies for seamless infinite scrolling
        // But images still reference the same slot indices
        for (let copy = 1; copy < copiesNeeded; copy++) {
            originalElements.forEach(element => {
                const duplicatedElement = {
                    ...element,
                    x: element.x + (this.baseWidth + this.elementSpacing) * copy
                };
                
                this.elements.push(duplicatedElement);
            });
        }
        
        this.totalWidth = (this.baseWidth + this.elementSpacing) * copiesNeeded - this.elementSpacing;
        
        console.log(`Strip ${this.stripConfig.id} initialized:`);
        console.log(`  - ${this.elements.length} total elements`);
        console.log(`  - ${this.slotMapping.count} unique image slots`);
        console.log(`  - Total width: ${this.totalWidth}px`);
    }
    
    calculateLetterWidth(letter) {
        // Create a temporary canvas to measure exact text width
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = `${this.config.text.fontWeight} ${this.config.text.fontSize}px "${this.config.text.fontFamily}", sans-serif`;
        
        const metrics = ctx.measureText(letter.toUpperCase());
        return metrics.width;
    }
    
    updateImages(imageSlots) {
        // Update called when image slots change
        // Elements already know their slot indices, so they'll automatically
        // display the updated content on next render
        this.currentImageSlots = imageSlots;
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
                    element.x += this.totalWidth;
                }
            } else {
                element.x += speed;
                
                // Wrap around when element goes off screen
                if (element.x > this.config.display.width + this.config.display.width / 2) {
                    element.x -= this.totalWidth;
                }
            }
        }
    }
    
    render(ctx) {
        let renderedElements = 0;
        
        ctx.save();
        
        for (const element of this.elements) {
            // Skip elements completely off screen
            if (element.x + element.width < -100 || element.x > this.config.display.width + 100) {
                continue;
            }
            
            const centerY = this.stripConfig.y + this.config.display.stripHeight / 2;
            
            if (element.type === 'letter') {
                this.renderLetter(ctx, element, centerY);
            } else if (element.type === 'image') {
                // Get the current image from the slot
                const imageInfo = this.imageManager.getImageByIndex(element.slotIndex);
                if (imageInfo) {
                    this.renderImage(ctx, element, imageInfo, centerY);
                }
            }
            
            renderedElements++;
        }
        
        ctx.restore();
        return renderedElements;
    }
    
    renderLetter(ctx, element, centerY) {
        // Apply exact font specifications - use quotes for font family with spaces
        ctx.font = `${this.config.text.fontWeight} ${this.config.text.fontSize}px "${this.config.text.fontFamily}", sans-serif`;
        ctx.letterSpacing = `${this.config.text.letterSpacing}px`;
        
        ctx.fillStyle = element.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Transform to uppercase as specified
        const text = element.content.toUpperCase();
        
        // Draw text without stroke/outline
        ctx.fillText(text, element.x + element.width / 2, centerY);
    }
    
    renderImage(ctx, element, imageInfo, centerY) {
        const imageY = centerY - element.height / 2;
        const x = element.x;
        const y = imageY;
        const width = element.width;
        const height = element.height;
        
        // Use the appropriate canvas based on image type
        const canvas = element.imageType === 'large' ? imageInfo.largeCanvas : imageInfo.croppedCanvas;
        
        // Draw the image directly
        if (canvas) {
            ctx.drawImage(canvas, x, y, width, height);
        }
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