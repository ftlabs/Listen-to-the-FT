const debug = require('debug')('bin:lib:validate-session');
const checkWithMembership = require('./membership').validateSession;

module.exports = function(req, res, next){

	debug('Validating session...');

	const secureSessionToken = req.get('secureSessionToken');
	const sessionToken = req.get('sessionToken')

	if(secureSessionToken){
		res.locals.userSession = secureSessionToken;
		res.locals.isSecure = true;
	}
	else if(sessionToken){
		res.locals.userSession = sessionToken;
		res.locals.isSecure = false;
	}
	else if(req.cookies['FTSession_s']){
		res.locals.userSession = req.cookies['FTSession_s'];
		res.locals.isSecure = true;
	}
	else if (req.cookies['FTSession']){
		res.locals.userSession = req.cookies['FTSession'];
		res.locals.isSecure = false;
	}

	debug(secureSessionToken);

	if(res.locals.userSession === undefined){
		// throw "No user session can be found"
		res.status(400);
		res.json({
			'error': '403',
			'message': 'No session id was provided'
		});
	} else {

		checkWithMembership(res.locals.userSession, res.locals.isSecure)
			.then(UUID => {
				res.locals.userUUID = UUID;
				next();
			})
			.catch(err => {
				res.status(401);
				res.json({
					'error' : '401',
					'message' : 'Invalid token'
				});
			})
		;

	}

};
