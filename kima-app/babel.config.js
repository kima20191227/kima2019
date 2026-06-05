module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      // react-native-css-interop 0.2.x babel.js는 react-native-worklets/plugin을
      // 무조건 포함하나 이는 reanimated v4 전용이라 v3 환경에서 빌드 실패 유발.
      // 아래처럼 babel-plugin만 직접 로드해 우회한다.
      require('react-native-css-interop/dist/babel-plugin').default,
      [
        'module-resolver',
        {
          root: ['./'],
          alias: { '@': './src' },
          extensions: ['.ios.js', '.android.js', '.js', '.jsx', '.ts', '.tsx', '.json'],
        },
      ],
    ],
  }
}
