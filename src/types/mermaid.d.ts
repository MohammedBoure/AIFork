declare module 'mermaid' {
  export interface MermaidConfig {
    startOnLoad?: boolean;
    theme?: 'default' | 'neutral' | 'dark' | 'forest' | 'base';
    themeVariables?: Record<string, unknown>;
    securityLevel?: 'strict' | 'loose' | 'antiscript';
    fontFamily?: string;
    [key: string]: unknown;
  }

  export interface RenderResult {
    svg: string;
    bindFunctions?: (element: Element) => void;
  }

  const mermaid: {
    initialize: (config: MermaidConfig) => void;
    render: (id: string, text: string) => Promise<RenderResult>;
    run: (options?: unknown) => Promise<void>;
  };

  export default mermaid;
}
