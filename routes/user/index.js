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

// router.use(validateSession);

router.get('/topics', function(req, res) {

	membership.validateSession(res.locals.userSession, res.locals.isSecure)
		.then(userUUID => {
			debug("Valid session for " + userUUID)

			myft.topics(userUUID)
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

					});

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

		})
		.catch(err => {
			res.json(err);		
		})
	;

});

router.get('/topics/:userID', function(req, res){

	const userUUID = req.params.userID;

	


});

module.exports = router;
