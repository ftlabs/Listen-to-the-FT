const express = require('express');
const router = express.Router();
const capi = require('../../bin/lib/capi');
const debug = require('debug')('listen-to-the-FT:routes:audio');
const isUUID = require('is-uuid');
const extractUUID = require('../../bin/lib/extract-uuid');


router.get('/', function(req, res, next) {

	const topicIds = req.query.topics.split(',');

	debug(topicIds)

	const articles = topicIds.map(id => {
		return capi.topic(id);
	});

	var articleOutput = []

	Promise.all(articles => {
		console.log(articles);
		// articleOutput.push(articles);
		
	});
	res.send(articles);
	
	// res.end();
});

router.get('/:topic', function(req, res, next) {

	const topicUUID = req.params.topic;
	if(isUUID.anyNonNil(topicUUID) === false){
		debug("Topic wasn't a UUID");
		res.status(400);
		res.send({
			error : 400,
			message : "UUID wasn't provided in the URL"
		})
	}
	

	return capi.topic(topicUUID)
	.then(articles => {
		
		var goodArticles = articles.map(article => {
			return extractUUID(article.apiUrl)
			.then(uuid => {
				debug(uuid)
				return capi.content(uuid)	
			})
			.then(content => {
				const annotations = content.annotations;
				const hasAudio = annotations.some(function(element, index, array){
					// debug(element.id, process.env.AUDIO_ARTICLES_THING_ID)
					return element.id == process.env.AUDIO_ARTICLES_THING_ID;
				});

				debug(hasAudio)
				if(hasAudio){

					return Promise.resolve({
						id : content.id,
						title : content.title,
						standfirst : content.standfirst,
						byline : content.byline,
						webUrl : content.webUrl,
						audioUrl : "https://amazons3/bucket/" + content.id.replace('http://www.ft.com/thing/','') + ".mp3"
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
				res.json(data);

			})
			.then(output => res.send(output))
		;

	})
	.catch(err => {
		res.status(502);
		res.send({
			error : 502,
			message : "Unable to retrieve content from CAPI"
		})
	})



});

module.exports = router;
