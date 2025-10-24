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
    Debug.debug(`🌐 Detecting language from text: "${text.substring(0, 50)}..."`);

    // Script-based detection (most reliable)
    if (this.containsScript(text, 'devanagari')) {
      Debug.success('🇮🇳 Detected language: Hindi (Devanagari script)');
      return 'hi';
    }
    if (this.containsScript(text, 'tamil')) {
      Debug.success('🇮🇳 Detected language: Tamil (Tamil script)');
      return 'ta';
    }
    if (this.containsScript(text, 'telugu')) {
      Debug.success('🇮🇳 Detected language: Telugu (Telugu script)');
      return 'te';
    }
    if (this.containsScript(text, 'kannada')) {
      Debug.success('🇮🇳 Detected language: Kannada (Kannada script)');
      return 'kn';
    }
    if (this.containsScript(text, 'japanese')) {
      Debug.success('🇯🇵 Detected language: Japanese (Hiragana/Katakana/Kanji)');
      return 'ja';
    }
    if (this.containsScript(text, 'chinese')) {
      Debug.success('🇨🇳 Detected language: Chinese (CJK characters)');
      return 'zh';
    }
    if (this.containsScript(text, 'korean')) {
      Debug.success('🇰🇷 Detected language: Korean (Hangul)');
      return 'ko';
    }
    if (this.containsScript(text, 'arabic')) {
      Debug.success('🇸🇦 Detected language: Arabic (Arabic script)');
      return 'ar';
    }

    // Keyword-based detection
    const lowerText = text.toLowerCase();
    
    // Spanish indicators
    if (this.hasKeywords(lowerText, ['¿', '¡', 'el ', 'la ', 'de ', 'que ', 'es '])) {
      Debug.success('🇪🇸 Detected language: Spanish (keyword-based)');
      return 'es';
    }
    
    // French indicators
    if (this.hasKeywords(lowerText, ['«', '»', 'le ', 'la ', 'de ', 'que ', 'est '])) {
      Debug.success('🇫🇷 Detected language: French (keyword-based)');
      return 'fr';
    }
    
    // German indicators
    if (this.hasKeywords(lowerText, ['ä', 'ö', 'ü', 'ß', 'der ', 'die ', 'das '])) {
      Debug.success('🇩🇪 Detected language: German (keyword-based)');
      return 'de';
    }

    // Default to English
    Debug.info('🇬🇧 Defaulting to English (no other language detected)');
    return 'en';
  }

  /**
   * Translate text to target language using Chrome AI Translator API
   */
  async translateText(text: string, targetLanguage: string = this.userPreferredLanguage): Promise<string> {
    const langConfig = SUPPORTED_LANGUAGES[targetLanguage];
    const langName = langConfig?.nativeName || targetLanguage;
    
    // No translation needed for English
    if (targetLanguage === 'en') {
      Debug.debug(`📝 Text already in English, no translation needed`);
      return text;
    }

    try {
      Debug.debug(`🔄 Translating to ${langName} (${targetLanguage})`);
      Debug.debug(`📄 Text to translate: "${text.substring(0, 50)}..."`);
      
      // Check if Translator API is available
      if (!('Translator' in window)) {
        Debug.warning('🚫 Translator API not available in window, returning original text');
        return text;
      }

      const cacheKey = `en-${targetLanguage}`;
      let translator = this.translatorCache.get(cacheKey);

      // Create translator if not cached
      if (!translator) {
        Debug.apiCall('Translator', 'start');
        Debug.debug(`🔍 Checking Translator availability for en→${targetLanguage}`);
        
        const availability = await (window as any).Translator.availability({
          sourceLanguage: 'en',
          targetLanguage: targetLanguage
        });

        Debug.debug(`📊 Translator availability: ${availability}`);

        if (availability !== 'available' && availability !== 'downloadable') {
          Debug.warning(`⚠️ Translator not available for en-${targetLanguage} (status: ${availability})`);
          return text;
        }

        Debug.debug(`📥 Creating translator instance for en→${targetLanguage}...`);
        translator = await (window as any).Translator.create({
          sourceLanguage: 'en',
          targetLanguage: targetLanguage
        });

        this.translatorCache.set(cacheKey, translator);
        Debug.apiCall('Translator', 'success', `✅ Created translator for en→${targetLanguage}`);
        Debug.debug(`💾 Cached translator for ${cacheKey}`);
      } else {
        Debug.debug(`♻️ Using cached translator for en→${targetLanguage}`);
      }

      // Translate the text
      Debug.debug(`⏳ Translating text...`);
      const translated = await translator.translate(text);
      Debug.success(`✅ Successfully translated to ${langName}`);
      Debug.debug(`📤 Translated result: "${translated.substring(0, 50)}..."`);
      return translated;
    } catch (error) {
      Debug.error(`❌ Translation failed for ${langName}`, error);
      Debug.warning(`⚠️ Falling back to original English text`);
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
      
      try {
        // Only use localStorage if available (not in service worker)
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('cs_preferred_language', languageCode);
          Debug.info(`💾 User language preference saved: ${languageCode}`);
        } else {
          Debug.debug(`📍 localStorage not available, preference not persisted`);
        }
      } catch (error) {
        Debug.warning('Failed to save language preference to localStorage', error);
      }
      
      Debug.info(`🌐 User language preference set to ${languageCode}`);
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
    try {
      // Only use localStorage if available (not in service worker)
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('cs_preferred_language');
        if (stored && SUPPORTED_LANGUAGES[stored]) {
          this.userPreferredLanguage = stored;
          Debug.debug(`📍 Loaded user language preference: ${stored}`);
        }
      } else {
        Debug.debug('📍 localStorage not available (service worker context)');
      }
    } catch (error) {
      Debug.warning('Failed to load language preference from localStorage', error);
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
