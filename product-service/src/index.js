require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const productRoutes = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 3002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/productdb';

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'product-service', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/products', productRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[PRODUCT-SERVICE ERROR] ${err.stack}`);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    service: 'product-service'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', service: 'product-service' });
});

// Connect to MongoDB and start server
const connectWithRetry = async () => {
  const maxRetries = 10;
  let retries = 0;
  while (retries < maxRetries) {
    try {
      await mongoose.connect(MONGO_URI);
      console.log(`[PRODUCT-SERVICE] Connected to MongoDB at ${MONGO_URI}`);

      // Seed initial products if collection is empty
      const Product = require('./models/Product');
      const count = await Product.countDocuments();
      if (count === 0) {
        await seedProducts(Product);
      }

      app.listen(PORT, () => {
        console.log(`[PRODUCT-SERVICE] Running on port ${PORT}`);
      });
      return;
    } catch (err) {
      retries++;
      console.error(`[PRODUCT-SERVICE] MongoDB connection failed (attempt ${retries}/${maxRetries}): ${err.message}`);
      if (retries < maxRetries) {
        console.log(`[PRODUCT-SERVICE] Retrying in 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  console.error('[PRODUCT-SERVICE] Failed to connect to MongoDB after maximum retries. Exiting.');
  process.exit(1);
};

const seedProducts = async (Product) => {
  const sampleProducts = [
    {
      name: 'Wireless Noise-Cancelling Headphones',
      description: 'Premium sound quality with 30-hour battery life and foldable design.',
      price: 299.99,
      category: 'Electronics',
      stock: 50,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
    },
    {
      name: 'Mechanical Gaming Keyboard',
      description: 'RGB backlit mechanical keyboard with tactile switches and N-key rollover.',
      price: 149.99,
      category: 'Electronics',
      stock: 75,
      imageUrl: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400'
    },
    {
      name: 'Ergonomic Office Chair',
      description: 'Lumbar support, adjustable armrests, and breathable mesh back for all-day comfort.',
      price: 459.99,
      category: 'Furniture',
      stock: 20,
      imageUrl: 'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=400'
    },
    {
      name: 'Stainless Steel Water Bottle',
      description: 'Keeps drinks cold 24 hours or hot 12 hours, BPA-free with leak-proof lid.',
      price: 34.99,
      category: 'Sports',
      stock: 200,
      imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400'
    },
    {
      name: 'Smart Watch Pro',
      description: 'Health monitoring, GPS, sleep tracking, and 7-day battery life.',
      price: 399.99,
      category: 'Electronics',
      stock: 35,
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'
    },
    {
      name: 'Running Shoes Ultra Boost',
      description: 'Lightweight, responsive cushioning for everyday training and long runs.',
      price: 129.99,
      category: 'Sports',
      stock: 100,
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'
    },
    {
      name: 'Portable Bluetooth Speaker',
      description: '360° surround sound, waterproof IPX7, 20-hour playtime.',
      price: 79.99,
      category: 'Electronics',
      stock: 60,
      imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400'
    },
    {
      name: 'Organic Coffee Blend',
      description: 'Single-origin, fair-trade Ethiopian coffee beans, medium roast.',
      price: 24.99,
      category: 'Food',
      stock: 150,
      imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400'
    }
  ];

  try {
    await Product.insertMany(sampleProducts);
    console.log(`[PRODUCT-SERVICE] Seeded ${sampleProducts.length} sample products`);
  } catch (err) {
    console.error('[PRODUCT-SERVICE] Seeding error:', err.message);
  }
};

connectWithRetry();
