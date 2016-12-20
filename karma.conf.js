const webpackConfig = require('./webpack.config');

module.exports = config => {
    config.set({
        basePath: '',
        frameworks: [ 'mocha', 'chai' ],
        files: [
            'test/**/*.tests.ts'
        ],
        preprocessors: {
            'test/**/*.tests.ts': [ 'webpack' ]
        },
        webpack: webpackConfig,
        webpackMiddleware: {
            stats: {
                assets: false,
                children: false,
                chunks: false
            }
        },
        beforeMiddleware: [
            'webpackBlocker'
        ],
        mime: {
            'text/x-typescript': ['ts','tsx']
        },
        reporters: 'dots',
        colors: true,
        client: {
            mocha: {
                reporter: 'html'
            }
        },
        autoWatch: true,
        browsers: [ 'Firefox', 'Chromium' ]
    });
};