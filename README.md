# Listen to the FT
An offline-enabled progressive web app for listening to the FT

[Use it](https://listen.ft.com)

[Read the blog about it](http://labs.ft.com/2017/02/listen-to-the-ft)

# Summary

We were asked to explore whether or not FT subscribers would listen to FT content in a podcast and this is what we came up with:

![start](https://cloud.githubusercontent.com/assets/913687/23973963/9c003a3e-09d0-11e7-9998-edbea4c71e83.gif)

# Features 

### Offline-enabled

Using service workers, we were able to create a web app that would function offline.

![offline](https://cloud.githubusercontent.com/assets/913687/23973947/818b8a96-09d0-11e7-8789-c06d5db84b2c.gif)

### Progressively Enhanced

_Listen to the FT_ works great on the web, but, with the inclusion of a manifest and a service workers, it can work even better in modern browsers/platforms. For example, on Android devices, _Listen to the FT_ can be installed to the home screen and run fullscreen using the latest Chrome/Firefox/Samsung Internet browsers.

![icon](https://cloud.githubusercontent.com/assets/913687/23974304/7816a39a-09d2-11e7-8082-1741320a3979.png)

### Download audio content

The inclusion of a service worker also allowed us to to download content ahead of time, so it could be listened to when a network connection isn't readily available or reliable (like travelling on the Tube)

![download](https://cloud.githubusercontent.com/assets/913687/23973981/af95841e-09d0-11e7-8a9d-56d78db360fd.gif)

### Enhanced media controls

Utilizing the newly available [media session APIs](https://developers.google.com/web/updates/2017/02/media-session), we were also able to offer more powerful media controls from the lock screen of Android devices.

![controls](https://cloud.githubusercontent.com/assets/913687/23974321/90c6ce10-09d2-11e7-8414-a567e566e94e.png)
