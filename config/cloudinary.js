const cloudinary = require('cloudinary').v2;

// Use the CLOUDINARY_URL to configure Cloudinary
cloudinary.config({
  cloud_url: process.env.CLOUDINARY_URL
});

module.exports = cloudinary;
