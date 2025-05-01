const Room = require('../models/Room');

// Function to generate a unique room number
const generateRoomNumber = async () => {
  // Get the latest room to determine the next number
  const latestRoom = await Room.findOne().sort({ roomNumber: -1 });
  
  if (!latestRoom) {
    // If no rooms exist, start with 101
    return '101';
  }

  // Extract the numeric part and increment
  const currentNumber = parseInt(latestRoom.roomNumber);
  const nextNumber = currentNumber + 1;
  
  // Format as a 3-digit number
  return nextNumber.toString().padStart(3, '0');
};

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
      // Generate room number
      const roomNumber = await generateRoomNumber();
      
      // Parse amenities if they exist
      let amenities = [];
      if (req.body.amenities) {
        try {
          amenities = JSON.parse(req.body.amenities);
        } catch (e) {
          amenities = req.body.amenities.split(',').map(item => item.trim());
        }
      }
      
      // Create room with generated number and image
      const room = new Room({
        ...req.body,
        roomNumber,
        amenities,
        image: req.file ? `/uploads/rooms/${req.file.filename}` : null
      });
      
      const savedRoom = await room.save();
      res.status(201).json(savedRoom);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Bulk create rooms
  bulkCreateRooms: async (req, res) => {
    try {
      const { rooms } = req.body;
      
      if (!Array.isArray(rooms) || rooms.length === 0) {
        return res.status(400).json({ message: 'Please provide an array of rooms' });
      }

      const createdRooms = [];
      
      // Create rooms sequentially to ensure proper room number generation
      for (let i = 0; i < rooms.length; i++) {
        const roomData = JSON.parse(rooms[i]);
        const roomNumber = await generateRoomNumber();
        const room = new Room({
          ...roomData,
          roomNumber,
          image: req.files && req.files[i] ? `/uploads/rooms/${req.files[i].filename}` : null
        });
        const savedRoom = await room.save();
        createdRooms.push(savedRoom);
      }

      res.status(201).json({
        message: `Successfully created ${createdRooms.length} rooms`,
        rooms: createdRooms
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Update room
  updateRoom: async (req, res) => {
    try {
      // Parse amenities if they exist
      let amenities = [];
      if (req.body.amenities) {
        amenities = req.body.amenities.split(',').map(item => item.trim());
      }

      const updateData = {
        name: req.body.name,
        capacity: parseInt(req.body.capacity),
        price: parseFloat(req.body.price),
        amenities: amenities,
        ...(req.file && { image: `/uploads/rooms/${req.file.filename}` })
      };

      const room = await Room.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
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
  },

  // Bulk delete all rooms
  bulkDeleteRooms: async (req, res) => {
    try {
      const result = await Room.deleteMany({});
      res.json({ 
        message: `Successfully deleted ${result.deletedCount} rooms`,
        deletedCount: result.deletedCount
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = roomController; 