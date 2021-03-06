const debug = require('debug')('bin:lib:concordence');
const extractUUID = require('./extract-uuid');
const canonicalAPIRoot = process.env.CANONICAL_API_URL || `https://api.ft.com/concordances`;

function convertTMEIDToCanonicalUUID(TME){

	const reqURL = `${canonicalAPIRoot}?authority=https://api.ft.com/system/FT-TME&identifierValue=${TME}&apiKey=${process.env.CAPI_KEY}`;

	debug(reqURL);

	return fetch(reqURL)
		.then(res => {
			if(res.status !== 200){
				throw res.status;
			} else {
				return res;
			}

		})
		.then(res => res.json())
		.then(result => {
			return extractUUID(result.concordances[0].concept.id);
		})
	;

}

module.exports = {
	tmeToUUID : convertTMEIDToCanonicalUUID
};