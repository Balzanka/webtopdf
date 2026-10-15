import React, { useState } from 'react';
import { TopBar } from './components/TopBar';
import { UrlBar } from './components/UrlBar';
import { Toolbar } from './components/Toolbar';
import { DocumentSheet } from './components/DocumentSheet';
import { SampleWebsitesModal } from './components/SampleWebsitesModal';
import { PasteHtmlModal } from './components/PasteHtmlModal';
import { UserGuideModal } from './components/UserGuideModal';
import { SAMPLE_WEBSITES, SampleWebsite } from './data/sampleWebsites';
import { BlockType, DocumentBlock, DocumentLanguageView, DocumentMetadata } from './types/document';
import { generateInteractiveFormPdf, triggerPdfDownload, printDocument } from './lib/pdfGenerator';

export default function App() {
  // Start with the first rich sample website
  const defaultSample = SAMPLE_WEBSITES[0];

  const [metadata, setMetadata] = useState<DocumentMetadata>(defaultSample.metadata);
  const [blocks, setBlocks] = useState<DocumentBlock[]>(defaultSample.blocks);
  const [languageView, setLanguageView] = useState<DocumentLanguageView>('slovak');
  const [currentUrl, setCurrentUrl] = useState<string>(defaultSample.url);

  // Loading states
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isGeneratingFields, setIsGeneratingFields] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals & Sections
  const [isSampleModalOpen, setIsSampleModalOpen] = useState<boolean>(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('editor');

  // 1. Extract Website from URL
  const handleExtractUrl = async (url: string) => {
    setIsExtracting(true);
    setErrorMessage(null);
    setCurrentUrl(url);

    try {
      const response = await fetch('/api/extract-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.fallbackRequired) {
          setErrorMessage(data.errorMessage);
        } else {
          setErrorMessage(data.error || 'Nepodarilo sa extrahovať obsah webovej stránky.');
        }
        return;
      }

      // Successful extraction
      const newMetadata: DocumentMetadata = {
        title: data.title || 'Extrahovaný webový dokument',
        originalTitle: data.title || 'Extracted Web Document',
        slovakTitle: data.title || 'Extrahovaný webový dokument',
        sourceUrl: data.sourceUrl || url,
        author: data.author || 'Web Extractor',
        date: data.extractedDate || new Date().toLocaleDateString('sk-SK'),
        description: data.description,
        pageSize: 'A4',
        orientation: 'portrait',
        fontFamily: 'sans',
        fontSize: 'base',
        headerText: `WebToPDF • ${data.title ? data.title.substring(0, 45) : 'Dokument'}`,
        footerText: 'Konvertované nástrojom WebToPDF • Editovateľné PDF',
        showPageNumbers: true,
        showSourceHeader: true,
      };

      setMetadata(newMetadata);
      setBlocks(data.blocks || []);
      setLanguageView('original'); // Show original extracted first, ready for Slovak translation

      // Trigger automated Slovak translation
      await triggerBatchTranslation(data.blocks, data.title, 'formal');
    } catch (err: any) {
      console.error('Extraction error:', err);
      setErrorMessage(`Chyba pripojenia: ${err.message || 'Server neodpovedá'}`);
    } finally {
      setIsExtracting(false);
    }
  };

  // 2. Import HTML directly
  const handleImportHtml = async (html: string, url: string) => {
    setIsExtracting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/extract-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ htmlContent: html, url }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setErrorMessage(data.error || 'Nepodarilo sa spracovať zadané HTML.');
        return;
      }

      const newMetadata: DocumentMetadata = {
        title: data.title || 'Vložený webový dokument',
        originalTitle: data.title || 'Pasted Web Document',
        slovakTitle: data.title || 'Vložený webový dokument',
        sourceUrl: url || 'Vložený obsah',
        author: data.author || 'Používateľ',
        date: data.extractedDate || new Date().toLocaleDateString('sk-SK'),
        description: data.description,
        pageSize: 'A4',
        orientation: 'portrait',
        fontFamily: 'sans',
        fontSize: 'base',
        headerText: `WebToPDF • ${data.title ? data.title.substring(0, 45) : 'Dokument'}`,
        footerText: 'Konvertované nástrojom WebToPDF • Editovateľné PDF',
        showPageNumbers: true,
        showSourceHeader: true,
      };

      setMetadata(newMetadata);
      setBlocks(data.blocks || []);
      setLanguageView('original');

      // Auto-translate to Slovak
      await triggerBatchTranslation(data.blocks, data.title, 'formal');
    } catch (err: any) {
      console.error('HTML import error:', err);
      setErrorMessage('Chyba pri spracovaní HTML.');
    } finally {
      setIsExtracting(false);
    }
  };

  // 3. Batch Translate entire document to Slovak using Gemini 3.8 Flash
  const triggerBatchTranslation = async (
    blocksToTranslate: DocumentBlock[],
    docTitle: string,
    style: 'formal' | 'conversational' | 'technical'
  ) => {
    setIsTranslating(true);
    try {
      const response = await fetch('/api/translate-slovak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks: blocksToTranslate,
          title: docTitle,
          style,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setBlocks(data.blocks);
        setMetadata((prev) => ({
          ...prev,
          slovakTitle: data.translatedTitle || prev.slovakTitle,
          slovakSummary: data.slovakSummary || prev.slovakSummary,
        }));
        setLanguageView('slovak');
      } else {
        console.warn('Slovak translation API returned error:', data.error);
      }
    } catch (err) {
      console.error('Translation network error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTranslateToSlovak = async (style: 'formal' | 'conversational' | 'technical') => {
    await triggerBatchTranslation(blocks, metadata.title, style);
  };

  // 4. Translate Single Block
  const handleTranslateBlock = async (id: string) => {
    const block = blocks.find((b) => b.id === id);
    if (!block) return;

    const sourceText = block.originalContent || block.content || '';
    if (!sourceText) return;

    try {
      const response = await fetch('/api/translate-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sourceText, action: 'translate' }),
      });

      const data = await response.json();
      if (data.success && data.result) {
        setBlocks((prev) =>
          prev.map((b) => (b.id === id ? { ...b, slovakContent: data.result } : b))
        );
      }
    } catch (err) {
      console.error('Single block translation error:', err);
    }
  };

  // 5. Polish Single Block in Slovak
  const handlePolishBlock = async (id: string) => {
    const block = blocks.find((b) => b.id === id);
    if (!block) return;

    const textToPolish =
      languageView === 'slovak'
        ? (block.slovakContent || block.content || '')
        : (block.originalContent || block.content || '');

    if (!textToPolish) return;

    try {
      const response = await fetch('/api/translate-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToPolish, action: 'polish' }),
      });

      const data = await response.json();
      if (data.success && data.result) {
        if (languageView === 'slovak') {
          setBlocks((prev) =>
            prev.map((b) => (b.id === id ? { ...b, slovakContent: data.result } : b))
          );
        } else {
          setBlocks((prev) =>
            prev.map((b) => (b.id === id ? { ...b, content: data.result, originalContent: data.result } : b))
          );
        }
      }
    } catch (err) {
      console.error('Single block polish error:', err);
    }
  };

  // 6. Generate Form Fields via AI
  const handleGenerateFormFields = async () => {
    setIsGeneratingFields(true);
    try {
      const contextSnippet = blocks
        .filter((b) => b.content)
        .map((b) => b.content)
        .join(' ')
        .substring(0, 1500);

      const response = await fetch('/api/generate-form-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentContext: contextSnippet,
          language: languageView === 'original' ? 'en' : 'sk',
        }),
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.fields)) {
        const newFormBlocks: DocumentBlock[] = data.fields.map((f: any, idx: number) => ({
          id: `ai-field-${Date.now()}-${idx}`,
          type: 'form-field',
          formField: {
            type: f.type || 'text',
            label: f.label || 'Pole formulára:',
            placeholder: f.placeholder || '',
            defaultValue: '',
            fieldName: f.fieldName || `field_${idx}`,
          },
        }));

        setBlocks((prev) => [...prev, ...newFormBlocks]);
      }
    } catch (err) {
      console.error('Generate form fields error:', err);
    } finally {
      setIsGeneratingFields(false);
    }
  };

  // 7. Add Block
  const handleAddBlock = (type: BlockType) => {
    const newId = `block-${Date.now()}`;
    let newBlock: DocumentBlock;

    switch (type) {
      case 'h2':
        newBlock = {
          id: newId,
          type: 'h2',
          content: 'Nový podnadpis sekcie',
          originalContent: 'New Section Heading',
          slovakContent: 'Nový podnadpis sekcie',
        };
        break;
      case 'paragraph':
        newBlock = {
          id: newId,
          type: 'paragraph',
          content: 'Zadajte text nového odseku sem. Môžete ho priamo editovať alebo preložiť do slovenčiny.',
          originalContent: 'Enter new paragraph text here.',
          slovakContent: 'Zadajte text nového odseku sem. Môžete ho priamo editovať alebo preložiť do slovenčiny.',
        };
        break;
      case 'list':
        newBlock = {
          id: newId,
          type: 'list',
          listType: 'unordered',
          listItems: ['Prvá položka zoznamu', 'Druhá dôležitá položka'],
          originalListItems: ['First item', 'Second item'],
          slovakListItems: ['Prvá položka zoznamu', 'Druhá dôležitá položka'],
        };
        break;
      case 'table':
        newBlock = {
          id: newId,
          type: 'table',
          tableData: {
            headers: ['Parameter / Položka', 'Hodnota', 'Stav'],
            rows: [
              ['Základná požiadavka', '100 %', 'Splnené'],
              ['Termín dodania', '30 dní', 'V procese'],
            ],
          },
          slovakTableData: {
            headers: ['Parameter / Položka', 'Hodnota', 'Stav'],
            rows: [
              ['Základná požiadavka', '100 %', 'Splnené'],
              ['Termín dodania', '30 dní', 'V procese'],
            ],
          },
        };
        break;
      case 'callout':
        newBlock = {
          id: newId,
          type: 'callout',
          content: 'Dôležitá poznámka alebo upozornenie k zmluvným podmienkam dokumentu.',
          originalContent: 'Important notice regarding contractual conditions.',
          slovakContent: 'Dôležitá poznámka alebo upozornenie k zmluvným podmienkam dokumentu.',
        };
        break;
      case 'form-field':
        newBlock = {
          id: newId,
          type: 'form-field',
          formField: {
            type: 'text',
            label: 'Nové formulárové pole:',
            placeholder: 'Zadajte hodnotu...',
            defaultValue: '',
            fieldName: `custom_field_${Date.now()}`,
          },
        };
        break;
      case 'page-break':
        newBlock = {
          id: newId,
          type: 'page-break',
        };
        break;
      default:
        newBlock = {
          id: newId,
          type: 'paragraph',
          content: 'Nový obsah...',
          slovakContent: 'Nový obsah...',
        };
    }

    setBlocks((prev) => [...prev, newBlock]);
  };

  // Block Manipulation
  const handleUpdateBlock = (updated: DocumentBlock) => {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleDuplicateBlock = (id: string) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const original = blocks[idx];
    const duplicated: DocumentBlock = {
      ...JSON.parse(JSON.stringify(original)),
      id: `dup-${Date.now()}`,
    };
    const updated = [...blocks];
    updated.splice(idx + 1, 0, duplicated);
    setBlocks(updated);
  };

  const handleMoveBlock = (id: string, direction: 'up' | 'down') => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;

    const updated = [...blocks];
    const [moved] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, moved);
    setBlocks(updated);
  };

  // 8. Export PDF
  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const pdfBytes = await generateInteractiveFormPdf(metadata, blocks, languageView);
      const filename = `${(metadata.title || 'web-document').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      triggerPdfDownload(pdfBytes, filename);
    } catch (err: any) {
      console.error('Export PDF error:', err);
      // Fallback to vector browser print
      printDocument();
    } finally {
      setIsExporting(false);
    }
  };

  // 9. Select Preloaded Sample
  const handleSelectSample = (sample: SampleWebsite) => {
    setMetadata(sample.metadata);
    setBlocks(sample.blocks);
    setCurrentUrl(sample.url);
    setLanguageView('slovak');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Bar (adheres to Top Bar Contract) */}
      <TopBar
        onExportPdf={handleExportPdf}
        onOpenSampleModal={() => setIsSampleModalOpen(true)}
        onToggleLanguageView={() =>
          setLanguageView((prev) =>
            prev === 'slovak' ? 'original' : prev === 'original' ? 'bilingual' : 'slovak'
          )
        }
        isExporting={isExporting}
        activeLanguageView={languageView}
        activeSection={activeSection}
        onSelectSection={(sec) => {
          if (sec === 'guide') {
            setIsGuideModalOpen(true);
          } else {
            setActiveSection(sec);
          }
        }}
      />

      {/* Website URL Extractor Bar */}
      <UrlBar
        onExtractUrl={handleExtractUrl}
        onSelectSample={handleSelectSample}
        onOpenPasteModal={() => setIsPasteModalOpen(true)}
        isLoading={isExtracting}
        currentUrl={currentUrl}
        errorMessage={errorMessage}
        onClearError={() => setErrorMessage(null)}
      />

      {/* Document Editor Toolbar */}
      <Toolbar
        languageView={languageView}
        onLanguageViewChange={setLanguageView}
        onTranslateToSlovak={handleTranslateToSlovak}
        isTranslating={isTranslating}
        onAddBlock={handleAddBlock}
        metadata={metadata}
        onUpdateMetadata={(updates) => setMetadata((prev) => ({ ...prev, ...updates }))}
        onExportPdf={handleExportPdf}
        onPrintPdf={printDocument}
        onGenerateFormFields={handleGenerateFormFields}
        isGeneratingFields={isGeneratingFields}
        onResetToSample={() => handleSelectSample(defaultSample)}
      />

      {/* Main Document Workspace */}
      <main className="flex-1 overflow-y-auto bg-slate-950 py-6">
        <div className="max-w-6xl mx-auto px-4">
          {/* Status summary banner */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 no-print">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">Aktuálne zobrazenie:</span>
              <span className="text-blue-400 font-medium">
                {languageView === 'slovak'
                  ? 'Slovenský preklad (Plná diakritika)'
                  : languageView === 'original'
                  ? 'Pôvodný webový zdroj'
                  : 'Bilingválne zobrazenie (Vedľa seba)'}
              </span>
              <span className="text-slate-600">·</span>
              <span className="tabular-nums font-mono">{blocks.length} blokov</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsGuideModalOpen(true)}
                className="text-slate-400 hover:text-white underline text-xs"
              >
                Ako fungujú editovateľné formuláre v PDF?
              </button>
            </div>
          </div>

          {/* Paginated Document Sheet (WYSIWYG Paper Canvas) */}
          <DocumentSheet
            metadata={metadata}
            blocks={blocks}
            languageView={languageView}
            onUpdateMetadata={(updates) => setMetadata((prev) => ({ ...prev, ...updates }))}
            onUpdateBlock={handleUpdateBlock}
            onDeleteBlock={handleDeleteBlock}
            onDuplicateBlock={handleDuplicateBlock}
            onMoveBlock={handleMoveBlock}
            onTranslateBlock={handleTranslateBlock}
            onPolishBlock={handlePolishBlock}
          />
        </div>
      </main>

      {/* Modals */}
      <SampleWebsitesModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        onSelectSample={handleSelectSample}
      />

      <PasteHtmlModal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        onImportHtml={handleImportHtml}
      />

      <UserGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
}
