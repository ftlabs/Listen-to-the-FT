const myftClient = require('next-myft-client')
const debug = require('debug')('listen-to-the-FT:bin:lib:myft')

const myftAPIURL = process.env.MY_FT_API_URL || `https://api.ft.com`;


function getUserTopics(userId){
    debug("Topics for " + userId)
    return myftClient
		.getAllRelationship('user', userId, 'followed', 'concept')
		.then(res => {
			return res.items
		})
		.catch((err) => {
			debug('Error fetching user follows', { event: 'FETCH_USER_FOLLOWS_ERROR', msg: err });
			return Promise.reject(err);
		})
	;
}

module.exports = {
	topics : getUserTopics
};