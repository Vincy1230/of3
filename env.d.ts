/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** ICP 备案号（完整文案），构建时通过环境变量注入，不写死在代码里。 */
  readonly VITE_ICP_CODE?: string
  /** ICP 备案查询链接，构建时通过环境变量注入。 */
  readonly VITE_ICP_URL?: string
  /** 公网安备案号（完整文案），构建时通过环境变量注入，不写死在代码里。 */
  readonly VITE_MPS_CODE?: string
  /** 公网安备案查询链接，构建时通过环境变量注入。 */
  readonly VITE_MPS_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
