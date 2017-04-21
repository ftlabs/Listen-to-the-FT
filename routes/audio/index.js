const express = require('express');
const router = express.Router();
const debug = require('debug')('listen-to-the-FT:routes:audio');

const capi = require('../../bin/lib/capi');
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

	const topicUUIDs = req.query.topics.split(',');

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

							const isValidTopic = annotations.some(annotation => {
								return topicUUIDs.indexOf(annotation.id.replace('http://api.ft.com/things/','')) > -1;
							});

							const validTopicIDs = [];

							topicUUIDs.forEach(uuid => {

								annotations.forEach(annotation => {
									debug('\t', annotation.id);
									if(annotation.id.indexOf(uuid) > -1){ validTopicIDs.push(uuid) };
								});

							});
							
							if(isValidTopic){
								debug(content);

								const information = {
									id : content.id,
									title : content.title,
									standfirst : content.standfirst,
									byline : content.byline,
									webUrl : content.webUrl,
									audioUrl : generatePublicS3URL(content.id),
									hasTopicIDs : validTopicIDs,
									published : content.publishedDate
								};

								return fetch(`${process.env.AUDIO_STATS_SERVICE}/check/${content.id}`)
									.then(res => {
										if(res.status !== 200){
											throw res;
										} else {
											return res;
										}
									})
									.then(res => res.json())
									.then(data => {

										if(data.haveFile === false){
											return false;
										} else {
											information.size = data.size;
											information.duration = data.duration;
											information.haveFile = data.haveFile;
											return information;
										}

									})
									.catch(err => {
										debug(err);
										return Promise.resolve(information);
									})
								;
								
							} else {
								return Promise.resolve({});
							}
						})
					})

					Promise.all(goodArticles)
						.then(data => {
							data = data.filter(datum => {
								return datum.id !== undefined;
							}).filter(datum => {

								if(datum === false){
									return false;
								}

								if(datum.haveFile === true){
									return true;
								}

								return datum !== false;
							});

							if(data.length === 0){
								res.status(404);
							}
							res.json(data);

						})
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
