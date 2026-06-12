const express = require('express');
const router = express.Router();
const { createItem, getItemById, getAllItems, updateItem, deleteItem } = require('../controllers/itemController');
const { authenticate, requireProjectManager } = require('../middleware/auth');

router.post('/', authenticate, requireProjectManager, createItem);
router.get('/:id', authenticate, getItemById);
router.get('/', authenticate, getAllItems);
router.put('/:id', authenticate, requireProjectManager, updateItem);
router.delete('/:id', authenticate, requireProjectManager, deleteItem);

module.exports = router;