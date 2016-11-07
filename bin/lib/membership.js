const fetch = require('node-fetch');

const membershipAPIURL = process.env.FT_API_URL || `https://api.ft.com`;

function loginUser(credentials){

	return fetch(`${membershipAPIURL}/login`,{
		body : credentials,
		method : 'POST',
		headers : {
			'Content-Type' : 'application/json',
			'X-Api-Key' : process.env.MEMBERSHIP_API_KEY
		}
	}).then(res => {
		
		if(res.status !== 200 && res.status !== 400){
			throw res;
		}
		return res.json();
	})

}

function getSessionFromToken(secureSessionToken){

	return fetch(`${membershipAPIURL}/sessions/s/${secureSessionToken}`)
		.then(res => {
			if(res.status !== 200){
				throw res;
			}
			return res.json();
		}).then(data => data.uuid)
	;
}


module.exports = {
	login : loginUser,
	session : getSessionFromToken
};