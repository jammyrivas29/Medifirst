const express = require('express');
const router = express.Router();
const firstAidController = require('../controllers/firstAidController');

router.get('/', firstAidController.getAllGuides);
router.get('/category/:category', firstAidController.getByCategory);
router.get('/:id', firstAidController.getGuideById);

module.exports = router;
