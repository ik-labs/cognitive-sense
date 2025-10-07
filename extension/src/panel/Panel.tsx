import { useState, useEffect } from 'react';

interface PanelState {
  loading: boolean;
  currentUrl: string;
  detections: any[];
  overallScore: number;
  error?: string;
}

export function Panel() {
  const [state, setState] = useState<PanelState>({
    loading: true,
    currentUrl: '',
    detections: [],
    overallScore: 0
  });

  useEffect(() => {
    initializePanel();
  }, []);

  const initializePanel = async () => {
    try {
      // Get current tab URL
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = tab.url || '';

      // TODO: Load detection data from storage
      // For now, show placeholder

      setState({
        loading: false,
        currentUrl,
        detections: [],
        overallScore: 0
      });
    } catch (error) {
      console.error('Failed to initialize panel:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load panel'
      }));
    }
  };

  if (state.loading) {
    return (
      <div className="cs-flex cs-items-center cs-justify-center cs-h-screen cs-bg-gray-50">
        <div className="cs-text-center">
          <div className="cs-text-2xl cs-mb-2">🛡️</div>
          <div className="cs-text-sm cs-text-gray-600">Loading CognitiveSense...</div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="cs-flex cs-items-center cs-justify-center cs-h-screen cs-bg-red-50">
        <div className="cs-text-center cs-text-red-600">
          <div className="cs-text-xl cs-mb-2">⚠️</div>
          <div className="cs-text-sm">{state.error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="cs-w-full cs-h-screen cs-bg-white cs-flex cs-flex-col">
      {/* Header */}
      <header className="cs-bg-white cs-border-b cs-border-gray-200 cs-p-4">
        <div className="cs-flex cs-items-center cs-gap-3">
          <span className="cs-text-2xl">🛡️</span>
          <div>
            <h1 className="cs-text-lg cs-font-semibold cs-text-gray-900">CognitiveSense</h1>
            <p className="cs-text-xs cs-text-gray-500">Privacy-first cognitive safety</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="cs-flex-1 cs-p-4 cs-overflow-y-auto">
        {/* Current Page */}
        <section className="cs-mb-6">
          <h2 className="cs-text-sm cs-font-medium cs-text-gray-700 cs-mb-2">Current Page</h2>
          <div className="cs-bg-gray-50 cs-rounded-lg cs-p-3">
            <div className="cs-text-xs cs-text-gray-600 cs-truncate">
              {state.currentUrl || 'No page loaded'}
            </div>
          </div>
        </section>

        {/* Status */}
        <section className="cs-mb-6">
          <div className="cs-bg-green-50 cs-border cs-border-green-200 cs-rounded-lg cs-p-4 cs-text-center">
            <div className="cs-text-3xl cs-font-bold cs-text-green-600 cs-mb-1">
              {state.overallScore}
              <span className="cs-text-lg cs-opacity-70">/100</span>
            </div>
            <div className="cs-text-sm cs-text-green-700 cs-font-medium">Safe</div>
            <div className="cs-text-xs cs-text-green-600 cs-mt-1">
              No manipulation detected
            </div>
          </div>
        </section>

        {/* Placeholder for future features */}
        <section className="cs-space-y-4">
          <div className="cs-bg-gray-50 cs-rounded-lg cs-p-4 cs-text-center cs-text-gray-500">
            <div className="cs-text-sm cs-mb-2">🚧 Coming Soon</div>
            <div className="cs-text-xs">
              Detection breakdown, history, and settings will appear here
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="cs-border-t cs-border-gray-200 cs-p-3 cs-text-center">
        <div className="cs-text-xs cs-text-gray-500">
          Day 1 Foundation Complete ✅
        </div>
      </footer>
    </div>
  );
}
