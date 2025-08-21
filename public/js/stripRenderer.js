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
        // Count actual photo images (large/cropped) in each strip pattern
        const stripPhotoCounts = this.config.strips.map(strip => {
            const photoCount = strip.pattern.filter(item => item === 'large' || item === 'cropped').length;
            return { stripId: strip.id, photoCount };
        });
        
        console.log('Photo counts per strip:', stripPhotoCounts);
        
        // Calculate total photos needed
        const totalPhotos = stripPhotoCounts.reduce((sum, strip) => sum + strip.photoCount, 0);
        console.log('Total photos needed:', totalPhotos);
        
        // Create an array of all 22 slot indices
        const allSlots = Array.from({ length: 22 }, (_, i) => i);
        
        // Shuffle the slots randomly
        for (let i = allSlots.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allSlots[i], allSlots[j]] = [allSlots[j], allSlots[i]];
        }
        
        // Distribute shuffled slots to strips based on actual photo counts
        this.imageSlotMapping = {};
        let currentIndex = 0;
        
        stripPhotoCounts.forEach(({ stripId, photoCount }) => {
            this.imageSlotMapping[stripId] = {
                slots: allSlots.slice(currentIndex, currentIndex + photoCount),
                count: photoCount
            };
            currentIndex += photoCount;
        });
        
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
        this.ctx.fillStyle = this.config.background.color;
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
        
        let imageSlotIndex = 0; // Track which slot to use for this strip
        
        // Create elements based on pattern
        for (let i = 0; i < pattern.length; i++) {
            const item = pattern[i];
            
            if (item === 'large' || item === 'cropped') {
                // Add photo image element
                const size = item === 'large' ? this.config.images.largeSize : this.config.images.croppedSize;
                
                // Get the global slot index from the randomly assigned slots
                const globalSlotIndex = this.slotMapping.slots[imageSlotIndex];
                
                const imageElement = {
                    type: 'photo',
                    imageType: item,
                    x: currentX,
                    width: size.width,
                    height: size.height,
                    slotIndex: globalSlotIndex // Store which slot this element uses
                };
                
                this.elements.push(imageElement);
                imageSlotIndex++;
                
                currentX += size.width + this.elementSpacing;
            } else if (item.type === 'letter') {
                // Add letter image element with predefined dimensions
                const letterDimensions = this.config.letters.dimensions[item.letter];
                const letterElement = {
                    type: 'letter',
                    letter: item.letter,
                    color: item.color,
                    x: currentX,
                    imagePath: `${this.config.letters.basePath}${item.letter}-${item.color}.png`,
                    image: null, // Will be loaded asynchronously
                    width: letterDimensions.width,
                    height: letterDimensions.height
                };
                
                this.elements.push(letterElement);
                
                currentX += letterElement.width + this.elementSpacing;
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
        // baseWidth already excludes trailing spacing, so we need to add elementSpacing between copies
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
        console.log(`  - Base width: ${this.baseWidth}px (without trailing spacing)`);
        console.log(`  - Copy spacing: ${this.baseWidth + this.elementSpacing}px (base + 40px gap)`);
        console.log(`  - Total width: ${this.totalWidth}px`);
        
        // Debug: show positions of first few elements of each copy
        if (copiesNeeded > 1) {
            const elementsPerCopy = originalElements.length;
            console.log(`  - First element copy 1: x=${this.elements[0].x}`);
            console.log(`  - First element copy 2: x=${this.elements[elementsPerCopy].x}`);
            console.log(`  - Last element copy 1: x=${this.elements[elementsPerCopy-1].x}, width=${this.elements[elementsPerCopy-1].width}`);
            console.log(`  - Gap between copies: ${this.elements[elementsPerCopy].x - (this.elements[elementsPerCopy-1].x + this.elements[elementsPerCopy-1].width)}px`);
        }
        
        // Load letter images
        this.loadLetterImages();
    }
    
    loadLetterImages() {
        const letterElements = this.elements.filter(el => el.type === 'letter');
        const uniqueImages = new Map();
        
        // Collect unique image paths
        letterElements.forEach(element => {
            if (!uniqueImages.has(element.imagePath)) {
                uniqueImages.set(element.imagePath, []);
            }
            uniqueImages.get(element.imagePath).push(element);
        });
        
        // Load each unique image (dimensions already set from config)
        uniqueImages.forEach((elements, imagePath) => {
            const img = new Image();
            img.onload = () => {
                // Just assign the loaded image - dimensions already set
                elements.forEach(element => {
                    element.image = img;
                });
                console.log(`Loaded letter image: ${imagePath}`);
            };
            img.onerror = () => {
                console.warn(`Failed to load letter image: ${imagePath}`);
            };
            img.src = imagePath;
        });
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
            } else if (element.type === 'photo') {
                // Get the current photo from the slot
                const imageInfo = this.imageManager.getImageByIndex(element.slotIndex);
                if (imageInfo) {
                    this.renderPhoto(ctx, element, imageInfo, centerY);
                }
            }
            
            renderedElements++;
        }
        
        ctx.restore();
        return renderedElements;
    }
    
    renderLetter(ctx, element, centerY) {
        // Render letter image
        if (element.image) {
            const x = element.x;
            const y = centerY - element.height / 2;
            
            // Draw the letter image at its natural size
            ctx.drawImage(element.image, x, y, element.width, element.height);
        }
        // No fallback needed - either the image renders or it doesn't
    }
    
    renderPhoto(ctx, element, imageInfo, centerY) {
        const imageY = centerY - element.height / 2;
        const x = element.x;
        const y = imageY;
        const width = element.width;
        const height = element.height;
        
        // Use the appropriate canvas based on image type
        const canvas = element.imageType === 'large' ? imageInfo.largeCanvas : imageInfo.croppedCanvas;
        
        // Draw the photo with rounded corners
        if (canvas) {
            const radius = 20; // Corner radius in pixels
            
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, radius);
            ctx.clip();
            ctx.drawImage(canvas, x, y, width, height);
            ctx.restore();
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