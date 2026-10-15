import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Copy,
  Languages,
  Sparkles,
  Plus,
  Minus,
  CheckSquare,
  PenTool,
  Calendar,
  Type,
  FileText,
} from 'lucide-react';
import { DocumentBlock, DocumentLanguageView } from '../types/document';

interface BlockItemEditorProps {
  block: DocumentBlock;
  languageView: DocumentLanguageView;
  onUpdateBlock: (updated: DocumentBlock) => void;
  onDeleteBlock: (id: string) => void;
  onDuplicateBlock: (id: string) => void;
  onMoveBlock: (id: string, direction: 'up' | 'down') => void;
  onTranslateBlock: (id: string) => Promise<void>;
  onPolishBlock: (id: string) => Promise<void>;
  isFirst: boolean;
  isLast: boolean;
}

export const BlockItemEditor: React.FC<BlockItemEditorProps> = ({
  block,
  languageView,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveBlock,
  onTranslateBlock,
  onPolishBlock,
  isFirst,
  isLast,
}) => {
  const [isTranslatingLocal, setIsTranslatingLocal] = useState(false);
  const [isPolishingLocal, setIsPolishingLocal] = useState(false);

  // Determine current active text based on language view
  const currentText =
    languageView === 'slovak'
      ? (block.slovakContent !== undefined ? block.slovakContent : (block.content || ''))
      : (block.originalContent !== undefined ? block.originalContent : (block.content || ''));

  const handleTextChange = (newVal: string) => {
    if (languageView === 'slovak') {
      onUpdateBlock({
        ...block,
        slovakContent: newVal,
        content: block.content || newVal,
      });
    } else {
      onUpdateBlock({
        ...block,
        originalContent: newVal,
        content: newVal,
      });
    }
  };

  const handleTranslate = async () => {
    setIsTranslatingLocal(true);
    try {
      await onTranslateBlock(block.id);
    } finally {
      setIsTranslatingLocal(false);
    }
  };

  const handlePolish = async () => {
    setIsPolishingLocal(true);
    try {
      await onPolishBlock(block.id);
    } finally {
      setIsPolishingLocal(false);
    }
  };

  // 1. Page Break Block
  if (block.type === 'page-break') {
    return (
      <div className="relative group my-8 border-y-2 border-dashed border-blue-400/50 py-3 text-center bg-blue-50/50">
        <span className="text-xs font-semibold text-blue-700 uppercase tracking-widest px-3 py-1 bg-white rounded shadow-xs">
          --- Nová strana PDF (Page Break) ---
        </span>
        <button
          onClick={() => onDeleteBlock(block.id)}
          className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-red-600 rounded"
          title="Odstrániť zlom strany"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // 2. Divider Block
  if (block.type === 'divider') {
    return (
      <div className="relative group my-4 py-2">
        <hr className="border-t border-slate-300" />
        <div className="absolute right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onDeleteBlock(block.id)}
            className="p-1 text-slate-400 hover:text-red-600 rounded bg-white shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group rounded-md p-2 -mx-2 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200 focus-within:border-blue-400/60 focus-within:bg-blue-50/20">
      {/* Floating Action Bar on Hover */}
      <div className="absolute right-2 -top-3.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-0.5 bg-white border border-slate-300 rounded-md shadow-sm px-1 py-0.5 z-20 no-print">
        <button
          onClick={handleTranslate}
          disabled={isTranslatingLocal}
          className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded"
          title="Preložiť tento blok do slovenčiny cez Gemini"
        >
          <Languages className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handlePolish}
          disabled={isPolishingLocal}
          className="p-1 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded"
          title="Vylepšiť slovenskú štylistiku a gramatiku"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>
        <div className="w-[1px] h-3 bg-slate-200 mx-0.5" />
        <button
          onClick={() => onMoveBlock(block.id, 'up')}
          disabled={isFirst}
          className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-30"
          title="Posunúť nahor"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onMoveBlock(block.id, 'down')}
          disabled={isLast}
          className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-30"
          title="Posunúť nadol"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDuplicateBlock(block.id)}
          className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
          title="Duplikovať blok"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDeleteBlock(block.id)}
          className="p-1 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded"
          title="Odstrániť blok"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Block Type Renderers */}
      {block.type === 'h1' && (
        <div className="space-y-1">
          <textarea
            value={currentText}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={1}
            placeholder="Hlavný nadpis dokumentu..."
            className="w-full resize-none font-bold text-slate-900 text-2xl lg:text-3xl leading-tight bg-transparent focus:outline-none focus:ring-0 tracking-tight"
            style={{ minHeight: '40px' }}
          />
          {languageView === 'bilingual' && block.originalContent && (
            <div className="text-xs text-slate-400 italic font-normal">
              Originál: {block.originalContent}
            </div>
          )}
        </div>
      )}

      {block.type === 'h2' && (
        <div className="space-y-1 mt-3">
          <textarea
            value={currentText}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={1}
            placeholder="Podnadpis kapitoly..."
            className="w-full resize-none font-bold text-slate-900 text-lg lg:text-xl leading-snug bg-transparent focus:outline-none focus:ring-0"
            style={{ minHeight: '30px' }}
          />
          {languageView === 'bilingual' && block.originalContent && (
            <div className="text-xs text-slate-400 italic">
              Originál: {block.originalContent}
            </div>
          )}
        </div>
      )}

      {block.type === 'h3' && (
        <div className="space-y-1 mt-2">
          <textarea
            value={currentText}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={1}
            placeholder="Menší nadpis..."
            className="w-full resize-none font-semibold text-slate-800 text-base leading-snug bg-transparent focus:outline-none focus:ring-0"
            style={{ minHeight: '26px' }}
          />
          {languageView === 'bilingual' && block.originalContent && (
            <div className="text-xs text-slate-400 italic">
              Originál: {block.originalContent}
            </div>
          )}
        </div>
      )}

      {block.type === 'paragraph' && (
        <div className="space-y-1">
          <textarea
            value={currentText}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={Math.max(2, Math.ceil(currentText.length / 80))}
            placeholder="Text odseku..."
            className="w-full resize-y text-slate-800 text-sm leading-relaxed bg-transparent focus:outline-none focus:ring-0"
          />
          {languageView === 'bilingual' && block.originalContent && (
            <div className="p-2 bg-slate-100 rounded text-xs text-slate-500 italic border-l-2 border-slate-300">
              <span className="font-medium not-italic text-slate-600">Pôvodné anglické znenie:</span> {block.originalContent}
            </div>
          )}
        </div>
      )}

      {block.type === 'quote' && (
        <div className="border-l-3 border-blue-500 pl-3.5 py-1 my-2 bg-slate-50/70 rounded-r">
          <textarea
            value={currentText}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={2}
            placeholder="Citácia alebo kľúčová myšlienka..."
            className="w-full resize-none italic text-slate-800 text-sm leading-relaxed bg-transparent focus:outline-none focus:ring-0"
          />
          {languageView === 'bilingual' && block.originalContent && (
            <div className="text-xs text-slate-400 mt-1">Originál: {block.originalContent}</div>
          )}
        </div>
      )}

      {block.type === 'callout' && (
        <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg my-2">
          <div className="flex items-center gap-1.5 text-blue-900 font-semibold text-xs mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span>Dôležité upozornenie / Informačný box</span>
          </div>
          <textarea
            value={currentText}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={2}
            placeholder="Text informačného boxu..."
            className="w-full resize-none text-slate-900 text-xs leading-relaxed bg-transparent focus:outline-none focus:ring-0"
          />
          {languageView === 'bilingual' && block.originalContent && (
            <div className="text-[11px] text-blue-700/80 mt-1 italic border-t border-blue-200/60 pt-1">
              Originál: {block.originalContent}
            </div>
          )}
        </div>
      )}

      {block.type === 'list' && (
        <div className="space-y-1.5 my-2">
          {(() => {
            const listItems =
              languageView === 'slovak'
                ? (block.slovakListItems || block.listItems || [''])
                : (block.originalListItems || block.listItems || ['']);

            return (
              <div className="space-y-1">
                {listItems.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold text-xs mt-1 shrink-0">
                      {block.listType === 'ordered' ? `${idx + 1}.` : '•'}
                    </span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const updated = [...listItems];
                        updated[idx] = e.target.value;
                        if (languageView === 'slovak') {
                          onUpdateBlock({ ...block, slovakListItems: updated });
                        } else {
                          onUpdateBlock({ ...block, originalListItems: updated, listItems: updated });
                        }
                      }}
                      className="flex-1 text-xs text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-400 focus:outline-none py-0.5"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = listItems.filter((_, i) => i !== idx);
                        if (languageView === 'slovak') {
                          onUpdateBlock({ ...block, slovakListItems: updated });
                        } else {
                          onUpdateBlock({ ...block, originalListItems: updated, listItems: updated });
                        }
                      }}
                      className="text-slate-400 hover:text-red-500 p-0.5"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const updated = [...listItems, 'Nová položka zoznamu'];
                    if (languageView === 'slovak') {
                      onUpdateBlock({ ...block, slovakListItems: updated });
                    } else {
                      onUpdateBlock({ ...block, originalListItems: updated, listItems: updated });
                    }
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium mt-1 pl-4"
                >
                  <Plus className="w-3 h-3" />
                  <span>Pridať položku</span>
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {block.type === 'table' && (
        <div className="my-3 overflow-x-auto">
          {(() => {
            const table =
              languageView === 'slovak'
                ? (block.slovakTableData || block.tableData || { headers: [], rows: [] })
                : (block.originalTableData || block.tableData || { headers: [], rows: [] });

            return (
              <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300">
                      {table.headers.map((h, colIdx) => (
                        <th key={colIdx} className="p-2 font-bold text-slate-800 border-r border-slate-200 last:border-r-0">
                          <input
                            type="text"
                            value={h}
                            onChange={(e) => {
                              const updatedH = [...table.headers];
                              updatedH[colIdx] = e.target.value;
                              const updatedTable = { ...table, headers: updatedH };
                              if (languageView === 'slovak') {
                                onUpdateBlock({ ...block, slovakTableData: updatedTable });
                              } else {
                                onUpdateBlock({ ...block, originalTableData: updatedTable, tableData: updatedTable });
                              }
                            }}
                            className="w-full font-bold bg-transparent focus:outline-none"
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50/50">
                        {row.map((cell, colIdx) => (
                          <td key={colIdx} className="p-2 border-r border-slate-200 last:border-r-0 text-slate-700">
                            <input
                              type="text"
                              value={cell}
                              onChange={(e) => {
                                const updatedRows = table.rows.map((r, rIdx) =>
                                  rIdx === rowIdx ? r.map((c, cIdx) => (cIdx === colIdx ? e.target.value : c)) : r
                                );
                                const updatedTable = { ...table, rows: updatedRows };
                                if (languageView === 'slovak') {
                                  onUpdateBlock({ ...block, slovakTableData: updatedTable });
                                } else {
                                  onUpdateBlock({ ...block, originalTableData: updatedTable, tableData: updatedTable });
                                }
                              }}
                              className="w-full bg-transparent focus:outline-none text-xs"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="bg-slate-50 p-1.5 flex items-center justify-between text-[11px] border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      const newRow = new Array(table.headers.length).fill('Nový údaj');
                      const updatedTable = { ...table, rows: [...table.rows, newRow] };
                      if (languageView === 'slovak') {
                        onUpdateBlock({ ...block, slovakTableData: updatedTable });
                      } else {
                        onUpdateBlock({ ...block, originalTableData: updatedTable, tableData: updatedTable });
                      }
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Pridať riadok
                  </button>
                  <span className="text-slate-400">Editovateľná tabuľka (AcroForm/PDF)</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {block.type === 'image' && (
        <div className="my-3 border border-slate-200 rounded-lg p-2 bg-slate-50/50">
          {block.imageSrc ? (
            <img
              src={block.imageSrc}
              alt={block.imageAlt || 'Obrázok dokumentu'}
              className="max-h-64 object-contain mx-auto rounded"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-28 flex items-center justify-center text-slate-400 text-xs italic">
              [Obrázok webu]
            </div>
          )}
          <input
            type="text"
            value={block.imageCaption || ''}
            onChange={(e) => onUpdateBlock({ ...block, imageCaption: e.target.value })}
            placeholder="Popis obrázku..."
            className="w-full text-center text-xs text-slate-500 mt-2 bg-transparent focus:outline-none border-b border-transparent focus:border-slate-300"
          />
        </div>
      )}

      {block.type === 'form-field' && block.formField && (
        <div className="p-3 my-2 bg-gradient-to-r from-blue-50/60 to-slate-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
              {block.formField.type === 'checkbox' && <CheckSquare className="w-3.5 h-3.5 text-blue-600" />}
              {block.formField.type === 'signature' && <PenTool className="w-3.5 h-3.5 text-blue-600" />}
              {block.formField.type === 'date' && <Calendar className="w-3.5 h-3.5 text-blue-600" />}
              {block.formField.type === 'text' && <Type className="w-3.5 h-3.5 text-blue-600" />}
              <span>Interaktívne AcroForm pole:</span>
            </div>
            <select
              value={block.formField.type}
              onChange={(e) => {
                if (block.formField) {
                  onUpdateBlock({
                    ...block,
                    formField: {
                      ...block.formField,
                      type: e.target.value as any,
                    },
                  });
                }
              }}
              className="bg-white border border-slate-300 text-slate-700 text-[11px] rounded px-1.5 py-0.5 focus:outline-none"
            >
              <option value="text">Textové pole</option>
              <option value="textarea">Viacriadkový text</option>
              <option value="checkbox">Začiarkavacie políčko (Checkbox)</option>
              <option value="date">Dátum</option>
              <option value="signature">Elektronický podpis</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <input
              type="text"
              value={block.formField.label}
              onChange={(e) => {
                if (block.formField) {
                  onUpdateBlock({
                    ...block,
                    formField: { ...block.formField, label: e.target.value },
                  });
                }
              }}
              placeholder="Popis poľa (Label)..."
              className="w-full text-xs font-semibold text-slate-800 bg-transparent focus:outline-none border-b border-slate-300 focus:border-blue-500 py-0.5"
            />

            {block.formField.type === 'checkbox' ? (
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={block.formField.checked || false}
                  onChange={(e) => {
                    if (block.formField) {
                      onUpdateBlock({
                        ...block,
                        formField: { ...block.formField, checked: e.target.checked },
                      });
                    }
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>{block.formField.placeholder || 'Začiarknuté'}</span>
              </label>
            ) : block.formField.type === 'signature' ? (
              <div className="border border-dashed border-slate-400 rounded-md p-2.5 bg-white text-center">
                <input
                  type="text"
                  value={block.formField.defaultValue || ''}
                  onChange={(e) => {
                    if (block.formField) {
                      onUpdateBlock({
                        ...block,
                        formField: { ...block.formField, defaultValue: e.target.value },
                      });
                    }
                  }}
                  placeholder="[Kliknite pre zadanie mena podpísanej osoby alebo digitálny podpis]"
                  className="w-full text-center text-xs font-serif italic text-blue-900 bg-transparent focus:outline-none"
                />
              </div>
            ) : block.formField.type === 'date' ? (
              <input
                type="date"
                value={block.formField.defaultValue || ''}
                onChange={(e) => {
                  if (block.formField) {
                    onUpdateBlock({
                      ...block,
                      formField: { ...block.formField, defaultValue: e.target.value },
                    });
                  }
                }}
                className="w-full text-xs text-slate-800 bg-white border border-slate-300 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            ) : block.formField.type === 'textarea' ? (
              <textarea
                value={block.formField.defaultValue || ''}
                onChange={(e) => {
                  if (block.formField) {
                    onUpdateBlock({
                      ...block,
                      formField: { ...block.formField, defaultValue: e.target.value },
                    });
                  }
                }}
                rows={2}
                placeholder={block.formField.placeholder || 'Zadajte text...'}
                className="w-full text-xs text-slate-800 bg-white border border-slate-300 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <input
                type="text"
                value={block.formField.defaultValue || ''}
                onChange={(e) => {
                  if (block.formField) {
                    onUpdateBlock({
                      ...block,
                      formField: { ...block.formField, defaultValue: e.target.value },
                    });
                  }
                }}
                placeholder={block.formField.placeholder || 'Zadajte hodnotu...'}
                className="w-full text-xs text-slate-800 bg-white border border-slate-300 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
