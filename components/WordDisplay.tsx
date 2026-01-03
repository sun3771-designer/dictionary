
import React, { useState } from 'react';
import { DictionaryEntry, WordDefinition } from '../types';

interface WordDisplayProps {
  entry: DictionaryEntry;
  onPlayAudio: () => void;
  isAudioLoading: boolean;
  onSearchWord?: (word: string) => void;
  onGoBack?: () => void;
  previousWord?: string;
}

const ClickableText: React.FC<{ text: string; onWordClick?: (word: string) => void; className?: string }> = ({ text, onWordClick, className = "" }) => {
  if (!onWordClick) return <span className={className}>{text}</span>;
  const words = text.split(/(\s+)/);
  return (
    <span className={className}>
      {words.map((part, index) => {
        if (/^\s+$/.test(part)) return part;
        const cleanWord = part.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]"'?]/g, "").trim();
        if (!cleanWord) return part;
        return (
          <span
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              onWordClick(cleanWord);
            }}
            className="cursor-pointer hover:text-ldoce-blue hover:underline decoration-ldoce-blue/40 transition-colors"
          >
            {part}
          </span>
        );
      })}
    </span>
  );
};

const WordDisplay: React.FC<WordDisplayProps> = ({ entry, onPlayAudio, isAudioLoading, onSearchWord, onGoBack, previousWord }) => {
  const [showChinese, setShowChinese] = useState(false);

  const groupedDefinitions: Record<string, WordDefinition[]> = entry.definitions.reduce((acc, def) => {
    const posKey = def.pos.toLowerCase();
    if (!acc[posKey]) acc[posKey] = [];
    acc[posKey].push(def);
    return acc;
  }, {} as Record<string, WordDefinition[]>);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6 animate-in fade-in duration-300">
      
      {onGoBack && (
        <button 
          onClick={onGoBack}
          className="flex items-center gap-2 text-ldoce-blue hover:text-ldoce-darkBlue font-bold text-xs transition-all bg-white px-3 py-2 rounded-full shadow-sm border border-slate-100"
        >
          <i className="fas fa-arrow-left"></i>
          Back to "{previousWord}"
        </button>
      )}

      {/* Entry Header */}
      <div className="bg-white rounded-lg shadow-sm border-b-2 border-ldoce-blue p-6">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-4xl font-bold text-ldoce-blue tracking-tight uppercase">{entry.word}</h1>
          
          {/* Frequency Tags */}
          {entry.frequency && (
            <div className="flex gap-1.5">
              {entry.frequency.spoken && (
                <span className="bg-ldoce-red text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm" title="Spoken frequency rank">{entry.frequency.spoken}</span>
              )}
              {entry.frequency.written && (
                <span className="bg-ldoce-blue text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm" title="Written frequency rank">{entry.frequency.written}</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xl text-slate-500 font-mono">/{entry.ipa}/</span>
            <button
              onClick={onPlayAudio}
              disabled={isAudioLoading}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-ldoce-blue/10 text-ldoce-blue hover:bg-ldoce-blue hover:text-white transition-all"
            >
              <i className={`fas ${isAudioLoading ? 'fa-spinner fa-spin' : 'fa-volume-up'}`}></i>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedDefinitions).map(([pos, defs]) => (
          <div key={pos} className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-100">
            <div className="bg-ldoce-blue px-4 py-1.5">
              <span className="text-white text-xs font-bold italic tracking-wider uppercase">{pos}</span>
            </div>
            
            <div className="p-5 space-y-6">
              {defs.map((def, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-ldoce-blue font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-grow space-y-3">
                    <div className="flex flex-wrap items-baseline gap-2">
                      {def.pattern && (
                        <span className="grammar-tag text-sm">{def.pattern}</span>
                      )}
                      <ClickableText text={def.meaning} onWordClick={onSearchWord} className="text-ldoce-textGrey text-lg leading-snug font-medium block" />
                    </div>

                    {def.collocations && def.collocations.length > 0 && (
                      <div className="flex flex-wrap gap-2 py-1">
                        {def.collocations.map((col, i) => (
                          <span key={i} className="text-[11px] font-bold text-ldoce-blue bg-blue-50 px-2.5 py-1 rounded border border-blue-100 tracking-tight">
                            <ClickableText text={col} onWordClick={onSearchWord} />
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2.5 pl-3 border-l-2 border-slate-100">
                      {def.examples.map((ex, i) => (
                        <div key={i} className="flex">
                          <span className="example-bullet">•</span>
                          <ClickableText text={ex} onWordClick={onSearchWord} className="text-slate-600 italic text-[15px] leading-relaxed block" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {entry.phrasal_verbs && entry.phrasal_verbs.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border-l-4 border-ldoce-red border-y border-r border-slate-100">
            <div className="bg-ldoce-red/5 px-4 py-2.5 border-b border-ldoce-red/10">
              <h2 className="text-ldoce-red font-bold flex items-center gap-2 tracking-wide text-xs">
                <i className="fas fa-random"></i> PHRASAL VERBS
              </h2>
            </div>
            <div className="p-5 space-y-6">
              {entry.phrasal_verbs.map((pv, idx) => (
                <div key={idx} className="space-y-1.5">
                  <h3 className="text-lg font-bold text-ldoce-blue underline decoration-ldoce-blue/20 underline-offset-4 cursor-pointer" onClick={() => onSearchWord?.(pv.phrase)}>{pv.phrase}</h3>
                  <ClickableText text={pv.meaning} onWordClick={onSearchWord} className="text-slate-700 text-base block" />
                  <div className="pl-4 space-y-1.5 mt-3 border-l border-slate-200">
                    {pv.examples.map((ex, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-slate-400">▪</span>
                        <ClickableText text={ex} onWordClick={onSearchWord} className="text-slate-500 italic text-sm block" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {entry.usage_note && (
          <div className="bg-amber-50 rounded-lg p-6 border border-amber-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <i className="fas fa-lightbulb text-6xl text-amber-600"></i>
            </div>
            <div className="flex items-center gap-3 mb-3 text-amber-800 relative z-10">
              <i className="fas fa-info-circle text-lg"></i>
              <h4 className="font-bold text-xs tracking-widest uppercase">Usage Note</h4>
            </div>
            <ClickableText text={entry.usage_note} onWordClick={onSearchWord} className="text-amber-900 text-[15px] leading-relaxed relative z-10 font-medium italic block" />
          </div>
        )}

        {(entry.synonyms.length > 0 || entry.antonyms.length > 0) && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-emerald-600 px-4 py-2 border-b border-emerald-700/10">
              <h2 className="text-white font-bold flex items-center gap-2 tracking-wider text-xs">
                <i className="fas fa-layer-group"></i> RELATED WORDS
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {entry.synonyms.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-emerald-100 pb-2">
                    <span className="text-[10px] font-black text-emerald-600 tracking-widest uppercase">Synonyms</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {entry.synonyms.map((s, i) => (
                      <button key={i} onClick={() => onSearchWord?.(s)} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-sm font-semibold px-3 py-1.5 rounded-full border border-emerald-200 transition-all">{s}</button>
                    ))}
                  </div>
                </div>
              )}
              {entry.antonyms.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-rose-100 pb-2">
                    <span className="text-[10px] font-black text-rose-600 tracking-widest uppercase">Antonyms</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {entry.antonyms.map((a, i) => (
                      <button key={i} onClick={() => onSearchWord?.(a)} className="bg-rose-50 hover:bg-rose-100 text-rose-800 text-sm font-semibold px-3 py-1.5 rounded-full border border-rose-200 transition-all">{a}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {entry.derivatives && entry.derivatives.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
            <h4 className="text-slate-500 font-bold text-[10px] tracking-[0.2em] mb-4 border-b border-slate-200 pb-1 uppercase">Word Family</h4>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {entry.derivatives.map((d, i) => (
                <button key={i} onClick={() => onSearchWord?.(d)} className="text-sm text-slate-700 font-bold hover:text-ldoce-blue transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>{d}
                </button>
              ))}
            </div>
          </div>
        )}

        {entry.origin && (
          <div className="p-4 flex items-center justify-center gap-3">
             <div className="h-px bg-slate-200 flex-grow"></div>
             <p className="text-[10px] text-slate-400 font-bold tracking-widest whitespace-nowrap uppercase">Etymology: {entry.origin}</p>
             <div className="h-px bg-slate-200 flex-grow"></div>
          </div>
        )}

        {entry.translation && (
          <div className="mt-12 pt-8 border-t border-slate-200">
            <button 
              onClick={() => setShowChinese(!showChinese)}
              className="w-full bg-blue-50 border border-blue-100 rounded-lg p-4 text-blue-800 flex items-center justify-between hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <i className="fas fa-language text-xl"></i>
                <span className="font-bold text-sm">Show translation source (Chinese)</span>
              </div>
              <i className={`fas fa-chevron-${showChinese ? 'up' : 'down'}`}></i>
            </button>
            {showChinese && (
              <div className="mt-4 bg-white rounded-lg p-5 shadow-sm border border-blue-200 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 opacity-80 text-[10px] font-bold tracking-widest uppercase text-blue-600">Source text</div>
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-medium text-slate-800">{entry.translation.sourceText}</span>
                    <i className="fas fa-arrow-right text-slate-300"></i>
                    <span className="text-2xl font-bold text-ldoce-blue">{entry.translation.translatedText}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WordDisplay;
