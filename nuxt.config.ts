// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    pageTransition: { name: 'page', mode: 'out-in' }
  },
  runtimeConfig:{
    isServer: true,
    public:{
      baseUrl:'/up',
    }
  },
  devServer: {
    host: '0.0.0.0',
    port: 4002,
  },
  nitro: {
    devProxy: {
      '/up': {
        target: 'http://127.0.0.1:4000/upload',
        // target: 'https://rerain.online/client',
        changeOrigin: true,
        prependPath: true
      },
    }
  },
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@element-plus/nuxt'
  ],
  plugins: [
    '~/plugins/highlight.ts',
  ],
  elementPlus: { /** Options */ }
})
