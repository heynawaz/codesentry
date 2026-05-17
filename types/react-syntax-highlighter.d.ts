declare module "react-syntax-highlighter" {
  import type { ComponentType } from "react";

  export interface SyntaxHighlighterProps {
    language?: string;
    style?: Record<string, React.CSSProperties>;
    children?: string | string[];
    customStyle?: React.CSSProperties;
    codeTagProps?: React.HTMLAttributes<HTMLElement>;
    PreTag?: keyof React.JSX.IntrinsicElements | ComponentType<unknown>;
    showLineNumbers?: boolean;
    wrapLongLines?: boolean;
    [key: string]: unknown;
  }

  export const Light: ComponentType<SyntaxHighlighterProps>;
  export default Light;
}

declare module "react-syntax-highlighter/dist/esm/styles/hljs/github" {
  const style: Record<string, React.CSSProperties>;
  export default style;
}

declare module "react-syntax-highlighter/dist/esm/styles/hljs/atom-one-dark" {
  const style: Record<string, React.CSSProperties>;
  export default style;
}
