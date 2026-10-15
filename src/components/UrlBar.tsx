import React, { useState } from 'react';
import { Globe, ArrowRight, Code, Sparkles, AlertCircle } from 'lucide-react';
import { SAMPLE_WEBSITES, SampleWebsite } from '../data/sampleWebsites';

interface UrlBarProps {
  onExtractUrl: (url: string) => Promise<void>;
  onSelectSample: (sample: SampleWebsite) => void;
  onOpenPasteModal: () => void;
  isLoading: boolean;
  currentUrl: string;
  errorMessage?: string | null;
  onClearError: () => void;
}

export const UrlBar: React.FC<UrlBarProps> = ({
  onExtractUrl,
  onSelectSample,
  onOpenPasteModal,
  isLoading,
  currentUrl,
  errorMessage,
  onClearError,
}) => {
  const [inputUrl, setInputUrl] = useState(currentUrl || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    onExtractUrl(inputUrl.trim());
  };

  return (
    <div className="w-full bg-slate-900 border-b border-slate-800 p-4">
      <div className="max-w-6xl mx-auto space-y-3">
        {/* URL Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Globe className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                if (errorMessage) onClearError();
              }}
              placeholder="Zadajte URL adresu webovej stránky (napr. https://sk.wikipedia.org/... alebo akýkoľvek web)"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="submit"
              disabled={isLoading || !inputUrl.trim()}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all whitespace-nowrap active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Spracovávam web...</span>
                </>
              ) : (
                <>
                  <span>Extrahovať do PDF</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenPasteModal}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap border border-slate-700"
              title="Vložiť priamo zdrojové HTML alebo text webu"
            >
              <Code className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Vložiť HTML</span>
            </button>
          </div>
        </form>

        {/* Error notification if external fetch fails */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 bg-amber-950/60 border border-amber-800/80 rounded-lg text-xs text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p>{errorMessage}</p>
              <p className="text-amber-300/80">
                Tip: Môžete kliknúť na vzorové webové stránky nižšie alebo použiť tlačidlo „Vložiť HTML“ pre načítanie ľubovoľného obsahu.
              </p>
            </div>
            <button
              onClick={onClearError}
              className="text-amber-400 hover:text-amber-200 text-xs underline"
            >
              Zavrieť
            </button>
          </div>
        )}

        {/* Quick Presets / Samples bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-0.5">
          <div className="flex items-center gap-1 text-slate-300 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Rýchle vzory webov:</span>
          </div>
          {SAMPLE_WEBSITES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => {
                setInputUrl(sample.url);
                onSelectSample(sample);
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors border border-slate-700/60 truncate max-w-[280px]"
            >
              {sample.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
