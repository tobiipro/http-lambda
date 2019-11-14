module.exports = {
  presets: [
    '@babel/preset-typescript',
    ['firecloud', {
      '@babel/preset-env': {
        targets: {
          node: '10'
        }
      }
    }]
  ],

  sourceMaps: true,

  retainLines: true
};
