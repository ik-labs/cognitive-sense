# CognitiveSense Roadmap

## 🎯 Vision
Build a world-class shopping persuasion detection system that works globally, protecting consumers in their native languages.

---

## 📊 Current Status (MVP - Day 4)

### ✅ Completed
- **3 Chrome AI APIs** in active use
  - Prompt API: Core detection engine
  - Writer API: User-friendly warnings & tips
  - Summarizer API: Initialized and ready
- **3 Detection Types**: Urgency, Anchoring, Social Proof
- **Multi-tab Support**: Per-URL detection storage
- **Professional UI**: Side panel with API attribution
- **Debug Logging**: Color-coded console output

### ⏳ In Progress
- Testing on multiple shopping sites
- Documentation and demo video

---

## 🚀 Phase 2: Multi-Language Support (Post-Hackathon)

### Timeline: 1-2 weeks after hackathon

### 2.1 Translator API Integration

#### **Objective**
Enable CognitiveSense to work on shopping sites in multiple languages, automatically translating warnings and tips to user's preferred language.

#### **Supported Languages (Priority Order)**
1. **Hindi (हिंदी)** - 345M speakers, major shopping sites
2. **Tamil (தமிழ்)** - 78M speakers, growing e-commerce
3. **Telugu (తెలుగు)** - 74M speakers, Flipkart popular
4. **Kannada (ಕನ್ನಡ)** - 44M speakers, Amazon India
5. **Marathi (मराठी)** - 83M speakers, regional growth
6. **Spanish (Español)** - 500M+ speakers, global expansion
7. **French (Français)** - 280M speakers, European markets
8. **Portuguese (Português)** - 250M speakers, Brazil expansion

#### **Architecture**

```typescript
// New: MultiLanguageManager
class MultiLanguageManager {
  private aiManager: AIEngineManager;
  private detectedLanguage: string = 'en';

  async detectPageLanguage(pageText: string): Promise<string> {
    // When Language Detector API available:
    // return await aiManager.language.detect(pageText);
    
    // Fallback: Simple heuristic detection
    return this.detectLanguageHeuristic(pageText);
  }

  async translateWarning(text: string, targetLang: string): Promise<string> {
    if (targetLang === 'en') return text;
    
    // When Translator API available:
    // return await aiManager.translator.translate(text, targetLang);
    
    // Fallback: Return English
    return text;
  }

  async translateTip(text: string, targetLang: string): Promise<string> {
    // Same as translateWarning
    return this.translateWarning(text, targetLang);
  }

  private detectLanguageHeuristic(text: string): string {
    // Simple pattern matching for now
    if (text.match(/[ह-ॿ]/)) return 'hi'; // Devanagari script
    if (text.match(/[அ-ஹ]/)) return 'ta'; // Tamil script
    if (text.match(/[అ-ఽ]/)) return 'te'; // Telugu script
    if (text.match(/[ಅ-ಹ]/)) return 'kn'; // Kannada script
    return 'en'; // Default
  }
}
```

#### **Implementation Steps**

**Step 1: Create Language Detection Layer** (2 hours)
- [ ] Create `MultiLanguageManager` class
- [ ] Implement heuristic detection
- [ ] Add language preference to settings
- [ ] Test on 5+ language samples

**Step 2: Integrate with ContentGenerator** (1 hour)
- [ ] Update `ContentGenerator` to use `MultiLanguageManager`
- [ ] Translate warnings based on detected language
- [ ] Translate tips based on detected language
- [ ] Add fallback for unsupported languages

**Step 3: Update UI for Language Display** (1 hour)
- [ ] Show detected language in panel header
- [ ] Add language selector dropdown
- [ ] Display content in selected language
- [ ] Add language preference to storage

**Step 4: Test & Validate** (2 hours)
- [ ] Test on Hindi shopping sites (Amazon.in, Flipkart)
- [ ] Test on Tamil sites (Tamil Nadu e-commerce)
- [ ] Test on Telugu sites (Telangana shopping)
- [ ] Verify translation quality

**Total Time: 6 hours**

---

### 2.2 Language Detector API Integration

#### **Objective**
Auto-detect page language without manual selection, providing seamless experience.

#### **Implementation**

```typescript
async detectPageLanguage(pageText: string): Promise<string> {
  try {
    // When Language Detector API available:
    if (aiManager.language.isAvailable()) {
      const detectedLang = await aiManager.language.detect(pageText);
      console.log(`🌐 Detected language: ${detectedLang}`);
      return detectedLang;
    }
  } catch (error) {
    console.log('Language detection failed, using heuristic');
  }
  
  // Fallback to heuristic
  return this.detectLanguageHeuristic(pageText);
}
```

#### **Implementation Steps**

**Step 1: Update LanguageEngine** (1 hour)
- [ ] Add `detect()` method to LanguageEngine
- [ ] Handle API availability gracefully
- [ ] Add error handling and fallbacks

**Step 2: Integrate with Page Context** (1 hour)
- [ ] Auto-detect language on page load
- [ ] Store detected language in context
- [ ] Pass to all detectors

**Step 3: Update UI** (30 mins)
- [ ] Show detected language badge
- [ ] Allow manual override
- [ ] Remember user preference

**Total Time: 2.5 hours**

---

## 📈 Phase 3: Enhanced Detection (Weeks 3-4)

### 3.1 Add Remaining Detection Types
- [ ] FOMO Detector (Fear of Missing Out)
- [ ] Bundling Detector (Forced bundles)
- [ ] Dark Pattern Detector (Deceptive UI)

### 3.2 Summarizer API Integration
- [ ] Compress product descriptions
- [ ] Extract key pricing info
- [ ] Summarize review sections

