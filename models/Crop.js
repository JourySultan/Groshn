const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  cropImportance: {
    type: String,
    required: true
  },
  farmName: {
    type: String,
    required: true
  },
  cropsDescreption: {
    type: String,
    required: true
  },
  cropStoreMethod: {
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
    required: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Crop', cropSchema);