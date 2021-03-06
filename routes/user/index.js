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

router.use(validateSession);

router.get('/uuid', function(req, res, next){

	membership.validateSession(req.cookies['FTSession'], false)
		.then(uuid => {
			res.json({uuid});
		})
		.catch(err => {
			debug(err);
			res.status(503);
			res.end();
		})
	;

});

router.get('/topics', function(req, res) {

	debug(`Valid session for ${res.locals.userUUID}`);

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

							debug(data);

							if( !topicsWithUUIDs.some(topic => { return topic.uuid == '8a086a54-ea48-3a52-bd3c-5821430c2132'})  ){

								topicsWithUUIDs.push({
									name : data.prefLabel,
									uuid : data.id.replace('https://api.ft.com/things/', '')
								});

							}

							topicsWithUUIDs.push({
								name : 'Artificial Voices',
								uuid : '8a086a54-ea48-3a52-bd3c-5821430c2132'
							});
							
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
