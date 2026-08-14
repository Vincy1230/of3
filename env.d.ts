/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** ICP 备案号 */
  readonly VITE_ICP_CODE?: string
  /** ICP 备案链接 */
  readonly VITE_ICP_URL?: string
  /** 公网安备案号 */
  readonly VITE_MPS_CODE?: string
  /** 公网安备案链接 */
  readonly VITE_MPS_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
