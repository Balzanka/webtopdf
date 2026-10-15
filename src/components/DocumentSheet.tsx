import React from 'react';
import { Globe, Calendar, User, FileText, CheckCircle2 } from 'lucide-react';
import { DocumentBlock, DocumentLanguageView, DocumentMetadata } from '../types/document';
import { BlockItemEditor } from './BlockItemEditor';

interface DocumentSheetProps {
  metadata: DocumentMetadata;
  blocks: DocumentBlock[];
  languageView: DocumentLanguageView;
  onUpdateMetadata: (updates: Partial<DocumentMetadata>) => void;
  onUpdateBlock: (updated: DocumentBlock) => void;
  onDeleteBlock: (id: string) => void;
  onDuplicateBlock: (id: string) => void;
  onMoveBlock: (id: string, direction: 'up' | 'down') => void;
  onTranslateBlock: (id: string) => Promise<void>;
  onPolishBlock: (id: string) => Promise<void>;
}

export const DocumentSheet: React.FC<DocumentSheetProps> = ({
  metadata,
  blocks,
  languageView,
  onUpdateMetadata,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveBlock,
  onTranslateBlock,
  onPolishBlock,
}) => {
  const fontClass =
    metadata.fontFamily === 'serif'
      ? 'font-serif'
      : metadata.fontFamily === 'mono'
      ? 'font-mono'
      : 'font-sans';

  const isA4 = metadata.pageSize === 'A4';

  return (
    <div className="py-8 px-4 flex justify-center">
      {/* Visual A4 Paper Canvas */}
      <div
        className={`pdf-sheet bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 w-full max-w-[850px] min-h-[1100px] p-8 sm:p-12 md:p-16 relative flex flex-col justify-between ${fontClass}`}
        style={{
          aspectRatio: isA4 ? '1 / 1.414' : '1 / 1.294',
        }}
      >
        {/* Header Ribbon / Source Bar */}
        <div>
          {metadata.showSourceHeader && (
            <div className="border-b border-slate-200 pb-3 mb-6 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
              <div className="flex items-center gap-1.5 truncate max-w-md">
                <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-medium text-slate-700">Zdrojový web:</span>
                <span className="truncate text-slate-500">{metadata.sourceUrl || 'Lokálny webový obsah'}</span>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>{metadata.author || 'Web Extractor'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{metadata.date}</span>
                </div>
              </div>
            </div>
          )}

          {/* Slovak Summary Callout if available */}
          {metadata.slovakSummary && languageView !== 'original' && (
            <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Zhrnutie webu v slovenčine (AI Gemini):</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {metadata.slovakSummary}
              </p>
            </div>
          )}

          {/* Document Blocks List */}
          <div className="space-y-3">
            {blocks.map((block, idx) => (
              <BlockItemEditor
                key={block.id}
                block={block}
                languageView={languageView}
                onUpdateBlock={onUpdateBlock}
                onDeleteBlock={onDeleteBlock}
                onDuplicateBlock={onDuplicateBlock}
                onMoveBlock={onMoveBlock}
                onTranslateBlock={onTranslateBlock}
                onPolishBlock={onPolishBlock}
                isFirst={idx === 0}
                isLast={idx === blocks.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Footer Area */}
        <div className="mt-12 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <div>
            <span>{metadata.footerText || 'WebToPDF Studio • Editovateľný PDF dokument'}</span>
          </div>
          {metadata.showPageNumbers && (
            <div className="tabular-nums font-mono text-slate-500">
              Strana 1
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
