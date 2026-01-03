
import React, { useState } from 'react';
import { SearchHistoryItem } from '../types';

interface HistoryViewProps {
  history: SearchHistoryItem[];
  onSelectWord: (word: string) => void;
  onClearHistory: () => void;
  onClose: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ history, onSelectWord, onClearHistory, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter((item) =>
    item.word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 serif">Your LexiFlow History</h2>
          <p className="text-slate-500">All the words you've explored so far.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClearHistory}
            className="text-sm font-semibold text-rose-600 hover:text-rose-700 transition-colors px-4 py-2 rounded-xl bg-rose-50 border border-rose-100"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl bg-slate-100 transition-colors"
          >
            Back to Search
          </button>
        </div>
      </div>

      {history.length > 0 && (
        <div className="mb-6 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <i className="fas fa-filter text-sm"></i>
          </span>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
            placeholder="Filter history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {history.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="text-slate-200 text-6xl mb-4">
            <i className="fas fa-history"></i>
          </div>
          <p className="text-slate-400 font-medium">Your history is currently empty.</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-400 font-medium">No matches found for "{searchTerm}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHistory.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onSelectWord(item.word)}
              className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left group"
            >
              <div>
                <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{item.word}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="text-slate-300 group-hover:text-blue-400 transition-colors">
                <i className="fas fa-chevron-right"></i>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryView;
