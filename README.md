# Listen to the FT
An offline-enabled progressive web app for listening to the FT

[Use it](https://listen.ft.com)

[Read the blog about it](http://labs.ft.com/2017/02/listen-to-the-ft/)

# Summary

We were asked to explore whether or not FT subscribers would listen to FT content in a podcast and this is what we came up with:

![start](https://cloud.githubusercontent.com/assets/913687/23973963/9c003a3e-09d0-11e7-9998-edbea4c71e83.gif)


# Features 

### Offline-enabled


![offline](https://cloud.githubusercontent.com/assets/913687/23973947/818b8a96-09d0-11e7-8789-c06d5db84b2c.gif)

Using service workers, we were able to create a web app that would function offline.

### Progressively Enhanced

_Listen to the FT_ works create on the web, but, with the inclusion of a manifest and a service workers, it can work even better in modern browsers on platforms. For example on Android devices, _Listen to the FT_ can be installed to the home screen and run full screen using the latest Chrome/Firefox/Samsung Internet browsers.

### Download audio content

The inclusion of a service worker also allowed us to to download content ahead of time, so it could be listened to when a network connection isn't readily available or reliable (like travelling on the Tube)

![download](https://cloud.githubusercontent.com/assets/913687/23973981/af95841e-09d0-11e7-8a9d-56d78db360fd.gif)
