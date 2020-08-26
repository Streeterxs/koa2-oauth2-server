const log = require('debug')('projects:personssector:babel');
log('server babel config');

module.exports = {
    presets: [
        ['@babel/preset-env', {targets: {node: 'current'}}],
        '@babel/preset-typescript'
    ],
    plugins: [
        // https://github.com/parcel-bundler/parcel/issues/871#issuecomment-370135105
        // https://github.com/babel/babel-loader/issues/560#issuecomment-370180866
        '@babel/plugin-transform-runtime'
    ]
}
