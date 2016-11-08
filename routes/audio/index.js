const express = require('express');
const router = express.Router();
const capi = require('../../bin/lib/capi');

router.get('/', function(req, res, next) {

	const topicIds = req.query.topics.split(',');

	const articles = topicIds.map(id => {
		return capi.topic(id);
	});

	Promise.all(articles => {
		console.log(articles);
	});

	res.end();
});

router.get('/:topic', function(req, res, next) {
	res.end();
});

module.exports = router;
