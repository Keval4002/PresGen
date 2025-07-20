import express from 'express';
const router = express.Router();
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Template from '../models/TemplateModel.js';
import JSZip from 'jszip';
import xml2js from 'xml2js';
import puppeteer from 'puppeteer';
import pptx2html from 'pptx2html';
// You may need to install and require a PPTX parsing library, e.g. pptx-parse or pptx2json
// const pptxParse = require('pptx-parse');

const upload = multer({ dest: 'uploads/' });

async function extractPptxTheme(filePath) {
  const data = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(data);
  // 1. Parse theme1.xml for colors and fonts
  const themeXml = await zip.file('ppt/theme/theme1.xml').async('string');
  const theme = await xml2js.parseStringPromise(themeXml);
  // Extract colors
  const colorScheme = theme['a:theme']['a:themeElements'][0]['a:clrScheme'][0];
  const colors = {
    background: colorScheme['a:bg1']?.[0]['a:srgbClr']?.[0]?.$.val || '#FFFFFF',
    text: colorScheme['a:tx1']?.[0]['a:srgbClr']?.[0]?.$.val || '#000000',
    accent1: colorScheme['a:accent1']?.[0]['a:srgbClr']?.[0]?.$.val,
    accent2: colorScheme['a:accent2']?.[0]['a:srgbClr']?.[0]?.$.val,
    accent3: colorScheme['a:accent3']?.[0]['a:srgbClr']?.[0]?.$.val,
    accent4: colorScheme['a:accent4']?.[0]['a:srgbClr']?.[0]?.$.val,
    accent5: colorScheme['a:accent5']?.[0]['a:srgbClr']?.[0]?.$.val,
    accent6: colorScheme['a:accent6']?.[0]['a:srgbClr']?.[0]?.$.val,
  };
  // Extract fonts
  const fontScheme = theme['a:theme']['a:themeElements'][0]['a:fontScheme'][0];
  const fonts = {
    heading: fontScheme['a:majorFont'][0]['a:latin'][0].$.typeface,
    body: fontScheme['a:minorFont'][0]['a:latin'][0].$.typeface,
  };
  // 2. Parse slide layouts
  const layouts = [];
  const layoutFiles = Object.keys(zip.files).filter(f => f.startsWith('ppt/slideLayouts/slideLayout'));
  for (const layoutFile of layoutFiles) {
    const layoutXml = await zip.file(layoutFile).async('string');
    const layout = await xml2js.parseStringPromise(layoutXml);
    layouts.push({
      name: layout['p:sldLayout']?.['$']?.['name'] || 'Unknown',
      placeholders: layout['p:sldLayout']?.['p:ph'] || [],
    });
  }
  // 3. Parse background style (from first slide or theme)
  const background = 'solid'; // or 'gradient', 'image' based on XML
  // 4. Default text styles (from theme or layouts)
  const defaultTextStyles = {
    titleSize: 44, // Example, parse from XML
    bodySize: 32,  // Example, parse from XML
  };
  return {
    colors,
    fonts,
    layouts,
    background,
    ...defaultTextStyles,
  };
}

// --- Add: Deep layout/placeholder and slide content extraction ---
async function extractPptxLayoutsAndPlaceholders(zip, xml2js) {
  const layouts = [];
  const layoutFiles = Object.keys(zip.files).filter(f => f.startsWith('ppt/slideLayouts/slideLayout'));
  for (const layoutFile of layoutFiles) {
    const layoutXml = await zip.file(layoutFile).async('string');
    const layout = await xml2js.parseStringPromise(layoutXml);
    const layoutRoot = layout['p:sldLayout'];
    const name = layoutRoot?.['$']?.['name'] || 'Unknown';
    // Placeholders: can be in p:spTree > p:ph or p:spTree > p:sp > p:nvSpPr > p:nvPr > p:ph
    let placeholders = [];
    const spTree = layoutRoot?.['p:cSld']?.[0]?.['p:spTree']?.[0];
    if (spTree) {
      // Find all shapes with a placeholder
      const shapes = spTree['p:sp'] || [];
      for (const shape of shapes) {
        const nvPr = shape['p:nvSpPr']?.[0]?.['p:nvPr']?.[0];
        const ph = nvPr?.['p:ph']?.[0];
        if (ph) {
          placeholders.push({
            type: ph['$']?.type || 'body',
            idx: ph['$']?.idx,
            sz: ph['$']?.sz,
            name: shape['p:nvSpPr']?.[0]?.['p:cNvPr']?.[0]?.['$']?.name,
          });
        }
      }
    }
    layouts.push({ name, placeholders });
  }
  return layouts;
}

