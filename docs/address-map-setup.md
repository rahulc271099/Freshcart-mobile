# Address map picker

The picker uses the existing react-native-maps native providers: Google Maps on Android and Apple Maps on iOS. It does not call Places, Geocoding, Routes, or Google's Geolocation API.

Android requires a billing-enabled Google Cloud project with Maps SDK for Android enabled. Put the Android API key in `android/local.properties` as `MAPS_API_KEY=...`. Restrict it to the app's package name and signing certificate SHA-1; include the release signing certificate for production. Do not commit the key. Rebuild the native app after changing it.

The current iOS Apple Maps provider requires no Google key. Switching iOS to Google Maps additionally requires the react-native-maps/Google CocoaPods subspec, Google SDK initialization with an iOS-restricted key, and a native rebuild.

Device checks still needed: Android/iOS map loading, pan/zoom and confirmation, existing-address centering, denied GPS permission with manual selection, cancellation preserving form values, and backend rejection of out-of-area coordinates. The API remains authoritative for serviceability when saving an address; there is no coordinate-only availability endpoint in this mobile repository.
