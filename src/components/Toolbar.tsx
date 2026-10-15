import React, { useState } from 'react';
import {
  Languages,
  Plus,
  Printer,
  FileDown,
  Sparkles,
  Layout,
  Type,
  FileCheck2,
  Columns,
  RotateCcw,
} from 'lucide-react';
import { BlockType, DocumentLanguageView, DocumentMetadata } from '../types/document';

interface ToolbarProps {
  languageView: DocumentLanguageView;
  onLanguageViewChange: (view: DocumentLanguageView) => void;
  onTranslateToSlovak: (style: 'formal' | 'conversational' | 'technical') => Promise<void>;
  isTranslating: boolean;
  onAddBlock: (type: BlockType) => void;
  metadata: DocumentMetadata;
  onUpdateMetadata: (updates: Partial<DocumentMetadata>) => void;
  onExportPdf: () => void;
  onPrintPdf: () => void;
  onGenerateFormFields: () => Promise<void>;
  isGeneratingFields: boolean;
  onResetToSample: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  languageView,
  onLanguageViewChange,
  onTranslateToSlovak,
  isTranslating,
  onAddBlock,
  metadata,
  onUpdateMetadata,
  onExportPdf,
  onPrintPdf,
  onGenerateFormFields,
  isGeneratingFields,
  onResetToSample,
}) => {
  const [slovakStyle, setSlovakStyle] = useState<'formal' | 'conversational' | 'technical'>('formal');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);

  return (
    <div className="bg-slate-900/95 border-b border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 sticky top-[57px] z-30 shadow-md">
      {/* Group 1: Slovak Translation Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Main Slovak Translate Button */}
        <button
          onClick={() => onTranslateToSlovak(slovakStyle)}
          disabled={isTranslating}
          className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-sm active:scale-95 whitespace-nowrap"
          title="Automatický preklad celého webu do bezchybnej slovenčiny pomocou Gemini 3.8 Flash"
        >
          <Languages className="w-3.5 h-3.5" />
          <span>{isTranslating ? 'Prekladám do slovenčiny...' : 'Preložiť do slovenčiny'}</span>
        </button>

        {/* Translation Style Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
          <span className="text-[11px] text-slate-400 pl-2 pr-1 font-medium hidden sm:inline">Štýl:</span>
          <select
            value={slovakStyle}
            onChange={(e) => setSlovakStyle(e.target.value as any)}
            className="bg-transparent text-slate-200 text-xs pr-2 py-1 focus:outline-none cursor-pointer"
          >
            <option value="formal" className="bg-slate-900 text-slate-200">Spisovná / Úradná</option>
            <option value="conversational" className="bg-slate-900 text-slate-200">Plynulá / Webová</option>
            <option value="technical" className="bg-slate-900 text-slate-200">Technická / Odborná</option>
          </select>
        </div>

        {/* View Mode Segmented Control */}
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => onLanguageViewChange('slovak')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              languageView === 'slovak'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Slovenčina
          </button>
          <button
            onClick={() => onLanguageViewChange('original')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              languageView === 'original'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pôvodný web
          </button>
          <button
            onClick={() => onLanguageViewChange('bilingual')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1 ${
              languageView === 'bilingual'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Zobraziť slovenský preklad aj pôvodné anglické znenie vedľa seba"
          >
            <Columns className="w-3 h-3" />
            <span>Bilingválne</span>
          </button>
        </div>
      </div>

      {/* Group 2: Document Editing & Add Block */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Add Block Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>Pridať prvok</span>
          </button>

          {showAddMenu && (
            <div
              className="absolute left-0 mt-1 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-xs"
              onMouseLeave={() => setShowAddMenu(false)}
            >
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Základný obsah
              </div>
              <button
                onClick={() => { onAddBlock('paragraph'); setShowAddMenu(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <span>Odstavec textu</span>
              </button>
              <button
                onClick={() => { onAddBlock('h2'); setShowAddMenu(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <span>Podnadpis (H2)</span>
              </button>
              <button
                onClick={() => { onAddBlock('list'); setShowAddMenu(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <span>Odrážkový zoznam</span>
              </button>
              <button
                onClick={() => { onAddBlock('table'); setShowAddMenu(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <span>Tabuľka s údajmi</span>
              </button>
              <button
                onClick={() => { onAddBlock('callout'); setShowAddMenu(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <span>Informačný box (Callout)</span>
              </button>

              <div className="border-t border-slate-800 my-1" />
              <div className="px-3 py-1 text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
                Interaktívne AcroForm polia
              </div>
              <button
                onClick={() => { onAddBlock('form-field'); setShowAddMenu(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Formulárové pole (Text/Podpis)</span>
              </button>
              <button
                onClick={() => { onAddBlock('page-break'); setShowAddMenu(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <span>Zlom strany (Page Break)</span>
              </button>
            </div>
          )}
        </div>

        {/* AI Generate Form Fields */}
        <button
          onClick={onGenerateFormFields}
          disabled={isGeneratingFields}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700 disabled:opacity-50"
          title="Automaticky vytvoriť schvaľovacie a podpisové polia prispôsobené obsahu webu"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden lg:inline">{isGeneratingFields ? 'Analyzujem...' : 'AI Formulárové polia'}</span>
        </button>

        {/* Layout & Font Configuration */}
        <div className="relative">
          <button
            onClick={() => setShowLayoutMenu(!showLayoutMenu)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <Layout className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Vzhľad strany</span>
          </button>

          {showLayoutMenu && (
            <div
              className="absolute right-0 mt-1 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-3 z-50 text-xs space-y-3"
              onMouseLeave={() => setShowLayoutMenu(false)}
            >
              <div>
                <label className="text-slate-400 font-medium block mb-1">Formát strany</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => onUpdateMetadata({ pageSize: 'A4' })}
                    className={`py-1 px-2 rounded border text-center ${
                      metadata.pageSize === 'A4'
                        ? 'border-blue-500 bg-blue-600/20 text-white font-medium'
                        : 'border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    A4 (Európa)
                  </button>
                  <button
                    onClick={() => onUpdateMetadata({ pageSize: 'Letter' })}
                    className={`py-1 px-2 rounded border text-center ${
                      metadata.pageSize === 'Letter'
                        ? 'border-blue-500 bg-blue-600/20 text-white font-medium'
                        : 'border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    US Letter
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Písmo (Typografia)</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => onUpdateMetadata({ fontFamily: 'sans' })}
                    className={`py-1 px-1.5 rounded border text-center ${
                      metadata.fontFamily === 'sans'
                        ? 'border-blue-500 bg-blue-600/20 text-white font-medium'
                        : 'border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Modern Sans
                  </button>
                  <button
                    onClick={() => onUpdateMetadata({ fontFamily: 'serif' })}
                    className={`py-1 px-1.5 rounded border text-center ${
                      metadata.fontFamily === 'serif'
                        ? 'border-blue-500 bg-blue-600/20 text-white font-medium'
                        : 'border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Klasický Serif
                  </button>
                  <button
                    onClick={() => onUpdateMetadata({ fontFamily: 'mono' })}
                    className={`py-1 px-1.5 rounded border text-center font-mono ${
                      metadata.fontFamily === 'mono'
                        ? 'border-blue-500 bg-blue-600/20 text-white font-medium'
                        : 'border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Mono
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">Číslovanie strán:</span>
                <input
                  type="checkbox"
                  checked={metadata.showPageNumbers}
                  onChange={(e) => onUpdateMetadata({ showPageNumbers: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-blue-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">Hlavička so zdrojom:</span>
                <input
                  type="checkbox"
                  checked={metadata.showSourceHeader}
                  onChange={(e) => onUpdateMetadata({ showSourceHeader: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-blue-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Quick Print Button */}
        <button
          onClick={onPrintPdf}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
          title="Tlačiť alebo uložiť ako PDF s natívnou podporou diakritiky v prehliadači"
        >
          <Printer className="w-3.5 h-3.5 text-slate-300" />
          <span className="hidden sm:inline">Tlačiť</span>
        </button>

        {/* Reset button */}
        <button
          onClick={onResetToSample}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-colors border border-slate-700"
          title="Obnoviť predvolený vzor"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
