const fetch = require('node-fetch');
const debug = require('debug')('bin:lib:get-topic-info');

module.exports = function(topicID){

	return fetch(`${process.env.FT_API_URL}/things/${topicID}`,{
			headers : {
				'X-API-KEY' : process.env.CAPI_KEY
			}
		})
		.then(res => {

			if(res.status !== 200){
				throw res;
			} else {
				return res;
			}
			
		})
		.then(res => res.json())
		.then(data => {
			return data;	
		})
	;

}
