/**
 * Chrome Built-in AI Language Detection and Translation wrapper
 */

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  script?: string;
}

export interface TranslationRequest {
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
}

export interface TranslationResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
}

export class LanguageEngine {
  private detector: any = null;
  // private _translator: any = null;
  private detectorAvailable = false;
  private translatorAvailable = false;

  async initialize(): Promise<void> {
    await Promise.all([
      this.initializeDetector(),
      this.initializeTranslator()
    ]);
  }

  private async initializeDetector(): Promise<void> {
    try {
      // Check if Chrome Built-in AI Language Detector is available
      if (!('ai' in window) || !('languageDetector' in (window as any).ai)) {
        console.log('ℹ️ Chrome Built-in AI Language Detector not available');
        return;
      }

      const ai = (window as any).ai;
      
      // Check capabilities
      const capabilities = await ai.languageDetector.capabilities();
      console.log('Language Detector capabilities:', capabilities);

      if (capabilities.available === 'no') {
        console.warn('Language Detector not available');
        return;
      }

      // Create detector
      this.detector = await ai.languageDetector.create();
      this.detectorAvailable = true;
      console.log('Language Detector initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Language Detector:', error);
      this.detectorAvailable = false;
    }
  }

  private async initializeTranslator(): Promise<void> {
    try {
      // Check if Chrome Built-in AI Translator is available
      if (!('ai' in window) || !('translator' in (window as any).ai)) {
        console.log('ℹ️ Chrome Built-in AI Translator not available');
        return;
      }

      const ai = (window as any).ai;
      
      // Check capabilities
      const capabilities = await ai.translator.capabilities();
      console.log('Translator capabilities:', capabilities);

      if (capabilities.available === 'no') {
        console.warn('Translator not available');
        return;
      }

      // Create translator (we'll create specific instances as needed)
      this.translatorAvailable = true;
      console.log('Translator initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Translator:', error);
      this.translatorAvailable = false;
    }
  }

  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    if (!this.detectorAvailable || !this.detector) {
      return this.fallbackLanguageDetection(text);
    }

    try {
      const results = await this.detector.detect(text);
      
      if (results && results.length > 0) {
        const topResult = results[0];
        return {
          language: topResult.detectedLanguage,
          confidence: topResult.confidence,
          script: this.getScript(topResult.detectedLanguage)
        };
      }
      
      return this.fallbackLanguageDetection(text);
    } catch (error) {
      console.error('Language detection failed:', error);
      return this.fallbackLanguageDetection(text);
    }
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    if (!this.translatorAvailable) {
      return this.fallbackTranslation(request);
    }

