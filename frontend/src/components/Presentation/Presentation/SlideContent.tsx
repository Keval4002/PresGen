import React from 'react';
import { FIXED_FONT_SIZES } from '../utils/UnifiedContentProcessor';

interface FormattedItem {
  title: string;
  description: string;
  hasTitle: boolean;
}

interface ThemeData {
  body_font: string;
  text_color: string;
  primary_color: string;
}

interface SlideContentProps {
  formattedItems: FormattedItem[];
  theme: ThemeData;
}

function SlideContent({ formattedItems, theme }: SlideContentProps) {
    if (!formattedItems || formattedItems.length === 0) return null;

    const baseStyle: React.CSSProperties = { 
        fontFamily: theme.body_font, 
        color: theme.text_color,
        fontSize: `${FIXED_FONT_SIZES.CONTENT_NORMAL}px`,
        lineHeight: 1.4
    };
    
    const titleStyle: React.CSSProperties = { 
        fontWeight: '700', 
        color: theme.primary_color,
        fontSize: `${FIXED_FONT_SIZES.CONTENT_NORMAL}px`
    };

    return (
        <div style={{ 
            ...baseStyle, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.4rem', 
            justifyContent: 'flex-start' 
        }}>
            {formattedItems.map(({ title, description, hasTitle }, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ 
                        marginRight: '8px', 
                        color: theme.primary_color, 
                        fontWeight: 'bold',
                        fontSize: `${FIXED_FONT_SIZES.CONTENT_NORMAL * 1.2}px`
                    }}>•</span>
                    <div style={{ flex: 1, wordBreak: 'break-word' }}>
                        {hasTitle && <span style={titleStyle}>{title}{description && ':'} </span>}
                        {description && <span style={baseStyle}>{description}</span>}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default SlideContent;