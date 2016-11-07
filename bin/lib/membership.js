const fetch = require('node-fetch');
const debug = require('debug')('listen-to-the-FT:bin:lib:membership')

const membershipAPIURL = process.env.FT_API_URL || `https://api.ft.com`;

function loginUser(credentials, token) {

	if (token === undefined) {
		throw 'A token was not passed for the membership API';
	}

	return fetch(`${membershipAPIURL}/login`, {
		body: JSON.stringify(credentials),
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-API-KEY': token
		}
	}).then(res => {

		if (res.status !== 200) {
			throw res;
		}
		return res.json();
	});

}

function validateSessionFromToken(sessionToken, isSecure) {

	var urlSecure = ""
	if (isSecure) {
		urlSecure = "s/"
	}
	return fetch(`${membershipAPIURL}/sessions/${urlSecure}${sessionToken}`)
	.then(res => {
		if (res.status !== 200) {
			throw res;
		}
		return res.json();
	}).then(data => data.uuid);
}

module.exports = {
	login: loginUser,
	validateSession: validateSessionFromToken
};