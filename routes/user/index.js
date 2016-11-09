const express = require('express');
const router = express.Router();

const membership = require('../../bin/lib/membership');
const myft = require('../../bin/lib/myft');
const validateSession = require('../../bin/lib/validate-session');
const concordence = require('../../bin/lib/concordence');
const debug = require('debug')('listen-to-the-FT:routes:user');


/* GET home page. */
router.get('/', function(req, res) {
  res.end();
});

router.post('/login', function(req, res) {

	debug(req.body);

	membership.login(req.body, process.env.MEMBERSHIP_LOGIN_API_KEY)
		.then(membershipResponse => {
			debug(membershipResponse)
			
			debug(req.cookies);
			res.cookie('ftlabs_listen', membershipResponse.sessionToken);
			res.cookie('ftlabs_listen_s', membershipResponse.secureSessionToken);

			res.send(membershipResponse);
		})
		.catch(err => {
			debug(err);
			res.status(503);
			res.end();
		})
	;
});

router.use(validateSession);

router.get('/topics', function(req, res) {

	debug("Valid session for " + res.locals.userUUID);

	myft.topics(res.locals.userUUID)
		.then(result => {

			const tmeIDsToTopicUUID = result.map(item => {

				return concordence.tmeToUUID(item.uuid)
					.then(uuid => {
						console.log(uuid);
						item.uuid = uuid;
						return item;
					})
					.catch(err => {
						debug(err);
						item.uuid = false;
						return item;
					})
				;

			})
		;

		Promise.all(tmeIDsToTopicUUID)
			.then(results => {

				const topicsWithUUIDs = results.filter(result => { return result.uuid; });

				res.json({
					topics : topicsWithUUIDs
				})
			})
		;

		})
		
	;

});

module.exports = router;
