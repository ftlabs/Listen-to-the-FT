const express = require('express');
const router = express.Router();

const membership = require('../../bin/lib/membership');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.end();
});

router.post('/login', function(req, res, next) {

	membership.login(req.body)
		.then(membershipResponse => {
			res.json(membershipResponse);
		})
		.catch(err => {
			res.status(503);
		})
	;
	
});

module.exports = router;
