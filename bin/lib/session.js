const fetch = require('node-fetch');

function getUserIdFromSessionToken(sessionToken){
	
	return fetch('https://session-next.ft.com/',{
		headers : {
			'FT-Session-Token' : sessionToken
		}
	}).then(res => res.json());

}

module.exports = {
	userID : getUserIdFromSessionToken
};