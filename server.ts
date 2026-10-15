import express, { Request, Response } from 'express';
import http from 'http';
import { GoogleGenAI } from '@google/genai';
import * as cheerio from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface ExtractedBlock {
  id: string;
  type: 'h1' | 'h2' | 'h3' | 'paragraph' | 'list' | 'table' | 'quote' | 'callout' | 'image' | 'form-field' | 'divider' | 'page-break';
  content?: string;
  originalContent?: string;
  slovakContent?: string;
  listItems?: string[];
  originalListItems?: string[];
  slovakListItems?: string[];
  listType?: 'unordered' | 'ordered';
  tableData?: {
    headers: string[];
    rows: string[][];
  };
  originalTableData?: {
    headers: string[];
    rows: string[][];
  };
  slovakTableData?: {
    headers: string[];
    rows: string[][];
  };
  imageSrc?: string;
  imageAlt?: string;
  imageCaption?: string;
  formField?: {
    type: 'text' | 'textarea' | 'checkbox' | 'date' | 'signature';
    label: string;
    placeholder?: string;
    defaultValue?: string;
    checked?: boolean;
    fieldName: string;
  };
}

// Helper to sanitize and normalize URLs
function normalizeUrl(inputUrl: string): string {
  let url = inputUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  return url;
}

// 1. Extract Website Endpoint
app.post('/api/extract-website', async (req: Request, res: Response) => {
  try {
    const { url, htmlContent } = req.body;

    let html = '';
    let targetUrl = '';

    if (htmlContent && htmlContent.trim().length > 0) {
      html = htmlContent;
      targetUrl = url || 'https://custom-content.local';
    } else if (url && url.trim().length > 0) {
      targetUrl = normalizeUrl(url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      try {
        const response = await fetch(targetUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 WebToPDF/2.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,sk;q=0.8',
          },
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Web server returned status ${response.status} (${response.statusText})`);
        }
        html = await response.text();
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        console.warn('URL fetch fallback triggered for:', targetUrl, fetchErr.message);
        return res.status(200).json({
          success: false,
          fallbackRequired: true,
          errorMessage: `Could not directly fetch ${targetUrl} (${fetchErr.message}). You can use preloaded sample data or paste HTML/text directly.`,
          url: targetUrl,
        });
      }
    } else {
      return res.status(400).json({ error: 'Either url or htmlContent must be provided.' });
    }

    const $ = cheerio.load(html);

    // Remove noise elements
    $('script, style, noscript, svg symbol, iframe, link, meta, template').remove();
    $('header nav, footer nav, .cookie-banner, .advertisement, .adsbygoogle, #disqus_thread').remove();

    // Extract title & metadata
    const title = $('title').text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      $('h1').first().text().trim() ||
      'Converted Web Document';

    const description = $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      '';

    let author = $('meta[name="author"]').attr('content') ||
      $('[rel="author"]').text().trim() ||
      $('span.author, .byline, .author-name').first().text().trim();

    if (!author) {
      try {
        author = new URL(targetUrl).hostname;
      } catch {
        author = 'Web Source';
      }
    }

    // Pick main content container if available
    let $root = $('main, article, [role="main"], .main-content, #content, .post-content').first();
    if ($root.length === 0 || $root.text().trim().length < 80) {
      $root = $('body');
    }

    const blocks: ExtractedBlock[] = [];
    let blockCounter = 1;

    const nextId = (prefix: string) => `${prefix}-${blockCounter++}`;

    // Add main title if found
    if (title) {
      blocks.push({
        id: nextId('h1'),
        type: 'h1',
        content: title,
        originalContent: title,
      });
    }

    // Process nodes sequentially
    $root.find('h1, h2, h3, h4, p, ul, ol, table, blockquote, img').each((_, el) => {
      const $el = $(el);
      const tagName = el.tagName.toLowerCase();

      // Skip elements nested in unwanted areas
      if ($el.parents('nav, footer, .sidebar, script').length > 0) return;

      if (tagName === 'h1' && $el.text().trim() !== title) {
        const text = $el.text().trim();
        if (text) {
          blocks.push({
            id: nextId('h1'),
            type: 'h1',
            content: text,
            originalContent: text,
          });
        }
      } else if (tagName === 'h2') {
        const text = $el.text().trim();
        if (text) {
          blocks.push({
            id: nextId('h2'),
            type: 'h2',
            content: text,
            originalContent: text,
          });
        }
      } else if (tagName === 'h3' || tagName === 'h4') {
        const text = $el.text().trim();
        if (text) {
          blocks.push({
            id: nextId('h3'),
            type: 'h3',
            content: text,
            originalContent: text,
          });
        }
      } else if (tagName === 'p') {
        const text = $el.text().trim();
        if (text.length > 15) {
          blocks.push({
            id: nextId('p'),
            type: 'paragraph',
            content: text,
            originalContent: text,
          });
        }
      } else if (tagName === 'blockquote') {
        const text = $el.text().trim();
        if (text) {
          blocks.push({
            id: nextId('quote'),
            type: 'quote',
            content: text,
            originalContent: text,
          });
        }
      } else if (tagName === 'ul' || tagName === 'ol') {
        const items: string[] = [];
        $el.find('> li').each((_, li) => {
          const itemText = $(li).text().trim();
          if (itemText) items.push(itemText);
        });
        if (items.length > 0) {
          blocks.push({
            id: nextId('list'),
            type: 'list',
            listType: tagName === 'ol' ? 'ordered' : 'unordered',
            listItems: items,
            originalListItems: items,
          });
        }
      } else if (tagName === 'table') {
        const headers: string[] = [];
        const rows: string[][] = [];

        $el.find('thead tr th, thead tr td').each((_, th) => {
          headers.push($(th).text().trim());
        });

        $el.find('tbody tr').each((_, tr) => {
          const row: string[] = [];
          $(tr).find('td, th').each((_, td) => {
            row.push($(td).text().trim());
          });
          if (row.length > 0) rows.push(row);
        });

        if (headers.length === 0 && rows.length === 0) {
          $el.find('tr').each((idx, tr) => {
            const cells: string[] = [];
            $(tr).find('td, th').each((_, c) => {
              cells.push($(c).text().trim());
            });
            if (idx === 0) {
              headers.push(...cells);
            } else if (cells.length > 0) {
              rows.push(cells);
            }
          });
        }

        if (headers.length > 0 || rows.length > 0) {
          blocks.push({
            id: nextId('table'),
            type: 'table',
            tableData: { headers, rows },
            originalTableData: { headers, rows },
          });
        }
      } else if (tagName === 'img') {
        const src = $el.attr('src');
        const alt = $el.attr('alt') || 'Web image';
        if (src && !src.startsWith('data:image/svg')) {
          try {
            const resolvedSrc = new URL(src, targetUrl).href;
            blocks.push({
              id: nextId('img'),
              type: 'image',
              imageSrc: resolvedSrc,
              imageAlt: alt,
              imageCaption: alt !== 'Web image' ? alt : undefined,
            });
          } catch {
            // Ignore invalid URLs
          }
        }
      }
    });

    // Provide default interactive form fields at the document end
    blocks.push({
      id: nextId('callout'),
      type: 'callout',
      content: 'Tento dokument bol automaticky extrahovaný a prevedený do editovateľného formátu PDF s možnosťou úpravy každého poľa a priamej tlače.',
      originalContent: 'This document was extracted and converted into an editable PDF format with full visual inline editing and interactive fields.',
    });

    blocks.push({
      id: nextId('form-name'),
      type: 'form-field',
      formField: {
        type: 'text',
        label: 'Meno posudzovateľa / Reviewer Name:',
        placeholder: 'Zadajte meno a priezvisko...',
        defaultValue: '',
        fieldName: 'reviewer_name',
      },
    });

    blocks.push({
      id: nextId('form-date'),
      type: 'form-field',
      formField: {
        type: 'date',
        label: 'Dátum overenia / Verification Date:',
        defaultValue: new Date().toISOString().split('T')[0],
        fieldName: 'verification_date',
      },
    });

    blocks.push({
      id: nextId('form-sig'),
      type: 'form-field',
      formField: {
        type: 'signature',
        label: 'Podpis / Authorised Signature:',
        placeholder: '[Kliknite pre podpis alebo zadajte elektronický podpis]',
        defaultValue: '',
        fieldName: 'authorized_signature',
      },
    });

    return res.status(200).json({
      success: true,
      title,
      description,
      author,
      sourceUrl: targetUrl,
      extractedDate: new Date().toLocaleDateString('sk-SK'),
      blocks,
    });
  } catch (error: any) {
    console.error('Error in /api/extract-website:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract website contents.',
    });
  }
});

// 2. Slovak Translation Endpoint using Gemini 3.8 Flash
app.post('/api/translate-slovak', async (req: Request, res: Response) => {
  try {
    const { blocks, title, style = 'formal' } = req.body;

    if (!blocks || !Array.isArray(blocks)) {
      return res.status(400).json({ error: 'Missing blocks array.' });
    }

    const styleInstructions = {
      formal: 'Použi spisovnú, profesionálnu a úradnú slovenčinu s vysokou štylistickou úrovňou.',
      conversational: 'Použi plynulú, prirodzenú a modernú slovenčinu vhodnú pre webové články a blogy.',
      technical: 'Použi presnú odbornú a technickú terminológiu v súlade so slovenskými odbornými štandardmi.',
    }[style as 'formal' | 'conversational' | 'technical'] || 'Použi spisovnú a profesionálnu slovenčinu.';

    const payload = {
      title,
      blocks: blocks.map((b: ExtractedBlock) => ({
        id: b.id,
        type: b.type,
        content: b.content,
        listItems: b.listItems,
        tableData: b.tableData,
        formFieldLabel: b.formField?.label,
        formFieldPlaceholder: b.formField?.placeholder,
      })),
    };

    const prompt = `Prelož nasledujúci webový dokument z pôvodného jazyka (zvyčajne angličtina) do gramaticky dokonalej a prirodzenej slovenčiny.
Štýl prekladu: ${styleInstructions}

DÔLEŽITÉ PRAVIDLÁ PRE SLOVENČINU:
1. Používaj správnu slovenskú gramatiku, interpunkciu a diakritiku (á, ä, č, ď, é, í, ľ, ň, ó, ô, ŕ, š, ť, ú, ý, ž).
2. Zachovaj presnú štruktúru JSON a ID blokov.
3. Prelož názov dokumentu (title), všetky textové obsahy (content), položky zoznamov (listItems) aj hlavičky a riadky tabuliek (tableData).
4. Ak blok obsahuje formulárové prvky (formFieldLabel, formFieldPlaceholder), prelož ich do zrozumiteľnej slovenčiny.
5. Vráť výhradne čistý JSON s kľúčmi:
   - "translatedTitle": string
   - "slovakSummary": string (stručné 2-vetné zhrnutie dokumentu v slovenčine)
   - "translatedBlocks": pole objektov s rovnakými "id" a preloženými poľami ("content", "listItems", "tableData", "formFieldLabel", "formFieldPlaceholder").

Vstupný dokument:
${JSON.stringify(payload, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const responseText = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse Gemini translation response as JSON.');
      }
    }

    const translationMap = new Map<string, any>();
    if (Array.isArray(parsed.translatedBlocks)) {
      parsed.translatedBlocks.forEach((item: any) => {
        if (item && item.id) translationMap.set(item.id, item);
      });
    }

    const updatedBlocks = blocks.map((b: ExtractedBlock) => {
      const trans = translationMap.get(b.id);
      if (!trans) return b;

      const updated = { ...b };
      if (trans.content !== undefined) updated.slovakContent = trans.content;
      if (trans.listItems !== undefined) updated.slovakListItems = trans.listItems;
      if (trans.tableData !== undefined) updated.slovakTableData = trans.tableData;

      if (updated.formField && (trans.formFieldLabel || trans.formFieldPlaceholder)) {
        updated.formField = {
          ...updated.formField,
          label: trans.formFieldLabel || updated.formField.label,
          placeholder: trans.formFieldPlaceholder || updated.formField.placeholder,
        };
      }

      return updated;
    });

    return res.status(200).json({
      success: true,
      translatedTitle: parsed.translatedTitle || title,
      slovakSummary: parsed.slovakSummary || '',
      blocks: updatedBlocks,
    });
  } catch (error: any) {
    console.error('Error in /api/translate-slovak:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Slovak translation failed.',
    });
  }
});

// 3. Single Block Inline Translation or Polish
app.post('/api/translate-single', async (req: Request, res: Response) => {
  try {
    const { text, action = 'translate' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required.' });
    }

    let prompt = '';
    if (action === 'polish') {
      prompt = `Uprav a vylepši nasledujúci slovenský text tak, aby bol profesionálny, gramaticky bezchybný a plynulý. Vráť len vylepšený text bez úvodných rečí:\n\n${text}`;
    } else {
      prompt = `Prelož nasledujúci text do bezchybnej, prirodzenej a spisovnej slovenčiny s úplnou slovenskou diakritikou. Vráť výhradne preložený text:\n\n${text}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
      },
    });

    return res.status(200).json({
      success: true,
      result: (response.text || '').trim(),
    });
  } catch (error: any) {
    console.error('Error in /api/translate-single:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to translate single block.',
    });
  }
});

// 4. Intelligent Form Fields Generation
app.post('/api/generate-form-fields', async (req: Request, res: Response) => {
  try {
    const { documentContext, language = 'sk' } = req.body;

    const prompt = `Analyzuj tento kontext webovej stránky / dokumentu a vygeneruj 4 až 6 praktických interaktívnych formulárových polí (AcroForm fields) pre editovateľné PDF.
Polia by mali byť vhodné pre oficiálne vyplnenie, schválenie, objednávku alebo spätnú väzbu.
Jazyk polí: ${language === 'sk' ? 'Slovenčina (napr. Schválil dňa, Meno a priezvisko, Poznámka ku schváleniu, Súhlasím so zmluvnými podmienkami, Podpis)' : 'English'}.

Kontext dokumentu:
${documentContext ? documentContext.substring(0, 1500) : 'Všeobecný firemný report a dohoda'}

Vráť výhradne JSON pole s objektmi:
[
  {
    "type": "text",
    "label": "Meno a priezvisko",
    "placeholder": "Ján Novák",
    "fieldName": "meno_priezvisko"
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    return res.status(200).json({ success: true, fields: parsed });
  } catch (error: any) {
    console.error('Error in /api/generate-form-fields:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Configure Vite integration for dev and static serving for prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server },
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, () => {
    console.log(`WebToPDF Studio Server running on http://localhost:${port}`);
  });
}

startServer();
