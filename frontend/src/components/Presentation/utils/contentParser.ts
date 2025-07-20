import { parseContentForUniformity } from '../utils/UnifiedContentProcessor';

interface ParsedItem {
  title: string;
  description: string;
}

export function parseStructuredContent(content: any): ParsedItem[] {
    const result = parseContentForUniformity(content);
    return result.items.map(item => ({
        title: item.title || '',
        description: item.description || ''
    }));
}