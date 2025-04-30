const Room = require('../models/Room');

const roomController = {
  // Get all rooms
  getAllRooms: async (req, res) => {
    try {
      const rooms = await Room.find();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get room by ID
  getRoomById: async (req, res) => {
    try {
      const room = await Room.findById(req.params.id);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      res.json(room);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Create new room
  createRoom: async (req, res) => {
    try {
      const room = new Room(req.body);
      const savedRoom = await room.save();
      res.status(201).json(savedRoom);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Update room
  updateRoom: async (req, res) => {
    try {
      const room = await Room.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      res.json(room);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Delete room
  deleteRoom: async (req, res) => {
    try {
      const room = await Room.findByIdAndDelete(req.params.id);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      res.json({ message: 'Room deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = roomController; 