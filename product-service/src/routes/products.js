const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/products - list all active products (public)
router.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      Product.countDocuments(filter)
    ]);

    res.status(200).json({
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error(`[PRODUCT] List error: ${err.message}`);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

// GET /api/products/:id - get single product (public)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json({ product });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    console.error(`[PRODUCT] Get error: ${err.message}`);
    res.status(500).json({ error: 'Failed to retrieve product' });
  }
});

// POST /api/products - create product (protected)
router.post(
  '/',
  authMiddleware,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price required'),
    body('category').isIn(['Electronics', 'Clothing', 'Books', 'Food', 'Furniture', 'Sports', 'Toys', 'Beauty', 'Other'])
      .withMessage('Valid category required'),
    body('stock').isInt({ min: 0 }).withMessage('Valid stock required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const product = new Product(req.body);
      await product.save();
      console.log(`[PRODUCT] Created product: ${product.name}`);
      res.status(201).json({ message: 'Product created successfully', product });
    } catch (err) {
      console.error(`[PRODUCT] Create error: ${err.message}`);
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
);

// PUT /api/products/:id - update product (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    console.log(`[PRODUCT] Updated product: ${product._id}`);
    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    console.error(`[PRODUCT] Update error: ${err.message}`);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id - soft delete product (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    console.log(`[PRODUCT] Deleted product: ${product._id}`);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    console.error(`[PRODUCT] Delete error: ${err.message}`);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
