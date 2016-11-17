/* global self caches*/

var CACHE_NAME = "FTLABS-LttFT-V1";
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
];

var fineToFail = [
	'https://origami-build.ft.com/v2/bundles/css?modules=o-fonts@^2.1.3,o-forms@^3.2.2,o-buttons@^4.4.1,o-loading@^1.0.0-beta.1,o-header@^6.11.1',
	'https://origami-build.ft.com/v2/bundles/js?modules=o-fonts@^2.1.3,o-forms@^3.2.2,o-buttons@^4.4.1,o-loading@^1.0.0-beta.1,o-header@^6.11.1'
];

self.addEventListener('install', function(event) {

	event.waitUntil( 
		caches.open(CACHE_NAME).then(function(cache) {
			console.log('Opened cache');

			fineToFail.forEach(item => {

				fetch(item, {mode : 'no-cors'})
					.then(function(response) {

						caches.open(CACHE_NAME)
							.then(function(cache) {
								cache.put(item, response);
							})
						;

					})
				;

			});

			return cache.addAll(itemsToCache);

		})

	);

});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.match(event.request).then(function(response) {
        var fetchPromise = fetch(event.request).then(function(networkResponse) {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        })
        return response || fetchPromise;
      })
    })
  );
});