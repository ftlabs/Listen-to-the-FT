const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
  res.end();
});

router.get('/:topic', function(req, res, next) {
  res.end();
});

module.exports = router;
