// Author: Vincy SHI
// Email: vincy@vincy1230.net

import { describe, it, expect, beforeEach } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { i18n } from '@/locales'
import router from '@/router'
import App from '../App.vue'

describe('App', () => {
  beforeEach(async () => {
    await router.push('/en/')
    await router.isReady()
  })

  it('mounts and renders the header title along with the main panels', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), i18n, router],
      },
    })
    expect(wrapper.text()).toContain('OpenFold3 Input Builder')
    expect(wrapper.text()).toContain('Queries')
    expect(wrapper.text()).toContain('Generated JSON')
  })
})
