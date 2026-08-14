// Author: Vincy SHI
// Email: vincy@vincy1230.net

import { createRouter, createWebHistory } from 'vue-router'
import type { SupportedLocale } from '@/locales'
import { i18n } from '@/locales'
import { applySeoMeta } from '@/composables/useSeoMeta'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { locale: 'en' as SupportedLocale } },
    {
      path: '/en/',
      name: 'home-en',
      component: HomeView,
      meta: { locale: 'en' as SupportedLocale },
    },
    {
      path: '/zh/',
      name: 'home-zh',
      component: HomeView,
      meta: { locale: 'zh-CN' as SupportedLocale },
    },
    {
      path: '/zh-cn/',
      name: 'home-zh-cn',
      component: HomeView,
      meta: { locale: 'zh-CN' as SupportedLocale },
    },
    {
      path: '/zh-hk/',
      name: 'home-zh-hk',
      component: HomeView,
      meta: { locale: 'zh-HK' as SupportedLocale },
    },
    { path: '/:pathMatch(.*)*', redirect: '/en/' },
  ],
})

router.beforeEach((to) => {
  const locale = (to.meta.locale as SupportedLocale | undefined) ?? 'en'
  i18n.global.locale.value = locale
  document.documentElement.lang = locale
  applySeoMeta(locale)
})

export default router
