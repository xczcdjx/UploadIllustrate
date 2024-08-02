// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    pageTransition: { name: 'page', mode: 'out-in' }
  },
  runtimeConfig:{
    isServer: true,
    public:{
      baseUrl:'http://192.168.124.27:3335/v1'
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
