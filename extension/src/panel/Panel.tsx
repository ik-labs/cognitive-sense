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

      // Load detection data from storage
      const result = await chrome.storage.local.get(['latestDetections', 'latestScore']);
      const detections = result.latestDetections || [];
      const overallScore = result.latestScore || 0;

      setState({
        loading: false,
        currentUrl,
        detections,
        overallScore
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

  // Listen for detection updates
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'DETECTION_COMPLETE') {
        setState(prev => ({
          ...prev,
          detections: message.data.detections || [],
          overallScore: message.data.overallScore || 0
        }));
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

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
          {state.detections.length === 0 ? (
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
          ) : (
            <div className="cs-bg-orange-50 cs-border cs-border-orange-200 cs-rounded-lg cs-p-4 cs-text-center">
              <div className="cs-text-3xl cs-font-bold cs-text-orange-600 cs-mb-1">
                {state.detections.length}
              </div>
              <div className="cs-text-sm cs-text-orange-700 cs-font-medium">
                Manipulation Tactics Detected
              </div>
              <div className="cs-text-xs cs-text-orange-600 cs-mt-1">
                {state.detections.filter(d => d.severity === 'high').length} high severity
              </div>
            </div>
          )}
        </section>

        {/* Detections List */}
        {state.detections.length > 0 && (
          <section className="cs-space-y-3">
            <h2 className="cs-text-sm cs-font-medium cs-text-gray-700 cs-mb-3">
              Detected Tactics
            </h2>
            {state.detections.map((detection: any, index: number) => (
              <div
                key={detection.id || index}
                className={`cs-bg-white cs-border-l-4 cs-rounded-lg cs-p-4 cs-shadow-sm ${
                  detection.severity === 'high' ? 'cs-border-red-500' :
                  detection.severity === 'medium' ? 'cs-border-orange-500' :
                  'cs-border-green-500'
                }`}
              >
                <div className="cs-flex cs-items-start cs-justify-between cs-mb-2">
                  <span className={`cs-text-xs cs-font-bold cs-px-2 cs-py-1 cs-rounded ${
                    detection.severity === 'high' ? 'cs-bg-red-100 cs-text-red-700' :
                    detection.severity === 'medium' ? 'cs-bg-orange-100 cs-text-orange-700' :
                    'cs-bg-green-100 cs-text-green-700'
                  }`}>
                    {detection.severity?.toUpperCase()}
                  </span>
                  <span className="cs-text-xs cs-text-gray-500">
                    {Math.round((detection.confidence || 0.5) * 100)}% confident
                  </span>
                </div>
                <h3 className="cs-text-sm cs-font-semibold cs-text-gray-900 cs-mb-2">
                  {detection.title}
                </h3>
                <p className="cs-text-xs cs-text-gray-600 cs-mb-2">
                  {detection.description}
                </p>
                {detection.reasoning && (
                  <div className="cs-bg-blue-50 cs-rounded cs-p-2 cs-mt-2">
                    <p className="cs-text-xs cs-text-blue-900">
                      <strong className="cs-font-semibold">🤖 AI Analysis:</strong> {detection.reasoning}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="cs-border-t cs-border-gray-200 cs-p-3 cs-text-center">
        <div className="cs-text-xs cs-text-gray-500">
          Powered by Chrome Built-in AI (Gemini Nano) 🤖
        </div>
      </footer>
    </div>
  );
}
