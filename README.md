# Sticker Animation Website - Dog Day 2025

A dynamic website featuring three horizontal strips of animated elements (letters + images) that move horizontally with configurable parameters. Designed for ultra-wide displays (4640x1760) with smooth animations and real-time parameter adjustment.

**🚀 Now 100% Frontend - No Server Required!**

## Features

- **Three Animated Strips**: Each strip moves independently with configurable speed and direction
- **Mixed Content**: Alternating pattern of letters and images
- **Zoom Effects**: Periodic zoom animations on random elements
- **Live Parameter UI**: Real-time adjustment of all animation parameters during development
- **Image Management**: Select images directly from your computer using file picker
- **High-Resolution Support**: Optimized for 4640x1760 ultra-wide displays
- **Performance Tracking**: Basic monitoring of FPS and on-screen elements

## Quick Start

### 1. Open the Website
Simply open `public/index.html` in your browser, or use any local server.

### 2. Add Images
Click the **"Select Images"** button to choose images from your computer.

### 3. Enjoy the Animation
Watch your three strips animate with the text and images you've selected!

## Project Structure

```
sticker-animation-website/
├── public/                 # Frontend files
│   ├── js/                # JavaScript modules
│   │   ├── config.js      # Configuration management
│   │   ├── font-manager.js # Font loading and management
│   │   ├── image-manager.js # Image loading and management
│   │   ├── strip-manager.js # Individual strip animation
│   │   ├── zoom-manager.js # Zoom effect management
│   │   ├── main-controller.js # Main animation controller
│   │   └── ui-controller.js # Development UI management
│   ├── index.html         # Main HTML file
│   └── styles.css         # Styling for development UI
└── README.md              # This file
```

## Configuration

### Strip Settings
- **Text**: Custom text for each strip (default: "Strike", "A", "Pause")
- **Direction**: Left or right movement
- **Speed**: Animation speed (1-10)

### Zoom Animation
- **Frequency**: How often zoom effects occur (3-20 seconds)
- **Duration**: How long each zoom lasts (1-5 seconds)
- **Scale**: Maximum zoom level (1.2x - 3x)

### Image Management
- **Select Images**: Choose images from your computer
- **Clear Images**: Remove all current images
- **Max Images**: Maximum number of images to keep in memory (5-20)

## Development Controls

### Live UI
- **Toggle UI**: Click "Hide UI" button to hide development controls
- **Real-time Updates**: All parameter changes take effect immediately
- **Performance Metrics**: Live FPS and element counters

### Image Controls
- **Select Images**: Opens file picker to select images
- **Clear Images**: Removes all current images
- **Image Count**: Shows how many images are loaded

### Keyboard Shortcuts
- `Ctrl/Cmd + H`: Toggle development UI
- `Ctrl/Cmd + P`: Pause/Resume animation
- `Ctrl/Cmd + R`: Reset all strips
- `Ctrl/Cmd + Z`: Force zoom effect

## Adding Images

1. **Click "Select Images"** button in the development UI
2. **Choose images** from your computer (JPEG, PNG supported)
3. **Images appear automatically** in the animation strips
4. **Use "Clear Images"** to remove all images

## Custom Fonts

To use custom fonts:
1. Upload font files through the font manager
2. Fonts are automatically loaded and applied to strips
3. Fallback to system fonts if custom fonts fail to load

## Performance

- **Target Resolution**: 4640x1760 (ultra-wide)
- **Animation**: 60fps target using p5.js
- **Memory Management**: Automatic cleanup of off-screen elements
- **Image Optimization**: Consistent sizing and efficient loading

## Browser Support

- **Primary**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Focus**: Single browser PoC optimization
- **Requirements**: HTML5 Canvas, ES6+ support

## Deployment

### Local Development
Simply open `public/index.html` in your browser.

### GitHub Pages
Copy the `public/` folder contents to a GitHub Pages repository.

### Any Web Server
The application works with any static file server.

## Troubleshooting

### Common Issues

1. **Images not loading**: Make sure to click "Select Images" and choose valid image files
2. **Low FPS**: Reduce number of images or animation complexity
3. **UI not responding**: Check browser console for JavaScript errors
4. **Font not loading**: Ensure font file is valid and accessible

### Debug Mode
Enable tracking in the configuration to see:
- Element boundaries (red rectangles)
- Letter positions (green rectangles)
- Image positions (blue rectangles)

## Future Enhancements

- **Audio Integration**: Sound effects for animations
- **3D Effects**: Three.js camera movements
- **Export Functionality**: Save animation sequences
- **Preset Configurations**: Pre-built parameter sets

## License

MIT License - see LICENSE file for details.

## Support

For issues or questions, check the browser console for detailed logging and error messages.
