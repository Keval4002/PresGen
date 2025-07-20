// // --- TYPE DEFINITIONS ---

// /**
//  * A coordinate object representing the position and size of an element,
//  * using a percentage-based (0-1) system relative to the canvas.
//  */
// interface LayoutCoordinate {
//   x: number;
//   y: number;
//   w: number;
//   h: number;
// }

// /**
//  * A dictionary mapping element keys (e.g., 'title', 'content', 'image')
//  * to their respective layout coordinates. A value can be null if the element
//  * is not present in a given layout.
//  */
// type LayoutPositions = Record<string, LayoutCoordinate | null>;

// /**
//  * A union of all possible layout names. Using a type ensures that
//  * only valid layout names can be used, preventing typos.
//  */
// type LayoutName =
//   | 'coordinate'
//   | 'title-special'
//   | 'alternating-split'
//   | 'image-content-stack'
//   | 'image-focus'
//   | 'multi-column'
//   | 'compact-list'
//   | 'zigzag-timeline'
//   | 'pyramid'
//   | 'standard-text';

// // --- DISCRIMINATED UNION FOR LAYOUT CONFIGURATIONS ---

// // Base interface for all layout configurations.
// interface BaseLayoutConfig {
//   name: LayoutName;
// }

// interface CoordinateLayoutConfig extends BaseLayoutConfig {
//   name: 'coordinate';
//   params: { positions: LayoutPositions };
// }

// interface TitleSpecialLayoutConfig extends BaseLayoutConfig {
//   name: 'title-special';
//   params: { hasImage?: boolean };
// }

// interface AlternatingSplitLayoutConfig extends BaseLayoutConfig {
//   name: 'alternating-split';
//   params: { isImageLeft?: boolean };
// }

// interface ImageFocusLayoutConfig extends BaseLayoutConfig {
//   name: 'image-focus';
//   params: { isImageLeft?: boolean };
// }

// interface MultiColumnLayoutConfig extends BaseLayoutConfig {
//   name: 'multi-column';
//   params: { columns?: number };
// }

// interface ZigZagTimelineLayoutConfig extends BaseLayoutConfig {
//   name: 'zigzag-timeline';
//   params: { itemCount: number };
// }

// interface PyramidLayoutConfig extends BaseLayoutConfig {
//   name: 'pyramid';
//   params: { itemCount: number };
// }

// interface StandardTextLayoutConfig extends BaseLayoutConfig {
//   name: 'standard-text';
//   params?: { titleHeight?: number };
// }

// // For layouts with no parameters.
// interface SimpleLayoutConfig extends BaseLayoutConfig {
//   name: 'image-content-stack' | 'compact-list';
//   params?: {};
// }

// /**
//  * A discriminated union of all possible layout configurations.
//  * TypeScript will infer the correct `params` type based on the `name`.
//  */
// export type LayoutConfig =
//   | CoordinateLayoutConfig
//   | TitleSpecialLayoutConfig
//   | AlternatingSplitLayoutConfig
//   | ImageFocusLayoutConfig
//   | MultiColumnLayoutConfig
//   | ZigZagTimelineLayoutConfig
//   | PyramidLayoutConfig
//   | StandardTextLayoutConfig
//   | SimpleLayoutConfig;

// /**
//  * The final output object from the layout manager.
//  */
// export interface GeneratedLayout {
//   name: LayoutName;
//   positions: LayoutPositions;
// }


// // --- CLASS DEFINITION ---

// export class SmartLayoutManager {
//     /**
//      * Generates a set of positions based on the provided layout configuration.
//      * @param layoutConfig - A configuration object specifying the layout name and its parameters.
//      * @returns A `GeneratedLayout` object containing the layout name and the calculated positions.
//      */
//     public generatePositions(layoutConfig: LayoutConfig): GeneratedLayout {
//         const { name, params = {} } = layoutConfig;

//         // Using a Record for dispatch provides type safety and extensibility.
//         const layoutMethods: Record<LayoutName, (p: any) => LayoutPositions> = {
//             'coordinate': (p) => p.positions,
//             'title-special': (p) => this.getTitleSpecialPositions(p),
//             'alternating-split': (p) => this.getAlternatingSplitPositions(p),
//             'image-content-stack': () => this.getImageContentStackPositions(),
//             'image-focus': (p) => this.getImageFocusPositions(p),
//             'multi-column': (p) => this.getMultiColumnPositions(p),
//             'compact-list': () => this.getCompactListPositions(),
//             'zigzag-timeline': (p) => this.getZigZagTimelinePositions(p),
//             'pyramid': (p) => this.getPyramidPositions(p),
//             'standard-text': (p) => this.getStandardTextPositions(p),
//         };

