/* global document localStorage window*/
var __listen_to_the_ft = (function(){

	'use strict';

	var localData = (function(){
		
		var storageKey = 'ftlabs-lttFT';
		var stored = localStorage.getItem(storageKey);
		
		function save(){
			localStorage.setItem(storageKey, JSON.stringify( stored ) );
		}

		function addItemForStorage(key, value){
			stored[key] = value;
			save();
		}

		function readItemFromStorage(key){
			return stored[key];
		}


		if(!stored){
			stored = {};
			save();
		} else {
			stored = JSON.parse(stored);
		}

		return {
			set : addItemForStorage,
			read : readItemFromStorage
		};

	})();

	var views = {
		login : document.querySelector('.view#login'),
		topics : document.querySelector('.view#topics'),
		audioItems : document.querySelector('.view#audioItems')
	};

	var components = {
		player : document.querySelector('.component#player'),
		loading : document.querySelector('.component#loading'),
		back : document.querySelector('.component#back'),
		overlay : document.querySelector('.component#popup'),
		menu : document.querySelector('.component#menu'),
		drawer : document.querySelector('.component#drawer')
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
			stack.forEach(view => {
				view.dataset.visible = 'false';
			});
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

	function handleLogin(){
		components.menu.dataset.visible = 'false';
		components.drawer.dataset.opened = 'false';
		viewstack.clear();
		views.login.dataset.visible = 'true';

		components.player.dataset.active = 'false';
		components.player.pause();
		components.player.currentTime = 0;

	}

	function hasAudioBeenPlayed(audioID){

		var listenedToArticles = localData.read('playedArticles');

		if(listenedToArticles === undefined){
			localData.set('playedArticles', []);
			return false;
		} else {
			return listenedToArticles.some(idsOfItemsListenedTo => { return idsOfItemsListenedTo === audioID });
		}

	}

	function playAudio(src, uuid){
		console.log(src);
		
		components.player.src = src;
		components.player.dataset.uuid = uuid;

		components.player.dataset.active = 'true';
		components.player.play();

		if(uuid){
			var playedItems = localData.read('playedArticles') === undefined ? [] : localData.read('playedArticles');
			playedItems.push(uuid);
			localData.set('playedArticles', playedItems);
		}

	}

	function getAudioForTopic(topicUUIDs, inBackground){

		console.log(topicUUIDs);

		if(!inBackground){
			components.loading.dataset.visible = 'true';
		}

		return fetch(`/audio?topics=${topicUUIDs}`,{credentials : 'include'})
			.then(res => {
				components.loading.dataset.visible = 'false';
				if(res.status !== 200){

					if(res.status === 403 || res.status === 401){
						throw {
							message : 'Session has expired',
							statCode : res.status
						};
							
					} else {
						throw `Could not get items for topic ${topicUUIDs}`;
					}

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

					if(res.status === 403 || res.status === 401){
						throw {
							message : 'Session has expired',
							statCode : res.status
						};
							
					} else {
						throw 'Could not get user topics';
					}

				}
				return res;
			})
			.then(res => res.json())
		;
	}

	function getTopicsForUserWithAudio(inBackground){

		if(!inBackground){
			components.loading.dataset.visible = 'true';
		}

		return getTopicsForUser()
			.then(data => {
				console.log(data);
				const UUIDs = data.topics.map(topic => {return topic.uuid}).join();
				return getAudioForTopic(UUIDs, inBackground)
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

						if(!inBackground){
							components.loading.dataset.visible = 'false';
						}

						return data.topics;

					})
				;
			})
			.catch(err => {
				
				if(err.statCode){

					if(err.statCode === 401 || err.statCode === 403){
						// handleLogin()
						overlay.set(
							'Session has expired', 
							'Please login to continue using this app.',
							'OK'
						);

						overlay.show();
					}

				}

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
				components.menu.dataset.visible = 'true';
				views.audioItems.innerHTML = '';
				views.audioItems.appendChild(HTML);
				viewstack.push(views.audioItems);
			})
		;

		getTopicsForUserWithAudio(true)
			.then(topics => {
				return topics.filter(topic => {
					return topic.articles.length > 0;
				});
			})
			.then(filteredTopics => generateMenu( filteredTopics ))
			.then(HTML => {

				components.drawer.innerHTML = "";
				components.drawer.appendChild(HTML);

			})
		;

	}

	function generateMenu(sections){

		console.log(sections);

		var sectionFrag = document.createDocumentFragment();
		var titleEl = document.createElement('div');
		var sectionOl = document.createElement('ol');

		titleEl.setAttribute('class', 'title');
		titleEl.textContent = "My Sections";
		sectionFrag.appendChild(titleEl);

		sections.forEach(section => {

			var sectionLi = document.createElement('li');
			sectionLi.textContent = section.name;

			sectionLi.dataset.topic = section.name;
			sectionLi.dataset.uuid = section.uuid;

			// Warm up the service worker
			getAudioForTopic(section.uuid, true);

			sectionLi.addEventListener('click', function(e){
				prevent(e);
				getAudioForTopic(this.dataset.uuid)
					.then(items => generateListView(items, 'audioItems', this.dataset.topic))
					.then(HTML => {
						components.drawer.dataset.opened = 'false';
						views.audioItems.innerHTML = "";
						views.audioItems.appendChild(HTML);
					})
					.catch(err => {
						if(err.statCode){

							if(err.statCode === 401 || err.statCode === 403){
								handleLogin();
								overlay.set(
									'Session has expired', 
									'Please login to continue using this app.',
									'OK'
								);

								overlay.show();
							}

						}
					})
				;
			})

			sectionOl.appendChild(sectionLi);

		});

		sectionFrag.appendChild(sectionOl);

		return sectionFrag;

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
				var wasListenedToBefore = hasAudioBeenPlayed(item.id);

				var textContainer = document.createElement('div');
				var headline = document.createElement('a');
				var byline = document.createElement('span');
				var standfirst = document.createElement('p');
				
				var actionsContainer = document.createElement('div');
				var playBtn = document.createElement('a');
				var readBtn = document.createElement('a');

				var dropDownArrow = document.createElement('span');

				textContainer.setAttribute('class', 'textContainer');
				actionsContainer.setAttribute('class', 'actionsContainer');
				dropDownArrow.setAttribute('class', 'dropDownArrow');

				headline.textContent = item.title;
				byline.textContent = item.byline;
				standfirst.textContent = item.standfirst;

				playBtn.textContent = 'Listen';
				readBtn.textContent = 'Read';

				playBtn.dataset.audiourl = item.audioUrl;

				(function(item, container){

					playBtn.addEventListener('click', function(e){
						prevent(e);
						playAudio(this.dataset.audiourl, item.id);
						container.dataset.played = 'true';
						document.querySelectorAll('.playing').forEach(el => {
							el.classList.remove('playing');
						});
						container.classList.add('playing');
					}, false);

					readBtn.addEventListener('click', function(e){
						prevent(e);						
						window.open('https://ft.com/content/' + item.id);
					}, false);

				})(item, li);

				actionsContainer.appendChild(playBtn);
				actionsContainer.appendChild(readBtn);

				textContainer.appendChild(headline);
				textContainer.appendChild(byline);
				textContainer.appendChild(standfirst);
				textContainer.appendChild(actionsContainer);

				li.appendChild(textContainer);
				li.appendChild(dropDownArrow);

				li.dataset.uuid = item.id;
				li.dataset.played = wasListenedToBefore;

				if(components.player.dataset.uuid === item.id){
					li.classList.add('playing');
				}

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
				components.menu.dataset.visible = 'true';
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

	components.menu.addEventListener('click', function(){

		if(components.drawer.dataset.opened === 'false'){
			components.drawer.dataset.opened = 'true';
		} else {
			components.drawer.dataset.opened = 'false';
		}

	}, false);

	console.log('Script loaded');
	components.loading.dataset.visible = 'false';

}());