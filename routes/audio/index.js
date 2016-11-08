const express = require('express');
const router = express.Router();
const capi = require('../../bin/lib/capi');
const debug = require('debug')('listen-to-the-FT:routes:audio');

const extractUUID = require('../../bin/lib/extract-uuid');
const generatePublicS3URL = require('../../bin/lib/get-s3-public-url');
const validateSession = require('../../bin/lib/validate-session');

router.use(validateSession);

function getTopics(req, res){

	if(req.query.topics === undefined){
		res.status(400);
		res.json({
			status : "ERR",
			reason : 'topics UUIDs must be passed as the query parameter topic',
			message : 'The request is not valid'
		});
		return;
	}

	const topicUUIDs = req.query.topics.split(',') ;

	extractUUID(process.env.AUDIO_ARTICLES_THING_ID)
		.then(audioUUID => {

			return capi.topic(audioUUID)
				.then(articles => {
					
					const goodArticles = articles.map(article => {
						return extractUUID(article.apiUrl)
						.then(uuid => {
							debug(uuid)
							return capi.content(uuid);
						})
						.then(content => {
							const annotations = content.annotations;
							content.id = content.id.replace('http://www.ft.com/thing/','');

							debug(topicUUIDs, annotations);

							const isValidTopic = annotations.some(annotation => {
								return topicUUIDs.indexOf(annotation.id.replace('http://api.ft.com/things/','')) > -1;
							});

							debug(isValidTopic);
							
							if(isValidTopic){

								return Promise.resolve({
									id : content.id,
									title : content.title,
									standfirst : content.standfirst,
									byline : content.byline,
									webUrl : content.webUrl,
									audioUrl : generatePublicS3URL(content.id)
								});
							}
							else{
								return Promise.resolve({});
							}
						})
					})

					Promise.all(goodArticles)
						.then(data => {
							data = data.filter(datum => {
								return datum.id !== undefined;
							})

							if(data.length === 0){
								res.status(404);
							}
							res.json(data);

						})
						.then(output => res.send(output))
					;

				})
				.catch(err => {
					debug(err);
					res.status(502);
					res.send({
						error : 502,
						message : `Unable to retrieve content from CAPI ${err.message}`
					})
				})
			;

		})
		.catch(err => {
			debug("Topic wasn't a UUID");
			res.status(400);
			res.send({
				error : 400,
				message : "UUID wasn't provided in the URL"
			})
		})
	;


}

router.get('/', getTopics);

module.exports = router;