//         const generate = layoutMethods[name] || layoutMethods['standard-text'];
//         const positions = generate(params);
        
//         return { name, positions };
//     }
    // --- TYPE DEFINITIONS ---

// interface LayoutCoordinate {
//   x: number;
//   y: number;
//   w: number;
//   h: number;
// }

// type LayoutPositions = Record<string, LayoutCoordinate | null>;

// export type LayoutName =
//   | 'coordinate'
//   | 'title-special'
//   | 'alternating-split'
//   | 'image-content-stack'
//   | 'image-focus'
//   | 'multi-column'
//   | 'compact-list'
//   | 'zigzag-timeline'
//   | 'pyramid'
//   | 'standard-text';

// interface BaseLayoutConfig {
//   name: LayoutName;
// }

// interface CoordinateLayoutConfig extends BaseLayoutConfig {
//   name: 'coordinate';
//   params: { positions: LayoutPositions };
// }

// interface TitleSpecialLayoutConfig extends BaseLayoutConfig {
//   name: 'title-special';
//   params: { hasImage?: boolean };
// }

// interface AlternatingSplitLayoutConfig extends BaseLayoutConfig {
//   name: 'alternating-split';
//   params: { isImageLeft?: boolean };
// }

// interface ImageFocusLayoutConfig extends BaseLayoutConfig {
//   name: 'image-focus';
//   params: { isImageLeft?: boolean };
// }

// interface MultiColumnLayoutConfig extends BaseLayoutConfig {
//   name: 'multi-column';
//   params: { columns?: number };
// }

// interface ZigZagTimelineLayoutConfig extends BaseLayoutConfig {
//   name: 'zigzag-timeline';
//   params: { itemCount: number };
// }

// interface PyramidLayoutConfig extends BaseLayoutConfig {
//   name: 'pyramid';
//   params: { itemCount: number };
// }

// interface StandardTextLayoutConfig extends BaseLayoutConfig {
//   name: 'standard-text';
//   params?: { titleHeight?: number };
// }

// interface SimpleLayoutConfig extends BaseLayoutConfig {
//   name: 'image-content-stack' | 'compact-list';
//   params?: {};
// }

// export type LayoutConfig =
//   | CoordinateLayoutConfig
//   | TitleSpecialLayoutConfig
//   | AlternatingSplitLayoutConfig
//   | ImageFocusLayoutConfig
//   | MultiColumnLayoutConfig
//   | ZigZagTimelineLayoutConfig
//   | PyramidLayoutConfig
//   | StandardTextLayoutConfig
//   | SimpleLayoutConfig;

// export interface GeneratedLayout {
//   name: LayoutName;
//   positions: LayoutPositions;
// }

// // --- CLASS DEFINITION ---

// export class SmartLayoutManager {
//     public generatePositions(layoutConfig: LayoutConfig): GeneratedLayout {
//         const { name, params = {} } = layoutConfig;

//         // Runtime validation
//         if (!this.isValidLayoutName(name)) {
//             throw new Error(`Invalid layout name: ${name}`);
//         }

//         const layoutMethods: Record<LayoutName, (p: any) => LayoutPositions> = {
//             'coordinate': (p) => p.positions,
//             'title-special': (p) => this.getTitleSpecialPositions(p),
//             'alternating-split': (p) => this.getAlternatingSplitPositions(p),
//             'image-content-stack': () => this.getImageContentStackPositions(),
//             'image-focus': (p) => this.getImageFocusPositions(p),
//             'multi-column': (p) => this.getMultiColumnPositions(p),
//             'compact-list': () => this.getCompactListPositions(),
//             'zigzag-timeline': (p) => this.getZigZagTimelinePositions(p),
//             'pyramid': (p) => this.getPyramidPositions(p),
//             'standard-text': (p) => this.getStandardTextPositions(p),
//         };

//         const generate = layoutMethods[name] || layoutMethods['standard-text'];
//         const positions = generate(params);
        
//         return { name, positions };
//     }

