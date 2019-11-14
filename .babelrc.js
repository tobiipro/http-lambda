module.exports = {
  presets: [
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
