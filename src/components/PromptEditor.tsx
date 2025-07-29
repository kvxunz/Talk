import { useState, useEffect } from 'react';
import { getDefaultPrompt, setTargetLanguage, type SupportedLanguage } from '../lib/api';

interface PromptEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prompt: string) => void;
  initialPrompt: string;
}

export function PromptEditor({ isOpen, onClose, onSave, initialPrompt }: PromptEditorProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [targetLanguage, setTargetLang] = useState<SupportedLanguage>('en-US');

  useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt]);

  if (!isOpen) return null;

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setTargetLang(lang);
    setTargetLanguage(lang);
    setPrompt(getDefaultPrompt(lang));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Edit Gemini Prompt</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 dark:text-gray-300">Target Language</label>
          <select 
            value={targetLanguage}
            onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="en-US">English</option>
            <option value="ja-JP">Japanese</option>
            <option value="cmn-CN">Chinese</option>
            <option value="ko-KR">Korean</option>
          </select>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full h-48 p-4 border rounded mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(prompt);
              onClose();
            }}
            className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
