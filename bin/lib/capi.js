const debug = require('debug')('listen-to-the-FT:bin:lib:capi');

function getItemsByTopic(topicUUID){

	const addr = `${process.env.UPP_COCO}/content?isAnnotatedBy=${topicUUID}`;

	// console.log(addr);

	return fetch(addr)
		.then(res => res.json())
		.catch(err => {
			debug('content-by-concept error', err);
			throw err;
		})
	;

}


function getContentFromUUID(articleUUID){
	const addr = `${process.env.UPP_COCO}/enrichedcontent/${articleUUID}`;

	return fetch(addr)
	.then(res => res.json())
	.catch(err => {
		debug('enrichedContent error', err);
		throw err;
	})
}

module.exports = {
	topic : getItemsByTopic,
	content : getContentFromUUID
};