const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');;
const multer = require('multer');
const Crop = require('../models/Crop');

// Configure multer to use memoryStorage (no disk storage needed)
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

// Cloudinary upload helper
const uploadToCloudinary = (buffer, fileName) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        public_id: fileName,  // Optional: You can define a custom filename
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    ).end(buffer); // send the image buffer directly to Cloudinary
  });
};

// Route to handle adding new crops
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    console.log('Received data:', req.body);  // Log the body parameters
    console.log('Received file:', req.file);  // Log the uploaded file

    // Validate input data
    if (!req.body.fertilizer || !req.body.quantity || !req.body.price || !req.file) {
      return res.status(400).json({ message: 'All fields and image are required.' });
    }

    // Upload the image to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, Date.now().toString());
    console.log('Cloudinary upload result:', result);  // Log the Cloudinary upload result

// Create the new crop in the database with Cloudinary URL
const crop = new Crop({
  name: req.body.name,  // Crop name
  category: req.body.category,  // Crop category
  growthLocation: req.body.growthLocation,  // Growth location
  cropType: req.body.cropType,  // Crop type
  harvestDate: req.body.harvestDate,  // Harvest date
  fertilizer: req.body.fertilizer,  // Fertilizer used
  quantity: req.body.quantity,  // Quantity
  price: req.body.price,  // Price
  image: result.secure_url,  // Cloudinary image URL
  user: req.user.userId,  // User ID from the session or JWT
});

    // Save the new crop in the database
    const newCrop = await crop.save();

    // Respond with the newly created crop
    res.status(201).json(newCrop);

  } catch (error) {
    console.error('Error adding crop:', error);  // Log the error in detail

    // Send detailed error message for better debugging
    res.status(400).json({ 
      message: 'An error occurred while adding the crop',
      details: error.toString(),  // Log the full error details, including stack trace
    });
  }
});


// Get all crops
router.get('/', auth, async (req, res) => {
  try {
    const crops = await Crop.find({ user: req.user.userId });
    res.json(crops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Update crop with image
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    // Validate input data
    const validationError = validateCropData(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

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
    console.error('Error updating crop:', error);
    res.status(400).json({ message: 'An error occurred while updating the crop', details: error.message });
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
    console.error('Error deleting crop:', error);
    res.status(500).json({ message: 'An error occurred while deleting the crop', details: error.message });
  }
});

module.exports = router;
