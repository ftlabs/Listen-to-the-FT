/* global self caches*/

var CACHE_NAME = 'FTLABS-LttFT-V2';
var itemsToCache = [
	'/',
	'/index.html',
	'/styles.css',
	'/animate.css',
	'/audio.css',
	'/scripts/main.js',
	'https://cdn.polyfill.io/v2/polyfill.min.js?features=fetch',
	'https://www.ft.com/__origami/service/image/v2/images/raw/fticon%3Ahamburger?url=fticon%253Ahamburger&source=ftlabs-listen-to-the-ft&tint=%23505050&fit=cover&format=auto&quality=lowest',
	'https://www.ft.com/__origami/service/image/v2/images/raw/fticon%3Aarrow-up?url=fticon%253Aarrow-up&source=ftlabs-listen-to-the-ft&tint=%23999999&fit=cover&format=auto&quality=medium',
	'https://www.ft.com/__origami/service/image/v2/images/raw/fticon%3Aarrow-down?url=fticon%253Aarrow-down&source=ftlabs-listen-to-the-ft&tint=%23999999&fit=cover&format=auto&quality=medium',
	'https://www.ft.com/__origami/service/image/v2/images/raw/fticon%3Aarrow-left?url=fticon%253Aarrow-left&source=ftlabs-listen-to-the-ft&fit=cover&format=auto&quality=medium',
	'https://www.ft.com/__origami/service/image/v2/images/raw/fticon%3Abrand-ft-masthead?url=fticon%253Abrand-ft-masthead&source=ftlabs-listen-to-the-ft&fit=cover&format=auto&quality=medium',
	'https://origami-build.ft.com/v2/bundles/css?modules=o-fonts@^2.1.3,o-forms@^3.2.2,o-buttons@^4.4.1,o-loading@^1.0.0-beta.1,o-header@^6.11.1',
	'https://origami-build.ft.com/v2/bundles/js?modules=o-fonts@^2.1.3,o-forms@^3.2.2,o-buttons@^4.4.1,o-loading@^1.0.0-beta.1,o-header@^6.11.1'
];

self.addEventListener('install', function(event) {

	event.waitUntil( 
		caches.open(CACHE_NAME).then(function(cache) {
			console.log('Opened cache');
			return cache.addAll(itemsToCache);

		})

	);

});

var routesToNotCache = ['/user/login', '/__reachable'];

self.addEventListener('fetch', function(event) {

	event.respondWith(
		caches.open(CACHE_NAME).then(function(cache) {
			return cache.match(event.request)
				.then(function(response) {
					var fetchPromise = fetch(event.request)
						.then(function(networkResponse) {

							if(event.request.method === 'GET'){

								var shouldCache = true;

								routesToNotCache.forEach(route => {

									if(shouldCache){

										if(event.request.url.indexOf(route) > -1){
											shouldCache = false;
										}

									}

								});

								if(shouldCache){
									cache.put(event.request, networkResponse.clone());
								}

							}

							return networkResponse;
						
						})
					
					;
				
				return response || fetchPromise;
			
			})
		})
	);
});

self.addEventListener('activate', function(event){

	console.log('Service worker activated');
    event.waitUntil(self.clients.claim());

}, false);

self.addEventListener('message', function(event){
	console.log('Service worker received an event', event);

	console.log(event.data.action, event.data.action === 'purgeUserSpecificCache');

	if(event.data.action === 'purgeUserSpecificCache'){
		console.log('Purging cache action recieved');
		purgeURLs(event);
	} 

	if(event.data.action === 'checkFileAvailability'){

		caches.open(CACHE_NAME).then(function(cache) {
			var isAvailable = cache.match(event.data.info)
				.then(Y => {
					console.log(Y, event.data.info);
				})
			;
			console.log('isAvailable', isAvailable);
			// return isAvailable
		})

	}

});

function purgeURLs(event){
	console.log('Purging user cache');
	event.waitUntil(
		caches.keys().then(function(cacheNames) {
			console.log(cacheNames);
			return Promise.all(
				cacheNames.map(function(cacheName) {

					return caches.delete(cacheName);
				
			}) );

		})

	);

}