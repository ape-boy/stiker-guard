module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@services': './src/services',
          '@stores': './src/stores',
          '@hooks': './src/hooks',
          '@utils': './src/utils',
          '@api': './src/api',
          '@models': './src/models',
          '@navigation': './src/navigation',
          '@config': './src/config',
        },
      },
    ],
  ],
};