### 3.3 Visual Analysis
- [ ] Image checking for fake products
- [ ] Logo verification
- [ ] Quality assessment

---

## 🌍 Phase 4: Global Expansion (Month 2)

### 4.1 Regional Shopping Sites
- [ ] Amazon India (Hindi, Tamil, Telugu)
- [ ] Flipkart (Hindi, regional languages)
- [ ] Myntra (Hindi, English)
- [ ] Snapdeal (Hindi, English)
- [ ] Meesho (Hindi, regional)
- [ ] eBay (Multiple languages)
- [ ] Alibaba (Chinese, English)
- [ ] Mercado Libre (Spanish, Portuguese)

### 4.2 Regional Customization
- [ ] Region-specific manipulation tactics
- [ ] Local currency support
- [ ] Cultural context awareness
- [ ] Regional payment methods

---

## 🔧 Technical Debt & Improvements

### High Priority
- [ ] Add unit tests for all detectors
- [ ] Add integration tests for API calls
- [ ] Performance optimization for large pages
- [ ] Memory leak prevention

### Medium Priority
- [ ] Add analytics tracking
- [ ] Implement user feedback system
- [ ] Create admin dashboard
- [ ] Add A/B testing framework

### Low Priority
- [ ] Mobile app version
- [ ] Browser sync across devices
- [ ] Community detection sharing
- [ ] ML model training pipeline

---

## 📊 Success Metrics

### Phase 2 Goals
- [ ] Support 5+ languages
- [ ] 95%+ translation accuracy
- [ ] <2s language detection time
- [ ] 0 false positives in language detection

### Phase 3 Goals
- [ ] 6 detection types working
- [ ] 90%+ detection accuracy
- [ ] <10s analysis time
- [ ] Works on 10+ shopping sites

### Phase 4 Goals
- [ ] 50+ shopping sites supported
- [ ] 20+ languages supported
- [ ] 100K+ active users
- [ ] 4.5+ star rating

---

## 💰 Resource Requirements

### Phase 2 (Multi-Language)
- **Developer Time**: 8-10 hours
- **Testing Time**: 4-6 hours
- **Total**: ~15 hours
- **Cost**: $0 (using free Chrome AI APIs)

### Phase 3 (Enhanced Detection)
- **Developer Time**: 20-30 hours
- **Testing Time**: 10-15 hours
- **Total**: ~40 hours
- **Cost**: $0

### Phase 4 (Global Expansion)
- **Developer Time**: 40-60 hours
- **Testing Time**: 20-30 hours
- **Localization**: 30-40 hours
- **Total**: ~100 hours
- **Cost**: $0 (using free APIs)

---

## 🎯 Key Milestones

| Milestone | Target Date | Status |
|-----------|------------|--------|
| MVP Submission | Oct 24, 2025 | ✅ On Track |
| Phase 2 Complete | Nov 7, 2025 | 📅 Planned |
| Phase 3 Complete | Nov 21, 2025 | 📅 Planned |
| Phase 4 Complete | Dec 19, 2025 | 📅 Planned |
| 100K Users | Q2 2026 | 🎯 Goal |

---

## 🚀 Quick Start for Phase 2

### Day 1: Setup
```bash
# Create MultiLanguageManager
touch extension/src/utils/MultiLanguageManager.ts

# Add language detection
# Add translation logic
# Add fallbacks
```

### Day 2: Integration
```bash
# Update ContentGenerator to use MultiLanguageManager
# Update Panel to show language
# Add language selector
```

### Day 3: Testing
```bash
# Test on Hindi sites
# Test on Tamil sites
# Test on Telugu sites
# Verify translations
```

### Day 4: Polish
```bash
# Add language badges
# Update documentation
# Create demo video
```

---

## 📝 Implementation Checklist

### Phase 2: Multi-Language Support

#### MultiLanguageManager
- [ ] Create class structure
- [ ] Implement heuristic detection
- [ ] Add translation methods
- [ ] Add error handling
- [ ] Add logging

#### ContentGenerator Integration
- [ ] Update generateUserFriendlyWarning()
- [ ] Update generateEducationalTip()
- [ ] Add language parameter
- [ ] Add translation logic
- [ ] Add fallbacks

#### UI Updates
- [ ] Add language badge to panel
- [ ] Add language selector dropdown
- [ ] Show detected language
- [ ] Allow manual override
- [ ] Store preference

#### Testing
- [ ] Unit tests for language detection
- [ ] Integration tests for translation
- [ ] E2E tests on real sites
- [ ] Manual testing on 5+ sites

---

## 🎓 Learning Resources

### Chrome AI APIs
- [Prompt API Docs](https://developer.chrome.com/docs/ai/prompt-api)
- [Translator API (Coming Soon)](https://developer.chrome.com/docs/ai/translator-api)
- [Language Detector API (Coming Soon)](https://developer.chrome.com/docs/ai/language-detector-api)

### Multi-Language Best Practices
- [Unicode & International Text](https://www.w3.org/International/)
- [Language Detection Algorithms](https://en.wikipedia.org/wiki/Language_identification)
- [Translation Quality Metrics](https://en.wikipedia.org/wiki/BLEU_score)

---

## 💡 Future Vision

By end of 2026, CognitiveSense will be:
- ✅ **Global**: Supporting 50+ languages
- ✅ **Comprehensive**: 10+ detection types
- ✅ **Intelligent**: ML-powered learning
- ✅ **Trusted**: 1M+ active users
- ✅ **Open**: Community-driven improvements

**Making online shopping safer for everyone, everywhere.** 🌍🛡️

---

**Last Updated**: October 24, 2025  
**Status**: Ready for Phase 2 Implementation  
**Next Review**: After hackathon submission
