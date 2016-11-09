var __listen_to_the_ft = (function(){

	'use strict';

	function prevent(e){
		e.stopImmediatePropagation();
		e.preventDefault();
	}

	function submitForm(form){

		var destination = form.action;

	}

	document.querySelector('form[data-purpose="login"]').addEventListener('submit', function(e){

		prevent(e);

		var loginBody = {};

		this.querySelectorAll('input:not([type="button"])').forEach(element => {
			loginBody[element.name] = element.value;
		});

		loginBody.rememberMe = loginBody.rememberMe === 'on';

		fetch(this.action, {
				body : JSON.stringify(loginBody),
				method : "POST",
				headers : {
					'Content-Type' : 'application/json'
				}
			})
			.then(res => res.json())
			.then(result => {
				console.log(result);
			})
			.catch(err => {
				console.error(err);
			})
		;

	}, false);

	console.log('Script loaded');

}());