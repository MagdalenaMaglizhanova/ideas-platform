// src/types/turndown.d.ts

declare module 'turndown' {
  interface TurndownOptions {
    headingStyle?: 'setext' | 'atx';
    hr?: string;
    bulletListMarker?: '-' | '+' | '*';
    codeBlockStyle?: 'indented' | 'fenced';
    fence?: string;
    emDelimiter?: '_' | '*';
    strongDelimiter?: '__' | '**';
    linkStyle?: 'inlined' | 'referenced';
    linkReferenceStyle?: 'full' | 'collapsed' | 'shortcut';
    br?: string;
    preformattedCode?: boolean;
    blankReplacement?: (content: string, node: Node) => string;
    keepReplacement?: (content: string, node: Node) => string;
    defaultReplacement?: (content: string, node: Node) => string;
  }

  interface TurndownService {
    new (options?: TurndownOptions): TurndownService;
    use(plugin: (turndown: TurndownService) => void): TurndownService;
    turndown(html: string): string;
    addRule(key: string, rule: any): TurndownService;
    keep(filter: any): TurndownService;
    remove(filter: any): TurndownService;
    escape(text: string): string;
  }

  const TurndownService: {
    new (options?: TurndownOptions): TurndownService;
  };

  export default TurndownService;
}

declare module 'turndown-plugin-gfm' {
  export function gfm(turndownService: any): void;
}