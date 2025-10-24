import React, { useState, useEffect } from 'react';
import { multiLanguageManager, SUPPORTED_LANGUAGES } from '../utils/MultiLanguageManager';

interface PanelState {
  loading: boolean;
  currentUrl: string;
  detections: any[];
  overallScore: number;
  error?: string;
  detectedLanguage: string;
  preferredLanguage: string;
}

export function Panel() {
  const [state, setState] = useState<PanelState>({
    loading: true,
    currentUrl: '',
    detections: [],
    overallScore: 0,
    detectedLanguage: 'en',
    preferredLanguage: multiLanguageManager.getPreferredLanguage()
  });
  
  const prevUrlRef = React.useRef<string>('');

  useEffect(() => {
    initializePanel();
    
    // Listen for tab changes by checking URL periodically
    const interval = setInterval(async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = tab.url || '';
      
      // If URL changed, refresh the panel
      if (currentUrl !== prevUrlRef.current) {
        console.log('📱 Tab changed from', prevUrlRef.current, 'to', currentUrl);
        prevUrlRef.current = currentUrl;
        initializePanel();
      }
    }, 300);
    
    return () => clearInterval(interval);
  }, []);

  const initializePanel = async () => {
    try {
      // Get current tab URL
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = tab.url || '';

      // Hash the URL to get storage key
      const urlHash = hashUrl(currentUrl);
      
      console.log(`🔍 Panel loading for URL: ${currentUrl}`);
      console.log(`🔑 URL hash: ${urlHash}`);
      
      // Load detection data from storage (per URL)
      const result = await chrome.storage.local.get([
        `detections_${urlHash}`,
        `score_${urlHash}`,
        'latestDetections',
        'latestScore'
      ]);
      
      // Try to get URL-specific data first, fall back to latest
      const detections = result[`detections_${urlHash}`] || result.latestDetections || [];
      const overallScore = result[`score_${urlHash}`] || result.latestScore || 0;

      console.log(`📊 Panel loaded: ${detections.length} detections, score: ${overallScore}`);
      console.log(`✅ Using ${result[`detections_${urlHash}`] ? 'URL-specific' : 'fallback'} data`);

      // Detect page language
      const pageText = detections.map((d: any) => d.description).join(' ');
      const detectedLang = multiLanguageManager.detectPageLanguage(pageText);

      setState({
        loading: false,
        currentUrl,
        detections,
        overallScore,
        detectedLanguage: detectedLang,
        preferredLanguage: multiLanguageManager.getPreferredLanguage()
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

  /**
   * Simple hash function for URL (same as content script)
   */
  const hashUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const key = `${urlObj.hostname}${urlObj.pathname}`;
      
      let hash = 0;
      for (let i = 0; i < key.length; i++) {
        const char = key.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      return Math.abs(hash).toString(36);
    } catch {
      return 'unknown';
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
        <div className="cs-flex cs-items-center cs-justify-between cs-gap-3 cs-mb-3">
          <div className="cs-flex cs-items-center cs-gap-3">
            <span className="cs-text-2xl">🛡️</span>
            <div>
              <h1 className="cs-text-lg cs-font-semibold cs-text-gray-900">CognitiveSense</h1>
              <p className="cs-text-xs cs-text-gray-500">Privacy-first cognitive safety</p>
            </div>
          </div>
          
          {/* Language Selector */}
          <div className="cs-flex cs-items-center cs-gap-2">
            <select
              value={state.preferredLanguage}
              onChange={async (e) => {
                const newLang = e.target.value;
                multiLanguageManager.setPreferredLanguage(newLang);
                
                // Re-translate all detections
                if (state.detections.length > 0) {
                  console.log(`🌐 Language changed to ${newLang}, re-translating detections...`);
                  
                  // Re-translate each detection's content
                  const translatedDetections = await Promise.all(
                    state.detections.map(async (detection: any) => {
                      const { multiLanguageManager: mlm } = await import('../utils/MultiLanguageManager');
                      
                      // Translate all text fields
                      const title = newLang !== 'en' 
                        ? await mlm.translateText(detection.title, newLang)
                        : detection.title;
                      
                      const description = newLang !== 'en'
                        ? await mlm.translateText(detection.description, newLang)
                        : detection.description;
                      
                      const reasoning = newLang !== 'en'
                        ? await mlm.translateText(detection.reasoning, newLang)
                        : detection.reasoning;
                      
                      const contentGen = new (await import('../ai/ContentGenerator')).ContentGenerator();
                      
                      const userFriendlyWarning = await contentGen.generateUserFriendlyWarning(detection);
                      const educationalTip = await contentGen.generateEducationalTip(detection);
                      
                      return {
                        ...detection,
                        title,
                        description,
                        reasoning,
                        userFriendlyWarning,
                        educationalTip
                      };
                    })
                  );
                  
                  setState(prev => ({
                    ...prev,
                    preferredLanguage: newLang,
                    detections: translatedDetections
                  }));
                  
                  console.log(`✅ All detection content re-translated to ${newLang}`);
                } else {
                  setState(prev => ({
                    ...prev,
                    preferredLanguage: newLang
                  }));
                }
              }}
              className="cs-text-xs cs-px-2 cs-py-1 cs-border cs-border-gray-300 cs-rounded cs-bg-white cs-cursor-pointer"
              title="Select language for translations"
            >
              {Object.values(SUPPORTED_LANGUAGES).map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
            {state.detectedLanguage !== 'en' && (
              <span className="cs-text-xs cs-text-gray-500 cs-font-semibold" title="Auto-detected page language">
                🌐 {SUPPORTED_LANGUAGES[state.detectedLanguage]?.name || state.detectedLanguage}
              </span>
            )}
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
                    <div className="cs-flex cs-items-start cs-justify-between cs-mb-1">
                      <strong className="cs-font-semibold cs-text-blue-900">🤖 AI Analysis:</strong>
                      <span className="cs-text-xs cs-bg-blue-200 cs-text-blue-800 cs-px-2 cs-py-0.5 cs-rounded cs-font-semibold">
                        Prompt API
                      </span>
                    </div>
                    <p className="cs-text-xs cs-text-blue-900">
                      {detection.reasoning}
                    </p>
                  </div>
                )}
                
                {detection.userFriendlyWarning && (
                  <div className="cs-bg-amber-50 cs-rounded cs-p-2 cs-mt-2">
                    <div className="cs-flex cs-items-start cs-justify-between cs-mb-1">
                      <strong className="cs-font-semibold cs-text-amber-900">⚠️ What This Means:</strong>
                      <span className="cs-text-xs cs-bg-amber-200 cs-text-amber-800 cs-px-2 cs-py-0.5 cs-rounded cs-font-semibold">
                        Writer API
                      </span>
                    </div>
                    <p className="cs-text-xs cs-text-amber-900">
                      {detection.userFriendlyWarning}
                    </p>
                  </div>
                )}
                
                {detection.educationalTip && (
                  <div className="cs-bg-green-50 cs-rounded cs-p-2 cs-mt-2">
                    <div className="cs-flex cs-items-start cs-justify-between cs-mb-1">
                      <strong className="cs-font-semibold cs-text-green-900">💡 Smart Tip:</strong>
                      <span className="cs-text-xs cs-bg-green-200 cs-text-green-800 cs-px-2 cs-py-0.5 cs-rounded cs-font-semibold">
                        Writer API
                      </span>
                    </div>
                    <p className="cs-text-xs cs-text-green-900">
                      {detection.educationalTip}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="cs-border-t cs-border-gray-200 cs-p-3">
        <div className="cs-text-xs cs-text-gray-600 cs-mb-2 cs-text-center cs-font-semibold">
          Powered by Chrome Built-in AI APIs 🤖
        </div>
        <div className="cs-flex cs-gap-2 cs-justify-center cs-flex-wrap">
          <span className="cs-text-xs cs-bg-blue-100 cs-text-blue-700 cs-px-2 cs-py-1 cs-rounded cs-font-semibold">
            ✅ Prompt API
          </span>
          <span className="cs-text-xs cs-bg-amber-100 cs-text-amber-700 cs-px-2 cs-py-1 cs-rounded cs-font-semibold">
            ✅ Writer API
          </span>
          <span className="cs-text-xs cs-bg-gray-200 cs-text-gray-700 cs-px-2 cs-py-1 cs-rounded cs-font-semibold">
            ⏳ Summarizer API
          </span>
        </div>
      </footer>
    </div>
  );
}
