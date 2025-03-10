declare module "mermaid" {
  interface MermaidConfig {
    theme?: string
    startOnLoad?: boolean
    securityLevel?: "strict" | "loose" | "antiscript"
    themeVariables?: Record<string, string>
    flowchart?: Record<string, any>
    sequence?: Record<string, any>
    gantt?: Record<string, any>
  }

  interface RenderResult {
    svg: string
    bindFunctions?: (element: Element) => void
  }

  export function initialize(config: MermaidConfig): void
  export function render(
    id: string,
    text: string,
    callback?: (svgCode: string, bindFunctions: (element: Element) => void) => void,
  ): Promise<RenderResult>
}

