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
	debug(req.headers)

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
		throw "No user session can be found"
	}

	membership.validateSession(userSession, isSecure)
	.then(response => {
		debug(response)
	})




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
		res.end()
});
router.get('/test', function(req, res, next) {
	res.send('Test')
});


module.exports = router;
