const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Configuration
const PORT = process.env.PORT || 3000;
const IMAGE_DIRECTORY = process.env.IMAGE_DIRECTORY || './images';
const MAX_IMAGES = parseInt(process.env.MAX_IMAGES) || 10;
const WATCH_INTERVAL = parseInt(process.env.WATCH_INTERVAL) || 60000;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/images', express.static(IMAGE_DIRECTORY));

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

// File watcher setup
let watcher;
function setupFileWatcher() {
  if (watcher) watcher.close();
  
  watcher = chokidar.watch(IMAGE_DIRECTORY, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    interval: WATCH_INTERVAL,
    usePolling: true, // Use polling for network drives
    ignoreInitial: true
  });

  watcher
    .on('add', (filePath) => {
      if (/\.(jpg|jpeg|png)$/i.test(filePath)) {
        const imageInfo = imageQueue.add(filePath);
        console.log(`New image added: ${path.basename(filePath)}`);
        
        // Notify all connected clients
        broadcast({
          type: 'newImage',
          image: imageInfo,
          queue: imageQueue.getAll()
        });
      }
    })
    .on('error', error => console.error(`Watcher error: ${error}`));
}

// WebSocket connection handling
function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', async (ws) => {
  console.log('New WebSocket connection');
  
  // Send initial images to new connection
  const images = imageQueue.getAll();
  ws.send(JSON.stringify({
    type: 'initialImages',
    images: images,
    config: {
      maxImages: MAX_IMAGES,
      watchInterval: WATCH_INTERVAL,
      displayWidth: process.env.DISPLAY_WIDTH,
      displayHeight: process.env.DISPLAY_HEIGHT
    }
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch(data.type) {
        case 'getImages':
          ws.send(JSON.stringify({
            type: 'images',
            images: imageQueue.getAll()
          }));
          break;
          
        case 'clearQueue':
          imageQueue.clear();
          broadcast({
            type: 'queueCleared',
            images: []
          });
          break;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

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
    watchInterval: WATCH_INTERVAL,
    displayWidth: process.env.DISPLAY_WIDTH || 4640,
    displayHeight: process.env.DISPLAY_HEIGHT || 1760
  });
});

// Start server
async function startServer() {
  await loadInitialImages();
  setupFileWatcher();
  
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Watching directory: ${IMAGE_DIRECTORY}`);
    console.log(`Max images: ${MAX_IMAGES}`);
    console.log(`Check interval: ${WATCH_INTERVAL}ms`);
  });
}

startServer().catch(console.error);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  if (watcher) watcher.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});