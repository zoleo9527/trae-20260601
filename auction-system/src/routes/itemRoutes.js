const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { authenticate, requireProjectManager } = require('../middleware/auth');

router.post('/', authenticate, requireProjectManager, itemController.createItem);
router.get('/:id', authenticate, itemController.getItemById);
router.get('/', authenticate, itemController.getAllItems);
router.put('/:id', authenticate, requireProjectManager, itemController.updateItem);
router.delete('/:id', authenticate, requireProjectManager, itemController.deleteItem);

module.exports = router;