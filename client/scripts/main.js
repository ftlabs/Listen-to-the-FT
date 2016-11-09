var __listen_to_the_ft = (function(){

	'use strict';

	var views = {
		login : document.querySelector('.view#login'),
		topics : document.querySelector('.view#topics')
	};

	var components = {
		player : document.querySelector('.component#player')	
	};

	function prevent(e){
		e.stopImmediatePropagation();
		e.preventDefault();
	}

	function getAudioForTopic(topicUUIDs){

		console.log(topicUUIDs);

		return fetch(`/audio?topics=${topicUUIDs}`,{credentials : 'include'})
			.then(res => {
				if(res.status !== 200){
					throw `Could not get items for topic ${topicUUIDs}`;
				}
				return res;
			})
			.then(res => res.json())
		;

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

	function getTopicsForUserWithAudio(){
		return getTopicsForUser()
			.then(data => {
				console.log(data);
				const UUIDs = data.topics.map(topic => {return topic.uuid}).join();
				return getAudioForTopic(UUIDs)
					.then(allAudio => {

						const topicsWithAudioCount = {};

						allAudio.forEach(a => {
						
							UUIDs.split(',').forEach(uuid => {
						
								const uuidIdx = a.hasTopicIDs.indexOf(uuid);
								if(uuidIdx > -1){
									const topicUUID = a.hasTopicIDs[uuidIdx];
									if(topicsWithAudioCount[topicUUID] !== undefined){
										topicsWithAudioCount[topicUUID] += 1;
									} else {
										topicsWithAudioCount[topicUUID] = 1;
									}
								}
	
							});

						});

						console.log(topicsWithAudioCount);

						return topicsWithAudioCount;

					})
				;
			})
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

	function generateListView(items, type){

		console.log(items);

		var docFrag = document.createDocumentFragment();
		const olEl = document.createElement('ol');

		if(!type){

			items.forEach(item => {

				var li = document.createElement('li');
				li.textContent = item.name;
				li.dataset.uuid = item.uuid;

				li.addEventListener('click', function(){
					getAudioForTopic(this.dataset.uuid)
						.then(audioItems => {
							console.log(audioItems)
						})
					;
				}, false);

				olEl.appendChild(li);

			});			

		}

		/*if(!type){
			return `<ol> ${items.map(item => { return `<li>${item.name}</li>` }).join('') } </ol>`;
		}*/

		docFrag.appendChild(olEl);

		return docFrag;

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

		/*getTopicsForUser()
			.then(data => generateListView(data.topics))
			.then(fragment => {
				console.log(fragment);
				views.topics.dataset.visible = "true";
				views.topics.innerHTML = "";
				views.topics.appendChild(fragment);
			})
			.catch(err => {
				console.log(err);
			})
		;*/

		getTopicsForUserWithAudio();

	}

	console.log('Script loaded');

}());