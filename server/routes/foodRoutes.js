const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'food-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

const {
  getFoods,
  getFood,
  createFood,
  updateFood,
  deleteFood
} = require('../controllers/foodController');

// Public routes
router.get('/', getFoods);
router.get('/:id', getFood);

// Protected routes
router.use(protect);
router.use(authorize('admin'));

router.post('/', upload.single('image'), createFood);
router.put('/:id', upload.single('image'), updateFood);
router.delete('/:id', deleteFood);

module.exports = router; 