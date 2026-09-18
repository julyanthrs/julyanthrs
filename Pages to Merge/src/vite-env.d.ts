/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional JSON endpoint for the contact form (e.g. Formspree, a serverless function). */
  readonly VITE_CONTACT_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
