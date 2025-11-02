/**
 * 스티커 가드 - 앱 진입점
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// React Native 앱 등록
AppRegistry.registerComponent(appName, () => App);
