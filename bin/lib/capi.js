function getItemsByTopic(topicUUID){

	const addr = `${process.env.UPP_COCO}/content?isAnnotatedBy=${topicUUID}`;

	console.log(addr);

	return fetch(addr)
		.then(res => res.text())
		.then(res => {
			console.log(res);
		})
		.catch(err => {
			console.log("FETCH ERROR:", err);
		})
	;

}

module.exports = {
	topic : getItemsByTopic
};