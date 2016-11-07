const express = require('express');
const router = express.Router();

const membership = require('../../bin/lib/membership');
const myft = require('../../bin/lib/myft');
const debug = require('debug')('listen-to-the-FT:routes:user')

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

router.get('/topics/:userid', function(req, res, next) {
	debug(req.params)
	myft.topics(req.params.userid)
		.then(result => {
			console.log('Result', result);
			// console.log(res.json())
			// res.send(result.json());
			res.status(316)
		})
		.catch(err => {
			console.log('Error getting topics:', err)
			res.status(503);
		})
});
router.get('/test', function(req, res, next) {
	res.send('Test')
});


module.exports = router;
