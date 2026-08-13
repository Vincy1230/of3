<!--
Author: Vincy SHI
Email: vincy@vincy1230.net
-->

**English** | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-HK.md)

# OpenFold3 Input Builder

A client-side [OpenFold3](https://openfold-3.readthedocs.io/en/latest/input_format_reference.html) input JSON builder. It guides you step by step through protein/RNA/DNA/ligand chains, MSA/template options, and pocket constraints, and generates a query JSON that strictly follows the official schema and is ready to copy and use. All 7 examples from the official docs are built in and can be loaded with one click.

Stack: Vue 3 + TypeScript + Vite + Pinia + Vue Router + vue-i18n, deployed on GitHub Pages at [of3.vincy1230.net](https://of3.vincy1230.net/)

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
