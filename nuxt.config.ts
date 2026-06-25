export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', 'shadcn-nuxt', '@nuxt/icon'],
  css: ['~/assets/css/tailwind.css'],
  app: {
    head: {
      htmlAttrs: {
        class: 'dark'
      },
      title: 'Dolphin',
      meta: [
        {
          name: 'description',
          content: 'A minimal desktop YouTube audio downloader.'
        }
      ]
    }
  },
  compatibilityDate: '2024-11-01'
})
