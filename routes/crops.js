const express = require('express');
const router = express.Router();
const Crop = require('../models/Crop');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

// Helper function to upload to cloudinary
const uploadToCloudinary = async (buffer) => {
  return new Promise((resolve, reject) => {
    const writeStream = cloudinary.uploader.upload_stream(
      {
        folder: 'crops',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    
    const readStream = Readable.from(buffer);
    readStream.pipe(writeStream);
  });
};

// Get all crops
router.get('/', auth, async (req, res) => {
  try {
    const crops = await Crop.find({ user: req.user.userId });
    res.json(crops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new crop with image
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    let imageUrl = null;
    
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
    }

    const crop = new Crop({
      ...req.body,
      image: imageUrl,
      user: req.user.userId
    });

    const newCrop = await crop.save();
    res.status(201).json(newCrop);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update crop with image
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    let updateData = { ...req.body };

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      updateData.image = result.secure_url;
    }

    const crop = await Crop.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      updateData,
      { new: true }
    );

    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }
    res.json(crop);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete crop
router.delete('/:id', auth, async (req, res) => {
  try {
    const crop = await Crop.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }
    res.json({ message: 'Crop deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;