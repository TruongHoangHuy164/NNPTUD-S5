var express = require('express');
var router = express.Router();

let comments = [ { "id": "1", "text": "a comment about post 1", "postId": "1" },
{ "id": "2", "text": "another comment about post 1", "postId": "1" }]

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send(comments);
});
router.get('/:id', function(req, res, next) {
  res.send(comments.filter(c=>c.id==req.params.id));
});

module.exports = router;
