const express = require('express');
const {
  create,
  login,
  getMe,
  forgotPassword,
  reset_password_template,
  resetPassword,
  updateDetails,
  updatePassword
} = require('../controllers/user');

const router = express.Router();
const { protect } = require('../middleware/auth');
router
  .post('/', create)
  .post('/login', login)
  .get('/', protect, getMe)
  .post('/forgotPassword', forgotPassword)
  .get('/reset_password_template/:resettoken', reset_password_template)
  .post('/resetPassword/:resettoken', resetPassword)
  .put('/', protect, updateDetails)
  .put('/updatepassword', protect, updatePassword);
  


module.exports = router;