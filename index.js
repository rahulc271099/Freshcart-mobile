/**
 * @format
 */

// Must be the very first import — react-native-gesture-handler needs to
// install its native event handling before anything else (including
// Reanimated/Navigation) touches it.
import 'react-native-gesture-handler';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
