const Food = require('../models/Food');
const path = require('path');
const fs = require('fs');

// @desc    Get all foods
// @route   GET /api/foods
// @access  Public
exports.getFoods = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';

    // Build search query
    const searchQuery = {
      isAvailable: true,
      ...(search && {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      }),
      ...(category && { category })
    };

    // Get total count for pagination
    const totalFoods = await Food.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalFoods / limit);

    // Get paginated foods
    const foods = await Food.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      foods,
      pagination: {
        currentPage: page,
        totalPages,
        totalFoods,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single food
// @route   GET /api/foods/:id
// @access  Public
exports.getFood = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({
        success: false,
        error: 'Food not found'
      });
    }

    res.status(200).json({
      success: true,
      data: food
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Create food
// @route   POST /api/foods
// @access  Private/Admin
exports.createFood = async (req, res) => {
  try {
    // Handle image upload
    let imagePath = 'default-food.jpg';
    if (req.file) {
      imagePath = req.file.filename;
    }

    // Create food object
    const foodData = {
      name: req.body.name,
      description: req.body.description,
      price: parseFloat(req.body.price),
      category: req.body.category,
      preparationTime: parseInt(req.body.preparationTime),
      image: imagePath
    };

    const food = await Food.create(foodData);
    res.status(201).json({
      success: true,
      data: food
    });
  } catch (error) {
    // If there's an error and a file was uploaded, delete it
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update food
// @route   PUT /api/foods/:id
// @access  Private/Admin
exports.updateFood = async (req, res) => {
  try {
    let foodData = { ...req.body };
    
    // Handle image upload
    if (req.file) {
      // Delete old image if it exists and is not the default
      const oldFood = await Food.findById(req.params.id);
      if (oldFood && oldFood.image !== 'default-food.jpg') {
        const oldImagePath = path.join(__dirname, '../uploads', oldFood.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      foodData.image = req.file.filename;
    }

    const food = await Food.findByIdAndUpdate(
      req.params.id,
      foodData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!food) {
      return res.status(404).json({
        success: false,
        error: 'Food not found'
      });
    }

    res.status(200).json({
      success: true,
      data: food
    });
  } catch (error) {
    // If there's an error and a file was uploaded, delete it
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete food
// @route   DELETE /api/foods/:id
// @access  Private/Admin
exports.deleteFood = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({
        success: false,
        error: 'Food not found'
      });
    }

    // Delete the food image if it exists and is not the default
    if (food.image !== 'default-food.jpg') {
      const imagePath = path.join(__dirname, '../uploads', food.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await food.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}; 