const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

config.resolver.platforms = ['ios', 'android', 'web'];

module.exports = config;