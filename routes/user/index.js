const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

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

	debug(req.cookies);

	membership.login(req.body, process.env.MEMBERSHIP_LOGIN_API_KEY)
		.then(membershipResponse => {
			debug(membershipResponse)
			
			const cookieOptions = { maxAge: 900000, httpOnly : false };

			res.cookie('ftlabsSession', membershipResponse.sessionToken, cookieOptions);
			res.cookie('ftlabsSession_s', membershipResponse.secureSessionToken, cookieOptions);

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
			debug(result);
			const tmeIDsToTopicUUID = result.map(item => {

				return concordence.tmeToUUID(item.uuid)
					.then(uuid => {
						debug(uuid);
						item.uuid = uuid;
						return item;
					})
					.catch(err => {
						debug("err", err);
						item.uuid = false;
						return item;
					})
				;

			})

			Promise.all(tmeIDsToTopicUUID)	
				.then(results => {
					return results.filter(result => { return result.uuid; });
				})
				.then(topicsWithUUIDs => {
					fetch(`${process.env.FT_API_URL}/things/8a086a54-ea48-3a52-bd3c-5821430c2132`,{
							headers : {
								'X-API-KEY' : process.env.CAPI_KEY
							}
						})
						.then(res => {

							if(res.status !== 200){
								throw res;
							} else {
								return res;
							}
							
						})
						.then(res => res.json())
						.then(data => {

							debug();

							if( !topicsWithUUIDs.some(topic => { return topic.uuid == '8a086a54-ea48-3a52-bd3c-5821430c2132'})  ){

								topicsWithUUIDs.push({
									name : data.prefLabel,
									uuid : data.id.replace('http://api.ft.com/things/', '')
								});

							}

							
							res.json({
								topics : topicsWithUUIDs
							});
							
						})
						.catch(err => {
							debug(err);
							res.status(500);
							res.send
						})
					;
				})
			;

		});

});

module.exports = router;
