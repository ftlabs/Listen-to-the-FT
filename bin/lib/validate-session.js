const debug = require('debug')('bin:lib:validate-session');
const checkWithMembership = require('./membership').validateSession;

module.exports = function(req, res, next){

	debug('Validating session...');

	const secureSessionToken = req.get('secureSessionToken');
	const sessionToken = req.get('sessionToken')

	const ftlabsSessionToken = req.cookies['ftlabsSession'];
	const ftlabsSecureSessionToken = req.cookies['ftlabsSession_s'];

	if(secureSessionToken){
		res.locals.userSession = secureSessionToken;
		res.locals.isSecure = true;
	}
	else if(sessionToken){
		res.locals.userSession = sessionToken;
		res.locals.isSecure = false;
	}
	else if(ftlabsSecureSessionToken){
		res.locals.userSession = ftlabsSecureSessionToken;
		res.locals.isSecure = true;
	}
	else if(ftlabsSessionToken){
		res.locals.userSession = ftlabsSessionToken;
		res.locals.isSecure = false;
	}
	// else if(req.cookies['FTSession_s']){
	// 	res.locals.userSession = req.cookies['FTSession_s'];
	// 	res.locals.isSecure = true;
	// }
	// else if (req.cookies['FTSession']){
	// 	res.locals.userSession = req.cookies['FTSession'];
	// 	res.locals.isSecure = false;
	// }
	
	debug(secureSessionToken, sessionToken, ftlabsSessionToken, ftlabsSecureSessionToken);
	debug(res.locals.userSession, res.locals.isSecure);

	if(res.locals.userSession === undefined){
		// throw "No user session can be found"
		res.status(403);
		res.json({
			'error': '403',
			'message': 'No session id was provided'
		});
	} else {

		checkWithMembership(res.locals.userSession, res.locals.isSecure)
			.then(UUID => {
				debug(UUID);
				res.locals.userUUID = UUID;
				next();
			})
			.catch(err => {
				debug(err);
				res.status(401);
				res.json({
					'error' : '401',
					'message' : 'Invalid token'
				});
			})
		;

	}

};
