// https://nuxt.com/docs/api/configuration/nuxt-config
import { fontless } from 'fontless'

const archivo = (file: string, unicodeRange: string, preload = false) => ({
  name: 'Archivo',
  src: [new URL(`./app/assets/fonts/${file}.woff2`, import.meta.url).href],
  weight: [100, 900] as [number, number],
  stretch: '100% 125%',
  style: 'normal',
  display: 'swap' as const,
  variableAxis: { wdth: [[100, 125] as [number, number]] },
  unicodeRange: unicodeRange.split(', '),
  preload,
})

const holdPaintForFont = `(function(d,c){if(!d.fonts)return;function show(){c.remove('font-pending')}c.add('font-pending');d.fonts.load('1em Archivo').then(show,show);setTimeout(show,500)})(document,document.documentElement.classList)`

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@comark/vue',
    '@nuxt/test-utils',
  ],
  devtools: { enabled: true },
  app: {
    head: {
      htmlAttrs: { lang: 'en-GB' },
      link: [
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      ],
      meta: [
        { name: 'theme-color', content: '#f4f4f1', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#1b1b19', media: '(prefers-color-scheme: dark)' },
      ],
      script: [
        { key: 'font-pending', innerHTML: holdPaintForFont, tagPosition: 'bodyOpen' },
      ],
    },
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      optimiseAvatars: !!process.env.VERCEL,
    },
  },
  experimental: {
    typedPages: true,
    viewTransition: true,
  },
  compatibilityDate: '2025-09-03',
  nitro: {
    static: true,
  },
  vite: {
    plugins: [
      fontless({
        defaults: {
          fallbackInstances: [
            { weight: 600 },
            { weight: 700 },
            { weight: 800 },
            { weight: 700, stretch: '125%' },
          ],
        },
        families: [
          archivo('archivo-latin', 'U+0020-007E, U+00A0, U+00B7, U+2009, U+2013-2014, U+2018-2019, U+201C-201D, U+2026', true),
          archivo('archivo-latin', 'U+00A1-00B6, U+00B8-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-2008, U+200A-2012, U+2015-2017, U+201A-201B, U+201E-2025, U+2027-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'),
          archivo('archivo-latin-ext', 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF'),
        ],
      }),
    ],
  },
  eslint: {
    config: {
      stylistic: true,
    },
  },
  server: {
    builder: 'vite',
  },
})
