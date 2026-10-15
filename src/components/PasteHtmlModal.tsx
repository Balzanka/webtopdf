import React, { useState } from 'react';
import { X, Code, Check } from 'lucide-react';

interface PasteHtmlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportHtml: (html: string, url: string) => void;
}

export const PasteHtmlModal: React.FC<PasteHtmlModalProps> = ({
  isOpen,
  onClose,
  onImportHtml,
}) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!htmlContent.trim()) return;
    onImportHtml(htmlContent, sourceUrl || 'https://vlozeny-obsah.sk');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Code className="w-5 h-5 text-blue-400" />
            <span>Vložiť vlastné HTML alebo text webu</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Ak webová stránka vyžaduje prihlásenie, je na intranete alebo blokuje priame sťahovanie, skopírujte jej HTML kód (alebo text) a vložte ho sem. Nástroj automaticky extrahuje nadpisy, odseky, tabuľky a pripraví ich na preklad do slovenčiny.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Voliteľná URL adresa pôvodného webu:
            </label>
            <input
              type="text"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://example.com/clanok"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              HTML kód alebo formátovaný text:
            </label>
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              rows={10}
              placeholder="<h1>Názov článku</h1><p>Prvý odsek textu...</p><table>...</table>"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              disabled={!htmlContent.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Spracovať do PDF</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
