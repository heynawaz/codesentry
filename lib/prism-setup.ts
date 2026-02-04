/**
 * Load Prism and set global so prismjs language components (which expect global Prism) can register.
 * Import this module before any prismjs/components/* imports.
 */
import Prism from "prismjs";

if (typeof globalThis !== "undefined") {
  (globalThis as unknown as { Prism: typeof Prism }).Prism = Prism;
}

export { Prism };
