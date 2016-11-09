var __listen_to_the_ft = (function(){

	'use strict';

	var views = {
		login : document.querySelector('.view#login')
	};

	var components = {
		player : document.querySelector('.component#player')	
	};

	function prevent(e){
		e.stopImmediatePropagation();
		e.preventDefault();
	}

	function getTopicsForUser(){
		return fetch('/user/topics', {credentials : 'include'})
			.then(res => {
				if(res.status !== 200){
					console.log(res);
					throw "Could not get user topics"
				}
				return res;
			})
			.then(res => res.json())
		;
	}

	function checkLoginStatus(){

		var cookies = document.cookie.split('; ');
		var kvp = {};
		cookies.forEach(cookie => {
			var cookieSplit = cookie.split('=');
			kvp[cookieSplit[0]] = cookieSplit[1];	
		});
		
		return kvp.ftlabsSession || kvp.ftlabsSecureSession;

	}

	function login(creds){

		return fetch('/user/login', {
				body : JSON.stringify(creds),
				method : "POST",
				headers : {
					'Content-Type' : 'application/json'
				},
				credentials : 'include'
			})
			.then(res => {
				if(res.status !== 200){
					throw "Login unsuccessful";
				} else {
					return res;
				}
			})
			.then(res => res.json())
		;

	}


	views.login.querySelector('form').addEventListener('submit', function(e){

		prevent(e);

		var loginBody = {};

		this.querySelectorAll('input:not([type="button"])').forEach(element => {
			loginBody[element.name] = element.value;
		});

		loginBody.rememberMe = loginBody.rememberMe === 'on';

		login(loginBody)
			.then(result => {
				views.login.dataset.visible = "false";
				getTopicsForUser()
					.then(data => {
						console.log(data);
					})
					.catch(err => {
						console.log(err);
					})
				;
			})
			.catch(err => {
				console.error(err);
			})
		;

	}, false);

	if(checkLoginStatus()){
		views.login.dataset.visible = "false";

		getTopicsForUser()
			.then(data => {
				console.log(data);
			})
			.catch(err => {
				console.log(err);
			})
		;

	}

	console.log('Script loaded');

}());