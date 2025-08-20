# Sticker Animation Website - Design Document

## Project Overview
A dynamic website featuring three horizontal strips of animated stickers (images/letters) that move horizontally with configurable parameters. The system includes automatic image management from a local folder with real-time updates and periodic zoom animations.

## Core Features

### 1. Display Configuration
- **Resolution**: 4640 x 1760 (Ultra-wide 4K+ display)
- **Width/Height**: Fixed viewport for optimal sharpness
- **Layout**: Three horizontal strips optimized for ultra-wide format
- **Pixel Density**: High-DPI support for crisp, sharp rendering

### 2. Animation System
- **Movement**: Regular horizontal scrolling (left/right)
- **Independence**: Each element (letter/image) moves independently
- **Direction**: Configurable movement direction per strip
- **Speed**: Adjustable animation speed per strip
- **Loop Behavior**: Elements wrap around when reaching screen edges
- **Spacing**: Even distribution - letter, image, letter, image pattern

### 3. Image Management
- **Source**: Local folder path (configurable parameter)
- **File Types**: JPEG and PNG only
- **File Watching**: Check for new files every few minutes (configurable interval)
- **Queue System**: Maximum ~10 images total
- **Image Sizing**: Consistent size, automatically fitted to strip height
- **Cleanup**: Remove old images when they're off-screen, not while visible
- **Auto-update**: Dynamic image replacement when new files detected

### 4. Zoom Animation
- **Trigger**: Periodic zoom events (configurable frequency)
- **Target**: Random selection from visible elements
- **Animation**: Zoom in → zoom out → return to normal
- **Library**: p5.js or GSAP for smooth transitions
- **Parameters**: All zoom settings configurable via live UI

## Technical Architecture

### Frontend Framework
- **Technology**: HTML5 + CSS3 + JavaScript
- **Animation Libraries**: p5.js (primary) + GSAP (alternative)
- **3D Considerations**: Three.js for camera movements (if needed)
- **Browser Support**: Single browser PoC, no cross-browser compatibility needed

### Image Processing
- **File Formats**: JPEG and PNG only
- **Sizing**: Consistent size, automatically fitted to strip height
- **Quality**: Maintain original image quality for 4K+ sharpness
- **Caching**: Browser-level image caching for performance
- **High-DPI Support**: Optimized for ultra-wide 4640x1760 resolution
- **Sharp Rendering**: Ensure crisp image display on high-resolution screen

### File System Integration
- **Local Folder Monitoring**: File system watcher
- **Cross-platform**: macOS, Windows, Linux compatibility
- **Security**: Local file access only

## Parameter Configuration

### Public Parameters
```javascript
// Display
resolution: { width: 4640, height: 1760 } // Ultra-wide 4K+ display
viewport: { width: 4640, height: 1760 } // Full resolution support

// Animation
strip1: { direction: 'left'|'right', speed: number }
strip2: { direction: 'left'|'right', speed: number }
strip3: { direction: 'left'|'right', speed: number }

// Image Management
imageFolder: string
maxImages: number (default: ~10)
updateInterval: number (minutes, default: few minutes)
imageSize: { width: number, height: number }

// Zoom Animation
zoomFrequency: number
zoomDuration: number
zoomScale: number
zoomTarget: 'random' | 'sequential' | 'manual'

// Basic Tracking (PoC)
enablePositionTracking: boolean
enableZoomQualityMonitoring: boolean
```

## Component Structure

### 1. Main Controller
- Parameter management
- Animation loop coordination
- Event handling

### 2. Strip Manager
- Individual strip animation
- Element positioning (letters + images)
- Movement calculations with wrap-around
- Even spacing management (letter, image, letter, image pattern)
- **Basic Position Tracking**: Monitor which elements are on-screen
- **Simple Visibility**: Track element entry/exit from viewport

### 3. Image Manager
- Folder monitoring (configurable interval)
- Queue management (max ~10 images)
- Image loading/unloading
- Off-screen cleanup system
- Consistent image sizing
- **Basic On-Screen Tracking**: Monitor which images are visible
- **Simple Queue Status**: Track image loading and position

### 4. Animation Engine
- Zoom effects with configurable parameters
- Transition management
- Performance optimization
- Live parameter adjustment UI
- **Basic Position Tracking**: Monitor which images are currently visible
- **Simple Zoom Quality**: Basic performance monitoring
- **Element State**: Track basic position and visibility

## Performance Considerations

### Optimization Strategies
- **Image Preloading**: Load next few images in advance
- **Canvas Rendering**: Use HTML5 Canvas for smooth 4K+ animations
- **RequestAnimationFrame**: Optimized animation loop for high resolution
- **Memory Management**: Cleanup images when off-screen
- **Efficient File Checking**: Configurable update intervals
- **High-Resolution Optimization**: Optimized for 4640x1760 display
- **Sharp Rendering**: Maintain crisp quality during animations

### Basic Tracking (PoC)
- **Element Position Tracking**: Simple monitoring of which images are on-screen
- **Zoom Quality Check**: Basic frame rate monitoring for zoom animations
- **Performance Check**: Simple performance indicators
- **Memory Usage**: Basic memory monitoring for ~10 images
- **Resolution Support**: Optimized for 4640x1760 display

### Scalability
- **Max Image Limit**: ~10 images maximum
- **Efficient File Checking**: Configurable intervals (few minutes)
- **Consistent Image Sizing**: Prevents layout shifts
- **Off-screen Cleanup**: Maintains performance

## Browser Compatibility
- **Single Browser**: Designed for PoC in one browser
- **Modern Browser**: Chrome, Firefox, Safari, or Edge (latest version)
- **No Cross-browser**: Focus on single browser optimization
- **No Fallbacks**: Simplified compatibility requirements

## Security & Privacy
- **Local Files Only**: No external file access
- **No Data Collection**: Client-side processing only
- **File Type Validation**: Safe image format handling

## Future Enhancements
- **Audio Integration**: Sound effects for animations
- **Custom Animations**: User-defined animation patterns
- **Export Functionality**: Save animation sequences
- **Preset Configurations**: Pre-built parameter sets