//     private isValidLayoutName(name: string): name is LayoutName {
//         const validLayouts: LayoutName[] = [
//             'coordinate',
//             'title-special',
//             'alternating-split',
//             'image-content-stack',
//             'image-focus',
//             'multi-column',
//             'compact-list',
//             'zigzag-timeline',
//             'pyramid',
//             'standard-text'
//         ];
//         return validLayouts.includes(name as LayoutName);
//     }
//     // Centered title for Title, Q&A, Conclusion slides.
//     private getTitleSpecialPositions({ hasImage }: { hasImage?: boolean }): LayoutPositions {
//         return {
//             title: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
//             image: hasImage ? { x: 0.4, y: 0.75, w: 0.2, h: 0.15 } : null
//         };
//     }
    
//     private getStandardTextPositions({ titleHeight = 0.15 }: { titleHeight?: number } = {}): LayoutPositions {
//         const contentY = 0.08 + titleHeight + 0.05;
//         return {
//             title: { x: 0.08, y: 0.08, w: 0.84, h: titleHeight },
//             content: { x: 0.08, y: contentY, w: 0.84, h: 1 - contentY - 0.08 }
//         };
//     }
    
//     private getAlternatingSplitPositions({ isImageLeft }: { isImageLeft?: boolean }): LayoutPositions {
//         const textX = isImageLeft ? 0.55 : 0.08;
//         const imageX = isImageLeft ? 0.08 : 0.55;
//         return {
//             title: { x: textX, y: 0.1, w: 0.37, h: 0.15 },
//             content: { x: textX, y: 0.3, w: 0.37, h: 0.6 },
//             image: { x: imageX, y: 0.15, w: 0.37, h: 0.7 }
//         };
//     }
    
//     private getImageContentStackPositions(): LayoutPositions {
//         return {
//             title: { x: 0.08, y: 0.05, w: 0.84, h: 0.12 },
//             image: { x: 0.1, y: 0.2, w: 0.8, h: 0.4 },
//             content: { x: 0.08, y: 0.65, w: 0.84, h: 0.3 }
//         };
//     }
    
//     private getImageFocusPositions({ isImageLeft }: { isImageLeft?: boolean }): LayoutPositions {
//         const textX = isImageLeft ? 0.72 : 0.08;
//         const imageX = isImageLeft ? 0.08 : 0.32;
//         return {
//             title: { x: textX, y: 0.25, w: 0.2, h: 0.15 },
//             content: { x: textX, y: 0.43, w: 0.2, h: 0.32 },
//             image: { x: imageX, y: 0.15, w: 0.6, h: 0.7 }
//         };
//     }
    
//     private getCompactListPositions(): LayoutPositions {
//         return {
//             title: { x: 0.08, y: 0.08, w: 0.84, h: 0.1 },
//             content: { x: 0.08, y: 0.22, w: 0.84, h: 0.7 }
//         };
//     }
    
//     private getMultiColumnPositions({ columns = 2 }: { columns?: number }): LayoutPositions {
//         const positions: LayoutPositions = { title: { x: 0.05, y: 0.05, w: 0.9, h: 0.1 } };
//         const colWidth = 0.9 / columns;
//         for (let i = 0; i < columns; i++) {
//             positions[`content${i}`] = { x: 0.05 + i * colWidth, y: 0.18, w: colWidth - 0.02, h: 0.77 };
//         }
//         return positions;
//     }
    
//     private getZigZagTimelinePositions({ itemCount }: { itemCount: number }): LayoutPositions {
//         const positions: LayoutPositions = {
//             title: { x: 0.05, y: 0.02, w: 0.9, h: 0.13 },
//             line: { x: 0.5 - 0.0025, y: 0.2, w: 0.005, h: 0.75 }
//         };

//         const totalContentHeight = 0.8;
//         const itemHeight = totalContentHeight / itemCount;
//         const circleSize = Math.min(0.06, itemHeight * 0.6);

//         for (let i = 0; i < itemCount; i++) {
//             const y = 0.18 + i * itemHeight;
//             const isLeft = i % 2 === 0;

//             positions[`item${i}C`] = { x: 0.5 - (circleSize / 2), y: y + (itemHeight / 2) - (circleSize / 2), w: circleSize, h: circleSize };
//             positions[`item${i}T`] = { x: isLeft ? 0.05 : 0.53, y, w: 0.42, h: itemHeight };
//         }
//         return positions;
//     }

//     private getPyramidPositions({ itemCount }: { itemCount: number }): LayoutPositions {
//         const positions: LayoutPositions = { title: { x: 0.05, y: 0.02, w: 0.9, h: 0.13 } };
//         const itemHeight = Math.max(0.1, 0.8 / itemCount);
//         const circleSize = 0.06;

