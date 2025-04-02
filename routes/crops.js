const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const Crop = require('../models/Crop');

// Configure multer to use memoryStorage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Cloudinary upload helper
const uploadToCloudinary = (buffer, fileName) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        public_id: fileName,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    ).end(buffer);
  });
};

// Get a single crop by its ID (Public route)
router.get('/:id', async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    res.json(crop);
  } catch (error) {
    console.error('Error fetching crop:', error);
    res.status(500).json({ message: 'An error occurred while fetching the crop', details: error.message });
  }
});

// Route to handle adding new crops (Admin only)
router.post('/', protect, authorize('admin'), upload.single('image'), async (req, res) => {
  try {
    console.log('Received data:', req.body);
    console.log('Received file:', req.file);

    if (!req.body.name || !req.body.quantity || !req.body.price || !req.file) {
      return res.status(400).json({ message: 'All fields and image are required.' });
    }

    const result = await uploadToCloudinary(req.file.buffer, Date.now().toString());
    console.log('Cloudinary upload result:', result);

    const crop = new Crop({
      name: req.body.name,
      cropImportance: req.body.cropImportance,
      farmName: req.body.farmName,
      cropsDescreption: req.body.cropsDescreption,
      cropStoreMethod: req.body.cropStoreMethod,
      quantity: req.body.quantity,
      price: req.body.price,
      image: result.secure_url,
      user: req.user._id,
    });

    const newCrop = await crop.save();
    res.status(201).json(newCrop);

  } catch (error) {
    console.error('Error adding crop:', error);
    res.status(400).json({ 
      message: 'An error occurred while adding the crop',
      details: error.toString(),
    });
  }
});

// Get all crops (Public route)
router.get('/', async (req, res) => {
  try {
    const crops = await Crop.find();
    res.json(crops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update crop with image (Admin only)
router.put('/:id', protect, authorize('admin'), upload.single('image'), async (req, res) => {
  try {
    let updateData = { ...req.body };
    
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      updateData.image = result.secure_url;
    }

    const crop = await Crop.findByIdAndUpdate(
      req.params.id,
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

// Delete crop (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const crop = await Crop.findByIdAndDelete(req.params.id);

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