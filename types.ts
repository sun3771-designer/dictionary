
export interface WordDefinition {
  pos: string;
  pattern?: string;
  meaning: string;
  examples: string[];
  collocations?: string[];
}

export interface PhrasalVerb {
  phrase: string;
  meaning: string;
  examples: string[];
}

export interface DictionaryEntry {
  word: string;
  ipa: string;
  definitions: WordDefinition[];
  phrasal_verbs?: PhrasalVerb[];
  synonyms: string[];
  antonyms: string[];
  derivatives?: string[];
  origin?: string;
  usage_note?: string;
  frequency?: {
    spoken?: string; // e.g., 'S1', 'S2'
    written?: string; // e.g., 'W1', 'W2'
  };
  // Translation metadata
  translation?: {
    sourceText: string;
    translatedText: string;
    isSentence?: boolean;
  };
}

export interface SearchHistoryItem {
  word: string;
  timestamp: number;
}
