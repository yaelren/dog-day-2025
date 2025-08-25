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
  constructor(maxSize = 22) {
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
    );
    
    // Sort by modification time to get the most recent images
    const fileStats = await Promise.all(
      imageFiles.map(async (file) => {
        const filePath = path.join(IMAGE_DIRECTORY, file);
        const stats = await fs.stat(filePath);
        return { file, filePath, mtime: stats.mtime };
      })
    );
    
    // Sort by modification time (newest first) and take the most recent MAX_IMAGES
    const sortedFiles = fileStats
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, MAX_IMAGES);
    
    // Add to queue (oldest to newest so newest are at the end)
    for (const { filePath, file } of sortedFiles.reverse()) {
      imageQueue.add(filePath);
    }
    
    console.log(`Loaded ${sortedFiles.length} most recent images from ${imageFiles.length} total`);
    if (imageFiles.length > MAX_IMAGES) {
      console.log(`Note: Folder contains ${imageFiles.length} images but only loading the ${MAX_IMAGES} most recent`);
    }
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
  
  // Track known files to detect new ones even if events don't fire properly
  const knownFiles = new Set();
  const currentImages = imageQueue.getAll();
  currentImages.forEach(img => knownFiles.add(path.basename(img.path)));

  watcher = chokidar.watch(IMAGE_DIRECTORY, {
    ignored: [
      /(^|[\/\\])\../, // ignore dotfiles
      /\.tmp$/, // ignore temp files
      /~\$/, // ignore temporary Office files
      /\.crdownload$/, // ignore Chrome downloads
      /desktop\.ini/ // ignore Windows system files
    ],
    persistent: true,
    usePolling: true, // Essential for Google Drive
    interval: 3000, // Check every 3 seconds for faster detection
    awaitWriteFinish: {
      stabilityThreshold: 2000, // Wait for file to be stable for 2 seconds
      pollInterval: 500 // Check every 500ms during stabilization
    },
    ignoreInitial: true
  });

  console.log(`File watcher started - checking Google Drive folder every 3 seconds`);
  
  // Periodic rescan to catch any missed files (important for Google Drive)
  setInterval(async () => {
    try {
      const files = await fs.readdir(IMAGE_DIRECTORY);
      const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png)$/i.test(file) && !knownFiles.has(file)
      );
      
      for (const file of imageFiles) {
        const filePath = path.join(IMAGE_DIRECTORY, file);
        knownFiles.add(file);
        imageQueue.add(filePath);
        console.log(`[${new Date().toLocaleTimeString()}] Found new image during rescan: ${file}`);
      }
      
      console.log(`[${new Date().toLocaleTimeString()}] Periodic scan - ${imageQueue.getAll().length}/${MAX_IMAGES} images in queue`);
    } catch (error) {
      console.error('Error during periodic scan:', error);
    }
  }, 15000); // Rescan every 15 seconds

  watcher
    .on('add', (filePath) => {
      if (/\.(jpg|jpeg|png)$/i.test(filePath)) {
        const filename = path.basename(filePath);
        if (!knownFiles.has(filename)) {
          knownFiles.add(filename);
          const imageInfo = imageQueue.add(filePath);
          console.log(`[${new Date().toLocaleTimeString()}] New image detected: ${filename}`);
        }
      }
    })
    .on('change', (filePath) => {
      // Google Drive might trigger 'change' instead of 'add' for new files
      if (/\.(jpg|jpeg|png)$/i.test(filePath)) {
        const filename = path.basename(filePath);
        if (!knownFiles.has(filename)) {
          knownFiles.add(filename);
          const imageInfo = imageQueue.add(filePath);
          console.log(`[${new Date().toLocaleTimeString()}] New image detected (via change event): ${filename}`);
        }
      }
    })
    .on('ready', () => {
      console.log(`[${new Date().toLocaleTimeString()}] Initial scan complete. Monitoring Google Drive folder...`);
    })
    .on('raw', (event, path, details) => {
      // Log when polling checks occur (only in verbose mode)
      if (process.env.VERBOSE === 'true' && event === 'scan') {
        console.log(`[${new Date().toLocaleTimeString()}] Polling Google Drive folder...`);
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