
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DictionaryEntry, SearchHistoryItem } from './types';
import { fetchWordDetails, fetchAudio } from './services/geminiService';
import SearchBar from './components/SearchBar';
import WordDisplay from './components/WordDisplay';
import HistoryView from './components/HistoryView';

// --- 音频解码工具函数 ---
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
// ----------------------

const App: React.FC = () => {
  const [currentWord, setCurrentWord] = useState<DictionaryEntry | null>(null);
  const [backStack, setBackStack] = useState<DictionaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [activeView, setActiveView] = useState<'search' | 'history'>('search');
  
  const audioContextRef = useRef<AudioContext | null>(null);

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
      } else if (!isBackAction) {
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
      // 获取 Gemini 生成的 base64 PCM 数据 (美音)
      const base64Audio = await fetchAudio(currentWord.word);
      
      if (base64Audio) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        const ctx = audioContextRef.current;
        const audioData = decodeBase64(base64Audio);
        const audioBuffer = await decodeAudioData(audioData, ctx, 24000, 1);
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start();
      } else {
        // 备选方案：如果 AI 语音失败，使用系统自带的美音
        const utterance = new SpeechSynthesisUtterance(currentWord.word);
        utterance.lang = 'en-US'; // 切换到美式英语
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error("Audio failed", err);
      // 错误回退
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
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
