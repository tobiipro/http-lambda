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
    ]
  }]
};
