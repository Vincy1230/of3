// Author: Vincy SHI
// Email: vincy@vincy1230.net
//
// 纯数据、零依赖（不引用 Vue/i18n），因此既能被浏览器运行时的
// useSeoMeta.ts 引入，也能被构建后在 Node 里跑的
// scripts/prerender-locales.mjs 直接 import。
//
// description 需要和 src/locales/*.ts 里各语言的 app.subtitle 保持
// 一致——运行时（客户端路由切换）用的是 i18n 的实时文案，这里的副本
// 只服务于构建期生成的静态 HTML，两处如果改动其一记得同步另一处。

export const SITE_URL = 'https://of3.vincy1230.net'
export const OG_IMAGE = `${SITE_URL}/og-image.jpg`

export const LOCALE_PATHS = {
  'zh-CN': '/zh-cn/',
  'zh-HK': '/zh-hk/',
  en: '/en/',
}

export const SUPPORTED_LOCALES = ['zh-CN', 'zh-HK', 'en']

/** 未匹配路径 / 根路径都归到这个语言，作为整站的规范默认语言。 */
export const DEFAULT_LOCALE = 'en'

export const TITLES = {
  'zh-CN': 'OpenFold3 输入构建器 · 结构预测 JSON 生成器',
  'zh-HK': 'OpenFold3 輸入建構器 · 結構預測 JSON 產生器',
  en: 'OpenFold3 Input Builder · Structure-Prediction JSON Generator',
}

export const DESCRIPTIONS = {
  'zh-CN': '分步引导填写 OpenFold3 结构预测输入 JSON',
  'zh-HK': '分步引導填寫 OpenFold3 結構預測輸入 JSON',
  en: 'A step-by-step guided form for building OpenFold3 structure-prediction input JSON',
}

export const KEYWORDS = {
  'zh-CN': 'OpenFold3, 结构预测, 蛋白质结构, JSON 生成器, 生物信息学, AlphaFold, 配体, MSA, Vincy, GitHub',
  'zh-HK': 'OpenFold3, 結構預測, 蛋白質結構, JSON 產生器, 生物信息學, AlphaFold, 配體, MSA, Vincy, GitHub',
  en: 'OpenFold3, structure prediction, protein structure, JSON generator, bioinformatics, AlphaFold, ligand, MSA, Vincy, GitHub',
}

export const OG_LOCALE = {
  'zh-CN': 'zh_CN',
  'zh-HK': 'zh_HK',
  en: 'en_US',
}

export const HREFLANG = {
  'zh-CN': 'zh-Hans',
  'zh-HK': 'zh-Hant-HK',
  en: 'en',
}

export const HTML_LANG = {
  'zh-CN': 'zh-CN',
  'zh-HK': 'zh-HK',
  en: 'en',
}
