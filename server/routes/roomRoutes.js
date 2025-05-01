const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const upload = require('../middleware/upload');

// All routes are public for now
router.get('/', roomController.getAllRooms);
router.get('/:id', roomController.getRoomById);
router.post('/', upload.single('image'), roomController.createRoom);
router.post('/bulk/add', upload.array('images', 10), roomController.bulkCreateRooms);
router.put('/:id', upload.single('image'), roomController.updateRoom);
router.delete('/:id', roomController.deleteRoom);
router.delete('/bulk/delete', roomController.bulkDeleteRooms);

module.exports = router; 