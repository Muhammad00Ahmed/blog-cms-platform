const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Get all posts
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, tag } = req.query;
    const query = { published: true };
    
    if (category) query.categories = category;
    if (tag) query.tags = tag;
    
    const posts = await Post.find(query)
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Post.countDocuments(query);
    
    res.json({
      posts,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create post
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const post = new Post({
      ...req.body,
      author: req.user.id,
      featuredImage: req.file ? req.file.path : null
    });
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update post
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.featuredImage = req.file.path;
    
    const post = await Post.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete post
router.delete('/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;