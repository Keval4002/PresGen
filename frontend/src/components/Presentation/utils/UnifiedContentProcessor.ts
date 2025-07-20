// --- Type Definitions ---
export interface IParsedContentItem {
    title: string;
    description: string;
    hasTitle: boolean;
  }
  
  export interface IParsedContent {
    items: IParsedContentItem[];
    totalItems: number;
  }
  
  interface IThemeData {
      background_color?: string;
      primary_color?: string;
      text_color?: string;
      heading_font?: string;
      body_font?: string;
  }
  
  interface IUnifiedTheme {
      background: string;
      primary: string;
      text: string;
      headingFont: string;
      bodyFont: string;
  }
  
  // --- Constants ---
  export const FIXED_FONT_SIZES = {
      TITLE_SLIDE: 44,
      TITLE_NORMAL: 28,
      CONTENT_NORMAL: 16,
      CONTENT_TIMELINE: 14,
  } as const;
  
  // --- Functions ---
  export function ensureHexColor(color: string | undefined | null): string | null {
      if (!color) return null;
      if (color.startsWith('#')) return color;
      if (color.match(/^[0-9A-Fa-f]{6}$/)) return `#${color}`;
      return color;
  }
  
  export function colorToHex(color: string | undefined | null): string | null {
      const hex = ensureHexColor(color);
      return hex ? hex.replace('#', '') : null;
  }
  
  function cleanMarkdown(text: string | undefined | null): string {
      if (!text || typeof text !== 'string') return '';
      return text.replace(/\*\*(.*?)\*\*|\*(.*?)\*/g, '$1$2').replace(/\s+/g, ' ').trim();
  }
  
  export function parseContentForUniformity(content: any): IParsedContent {
      if (!content || typeof content !== 'string') {
          return { items: [], totalItems: 0 };
      }
      
      const boldTitleRegex = /^(?:[-*•▪▫▸▹◦‣⁃]\s*)?\*\*(.*?)\*\*(?::\s*(.*))?$/;
      const lines = content.split('\n').filter(line => line.trim());
      const items: IParsedContentItem[] = [];
      let currentItem: IParsedContentItem | null = null;
  
      for (const line of lines) {
          const trimmed = line.trim();
          const boldMatch = trimmed.match(boldTitleRegex);
  
          if (boldMatch) {
              if (currentItem) items.push(currentItem);
              currentItem = {
                  title: cleanMarkdown(boldMatch[1]),
                  description: cleanMarkdown(boldMatch[2] || ''),
                  hasTitle: true,
              };
          } else {
              const cleanedLine = cleanMarkdown(trimmed.replace(/^[-*•▪▫▸▹◦‣⁃]\s*/, ''));
              if (currentItem) {
                  currentItem.description += (currentItem.description ? ' ' : '') + cleanedLine;
              } else {
                  items.push({ title: '', description: cleanedLine, hasTitle: false });
              }
          }
      }
      if (currentItem) items.push(currentItem);
  
      return { items, totalItems: items.length };
  }
  
  export function generateUnifiedThemeStyles(theme: IThemeData): IUnifiedTheme {
      return {
          background: theme.background_color || '#FFFFFF',
          primary: theme.primary_color || '#1f2937',
          text: theme.text_color || '#374151',
          headingFont: theme.heading_font || 'Inter',
          bodyFont: theme.body_font || 'Inter',
      };
  }