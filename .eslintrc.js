module.exports = {
  root: true,

  extends: [
    'firecloud/node'
  ],

  overrides: [{
    files: [
      '*.ts'
    ],

    extends: [
      'firecloud/configs/typescript'
    ],

    rules: {
      'lodash/prefer-noop': 'off',
      'no-dupe-class-members': 'off'
    }
  }]
};
