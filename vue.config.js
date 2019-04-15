module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/coalitiontinder/' : '/',
  configureWebpack: {
    resolve: {
      symlinks: false
    }
  },
  chainWebpack: (config) => {
    const svgRule = config.module.rule('svg')
    svgRule.uses.clear()
    svgRule
      .use('vue-svg-loader')
      .loader('vue-svg-loader')
  }
}
