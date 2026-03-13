// ============================================================
// auth.routes.js
// ============================================================
const express = require('express');
const router  = express.Router();

const { login, getMe, changePassword, updateAvatar } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const upload            = require('../middleware/Upload.middleware.js');

router.post('/login',           login);
router.get('/me',               authenticate, getMe);
router.put('/change-password',  authenticate, changePassword);
router.post('/avatar',          authenticate, upload.single('avatar'), updateAvatar);

module.exports = router;