//         for (let i = 0; i < itemCount; i++) {
//             const y = 0.18 + i * itemHeight;
//             positions[`item${i}C`] = { x: 0.1, y: y + (itemHeight / 2) - (circleSize / 2), w: circleSize, h: circleSize };
//             positions[`item${i}T`] = { x: 0.2, y: y, w: 0.7, h: itemHeight };
//         }
//         return positions;
//     }
// }


interface LayoutCoordinate {
  x: number;
  y: number;
  w: number;
  h: number;
}

type LayoutPositions = Record<string, LayoutCoordinate | null>;

export type LayoutName =
  | 'coordinate'
  | 'title-special'
  | 'alternating-split'
  | 'image-content-stack'
  | 'image-focus'
  | 'multi-column'
  | 'compact-list'
  | 'zigzag-timeline'
  | 'pyramid'
  | 'standard-text';

interface BaseLayoutConfig {
  name: LayoutName;
}

interface CoordinateLayoutConfig extends BaseLayoutConfig {
  name: 'coordinate';
  params: { positions: LayoutPositions };
}

interface TitleSpecialLayoutConfig extends BaseLayoutConfig {
  name: 'title-special';
  params: { hasImage?: boolean };
}

interface AlternatingSplitLayoutConfig extends BaseLayoutConfig {
  name: 'alternating-split';
  params: { isImageLeft?: boolean };
}

interface ImageFocusLayoutConfig extends BaseLayoutConfig {
  name: 'image-focus';
  params: { isImageLeft?: boolean };
}

interface MultiColumnLayoutConfig extends BaseLayoutConfig {
  name: 'multi-column';
  params: { columns?: number };
}

interface ZigZagTimelineLayoutConfig extends BaseLayoutConfig {
  name: 'zigzag-timeline';
  params: { itemCount: number };
}

interface PyramidLayoutConfig extends BaseLayoutConfig {
  name: 'pyramid';
  params: { itemCount: number };
}

interface StandardTextLayoutConfig extends BaseLayoutConfig {
  name: 'standard-text';
  params?: { titleHeight?: number };
}

interface SimpleLayoutConfig extends BaseLayoutConfig {
  name: 'image-content-stack' | 'compact-list';
  params?: {};
}

export type LayoutConfig =
  | CoordinateLayoutConfig
  | TitleSpecialLayoutConfig
  | AlternatingSplitLayoutConfig
  | ImageFocusLayoutConfig
  | MultiColumnLayoutConfig
  | ZigZagTimelineLayoutConfig
  | PyramidLayoutConfig
  | StandardTextLayoutConfig
  | SimpleLayoutConfig;

export interface GeneratedLayout {
  name: LayoutName;
  positions: LayoutPositions;
}

export class SmartLayoutManager {
    public generatePositions(layoutConfig: LayoutConfig): GeneratedLayout {
        const { name, params = {} } = layoutConfig;

        if (!this.isValidLayoutName(name)) {
            throw new Error(`Invalid layout name: ${name}`);
        }

        const layoutMethods: Record<LayoutName, (p: any) => LayoutPositions> = {
            'coordinate': (p) => p.positions,
            'title-special': (p) => this.getTitleSpecialPositions(p),
            'alternating-split': (p) => this.getAlternatingSplitPositions(p),
            'image-content-stack': () => this.getImageContentStackPositions(),
            'image-focus': (p) => this.getImageFocusPositions(p),
            'multi-column': (p) => this.getMultiColumnPositions(p),
            'compact-list': () => this.getCompactListPositions(),
            'zigzag-timeline': (p) => this.getZigZagTimelinePositions(p),
            'pyramid': (p) => this.getPyramidPositions(p),
            'standard-text': (p) => this.getStandardTextPositions(p),
        };

        const generate = layoutMethods[name] || layoutMethods['standard-text'];
        const positions = generate(params);
        
        return { name, positions };
    }

    private isValidLayoutName(name: string): name is LayoutName {
        const validLayouts: LayoutName[] = [
            'coordinate',
            'title-special',
            'alternating-split',
            'image-content-stack',
            'image-focus',
            'multi-column',
            'compact-list',
            'zigzag-timeline',
            'pyramid',
            'standard-text'
        ];
        return validLayouts.includes(name as LayoutName);
    }
    
