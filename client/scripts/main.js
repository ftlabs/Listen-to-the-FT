/* global document localStorage window navigator*/
var __listen_to_the_ft = (function(){

	'use strict';

	var CACHE_NAME = 'FTLABS-LttFT-V2';
	var originalTitle = document.title;
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

	var networkState = (function(){

		var connected = true;
		var networkPoll = undefined;
		var networkHistory = [];
		var MAX_NETWORK_HISTORY = 3;

		function determineNetworkState(){

			while(networkHistory.length > MAX_NETWORK_HISTORY){
				networkHistory.shift();
			}

			var on = 0;
			var off = 0;

			networkHistory.forEach(state => {
				if(state === false ){
					off += 1;
				} else {
					on += 1;
				}
			});

			if(off === networkHistory.length){
				connected = false;
				document.body.dataset.offline = 'true';
			}

			if(connected === false && on === networkHistory.length ){
				connected = true;
				document.body.dataset.offline = 'false';
			}

		}

		function startNetworkInterrogation(interval){

			interval = interval || 1000;

			(function(h){

				networkPoll = setInterval(function(){

					makeRequest('/__reachable')
						.then(res => {
							if(res.status === 200){
								networkHistory.push(true);
							} else {
								networkHistory.push(false);
							}

							determineNetworkState();

						})
						.catch(err => {
							console.log(err);
							networkHistory.push(false);
							determineNetworkState();
						})
					;

				}, interval);

			}(networkHistory));

		}

		function returnNetworkState(){

			return connected;

		}

		function stopNetworkInterrogation(){
			clearInterval(networkPoll);
		}

		return {
			start : startNetworkInterrogation,
			get : returnNetworkState,
			stop : stopNetworkInterrogation
		}

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
			Array.from(document.querySelectorAll('.view')).forEach(view => {
				view.dataset.blurred = 'true';
			});
		}

		function hideOverlay(){
			Array.from(document.querySelectorAll('.view')).forEach(view => {
				view.dataset.blurred = 'false';
			});
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

	function makeRequest(url, options, timeout){

		timeout = timeout || 5000;
		var success = false;
		var tO = new Promise(function(resolve, reject){
				setTimeout(function(){ if(!success){reject('Request timed out.');} else {resolve()} }, timeout);
		});

		return Promise.race( [ tO, fetch(url, options) ] )
			.then(res => {
				success = true;
				return res;
			})
			.catch(err => {
				console.log(err);
				throw {
					timeout : true,
					message : err
				};
			})
		;

	};

	function handleLogin(){
		components.loading.dataset.visible = "false";
		components.menu.dataset.visible = 'false';
		components.drawer.dataset.opened = 'false';
		viewstack.clear();
		views.login.dataset.visible = 'true';

		components.player.dataset.active = 'false';
		components.player.dataset.uuid = '';
		components.player.pause();
		components.player.currentTime = 0;
		components.player.src = '';

	}

	function handleTimeout(){

		components.loading.dataset.visible = 'false';
		overlay.set(
			'Request timeout', 
			'The request to the server took too long, and has timed out. Please reload the app.',
			'OK'
		);
		overlay.show();

	}

	function unknownErrorHandler(){

		overlay.set(
			'Something went wrong', 
			'We\'re not too sure what\'s happened. You can try again, or contact FT Labs for help.',
			'OK'
		);
		overlay.show();

	}

	function purgeUserSpecificCache(){

		localStorage.clear();
		if(navigator.serviceWorker){

			if(navigator.serviceWorker.controller !== undefined){
				try{
					navigator.serviceWorker.controller.postMessage({
						action : 'purgeUserSpecificCache'
					});
				} catch (err){
					console.log('Failed to purge cache', err);
				}

			}

		}

	}

	function checkFileAvailability(url){

		if(window.caches){
		
			return caches.open(CACHE_NAME)
				.then(function(cache){

					return cache.match(new Request(url));

				})
				.then(result => {
					return result !== undefined;
				})
			;
		
		} else {
			return Promise.resolve(null);
		}

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

		return makeRequest(`/audio?topics=${topicUUIDs}`,{credentials : 'include'})
			.then(res => {
				components.loading.dataset.visible = 'false';
				if(res.status !== 200){

					if(res.status === 403 || res.status === 401){
						handleLogin();
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
		return makeRequest('/user/topics', {credentials : 'include'})
			.then(res => {
				components.loading.dataset.visible = 'false';
				if(res.status !== 200){
					console.log(res);

					if(res.status === 403 || res.status === 401){
						handleLogin();
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
			.catch(err => {
				if(err.timeout){
					handleTimeout();
					console.log(err.message);
				}
			})
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
						handleLogin()
						overlay.set(
							'Session has expired', 
							'Please login to continue using this app.',
							'OK'
						);

						overlay.show();
					}

				} else if(err.timeout){
					handleTimeout();
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
			.catch(err => {

				if(err.timeout){
					handleTimeout();
				} else {
					unknownErrorHandler();
				}

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
			.catch(err => {

				if(err.timeout){
					handleTimeout();
				} else {
					unknownErrorHandler();
				}

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
		const offlineEl = document.createElement('div');
		const olEl = document.createElement('ol');
		const iconImg = document.createElement('img');

		offlineEl.textContent = 'Offline Mode';
		offlineEl.classList.add('offline');

		iconImg.setAttribute('src', 'https://www.ft.com/__origami/service/image/v2/images/raw/fticon%3Abrand-ft?url=fticon%253Abrand-ft&source=ftlabs-listen-to-the-ft&width=100&tint=white&fit=cover&format=auto&quality=medium');
		iconImg.classList.add('iconImage');

		docFrag.appendChild(offlineEl);

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
				var downloadBtn = document.createElement('a');

				var dropDownArrow = document.createElement('span');

				textContainer.setAttribute('class', 'textContainer');
				actionsContainer.setAttribute('class', 'actionsContainer');
				dropDownArrow.setAttribute('class', 'dropDownArrow');

				headline.textContent = item.title;
				byline.textContent = item.byline;
				standfirst.textContent = item.standfirst;

				playBtn.textContent = 'Listen';
				readBtn.textContent = 'Read';
				downloadBtn.textContent = 'Download';

				playBtn.dataset.audiourl = item.audioUrl;
				downloadBtn.dataset.audiourl = item.audioUrl;
				
				playBtn.classList.add('play');
				readBtn.classList.add('read');
				downloadBtn.classList.add('download');

				readBtn.setAttribute('href', 'https://ft.com/content/' + item.id);
				readBtn.setAttribute('target', '_blank');

				checkFileAvailability(item.audioUrl)
					.then(available => {

						if(available === true){
							downloadBtn.dataset.downloaded = 'true';
							downloadBtn.textContent = 'Available Offline';
							li.dataset.offline = 'true';

						} else if(available === false){
							li.dataset.offline = 'false';
						} else if(available === null){
							downloadBtn.dataset.visible = 'false';
						}

					})
				;

				(function(item, container){

					playBtn.addEventListener('click', function(e){
						prevent(e);
						document.title = item.title;
						playAudio(this.dataset.audiourl, item.id);
						container.dataset.played = 'true';
						Array.from(document.querySelectorAll('.playing')).forEach(el => {
							el.classList.remove('playing');
						});
						container.classList.add('playing');
					}, false);

					downloadBtn.addEventListener('click', function(e){
						prevent(e);

						if(!networkState.get()){
							overlay.set(
								'No network connection', 
								'Sorry, we\'re unable to download this file without an internet connection.',
								'OK'
							);
							overlay.show();
						} else if(this.dataset.downloaded === 'true' || this.dataset.downloading === 'true'){
							return;
						} else {

							(function(el){

								makeRequest(el.dataset.audiourl, {Origin : window.location.host})
									.then(function(res){
										return res.clone().blob()
											.then(function(){
												return res;
											})
										;
									})
									.then(function(res){

										if(res.status === 200){
											console.log('File downloaded');
											el.dataset.downloaded = 'true';
											el.textContent = 'Available Offline';

											return caches.open(CACHE_NAME)
												.then(function(cache){
													cache.put(el.dataset.audiourl, res);
												})
											;

										} else {
											overlay.set(
												'Download Failed', 
												'Sorry, we tried to download "' + item.title + '" but the request failed. You can tap the "Download" button to try again',
												'OK'
											);
											overlay.show();
											throw res;
										}

									})
									.catch(err => {
										console.log('Download error:',  err);
										this.dataset.downloading = 'false';	
										this.dataset.downloaded = 'false';
										this.textContent = 'Download';
									})
								;

							})(this);

							this.dataset.downloading = 'true';
							this.textContent = 'Downloading...';
						
					}

					}, false);

				})(item, li);

				actionsContainer.appendChild(playBtn);
				actionsContainer.appendChild(readBtn);
				actionsContainer.appendChild(downloadBtn);

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

		olEl.appendChild(iconImg);
		docFrag.appendChild(olEl);

		return docFrag;

	}

	function login(creds){

		components.loading.dataset.visible = 'true';
		purgeUserSpecificCache();
		return makeRequest('/user/login', {
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
				if(err.timeout){
					handleTimeout();
				} else {
					overlay.set(
						'Login Failed', 
						'The credentials passed were not valid.',
						'OK'
					);
					overlay.show();
				}

			})
		;

	}, false);

	function initialise(){
		
		if(checkLoginStatus()){
			generateFirstView();
			views.login.dataset.visible = 'false';
		} else {
			purgeUserSpecificCache();
			components.loading.dataset.visible = 'false';
			views.login.dataset.visible = 'true';
		}

		components.back.addEventListener('click', function(){
			viewstack.pop();
		}, false);

		components.player.addEventListener('ended', function(){
			console.log('Audio finished');
			this.dataset.active = 'false';
			document.title = originalTitle;
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

		networkState.start();

	}


	return{
		init : initialise
	};

}());
