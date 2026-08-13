<!--
Author: Vincy SHI
Email: vincy@vincy1230.net
-->

# OpenFold3 Input Builder

纯前端的 [OpenFold3](https://openfold-3.readthedocs.io/en/latest/input_format_reference.html) 输入 JSON 构建器，分步引导用户填写 protein/RNA/DNA/ligand 链、MSA/模板选项与 pocket constraint，严格按官方 schema 生成一份可直接复制使用的 query JSON。内置官方文档给出的全部 7 个示例，可一键加载查看效果。

技术栈：Vue 3 + TypeScript + Vite + Pinia + Vue Router + vue-i18n，部署于 GitHub Pages [of3.vincy1230.net](https://of3.vincy1230.net/)

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
