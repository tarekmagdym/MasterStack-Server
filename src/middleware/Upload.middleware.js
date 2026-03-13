const multer                = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary            = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:           'masterstack/avatars',
    allowed_formats:  ['jpg', 'jpeg', 'png', 'webp'],
    transformation:   [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
  },
});

module.exports = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
});