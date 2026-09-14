/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Languages, Clock } from 'lucide-react';
import Translator from './components/Translator';
import HistoryPage from './components/HistoryPage';
import { TranslationHistoryItem } from './types';
import { getTranslationHistory } from './utils/historyStorage';

export default function App() {
  const [activePage, setActivePage] = useState<'translator' | 'history'>('translator');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<TranslationHistoryItem | null>(null);
  const [historyCount, setHistoryCount] = useState<number>(0);

  const updateCount = () => {
    const items = getTranslationHistory();
    setHistoryCount(items.length);
  };

  useEffect(() => {
    updateCount();
    const handleUpdate = () => updateCount();
    window.addEventListener('translation-history-changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('translation-history-changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleSelectFromHistory = (item: TranslationHistoryItem) => {
    setSelectedHistoryItem(item);
    setActivePage('translator');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-200 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-gray-900 tracking-tight text-base sm:text-lg">
                AI Translator
              </span>
            </div>
          </div>

          {/* Page Navigation Tabs */}
          <nav className="flex items-center space-x-1 bg-gray-100/80 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setActivePage('translator')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activePage === 'translator'
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <Languages className="w-4 h-4" />
              <span>Translate</span>
            </button>

            <button
              onClick={() => setActivePage('history')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activePage === 'history'
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>History</span>
              {historyCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-xs font-bold ${
                  activePage === 'history' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {historyCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex items-start justify-center py-6 sm:py-10 px-4">
        {activePage === 'translator' ? (
          <Translator
            initialItem={selectedHistoryItem}
            onOpenHistory={() => setActivePage('history')}
          />
        ) : (
          <HistoryPage
            onSelectTranslation={handleSelectFromHistory}
            onNavigateToTranslator={() => setActivePage('translator')}
          />
        )}
      </main>

      <footer className="py-6 text-center text-sm text-gray-400 border-t border-gray-100">
        <p>AI Translator • Instant text & voice translation with browser history</p>
      </footer>
    </div>
  );
}

