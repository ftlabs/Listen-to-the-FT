/* global document allow-var*/
var __listen_to_the_ft = (function(){

	'use strict';

	var views = {
		login : document.querySelector('.view#login'),
		topics : document.querySelector('.view#topics'),
		audioItems : document.querySelector('.view#audioItems')
	};

	var components = {
		player : document.querySelector('.component#player'),
		loading : document.querySelector('.component#loading'),
		back : document.querySelector('.component#back'),
		overlay : document.querySelector('.component#popup')
	};

	var viewstack = (function(){

		var stack = [];
		function addViewToStack(view){

			if(stack.length > 0){
				stack[ stack.length - 1 ].dataset.animate = 'out-left';
			}

			stack.push(view);

			if(stack.length > 1){
				components.back.dataset.visible = 'true';
			}

			view.dataset.visible = 'true';
			view.dataset.animate = 'in-right';

		}

		function removeLastViewFromStack(){
			if(stack.length > 1){
				var lastView = stack.pop();
				

				lastView.dataset.animate = 'out-right';
				if(stack.length > 0){
					var incomingView = stack[ stack.length - 1 ]; 
					incomingView.dataset.visible = 'true';
					incomingView.dataset.animate = 'in-left';
				}

				if(stack.length <= 1){
					components.back.dataset.visible = 'false';
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

	var overlay = (function(){

		var overlayElement = components.overlay;

		function setOverlayMessage(title, message, buttonText){
			
			if(title){
				overlayElement.querySelector('h3').textContent = title;
			}

			if(message){
				overlayElement.querySelector('p').textContent = message;
			}

			if(buttonText){
				overlayElement.querySelector('button').textContent = buttonText;
			}

		}
		
		function showOverlay(){
			overlayElement.dataset.visible = 'true';
		}

		function hideOverlay(){
			overlayElement.dataset.visible = 'false';
		}

		overlayElement.querySelector('button').addEventListener('click', hideOverlay, false);

		return {
			set : setOverlayMessage,
			show : showOverlay,
			hide : hideOverlay
		};

	}());

	function prevent(e){
		e.stopImmediatePropagation();
		e.preventDefault();
	}

	function playAudio(src){
		console.log(src);
		
		components.player.src = src;

		components.player.dataset.active = 'true';
		components.player.play();

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
					throw 'Could not get user topics';
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

		getAudioForTopic('8a086a54-ea48-3a52-bd3c-5821430c2132')
			.then(items => generateListView( items, 'audioItems', 'Latest Audio Articles'))
			.then(HTML => {
				console.log(HTML);
				views.audioItems.innerHTML = '';
				views.audioItems.appendChild(HTML);
				// views.topics.dataset.visible = 'true';
				viewstack.push(views.audioItems);

			})
		;
	}

	function generateListView(items, type, listTitle){

		console.log(items);

		var docFrag = document.createDocumentFragment();
		const olEl = document.createElement('ol');

		if(!type){

			items.forEach(item => {
				console.log(item);
				var li = document.createElement('li');
				li.textContent = item.name;
				li.dataset.uuid = item.uuid;
				li.dataset.topic = item.name; 

				li.addEventListener('click', function(){
					getAudioForTopic(this.dataset.uuid)
						.then(audioItems => generateListView(audioItems, 'audioItems', this.dataset.topic))
						.then(HTML => {
							views.audioItems.innerHTML = '';
							views.audioItems.appendChild(HTML);
							viewstack.push(views.audioItems);
						})
					;
				}, false);

				olEl.appendChild(li);

			});

		} else if(type === 'audioItems'){
			// debugger;

			if(listTitle){

				var titleElement = document.createElement('div');
				titleElement.setAttribute('class', 'title');
				titleElement.textContent = listTitle;

				docFrag.appendChild(titleElement);

			}

			items.forEach(item => {

				var li = document.createElement('li');
				var hasBeenListenedTo = document.createElement('div');
				
				var textContainer = document.createElement('div');
				var headline = document.createElement('a');
				var byline = document.createElement('span');
				var standfirst = document.createElement('p');
				
				var actionsContainer = document.createElement('div');
				var playBtn = document.createElement('a');
				var readBtn = document.createElement('a');

				hasBeenListenedTo.setAttribute('class', 'hasListened');
				textContainer.setAttribute('class', 'textContainer');
				actionsContainer.setAttribute('class', 'actionsContainer');

				headline.textContent = item.title;
				byline.textContent = item.byline;
				standfirst.textContent = item.standfirst;

				playBtn.textContent = 'Play';
				readBtn.textContent = 'Read';

				playBtn.dataset.audiourl = item.audioUrl;

				(function(item){

					playBtn.addEventListener('click', function(e){
						prevent(e);
						playAudio(this.dataset.audiourl);
					}, false);

					readBtn.addEventListener('click', function(e){
						prevent(e);						
						window.open('https://ft.com/content/' + item.id);
					}, false);

				})(item);

				actionsContainer.appendChild(playBtn);
				actionsContainer.appendChild(readBtn);

				li.appendChild(hasBeenListenedTo);

				textContainer.appendChild(headline);
				textContainer.appendChild(byline);
				textContainer.appendChild(standfirst);
				textContainer.appendChild(actionsContainer);

				li.appendChild(textContainer);

				li.dataset.uuid = item.id;

				li.addEventListener('click', function(){
					components.player.setAttribute('title', item.title);
					this.dataset.expanded === 'true' ? this.dataset.expanded = 'false' : this.dataset.expanded = 'true';
				}, false);

				olEl.appendChild(li);

			});

		}

		docFrag.appendChild(olEl);

		return docFrag;

	}

	function login(creds){
		components.loading.dataset.visible = 'true';
		return fetch('/user/login', {
				body : JSON.stringify(creds),
				method : 'POST',
				headers : {
					'Content-Type' : 'application/json'
				},
				credentials : 'include'
			})
			.then(res => {
				if(res.status !== 200){
					components.loading.dataset.visible = 'false';
					throw 'Login unsuccessful';
				} else {
					components.loading.dataset.visible = 'false';
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
				views.login.dataset.visible = 'false';
				generateFirstView();
			})
			.catch(err => {
				// console.error(err);
				overlay.set(
					'Login Failed', 
					'The credentials passed were not valid.',
					'OK'
				);

				overlay.show();
			})
		;

	}, false);

	if(checkLoginStatus()){
		generateFirstView();
		views.login.dataset.visible = 'false';
	} else {
		views.login.dataset.visible = 'true';
	}

	components.back.addEventListener('click', function(){
		viewstack.pop();
	}, false);

	components.player.addEventListener('ended', function(){
		console.log('Audio finished');
		this.dataset.active = 'false';
	}, false);

	console.log('Script loaded');
	components.loading.dataset.visible = 'false';

}());