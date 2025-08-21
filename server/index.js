const express = require('express');
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');
require('dotenv').config();

const app = express();

// Configuration
const PORT = process.env.PORT || 3000;
const IMAGE_DIRECTORY = process.env.IMAGE_DIRECTORY || './images';
const MAX_IMAGES = parseInt(process.env.MAX_IMAGES) || 10;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/images', express.static(IMAGE_DIRECTORY));
app.use('/placeholders', express.static(path.join(__dirname, '../placeholders')));

// Image queue management
class ImageQueue {
  constructor(maxSize = 10) {
    this.queue = [];
    this.maxSize = maxSize;
  }

  add(imagePath) {
    // Add new image and remove oldest if queue is full
    if (this.queue.length >= this.maxSize) {
      this.queue.shift(); // Remove oldest
    }
    
    const imageInfo = {
      path: imagePath,
      filename: path.basename(imagePath),
      timestamp: Date.now()
    };
    
    this.queue.push(imageInfo);
    return imageInfo;
  }

  getAll() {
    return this.queue;
  }

  clear() {
    this.queue = [];
  }
}

const imageQueue = new ImageQueue(MAX_IMAGES);

// Load initial images
async function loadInitialImages() {
  try {
    const files = await fs.readdir(IMAGE_DIRECTORY);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png)$/i.test(file)
    ).slice(0, MAX_IMAGES);

    for (const file of imageFiles) {
      imageQueue.add(path.join(IMAGE_DIRECTORY, file));
    }
    
    console.log(`Loaded ${imageFiles.length} initial images`);
    return imageQueue.getAll();
  } catch (error) {
    console.error('Error loading initial images:', error);
    return [];
  }
}

// File watcher setup - simplified without WebSocket broadcasting
let watcher;
function setupFileWatcher() {
  if (watcher) watcher.close();
  
  watcher = chokidar.watch(IMAGE_DIRECTORY, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    usePolling: true, // Use polling for network drives
    ignoreInitial: true
  });

  watcher
    .on('add', (filePath) => {
      if (/\.(jpg|jpeg|png)$/i.test(filePath)) {
        const imageInfo = imageQueue.add(filePath);
        console.log(`New image added: ${path.basename(filePath)}`);
      }
    })
    .on('error', error => console.error(`Watcher error: ${error}`));
}

// Simplified - no WebSocket handling needed

// API endpoints
app.get('/api/images', (req, res) => {
  res.json({
    images: imageQueue.getAll(),
    maxImages: MAX_IMAGES
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    imageDirectory: IMAGE_DIRECTORY,
    maxImages: MAX_IMAGES,
    displayWidth: process.env.DISPLAY_WIDTH || 4640,
    displayHeight: process.env.DISPLAY_HEIGHT || 1760
  });
});

// API endpoint for placeholder images
app.get('/api/placeholders', async (req, res) => {
  try {
    const placeholderDir = path.join(__dirname, '../placeholders');
    const files = await fs.readdir(placeholderDir);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png)$/i.test(file)
    );
    
    const placeholders = imageFiles.map(filename => ({
      filename: filename,
      path: path.join(placeholderDir, filename),
      isPlaceholder: true
    }));
    
    res.json({
      images: placeholders,
      count: placeholders.length
    });
  } catch (error) {
    console.error('Error loading placeholder images:', error);
    res.json({ images: [], count: 0 });
  }
});

app.post('/api/clear', (req, res) => {
  imageQueue.clear();
  res.json({ success: true, images: [] });
});

// Start server
async function startServer() {
  await loadInitialImages();
  setupFileWatcher();
  
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Watching directory: ${IMAGE_DIRECTORY}`);
    console.log(`Max images: ${MAX_IMAGES}`);
  });
}

startServer().catch(console.error);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  if (watcher) watcher.close();
  process.exit(0);
});