    private getTitleSpecialPositions({ hasImage }: { hasImage?: boolean }): LayoutPositions {
        return { 
            title: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 }, 
            image: hasImage ? { x: 0.4, y: 0.75, w: 0.2, h: 0.15 } : null 
        };
    }
    
    private getStandardTextPositions({ titleHeight = 0.15 }: { titleHeight?: number } = {}): LayoutPositions {
        const contentY = 0.08 + titleHeight + 0.05;
        return { 
            title: { x: 0.08, y: 0.08, w: 0.84, h: titleHeight }, 
            content: { x: 0.08, y: contentY, w: 0.84, h: 1 - contentY - 0.08 } 
        };
    }
    
    private getAlternatingSplitPositions({ isImageLeft }: { isImageLeft?: boolean }): LayoutPositions {
        const textX = isImageLeft ? 0.55 : 0.08;
        const imageX = isImageLeft ? 0.08 : 0.55;
        return { 
            title: { x: textX, y: 0.1, w: 0.37, h: 0.15 }, 
            content: { x: textX, y: 0.3, w: 0.37, h: 0.6 }, 
            image: { x: imageX, y: 0.15, w: 0.37, h: 0.7 } 
        };
    }
    
    private getImageContentStackPositions(): LayoutPositions {
        return { 
            title: { x: 0.08, y: 0.05, w: 0.84, h: 0.12 }, 
            image: { x: 0.1, y: 0.2, w: 0.8, h: 0.4 }, 
            content: { x: 0.08, y: 0.65, w: 0.84, h: 0.3 } 
        };
    }
    
    private getImageFocusPositions({ isImageLeft }: { isImageLeft?: boolean }): LayoutPositions {
        const textX = isImageLeft ? 0.72 : 0.08;
        const imageX = isImageLeft ? 0.08 : 0.32;
        return { 
            title: { x: textX, y: 0.25, w: 0.2, h: 0.15 }, 
            content: { x: textX, y: 0.43, w: 0.2, h: 0.32 }, 
            image: { x: imageX, y: 0.15, w: 0.6, h: 0.7 } 
        };
    }
    
    private getCompactListPositions(): LayoutPositions {
        return { 
            title: { x: 0.08, y: 0.08, w: 0.84, h: 0.1 }, 
            content: { x: 0.08, y: 0.22, w: 0.84, h: 0.7 } 
        };
    }
    
    private getMultiColumnPositions({ columns = 2 }: { columns?: number }): LayoutPositions {
        const positions: LayoutPositions = { title: { x: 0.05, y: 0.05, w: 0.9, h: 0.1 } };
        const colWidth = 0.9 / columns;
        for (let i = 0; i < columns; i++) {
            positions[`content${i}`] = { x: 0.05 + i * colWidth, y: 0.18, w: colWidth - 0.02, h: 0.77 };
        }
        return positions;
    }
    
    private getZigZagTimelinePositions({ itemCount }: { itemCount: number }): LayoutPositions {
        const positions: LayoutPositions = { 
            title: { x: 0.05, y: 0.02, w: 0.9, h: 0.13 },
            line: { x: 0.5 - 0.0025, y: 0.2, w: 0.005, h: 0.75 }
        };

        const totalContentHeight = 0.8;
        const itemHeight = totalContentHeight / itemCount;
        const circleSize = Math.min(0.06, itemHeight * 0.6);

        for (let i = 0; i < itemCount; i++) {
            const y = 0.18 + i * itemHeight;
            const isLeft = i % 2 === 0;

            positions[`item${i}C`] = { x: 0.5 - (circleSize / 2), y: y + (itemHeight / 2) - (circleSize / 2), w: circleSize, h: circleSize };
            positions[`item${i}T`] = { x: isLeft ? 0.05 : 0.53, y, w: 0.42, h: itemHeight };
        }
        return positions;
    }

    private getPyramidPositions({ itemCount }: { itemCount: number }): LayoutPositions {
        const positions: LayoutPositions = { title: { x: 0.05, y: 0.02, w: 0.9, h: 0.13 } };
        const itemHeight = Math.max(0.1, 0.8 / itemCount);
        const circleSize = 0.06;

        for (let i = 0; i < itemCount; i++) {
            const y = 0.18 + i * itemHeight;
            positions[`item${i}C`] = { x: 0.1, y: y + (itemHeight / 2) - (circleSize / 2), w: circleSize, h: circleSize };
            positions[`item${i}T`] = { x: 0.2, y: y, w: 0.7, h: itemHeight };
        }
        return positions;
    }
}