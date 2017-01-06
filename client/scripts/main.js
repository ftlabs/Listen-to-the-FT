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
				trackEvent({
					action : 'networkStatus',
					category : 'connectivity',
					status : 'offline',
					time : Math.floor(new Date() / 1000)
				});
			}

			if(connected === false && on === networkHistory.length ){
				connected = true;
				document.body.dataset.offline = 'false';
				trackEvent({
					action : 'networkStatus',
					category : 'connectivity',
					status : 'online',
					time : Math.floor(new Date() / 1000)
				});
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

	function trackEvent(details){

		details.userid = details.userid || localData.read('uuid');

		document.body.dispatchEvent(new CustomEvent( 'oTracking.event', {
			detail: details,
			bubbles: true
		}));

	}

	function handleLogin(){

		purgeUserSpecificCache();
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

	function cacheItemsForApp(){
		
		if(navigator.serviceWorker){

			if(navigator.serviceWorker.controller !== undefined){
				try{
					navigator.serviceWorker.controller.postMessage({
						action : 'cacheItemsForApp'
					});
				} catch (err){
					console.log('Failed to cache items for app', err);
				}

			}

		}

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

	function clearMediaItemsInCache(){
		
		if(window.caches){
			return caches.open(CACHE_NAME)
				.then(cache => {
					console.log('Cleared:', cache);
					cache.keys().then(function(keys) {
						keys.forEach(function(request, index, array) {
							if(request.url.indexOf('.mp3') > -1){
								cache.delete(request);
							}
						});
					});
				})
			;
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

	function getAudio(src, size){

		return makeRequest(src, {
				mode : 'cors',
				headers : {
					'Range' : `0-${size}`
				}
			}, 120000)
			.then(res => {
				if(res.status !== 200){
					throw res;
				} else {
					return res;
				}
			})
			.then(res => res.blob())
		;

	}

	function playAudio(src, uuid){
		//console.log(src);
		
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

		// console.log(topicUUIDs);

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
					//console.log(res);

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
				//console.log(data);
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

		return kvp['FTSession'] || kvp['FTSession_S'];

	}

	function generateFirstView(){

		getAudioForTopic('8a086a54-ea48-3a52-bd3c-5821430c2132')
			.then(items => generateListView( items, 'audioItems', 'Latest Audio Articles'))
			.then(HTML => {
				//console.log(HTML);
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

		//console.log(sections);

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
				trackEvent({
					action : 'click',
					category : 'menuSection',
					sectionID : section.uuid
				});
			})

			sectionOl.appendChild(sectionLi);

		});

		sectionFrag.appendChild(sectionOl);

		var actionsOl = document.createElement('ol');

		var clearMediaFiles = document.createElement('li');
		var aboutThis = document.createElement('li');
		
		actionsOl.setAttribute('class', 'actions');

		clearMediaFiles.textContent = 'Clear downloaded items';
		aboutThis.textContent = 'About this app';

		clearMediaFiles.addEventListener('click', function(){
			components.drawer.dataset.opened = 'false';
			clearMediaItemsInCache()
				.then(function(){
					Array.from(document.querySelectorAll('li[data-offline="true"]')).forEach(li => {
						li.dataset.offline = 'false';
					});
				})
			;			
		}, false);

		aboutThis.addEventListener('click', function(){
			components.drawer.dataset.opened = 'false';
			overlay.set(
				'Listen to the FT', 
				'This app is an experiment by FT Labs to explore whether subscribers are interested in listening to good quality audio versions of FT articles.',
				'OK'
			);
			overlay.show();

		}, false);

		if(window.caches){
			actionsOl.appendChild(clearMediaFiles);
		}

		actionsOl.appendChild(aboutThis);

		sectionFrag.appendChild(actionsOl);

		return sectionFrag;

	}

	function generateListView(items, type, listTitle){

		//console.log(items);

		var docFrag = document.createDocumentFragment();
		const offlineEl = document.createElement('div');
		const olEl = document.createElement('ol');
		const iconImg = document.createElement('img');

		offlineEl.textContent = 'Offline Mode';
		offlineEl.classList.add('offline');

		iconImg.setAttribute('src', '/assets/images/ftlabs_logo_small.png');
		iconImg.classList.add('iconImage');

		docFrag.appendChild(offlineEl);

		if(!type){

			items.forEach(item => {
				//console.log(item);
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

				var duration = document.createElement('div');
				var dropDownArrow = document.createElement('span');

				textContainer.setAttribute('class', 'textContainer');
				actionsContainer.setAttribute('class', 'actionsContainer');
				duration.setAttribute('class', 'duration');
				dropDownArrow.setAttribute('class', 'dropDownArrow');

				headline.textContent = item.title;
				byline.textContent = item.byline;
				standfirst.textContent = item.standfirst;
				duration.textContent = item.duration.humantime;

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

				downloadBtn.dataset.size = item.size;
				downloadBtn.dataset.humansize = `(${ (item.size / 1048576).toLocaleString('en', {maximumFractionDigits : 2}) } mb)`;

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
						trackEvent({
							action : 'listen',
							category : 'media',
							contentID : item.id
						});
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
							this.dataset.downloading = 'false';	
							this.dataset.downloaded = 'false';
							this.textContent = 'Download';
						} else if(this.dataset.downloaded === 'true' || this.dataset.downloading === 'true'){
							return;
						} else {

							(function(el){

								trackEvent({
									action : 'download',
									category : 'media',
									contentID : item.id
								});

								getAudio(el.dataset.audiourl, item.size)
									.then(data => {
										//console.log(data);
										//console.log('File downloaded');
										el.dataset.downloaded = 'true';
										el.textContent = 'Available Offline';
										container.dataset.offline = 'true';
									})
									.catch(err => {
										console.log('Download error:',  err);
										overlay.set(
											'Download Failed', 
											'Sorry, we tried to download "' + item.title + '" but the request failed. You can tap the "Download" button to try again',
											'OK'
										);
										overlay.show();
										el.dataset.downloading = 'false';	
										el.dataset.downloaded = 'false';
										el.textContent = 'Download';
									})
								;

							})(this);

							this.dataset.downloading = 'true';
							this.textContent = 'Downloading...';
						
					}

					}, false);

					readBtn.addEventListener('click', function(){

						trackEvent({
							action : 'read',
							category : 'media',
							contentID : item.id
						});

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
				li.appendChild(duration);
				li.appendChild(dropDownArrow);

				li.dataset.uuid = item.id;
				li.dataset.played = wasListenedToBefore;

				if(components.player.dataset.uuid === item.id){
					li.classList.add('playing');
				}

				li.addEventListener('click', function(){
					components.player.setAttribute('title', item.title);
					this.dataset.expanded === 'true' ? this.dataset.expanded = 'false' : this.dataset.expanded = 'true';
					trackEvent({
						action : 'click',
						category : 'item',
						expanded : this.dataset.expanded
					});
				}, false);

				olEl.appendChild(li);

			});

		}

		olEl.appendChild(iconImg);
		docFrag.appendChild(olEl);

		return docFrag;

	}

	const loginForm = views.login.querySelector('form');

	function initialise(){
		
		document.body.dispatchEvent(new CustomEvent('oTracking.page', {
			detail: {
				url: document.URL,
				action : 'pageLoaded',
				uuid : localData.read('uuid')
			},
			bubbles: true
		}));


		if(checkLoginStatus()){
			generateFirstView();
			views.login.dataset.visible = 'false';
			if(localData.read('loggedin') === 'false'){
				cacheItemsForApp();
				makeRequest('/user/uuid', {credentials : 'include'})
					.then(res => {
						if(res.status !== 200){
							throw res;
						} else {
							return res;
						}
					})
					.then(res => res.json())
					.then(data => {
						localData.set('loggedin', 'true');
						localData.set('uuid', data.uuid);
						trackEvent({
							action : 'login',
							category : 'app',
							userID : localData.read('uuid')
						});
					})
					.catch(err => {
						console.log(err);
					})
				;
			}
		} else {
			components.loading.dataset.visible = 'false';
			views.login.dataset.visible = 'true';
			localData.set('loggedin', 'false');
		}

		components.back.addEventListener('click', function(){
			viewstack.pop();
		}, false);

		components.player.addEventListener('ended', function(){
			//console.log('Audio finished');
			this.dataset.active = 'false';
			document.title = originalTitle;
			trackEvent({
				action : 'finished',
				category : 'media',
				contentID : this.dataset.uuid
			});
		}, false);

		components.player.addEventListener('play', function(){
			trackEvent({
				action : 'play',
				category : 'media',
				contentID : this.dataset.uuid,
				position : this.currentTime
			});
		}, false);

		components.player.addEventListener('pause', function(){
			trackEvent({
				action : 'pause',
				category : 'media',
				contentID : this.dataset.uuid,
				position : this.currentTime
			});
		}, false);

		components.player.addEventListener('seeked', function(){
			trackEvent({
				action : 'seeked',
				category : 'media',
				contentID : this.dataset.uuid,
				position : this.currentTime
			});
		}, false);

		components.menu.addEventListener('click', function(){

			if(components.drawer.dataset.opened === 'false'){
				components.drawer.dataset.opened = 'true';
				trackEvent({
					action : 'click',
					category : 'menu',
					type : 'opened'
				});
			} else {
				components.drawer.dataset.opened = 'false';
				trackEvent({
					action : 'click',
					category : 'menu',
					type : 'closed'
				});
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
