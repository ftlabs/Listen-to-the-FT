const express = require('express');
const router = express.Router();

const membership = require('../../bin/lib/membership');
const myft = require('../../bin/lib/myft');
const validateSession = require('../../bin/lib/validate-session');
const debug = require('debug')('listen-to-the-FT:routes:user')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.end();
});

router.post('/login', function(req, res, next) {

	membership.login(req.body, process.env.MEMBERSHIP_LOGIN_API_KEY)
		.then(membershipResponse => {
			debug(membershipResponse)
			res.send(membershipResponse)
		})
		.catch(err => {
			res.status(503);
			res.end();
		})
	;
});

router.use(validateSession);

router.get('/topics', function(req, res) {

});

module.exports = router;
