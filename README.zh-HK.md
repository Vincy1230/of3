<!--
Author: Vincy SHI
Email: vincy@vincy1230.net
-->

[English](./README.md) | [简体中文](./README.zh-CN.md) | **繁體中文**

# OpenFold3 輸入建構器

純前端的 [OpenFold3](https://openfold-3.readthedocs.io/en/latest/input_format_reference.html) 輸入 JSON 建構器，分步引導使用者填寫 protein/RNA/DNA/ligand 鏈、MSA/範本選項與 pocket constraint，嚴格按官方 schema 產生一份可直接複製使用的 query JSON。內置官方文件給出的全部 7 個範例，可一鍵載入查看效果。

技術棧：Vue 3 + TypeScript + Vite + Pinia + Vue Router + vue-i18n，部署於 GitHub Pages [of3.vincy1230.net](https://of3.vincy1230.net/)

## 專案搭建

```sh
npm install
```

### 開發環境（編譯 + 熱更新）

```sh
npm run dev
```

### 生產環境（型別檢查 + 編譯 + 壓縮）

```sh
npm run build
```

### 用 [Vitest](https://vitest.dev/) 跑單元測試

```sh
npm run test:unit
```

### 用 [ESLint](https://eslint.org/) 跑 lint

```sh
npm run lint
```