    try {
      const ai = (window as any).ai;
      
      // Detect source language if not provided
      let sourceLanguage = request.sourceLanguage;
      if (!sourceLanguage) {
        const detection = await this.detectLanguage(request.text);
        sourceLanguage = detection.language;
      }

      // Create translator for this language pair
      const translator = await ai.translator.create({
        sourceLanguage,
        targetLanguage: request.targetLanguage
      });

      const translatedText = await translator.translate(request.text);
      
      // Clean up translator
      await translator.destroy();

      return {
        translatedText,
        sourceLanguage,
        targetLanguage: request.targetLanguage,
        confidence: 0.8
      };
    } catch (error) {
      console.error('Translation failed:', error);
      return this.fallbackTranslation(request);
    }
  }

  /**
   * Translate manipulation detection content for tooltips
   */
  async translateTooltip(content: {
    title: string;
    description: string;
    targetLanguage: string;
  }): Promise<{
    title: string;
    description: string;
  }> {
    if (content.targetLanguage === 'en') {
      return {
        title: content.title,
        description: content.description
      };
    }

    try {
      const [titleResult, descResult] = await Promise.all([
        this.translate({
          text: content.title,
          targetLanguage: content.targetLanguage
        }),
        this.translate({
          text: content.description,
          targetLanguage: content.targetLanguage
        })
      ]);

      return {
        title: titleResult.translatedText,
        description: descResult.translatedText
      };
    } catch (error) {
      console.error('Tooltip translation failed:', error);
      return {
        title: content.title,
        description: content.description
      };
    }
  }

  /**
   * Get page language with fallback detection
   */
  async getPageLanguage(): Promise<string> {
    // Try HTML lang attribute first
    const htmlLang = document.documentElement.lang;
    if (htmlLang && htmlLang.length >= 2) {
      return htmlLang.split('-')[0].toLowerCase();
    }

    // Try meta language tag
    const metaLang = document.querySelector('meta[http-equiv="content-language"]') as HTMLMetaElement;
    if (metaLang?.content) {
      return metaLang.content.split('-')[0].toLowerCase();
    }

    // Detect from page content
    const pageText = document.body.innerText.slice(0, 1000);
    const detection = await this.detectLanguage(pageText);
    
    return detection.language;
  }

  private fallbackLanguageDetection(text: string): LanguageDetectionResult {
    // Simple heuristic detection
    const sample = text.slice(0, 500).toLowerCase();
    
    // Devanagari script (Hindi)
    if (/[\u0900-\u097F]/.test(sample)) {
      return { language: 'hi', confidence: 0.8, script: 'Devanagari' };
    }
    
    // Tamil script
    if (/[\u0B80-\u0BFF]/.test(sample)) {
      return { language: 'ta', confidence: 0.8, script: 'Tamil' };
    }
    
    // Arabic script
    if (/[\u0600-\u06FF]/.test(sample)) {
      return { language: 'ar', confidence: 0.7, script: 'Arabic' };
    }
    
    // Chinese characters
    if (/[\u4e00-\u9fff]/.test(sample)) {
      return { language: 'zh', confidence: 0.7, script: 'Chinese' };
    }
    
    // Spanish common words
    if (/\b(el|la|de|que|y|en|un|es|se|no|te|lo|le|da|su|por|son|con|para|una|está|las|los|del|al)\b/.test(sample)) {
      return { language: 'es', confidence: 0.6, script: 'Latin' };
    }
    
    // French common words
    if (/\b(le|de|et|à|un|il|être|et|en|avoir|que|pour|dans|ce|son|une|sur|avec|ne|se|pas|tout|plus|pouvoir)\b/.test(sample)) {
      return { language: 'fr', confidence: 0.6, script: 'Latin' };
    }
    
    // Default to English
    return { language: 'en', confidence: 0.5, script: 'Latin' };
  }

  private fallbackTranslation(request: TranslationRequest): TranslationResponse {
    // Return predefined translations for common manipulation terms
    const translations = this.getCommonTranslations(request.targetLanguage);
    
    let translatedText = request.text;
    
    // Simple word replacement for common terms
    Object.entries(translations).forEach(([english, translated]) => {
      const regex = new RegExp(`\\b${english}\\b`, 'gi');
      translatedText = translatedText.replace(regex, translated);
    });

    return {
      translatedText,
      sourceLanguage: request.sourceLanguage || 'en',
      targetLanguage: request.targetLanguage,
      confidence: 0.4
    };
  }

  private getCommonTranslations(targetLanguage: string): Record<string, string> {
    const translations: Record<string, Record<string, string>> = {
      'hi': {
        'Manipulation Detected': 'हेरफेर का पता चला',
        'High Risk': 'उच्च जोखिम',
        'Urgency': 'तात्कालिकता',
        'Limited Time': 'सीमित समय',
        'Discount': 'छूट',
        'Sale': 'बिक्री',
        'Reviews': 'समीक्षा',
        'Popular': 'लोकप्रिय',
        'Trending': 'ट्रेंडिंग',
        'Exclusive': 'विशेष',
        'Warning': 'चेतावनी'
      },
      'ta': {
        'Manipulation Detected': 'கையாளுதல் கண்டறியப்பட்டது',
        'High Risk': 'அதிக ஆபத்து',
        'Urgency': 'அவசரம்',
        'Limited Time': 'வரையறுக்கப்பட்ட நேரம்',
        'Discount': 'தள்ளுபடி',
        'Sale': 'விற்பனை',
        'Reviews': 'மதிப்புரைகள்',
        'Popular': 'பிரபலமான',
        'Trending': 'டிரெண்டிங்',
        'Exclusive': 'பிரத்யேக',
        'Warning': 'எச்சரிக்கை'
      },
      'es': {
        'Manipulation Detected': 'Manipulación Detectada',
        'High Risk': 'Alto Riesgo',
        'Urgency': 'Urgencia',
        'Limited Time': 'Tiempo Limitado',
        'Discount': 'Descuento',
        'Sale': 'Venta',
        'Reviews': 'Reseñas',
        'Popular': 'Popular',
        'Trending': 'Tendencia',
        'Exclusive': 'Exclusivo',
        'Warning': 'Advertencia'
      },
      'fr': {
        'Manipulation Detected': 'Manipulation Détectée',
        'High Risk': 'Risque Élevé',
        'Urgency': 'Urgence',
        'Limited Time': 'Temps Limité',
        'Discount': 'Remise',
        'Sale': 'Vente',
        'Reviews': 'Avis',
        'Popular': 'Populaire',
        'Trending': 'Tendance',
        'Exclusive': 'Exclusif',
        'Warning': 'Avertissement'
      }
    };

    return translations[targetLanguage] || {};
  }

  private getScript(language: string): string {
    const scripts: Record<string, string> = {
      'hi': 'Devanagari',
      'ta': 'Tamil',
      'ar': 'Arabic',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'th': 'Thai',
      'ru': 'Cyrillic',
      'el': 'Greek'
    };

    return scripts[language] || 'Latin';
  }

  async destroy(): Promise<void> {
    if (this.detector) {
      try {
        await this.detector.destroy();
      } catch (error) {
        console.error('Failed to destroy language detector:', error);
      }
      this.detector = null;
    }
    
    // Note: Individual translators are destroyed after each use
    this.detectorAvailable = false;
    this.translatorAvailable = false;
  }

  isReady(): boolean {
    return this.detectorAvailable || this.translatorAvailable;
  }

  getCapabilities(): {
    detection: boolean;
    translation: boolean;
  } {
    return {
      detection: this.detectorAvailable,
      translation: this.translatorAvailable
    };
  }

  // Supported languages for manipulation detection
  static supportedLanguages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'de', name: 'German', native: 'Deutsch' },
    { code: 'zh', name: 'Chinese', native: '中文' },
    { code: 'ja', name: 'Japanese', native: '日本語' },
    { code: 'ar', name: 'Arabic', native: 'العربية' }
  ];
}
