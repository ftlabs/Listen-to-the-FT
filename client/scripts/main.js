var __listen_to_the_ft = (function(){

	'use strict';

	var viewstack = (function(){

		var stack = [];

		function addViewToStack(view){


			if(stack.length > 0){
				stack[ stack.length - 1 ].dataset.visible = "false";
			}

			stack.push(view);

			if(stack.length > 1){
				components.back.dataset.visible = "true";
			}

			view.dataset.visible = "true";
			view.dataset.animate = "in-right";

		}

		function removeLastViewFromStack(){

			if(stack.length > 1){
				var lastView = stack.pop();
				
				// lastView.dataset.visible = "false";
				if(stack.length > 0){
					stack[ stack.length - 1 ].dataset.visible = "true";
				}

				if(stack.length <= 1){
					components.back.dataset.visible = "false";
				}

			}

		}

		function clearStack(){
			stack = [];
		}

		return {
			push : addViewToStack,
			pop : removeLastViewFromStack,
			clear : clearStack
		};

	}());

	var views = {
		login : document.querySelector('.view#login'),
		topics : document.querySelector('.view#topics'),
		audioItems : document.querySelector('.view#audioItems')
	};

	var components = {
		player : document.querySelector('.component#player'),
		loading : document.querySelector('.component#loading'),
		back : document.querySelector('.component#back')
	};

	function prevent(e){
		e.stopImmediatePropagation();
		e.preventDefault();
	}

	function playAudio(src){
		console.log(src);
		
		const audioElement = document.querySelector('audio');
		audioElement.src = src;

		components.player.dataset.visible = "true";
		audioElement.play();

	}

	function getAudioForTopic(topicUUIDs){

		console.log(topicUUIDs);
		components.loading.dataset.visible = 'true';
		return fetch(`/audio?topics=${topicUUIDs}`,{credentials : 'include'})
			.then(res => {
				components.loading.dataset.visible = 'false';
				if(res.status !== 200){
					throw `Could not get items for topic ${topicUUIDs}`;
				}
				return res;
			})
			.then(res => res.json())
		;

	}

	function getTopicsForUser(){
		components.loading.dataset.visible = 'true';
		return fetch('/user/topics', {credentials : 'include'})
			.then(res => {
				components.loading.dataset.visible = 'false';
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
		components.loading.dataset.visible = 'true';
		return getTopicsForUser()
			.then(data => {
				console.log(data);
				const UUIDs = data.topics.map(topic => {return topic.uuid}).join();
				return getAudioForTopic(UUIDs)
					.then(allAudio => {

						const topicsWithAudioCount = {};

						allAudio.forEach(a => {

							data.topics.forEach(topic => {

								topic.articles = [];
								const uuid = topic.uuid;
								const uuidIdx = a.hasTopicIDs.indexOf(uuid);
								if(uuidIdx > -1){
									const topicUUID = a.hasTopicIDs[uuidIdx];
									topic.articles.push(a);
								}
	
							});

						});
						components.loading.dataset.visible = 'false';
						return data.topics;

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

	function generateFirstView(){

		getTopicsForUserWithAudio()
			.then(topics => {
				return topics.filter(topic => {
					return topic.articles.length > 0;
				});
			})
			.then(filteredTopics => generateListView( filteredTopics ))
			.then(HTML => {
				console.log(HTML);
				views.topics.innerHTML = "";
				views.topics.appendChild(HTML);
				// views.topics.dataset.visible = "true";
				viewstack.push(views.topics);

			})
		;
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
						.then(audioItems => generateListView(audioItems, "audioItems"))
						.then(HTML => {
							// views.topics.dataset.visible = "false";
							views.audioItems.innerHTML = "";
							views.audioItems.appendChild(HTML);
							// views.audioItems.dataset.visible = "true";
							viewstack.push(views.audioItems);
						})
					;
				}, false);

				olEl.appendChild(li);

			});

		} else if(type === "audioItems"){
			// debugger;
			items.forEach(item => {

				var li = document.createElement('li');
				var hasBeenListenedTo = document.createElement('div');
				var textContainer = document.createElement('div');
				var headline = document.createElement('a');
				var byline = document.createElement('span')
				
				hasBeenListenedTo.setAttribute('class', 'hasListened');
				textContainer.setAttribute('class', 'textContainer');

				headline.textContent = item.title;
				byline.textContent = item.byline;

				li.appendChild(hasBeenListenedTo);

				textContainer.appendChild(headline);
				textContainer.appendChild(byline);

				li.appendChild(textContainer);

				li.dataset.uuid = item.uuid;
				li.dataset.audioURL = item.audioUrl;

				li.addEventListener('click', function(){
					document.title = item.title;
					components.player.setAttribute('title', item.title);
					playAudio(this.dataset.audioURL);
				}, false);

				olEl.appendChild(li);

			});

		}

		docFrag.appendChild(olEl);

		return docFrag;

	}

	function login(creds){
		components.loading.dataset.visible = "true";
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
					components.loading.dataset.visible = "false";
					return res;
				}
			})
			.then(res => res.json())
		;

	}


	views.login.querySelector('form').addEventListener('submit', function(e){

		prevent(e);

		var loginBody = {};

		Array.from(this.querySelectorAll('input:not([type="button"])')).forEach(element => {
			loginBody[element.name] = element.value;
		});

		loginBody.rememberMe = loginBody.rememberMe === 'on';

		login(loginBody)
			.then(result => {
				views.login.dataset.visible = "false";
				generateFirstView();
			})
			.catch(err => {
				console.error(err);
			})
		;

	}, false);

	if(checkLoginStatus()){
		generateFirstView();
		views.login.dataset.visible = "false";
	} else {
		views.login.dataset.visible = "true";
	}

	components.back.addEventListener('click', function(){
		viewstack.pop();
	}, false);

	console.log('Script loaded');
	components.loading.dataset.visible = "false";

}());