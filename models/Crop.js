const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['فواكه', 'خضار'],
    required: true
  },
  cropType: {
    type: String,
    enum: ['عضوي', 'غير عضوي'],
    required: true
  },
  growthLocation: {
    type: String,
    enum: ['بيت محمي', 'بيت غير محمي'],
    required: true
  },
  harvestDate: {
    type: Date,
    required: true
  },
  fertilizer: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  image: {
    type: String
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Crop', cropSchema);