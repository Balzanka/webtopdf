import React from 'react';
import { X, FileText, ArrowRight, ExternalLink } from 'lucide-react';
import { SAMPLE_WEBSITES, SampleWebsite } from '../data/sampleWebsites';

interface SampleWebsitesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sample: SampleWebsite) => void;
}

export const SampleWebsitesModal: React.FC<SampleWebsitesModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <FileText className="w-5 h-5 text-blue-400" />
            <span>Predpripravené vzory webových stránok</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300">
          Vyberte si ktorýkoľvek z nasledujúcich reálnych scenárov webových stránok. Každý vzor obsahuje extrahovanú štruktúru, tabuľky, zoznamy a okamžitý slovenský preklad s interaktívnymi formulárovými poliami.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {SAMPLE_WEBSITES.map((sample) => (
            <div
              key={sample.id}
              onClick={() => {
                onSelectSample(sample);
                onClose();
              }}
              className="p-4 bg-slate-950 border border-slate-800 hover:border-blue-500/80 rounded-lg cursor-pointer transition-all hover:bg-slate-800/40 group flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
                  {sample.category}
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                  {sample.name}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {sample.metadata.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono text-[11px] truncate max-w-[180px]">
                  {sample.url.replace('https://', '')}
                </span>
                <span className="text-blue-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-medium">
                  Načítať do PDF <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
