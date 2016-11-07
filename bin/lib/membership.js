const fetch = require('node-fetch');

const membershipAPIURL = process.env.FT_API_URL || `https://api.ft.com`;
	
function loginUser(credentials, token){

	if(token === undefined){
		throw 'A token was not passed for the membership API';
	}
	console.log(credentials);
	console.log(`${membershipAPIURL}/login`);

	return fetch(`${membershipAPIURL}/login`,{
			body : JSON.stringify(credentials),
			method : 'POST',
			headers : {
				'Content-Type' : 'application/json',
				'X-API-KEY' : token
			}
		})
		.then(res => {
		
			if(res.status !== 200){
				throw res;
			}
			return res.json();
		})
	;

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