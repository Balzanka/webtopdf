import React from 'react';
import { Download, Languages, FileText } from 'lucide-react';

interface TopBarProps {
  onExportPdf: () => void;
  onOpenSampleModal: () => void;
  onToggleLanguageView: () => void;
  isExporting: boolean;
  activeLanguageView: 'slovak' | 'original' | 'bilingual';
  activeSection: string;
  onSelectSection: (section: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onExportPdf,
  onOpenSampleModal,
  onToggleLanguageView,
  isExporting,
  activeLanguageView,
  activeSection,
  onSelectSection,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Brand title wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="/"
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            PDF
          </div>
          <span>WebToPDF Studio</span>
        </a>
      </div>

      {/* Zone 2: 4-5 concise single-line nav links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
        <button
          onClick={() => onSelectSection('editor')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeSection === 'editor' ? 'text-blue-400' : ''
          }`}
        >
          Editor dokumentu
        </button>
        <button
          onClick={onOpenSampleModal}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <FileText className="w-4 h-4 text-slate-400" />
          <span>Vzory webov</span>
        </button>
        <button
          onClick={onToggleLanguageView}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <Languages className="w-4 h-4 text-slate-400" />
          <span>
            Jazyk: {activeLanguageView === 'slovak' ? 'Slovenčina' : activeLanguageView === 'original' ? 'Pôvodný' : 'Bilingválne'}
          </span>
        </button>
        <button
          onClick={() => onSelectSection('guide')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeSection === 'guide' ? 'text-blue-400' : ''
          }`}
        >
          Návod na použitie
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onExportPdf}
          disabled={isExporting}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isExporting ? 'Generujem PDF...' : 'Stiahnuť PDF'}</span>
        </button>
      </div>
    </header>
  );
};
