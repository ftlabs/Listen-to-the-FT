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

	membership.login(req.body, process.env.MEMBERSHIP_LOGIN_API_KEY)
		.then(membershipResponse => {
			debug(membershipResponse)
			res.send(membershipResponse)
		})
		.catch(err => {
			res.status(503);
		})
	;
});

router.get('/topics', function(req, res, next) {
	var userSession = undefined;
	var isSecure = false;

	if(req.headers.secureSessionToken){
		userSession = req.headers.secureSessionToken;
		isSecure = true;
	}
	else if(req.headers.sessionToken){
		userSession = req.headers.sessionToken;
		isSecure = false;
	}
	else if(req.cookies['FTSession_s']){
		userSession = req.cookies['FTSession_s'];
		isSecure = true;
	}
	else if (req.cookies['FTSession']){
		userSession = req.cookies['FTSession'];
		isSecure = false;
	}

	if(userSession === undefined){
		res.status(400)
		res.set('Content-Type', 'application/json');
		res.send('{"error": "403", "message": "No session id was provided"}')
	}

	membership.validateSession(userSession, isSecure)
	.then(userUUID => {
		debug("Valid session for " + userUUID)

		myft.topics(userUUID)
			.then(result => {
				res.send(result)
			})

	})
});
router.get('/test', function(req, res, next) {
	res.send('Test')
});


module.exports = router;
