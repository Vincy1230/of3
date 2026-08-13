<!--
Author: Vincy SHI
Email: vincy@vincy1230.net
-->

[English](./README.md) | **简体中文** | [繁體中文](./README.zh-HK.md)

# OpenFold3 输入构建器

纯前端的 [OpenFold3](https://openfold-3.readthedocs.io/en/latest/input_format_reference.html) 输入 JSON 构建器，分步引导用户填写 protein/RNA/DNA/ligand 链、MSA/模板选项与 pocket constraint，严格按官方 schema 生成一份可直接复制使用的 query JSON。内置官方文档给出的全部 7 个示例，可一键加载查看效果。

技术栈：Vue 3 + TypeScript + Vite + Pinia + Vue Router + vue-i18n，部署于 GitHub Pages [of3.vincy1230.net](https://of3.vincy1230.net/)

## 项目搭建

```sh
npm install
```

### 开发环境（编译 + 热更新）

```sh
npm run dev
```

### 生产环境（类型检查 + 编译 + 压缩）

```sh
npm run build
```

### 用 [Vitest](https://vitest.dev/) 跑单元测试

```sh
npm run test:unit
```

### 用 [ESLint](https://eslint.org/) 跑 lint

```sh
npm run lint
```
