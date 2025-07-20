import { parseContentForUniformity, IParsedContent } from './UnifiedContentProcessor';
import { LayoutConfig, LayoutName } from './SmartLayoutManager';

type ContentDensity = 'empty' | 'sparse' | 'normal' | 'dense' | 'very-dense';

interface SlideData {
  type: string;
  content: any;
  imageUrl?: string;
  layout?: any;
  title?: string;
}

export class IntelligentLayoutAnalyzer {
    private _getContentDensity(parsedContent: IParsedContent): ContentDensity {
        const { totalItems, items } = parsedContent;
        const totalChars = items.reduce((sum, item) => sum + (item.title?.length || 0) + (item.description?.length || 0), 0);
        
        if (totalItems === 0) return 'empty';
        if (totalItems <= 3 && totalChars < 200) return 'sparse';
        if (totalItems <= 6 && totalChars < 500) return 'normal';
        if (totalItems <= 9 && totalChars < 800) return 'dense';
        return 'very-dense';
    }

    analyzeContent(slide: SlideData, slideIndex: number = 0): LayoutConfig {
        const { type, content, imageUrl, layout, title } = slide;
        const parsedContent = parseContentForUniformity(content);
        const { totalItems } = parsedContent;
        
        if (type === 'TitleSlide' || type === 'Q&A') return { name: 'title-special', params: { hasImage: !!imageUrl } };
        if (type === 'Coordinate' && layout) return { name: 'coordinate', params: { positions: layout } };

        const contentDensity = this._getContentDensity(parsedContent);
        
        if (imageUrl) {
            if (contentDensity === 'very-dense') return { name: 'image-content-stack' };
            if (contentDensity === 'sparse') return { name: 'image-focus', params: { isImageLeft: slideIndex % 2 === 0 } };
            return { name: 'alternating-split', params: { isImageLeft: slideIndex % 2 === 0 } };
        }

        if (contentDensity === 'very-dense') {
             if (totalItems > 12) return { name: 'multi-column', params: { columns: 2 } };
             return { name: 'compact-list' };
        }
        if (totalItems >= 5 && totalItems <= 9) return { name: 'zigzag-timeline', params: { itemCount: totalItems } };
        if (totalItems >= 3 && totalItems <= 4) return { name: 'pyramid', params: { itemCount: totalItems } };
        
        const titleLength = (title || '').length;
        let titleHeight = 0.15;
        if(titleLength > 100) titleHeight = 0.25;
        else if (titleLength > 50) titleHeight = 0.2;
        return { name: 'standard-text', params: { titleHeight } };
    }
}