const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/medical-profile', userController.updateMedicalProfile);
router.get('/emergency-contacts', userController.getEmergencyContacts);
router.post('/emergency-contacts', userController.addEmergencyContact);
router.delete('/emergency-contacts/:contactId', userController.deleteEmergencyContact);

module.exports = router;
