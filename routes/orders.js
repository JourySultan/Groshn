const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const CartItem = require('../models/CartItem');
const { protect, authorize } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Get all orders (Admin only)
router.get('/all', protect, authorize('admin'), async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.crop')
      .populate('user', 'username email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's orders
router.get('/', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.crop')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new order
router.post('/', protect, async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;

    // Get cart items
    const cartItems = await CartItem.find({ user: req.user._id })
      .populate('crop');

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Calculate total amount
    const items = cartItems.map(item => ({
      crop: item.crop._id,
      quantity: item.quantity,
      price: item.crop.price
    }));

    const totalAmount = items.reduce((total, item) => 
      total + (item.price * item.quantity), 0);

    // Create order
    const order = new Order({
      user: req.user._id,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod,
      status: 'pending' // Default status
    });

    if (paymentMethod === 'credit_card') {
      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: 'usd',
        metadata: { orderId: order._id.toString() }
      });

      // Save order and clear cart
      await order.save();
      await CartItem.deleteMany({ user: req.user._id });

      res.status(201).json({
        order,
        clientSecret: paymentIntent.client_secret
      });
    } else {
      // Cash on delivery
      await order.save();
      await CartItem.deleteMany({ user: req.user._id });
      
      res.status(201).json({ order });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get order details (Admin can view any order, users can only view their own)
router.get('/:id', protect, async (req, res) => {
  try {
    let order;
    if (req.user.role === 'admin') {
      order = await Order.findById(req.params.id)
        .populate('items.crop')
        .populate('user', 'username email');
    } else {
      order = await Order.findOne({
        _id: req.params.id,
        user: req.user._id
      }).populate('items.crop');
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update order status (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        updatedAt: Date.now()
      },
      { new: true }
    )
    .populate('items.crop')
    .populate('user', 'username email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete order (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;