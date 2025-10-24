/**
 * MultiLanguageManager - Handles language detection and translation
 * Uses Chrome AI Translator API when available, with intelligent fallbacks
 */

import { Debug } from './Debug';

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageConfig> = {
  en: { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  ta: { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  zh: { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' }
};

export class MultiLanguageManager {
  private translatorCache: Map<string, any> = new Map();
  private detectedLanguage: string = 'en';
  private userPreferredLanguage: string = 'en';

  constructor() {
    this.loadUserPreference();
  }

  /**
   * Detect page language using heuristic patterns
   */
  detectPageLanguage(pageText: string): string {
    const text = pageText.substring(0, 500); // Sample first 500 chars

    // Script-based detection (most reliable)
    if (this.containsScript(text, 'devanagari')) return 'hi'; // हिंदी
    if (this.containsScript(text, 'tamil')) return 'ta'; // தமிழ்
    if (this.containsScript(text, 'telugu')) return 'te'; // తెలుగు
    if (this.containsScript(text, 'kannada')) return 'kn'; // ಕನ್ನಡ
    if (this.containsScript(text, 'japanese')) return 'ja'; // 日本語
    if (this.containsScript(text, 'chinese')) return 'zh'; // 中文
    if (this.containsScript(text, 'korean')) return 'ko'; // 한국어
    if (this.containsScript(text, 'arabic')) return 'ar'; // العربية

    // Keyword-based detection
    const lowerText = text.toLowerCase();
    
    // Spanish indicators
    if (this.hasKeywords(lowerText, ['¿', '¡', 'el ', 'la ', 'de ', 'que ', 'es '])) return 'es';
    
    // French indicators
    if (this.hasKeywords(lowerText, ['«', '»', 'le ', 'la ', 'de ', 'que ', 'est '])) return 'fr';
    
    // German indicators
    if (this.hasKeywords(lowerText, ['ä', 'ö', 'ü', 'ß', 'der ', 'die ', 'das '])) return 'de';

    // Default to English
    return 'en';
  }

  /**
   * Translate text to target language using Chrome AI Translator API
   */
  async translateText(text: string, targetLanguage: string = this.userPreferredLanguage): Promise<string> {
    // No translation needed for English
    if (targetLanguage === 'en') {
      return text;
    }

    try {
      // Check if Translator API is available
      if (!('Translator' in window)) {
        Debug.warning('Translator API not available, returning original text');
        return text;
      }

      const cacheKey = `en-${targetLanguage}`;
      let translator = this.translatorCache.get(cacheKey);

      // Create translator if not cached
      if (!translator) {
        Debug.apiCall('Translator', 'start');
        
        const availability = await (window as any).Translator.availability({
          sourceLanguage: 'en',
          targetLanguage: targetLanguage
        });

        if (availability !== 'available' && availability !== 'downloadable') {
          Debug.warning(`Translator not available for en-${targetLanguage}`);
          return text;
        }

        translator = await (window as any).Translator.create({
          sourceLanguage: 'en',
          targetLanguage: targetLanguage
        });

        this.translatorCache.set(cacheKey, translator);
        Debug.apiCall('Translator', 'success', `Created translator for en-${targetLanguage}`);
      }

      // Translate the text
      const translated = await translator.translate(text);
      Debug.success(`Translated text to ${targetLanguage}`);
      return translated;
    } catch (error) {
      Debug.error('Translation failed', error);
      return text; // Return original text on error
    }
  }

  /**
   * Get user's preferred language
   */
  getPreferredLanguage(): string {
    return this.userPreferredLanguage;
  }

  /**
   * Set user's preferred language
   */
  setPreferredLanguage(languageCode: string): void {
    if (SUPPORTED_LANGUAGES[languageCode]) {
      this.userPreferredLanguage = languageCode;
      localStorage.setItem('cs_preferred_language', languageCode);
      Debug.info(`User language preference set to ${languageCode}`);
    }
  }

  /**
   * Get detected language
   */
  getDetectedLanguage(): string {
    return this.detectedLanguage;
  }

  /**
   * Get language config
   */
  getLanguageConfig(code: string): LanguageConfig | null {
    return SUPPORTED_LANGUAGES[code] || null;
  }

  /**
   * Get all supported languages
   */
  getAllSupportedLanguages(): LanguageConfig[] {
    return Object.values(SUPPORTED_LANGUAGES);
  }

  /**
   * Private helper: Check if text contains specific script
   */
  private containsScript(text: string, scriptName: string): boolean {
    const scripts: Record<string, RegExp> = {
      devanagari: /[\u0900-\u097F]/g, // हिंदी
      tamil: /[\u0B80-\u0BFF]/g, // தமிழ்
      telugu: /[\u0C00-\u0C7F]/g, // తెలుగు
      kannada: /[\u0C80-\u0CFF]/g, // ಕನ್ನಡ
      japanese: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g, // 日本語
      chinese: /[\u4E00-\u9FFF]/g, // 中文
      korean: /[\uAC00-\uD7AF]/g, // 한국어
      arabic: /[\u0600-\u06FF]/g // العربية
    };

    const regex = scripts[scriptName];
    return regex ? regex.test(text) : false;
  }

  /**
   * Private helper: Check if text contains keywords
   */
  private hasKeywords(text: string, keywords: string[]): number {
    return keywords.filter(keyword => text.includes(keyword)).length;
  }

  /**
   * Load user preference from storage
   */
  private loadUserPreference(): void {
    const stored = localStorage.getItem('cs_preferred_language');
    if (stored && SUPPORTED_LANGUAGES[stored]) {
      this.userPreferredLanguage = stored;
    }
  }

  /**
   * Clear translator cache
   */
  clearCache(): void {
    this.translatorCache.clear();
    Debug.info('Translator cache cleared');
  }

  /**
   * Destroy all translators
   */
  async destroy(): Promise<void> {
    for (const translator of this.translatorCache.values()) {
      if (translator && typeof translator.destroy === 'function') {
        await translator.destroy();
      }
    }
    this.translatorCache.clear();
    Debug.info('All translators destroyed');
  }
}

// Export singleton instance
export const multiLanguageManager = new MultiLanguageManager();
