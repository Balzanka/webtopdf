import React from 'react';
import { X, BookOpen, CheckCircle, Sparkles, FileDown, Layers, Edit3 } from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <span>Návod: Ako konvertovať web na editovateľné PDF</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
              <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-xs">1</span>
              <span>Zadanie webovej stránky</span>
            </div>
            <p className="leading-relaxed">
              Zadajte ľubovoľnú URL adresu (napr. správy, odborné štúdie, zmluvy, Wikipedia, produktové stránky) alebo zvoľte tlačidlo <strong>Vložiť HTML</strong> pre interné alebo offline weby. Nástroj automaticky očistí stránku od reklám a extrahuje nadpisy, odseky, tabuľky a zoznamy do A4 formátu.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs">2</span>
              <span>Automatický preklad do slovenčiny (Gemini AI)</span>
            </div>
            <p className="leading-relaxed">
              Kliknite na <strong>Preložiť do slovenčiny</strong>. Model Gemini 3.8 Flash preloží celý dokument s dokonalou slovenskou diakritikou (á, č, ď, é, í, ľ, ň, ó, ô, ŕ, š, ť, ú, ý, ž). Môžete si zvoliť štýl (Spisovná/Úradná, Plynulá webová alebo Technická) a prepínať medzi slovenským, pôvodným alebo bilingválnym zobrazením vedľa seba.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center text-xs">3</span>
              <span>Čo robí toto PDF „editovateľným“?</span>
            </div>
            <ul className="space-y-1.5 list-disc pl-4 text-slate-300">
              <li>
                <strong>Vizuálna úprava na plátne:</strong> Kliknite na akýkoľvek nadpis, text, tabuľku alebo zoznam a upravte jeho znenie priamo pred tlačou.
              </li>
              <li>
                <strong>Interaktívne AcroForms:</strong> Môžete vkladať vyplniteľné formulárové polia (meno, dátum, podpis, začiarkavacie políčka).
              </li>
              <li>
                <strong>Otvorenie v Adobe Acrobat alebo v prehliadači:</strong> Vygenerované PDF zachováva interaktívne polia, takže do nich príjemca môže vpisovať údaje a uložiť vyplnené PDF.
              </li>
            </ul>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <span className="w-5 h-5 rounded-full bg-amber-600/30 text-amber-400 flex items-center justify-center text-xs">4</span>
              <span>Export a tlač</span>
            </div>
            <p className="leading-relaxed">
              Máte na výber <strong>Stiahnuť PDF</strong> (vygeneruje súbor s interaktívnymi formulármi cez PDF-lib) alebo <strong>Tlačiť</strong> (využije tlačový raster prehliadača s nulovým skreslením písma a diakritiky).
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors"
          >
            Rozumiem, začať pracovať
          </button>
        </div>
      </div>
    </div>
  );
};
