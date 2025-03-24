const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const CartItem = require('../models/CartItem');
const auth = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Get user's orders
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.userId })
      .populate('items.crop')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new order
router.post('/', auth, async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;

    // Get cart items
    const cartItems = await CartItem.find({ user: req.user.userId })
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
      user: req.user.userId,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod
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
      await CartItem.deleteMany({ user: req.user.userId });

      res.status(201).json({
        order,
        clientSecret: paymentIntent.client_secret
      });
    } else {
      // Cash on delivery
      await order.save();
      await CartItem.deleteMany({ user: req.user.userId });
      
      res.status(201).json({ order });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get order details
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.userId
    }).populate('items.crop');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;