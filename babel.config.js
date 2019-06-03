module.exports = {
  presets: [
    ['@babel/env', {
      useBuiltIns: false,
      targets: {
        node: 'current'
      }
    }]
  ],
  plugins: [
    ['@babel/plugin-proposal-class-properties', {
      loose: true
    }],
    '@babel/plugin-transform-runtime'
  ]
};