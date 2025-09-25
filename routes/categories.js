var express = require('express');
var router = express.Router();
let Category = require('../schemas/category');

// GET /categories - list all categories
router.get('/', async function(req, res) {
  try {
    const items = await Category.find({});
    res.send({ success: true, data: items });
  } catch (error) {
    res.status(500).send({ success: false, data: error });
  }
});

// GET /categories/:id - get by id
router.get('/:id', async function(req, res) {
  try {
    const item = await Category.findById(req.params.id);
    if (!item) return res.status(404).send({ success: false, message: 'Category not found' });
    res.send({ success: true, data: item });
  } catch (error) {
    res.status(400).send({ success: false, data: error });
  }
});

// POST /categories - create
router.post('/', async function(req, res) {
  try {
    const item = new Category({ name: req.body.name });
    await item.save();
    res.status(201).send({ success: true, data: item });
  } catch (error) {
    res.status(400).send({ success: false, data: error });
  }
});

// PUT /categories/:id - update
router.put('/:id', async function(req, res) {
  try {
    const item = await Category.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).send({ success: false, message: 'Category not found' });
    res.send({ success: true, data: item });
  } catch (error) {
    res.status(400).send({ success: false, data: error });
  }
});

// DELETE /categories/:id - hard delete
router.delete('/:id', async function(req, res) {
  try {
    const item = await Category.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).send({ success: false, message: 'Category not found' });
    res.send({ success: true, data: item });
  } catch (error) {
    res.status(400).send({ success: false, data: error });
  }
});

module.exports = router;
