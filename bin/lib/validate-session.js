const debug = require('debug')('bin:lib:validate-session');
const checkWithMembership = require('./membership').validateSession;

module.exports = function(req, res, next){

	debug('Validating session...');

	const sessionToken = req.cookies['FTSession'];

	if(sessionToken){
		res.locals.userSession = sessionToken;
		res.locals.isSecure = false;
	}
	
	debug(sessionToken);
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
