
import React, { useState, useEffect, useRef } from 'react';
import { fetchSuggestions } from '../services/geminiService';

interface SearchBarProps {
  onSearch: (word: string) => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2 && !isLoading) {
        const res = await fetchSuggestions(query);
        setSuggestions(res);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const finalQuery = activeIndex >= 0 ? suggestions[activeIndex] : query;
    if (finalQuery.trim()) {
      onSearch(finalQuery.trim());
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setActiveIndex(prev => Math.min(prev + 1, suggestions.length - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setActiveIndex(prev => Math.max(prev - 1, -1));
      e.preventDefault();
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="bg-ldoce-blue py-3 px-4 sticky top-0 z-50 shadow-lg">
      <div className="max-w-4xl mx-auto relative" ref={containerRef}>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-grow">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <i className="fas fa-search text-sm"></i>
            </span>
            <input
              type="text"
              autoFocus
              autoComplete="off"
              className="block w-full pl-9 pr-3 py-2 border-none rounded-md leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50 sm:text-base transition-all"
              placeholder="Type a word or phrase..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => query.length >= 2 && setShowSuggestions(true)}
            />
            {query && (
              <button 
                type="button"
                onClick={() => { setQuery(''); setSuggestions([]); }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-300 hover:text-slate-500"
              >
                <i className="fas fa-times-circle"></i>
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-md font-bold text-sm transition-colors disabled:opacity-50 min-w-[60px]"
          >
            {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : 'GO'}
          </button>
        </form>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-xl border border-slate-200 overflow-hidden z-[100]">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className={`w-full text-left px-9 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${activeIndex === index ? 'bg-slate-100' : ''}`}
                onClick={() => {
                  setQuery(suggestion);
                  onSearch(suggestion);
                  setShowSuggestions(false);
                }}
              >
                <span className={activeIndex === index ? 'font-bold text-ldoce-blue' : 'text-slate-700'}>
                  {suggestion}
                </span>
                <i className="fas fa-chevron-right text-[10px] text-slate-300"></i>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