async function extractPptxSlides(zip, xml2js) {
  const slides = [];
  const slideFiles = Object.keys(zip.files).filter(f => f.startsWith('ppt/slides/slide') && f.endsWith('.xml'));
  // Map slide layout rels
  const relsFiles = {};
  for (const slideFile of slideFiles) {
    const relsPath = slideFile.replace('slides/', 'slides/_rels/') + '.rels';
    if (zip.files[relsPath]) {
      const relsXml = await zip.file(relsPath).async('string');
      relsFiles[slideFile] = await xml2js.parseStringPromise(relsXml);
    }
  }
  // Map slide layoutId to layout file
  const slideIdToLayout = {};
  const presentationXml = await zip.file('ppt/presentation.xml').async('string');
  const presentation = await xml2js.parseStringPromise(presentationXml);
  const sldIdLst = presentation['p:presentation']?.['p:sldIdLst']?.[0]?.['p:sldId'] || [];
  for (let i = 0; i < sldIdLst.length; i++) {
    const rId = sldIdLst[i]['$']['r:id'];
    // Find mapping in ppt/_rels/presentation.xml.rels
    if (!zip.files['ppt/_rels/presentation.xml.rels']) continue;
    const presRelsXml = await zip.file('ppt/_rels/presentation.xml.rels').async('string');
    const presRels = await xml2js.parseStringPromise(presRelsXml);
    const rel = (presRels.Relationships.Relationship || []).find(r => r['$'].Id === rId);
    if (rel) {
      slideIdToLayout[`ppt/slides/slide${i+1}.xml`] = rel['$'].Target;
    }
  }
  for (const slideFile of slideFiles) {
    const slideXml = await zip.file(slideFile).async('string');
    const slide = await xml2js.parseStringPromise(slideXml);
    const cSld = slide['p:sld']?.['p:cSld']?.[0];
    const spTree = cSld?.['p:spTree']?.[0];
    let title = '';
    let content = '';
    let images = [];
    // Extract text from shapes
    const shapes = spTree?.['p:sp'] || [];
    for (const shape of shapes) {
      const txBody = shape['p:txBody']?.[0];
      if (txBody) {
        const paras = txBody['a:p'] || [];
        const text = paras.map(p => (p['a:r'] || []).map(r => r['a:t']?.[0] || '').join('')).join('\n');
        // Heuristic: first shape with text is title, rest is content
        if (!title && text) title = text;
        else if (text) content += (content ? '\n' : '') + text;
      }
    }
    // Extract images
    const pics = spTree?.['p:pic'] || [];
    for (const pic of pics) {
      // Find image relId
      const blip = pic['p:blipFill']?.[0]?.['a:blip']?.[0];
      const embed = blip?.['$']?.['r:embed'];
      if (embed && relsFiles[slideFile]) {
        const rel = (relsFiles[slideFile].Relationships.Relationship || []).find(r => r['$'].Id === embed);
        if (rel) {
          const imgPath = 'ppt/' + rel['$'].Target.replace('..', '').replace(/^\//, '');
          if (zip.files[imgPath]) {
            // Optionally, save image to disk or encode as base64
            images.push({ src: imgPath });
          }
        }
      }
    }
    slides.push({ title, content, images, layoutRef: slideIdToLayout[slideFile], rawXml: slideXml });
  }
  return slides;
}

// POST /api/templates/import
router.post('/import', upload.single('ppt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const data = fs.readFileSync(req.file.path);
    const zip = await JSZip.loadAsync(data);
    // Extract theme/colors/fonts
    const themeXml = await zip.file('ppt/theme/theme1.xml').async('string');
    const theme = await xml2js.parseStringPromise(themeXml);
    const colorScheme = theme['a:theme']['a:themeElements'][0]['a:clrScheme'][0];
    const colors = {
      background: colorScheme['a:bg1']?.[0]['a:srgbClr']?.[0]?.$.val || '#FFFFFF',
      text: colorScheme['a:tx1']?.[0]['a:srgbClr']?.[0]?.$.val || '#000000',
      accent1: colorScheme['a:accent1']?.[0]['a:srgbClr']?.[0]?.$.val,
      accent2: colorScheme['a:accent2']?.[0]['a:srgbClr']?.[0]?.$.val,
      accent3: colorScheme['a:accent3']?.[0]['a:srgbClr']?.[0]?.$.val,
      accent4: colorScheme['a:accent4']?.[0]['a:srgbClr']?.[0]?.$.val,
      accent5: colorScheme['a:accent5']?.[0]['a:srgbClr']?.[0]?.$.val,
      accent6: colorScheme['a:accent6']?.[0]['a:srgbClr']?.[0]?.$.val,
    };
    const fontScheme = theme['a:theme']['a:themeElements'][0]['a:fontScheme'][0];
    const fonts = {
      heading: fontScheme['a:majorFont'][0]['a:latin'][0].$.typeface,
      body: fontScheme['a:minorFont'][0]['a:latin'][0].$.typeface,
    };
    // Deep layouts/placeholders
    const layouts = await extractPptxLayoutsAndPlaceholders(zip, xml2js);
    // Slides/content
    const slides = await extractPptxSlides(zip, xml2js);

    // --- Convert PPTX to PDF, then PDF to PNGs ---
    const { execSync } = await import('child_process');
    const os = await import('os');
    const tempDir = os.tmpdir();
    const pptxPath = req.file.path;
    const outputDir = path.join(tempDir, `pptx_import_${Date.now()}`);
    fs.mkdirSync(outputDir);
    let pdfPath = '';
    let slide_images = [];
    let cover_image_url = 'https://via.placeholder.com/400x300?text=Cover+Page';
    try {
      // 1. Convert PPTX to PDF
      execSync(`soffice --headless --convert-to pdf "${pptxPath}" --outdir "${outputDir}"`, { stdio: 'ignore' });
      // Find the PDF file
      const pdfFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.pdf'));
      if (pdfFiles.length === 0) throw new Error('PDF not generated');
      pdfPath = path.join(outputDir, pdfFiles[0]);
      // 2. Convert PDF to PNGs (one per slide)
      execSync(`magick "${pdfPath}" "${outputDir}/slide_%d.png"`, { stdio: 'ignore' });
      // Find all PNG files
      const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.png'));
      if (files.length > 0) {
        files.sort((a, b) => {
          const aNum = parseInt(a.match(/\d+/)?.[0] || '0');
          const bNum = parseInt(b.match(/\d+/)?.[0] || '0');
          return aNum - bNum;
        });
        for (let i = 0; i < files.length; i++) {
          const pngPath = path.join(outputDir, files[i]);
          const imgData = fs.readFileSync(pngPath);
          const base64Image = 'data:image/png;base64,' + imgData.toString('base64');
          if (i === 0) cover_image_url = base64Image;
          slide_images.push({
            slideIndex: i,
            imageUrl: base64Image,
            fileName: files[i]
          });
        }
      }
    } catch (err) {
      if (slides[0]?.title) {
        const svg = `<svg width='400' height='300' xmlns='http://www.w3.org/2000/svg'><rect width='100%' height='100%' fill='#${colors.background}'/><text x='50%' y='50%' font-size='32' fill='#${colors.text}' text-anchor='middle' alignment-baseline='middle'>${slides[0].title}</text></svg>`;
        cover_image_url = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
      }
    }

    // Update slides with their corresponding images
    const slidesWithImages = slides.map((slide, index) => ({
      ...slide,
      slideImage: slide_images[index]?.imageUrl || null,
      slideIndex: index
    }));

    // Save PDF to backend files (e.g., /uploads or /output)
    let savedPdfPath = '';
    if (pdfPath && fs.existsSync(pdfPath)) {
      const saveDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir);
      const pdfFileName = path.basename(pdfPath);
      savedPdfPath = path.join(saveDir, pdfFileName);
      fs.copyFileSync(pdfPath, savedPdfPath);
    }

    // Clean up temp files
    try {
      fs.unlinkSync(req.file.path);
      if (pdfPath && fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
      if (fs.existsSync(outputDir)) {
        const tempFiles = fs.readdirSync(outputDir);
        for (const f of tempFiles) fs.unlinkSync(path.join(outputDir, f));
        fs.rmdirSync(outputDir);
      }
    } catch (cleanupErr) {}

    // Save to MongoDB with all slide images and PDF path
    const template = new Template({
      title: path.basename(req.file.originalname, path.extname(req.file.originalname)),
      content: {
        slides: slidesWithImages,
        slide_images: slide_images // Store all slide images separately for easy access
      },
      theming: { colors, fonts, layouts },
      cover_image_url,
      total_slides: slides.length,
      slide_images_count: slide_images.length,
      pdf_path: savedPdfPath ? savedPdfPath.replace(process.cwd(), '').replace(/\\/g, '/') : ''
    });
    await template.save();
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: 'Failed to import PPT', details: err.message });
  }
});

// GET /api/templates/active
router.get('/active', async (req, res) => {
  try {
    const templates = await Template.find({ status: { $in: [undefined, 'active'] } }).sort({ updated_at: -1 });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch templates', details: err.message });
  }
});

export default router; 