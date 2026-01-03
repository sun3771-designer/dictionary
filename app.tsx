
import React, { useState, useEffect, useCallback } from 'react';
import { DictionaryEntry, SearchHistoryItem } from './types';
import { fetchWordDetails } from './services/geminiService';
import SearchBar from './components/SearchBar';
import WordDisplay from './components/WordDisplay';
import HistoryView from './components/HistoryView';

const App: React.FC = () => {
  const [currentWord, setCurrentWord] = useState<DictionaryEntry | null>(null);
  const [backStack, setBackStack] = useState<DictionaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [activeView, setActiveView] = useState<'search' | 'history'>('search');

  useEffect(() => {
    const saved = localStorage.getItem('dictionary_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const handleSearch = async (word: string, isBackAction: boolean = false) => {
    setIsLoading(true);
    setError(null);
    setActiveView('search');
    try {
      const result = await fetchWordDetails(word);
      
      if (!isBackAction && currentWord) {
        setBackStack(prev => [...prev, currentWord]);
      } else if (isBackAction) {
        // We are already navigating using the stack, handled by goBack
      } else {
        // First search, clear stack
        setBackStack([]);
      }

      setCurrentWord(result);
      
      const newHistoryItem: SearchHistoryItem = { word: result.word, timestamp: Date.now() };
      const updatedHistory = [newHistoryItem, ...history.filter(h => h.word.toLowerCase() !== result.word.toLowerCase())].slice(0, 100);
      setHistory(updatedHistory);
      localStorage.setItem('dictionary_history', JSON.stringify(updatedHistory));
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError("Word not found. Check spelling or try another.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (backStack.length === 0) return;
    const previous = backStack[backStack.length - 1];
    setBackStack(prev => prev.slice(0, -1));
    setCurrentWord(previous);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('dictionary_history');
  };

  const playPronunciation = useCallback(async () => {
    if (!currentWord) return;
    setIsAudioLoading(true);
    try {
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.lang = 'en-GB';
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Audio failed", err);
    } finally {
      setIsAudioLoading(false);
    }
  }, [currentWord]);

  return (
    <div className="min-h-screen bg-ldoce-lightGrey pb-12">
      <header className="bg-ldoce-darkBlue text-white py-3 px-4 shadow-md relative z-[60]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fas fa-book-bookmark text-xl text-white"></i>
            <span className="text-xl font-bold tracking-tight">LexiFlow</span>
          </div>
          <nav className="flex gap-1 bg-white/10 rounded-lg p-1">
            <button 
              onClick={() => setActiveView('search')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${activeView === 'search' ? 'bg-white text-ldoce-darkBlue' : 'text-white/80 hover:text-white'}`}
            >
              DICT
            </button>
            <button 
              onClick={() => setActiveView('history')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${activeView === 'history' ? 'bg-white text-ldoce-darkBlue' : 'text-white/80 hover:text-white'}`}
            >
              HIST {history.length > 0 && `(${history.length})`}
            </button>
          </nav>
        </div>
      </header>

      {activeView === 'search' ? (
        <>
          <SearchBar onSearch={(word) => handleSearch(word)} isLoading={isLoading} />

          <main className="container mx-auto">
            {!currentWord && !isLoading && !error && (
              <div className="max-w-xl mx-auto mt-16 text-center px-4">
                <div className="mb-6 opacity-20">
                  <i className="fas fa-book-open text-8xl text-ldoce-blue"></i>
                </div>
                <h2 className="text-2xl font-bold text-ldoce-darkBlue mb-2">Longman Style Dictionary</h2>
                <p className="text-slate-500 mb-8 text-sm">
                  Search for meanings, grammar, collocations and examples in authentic contemporary English.
                </p>
                
                {history.length > 0 && (
                  <div className="text-left bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                    <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-4">Recent Searches</h3>
                    <div className="flex flex-wrap gap-2">
                      {history.slice(0, 12).map((h, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSearch(h.word)}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-ldoce-blue hover:text-white rounded text-sm text-slate-600 transition-all border border-slate-200"
                        >
                          {h.word}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isLoading && (
              <div className="flex flex-col items-center justify-center mt-20">
                <div className="w-10 h-10 border-4 border-ldoce-blue border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-400 text-sm font-medium">Consulting Lexicographer...</p>
              </div>
            )}

            {error && (
              <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded-lg border-l-4 border-ldoce-red shadow-sm">
                <h3 className="text-ldoce-red font-bold mb-2">Not Found</h3>
                <p className="text-slate-600 text-sm">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-4 text-xs font-bold text-ldoce-blue uppercase"
                >
                  Dismiss
                </button>
              </div>
            )}

            {currentWord && !isLoading && (
              <WordDisplay 
                entry={currentWord} 
                onPlayAudio={playPronunciation} 
                isAudioLoading={isAudioLoading}
                onSearchWord={(word) => handleSearch(word)}
                onGoBack={backStack.length > 0 ? goBack : undefined}
                previousWord={backStack.length > 0 ? backStack[backStack.length - 1].word : undefined}
              />
            )}
          </main>
        </>
      ) : (
        <HistoryView 
          history={history} 
          onSelectWord={(word) => handleSearch(word)} 
          onClearHistory={clearHistory}
          onClose={() => setActiveView('search')}
        />
      )}
    </div>
  );
};

export default App;
