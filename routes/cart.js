const express = require('express');
const router = express.Router();
const CartItem = require('../models/CartItem');
const Crop = require('../models/Crop');
const { protect, authorize } = require('../middleware/auth');

// Get cart items
router.get('/', protect, async (req, res) => {
  try {
    const cartItems = await CartItem.find({ user: req.user._id })
      .populate('crop');
    res.json(cartItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add item to cart
router.post('/', protect, async (req, res) => {
  try {
    const { cropId, quantity } = req.body;

    // Check if crop exists
    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    // Check if item already in cart
    let cartItem = await CartItem.findOne({ 
      user: req.user._id,
      crop: cropId 
    });

    if (cartItem) {
      // Update quantity if item exists
      cartItem.quantity += quantity;
      await cartItem.save();
    } else {
      // Create new cart item
      cartItem = new CartItem({
        user: req.user._id,
        crop: cropId,
        quantity
      });
      await cartItem.save();
    }

    res.status(201).json(cartItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update cart item quantity
router.put('/:id', protect, async (req, res) => {
  try {
    const { quantity } = req.body;
    const cartItem = await CartItem.findOneAndUpdate(
      { _id: req.params.id, user: req.user.user._id },
      { quantity },
      { new: true }
    );

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    res.json(cartItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Remove item from cart
router.delete('/:id', protect, async (req, res) => {
  try {
    const cartItem = await CartItem.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;