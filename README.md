# CognitiveSense 🛡️

**Shop consciously. Browse safely. Stay aware.**

An AI-powered Chrome extension that detects psychological manipulation tactics on **shopping websites** and **social media platforms** using Chrome Built-in AI APIs. Protect yourself from deceptive practices with real-time analysis and multi-language support.

## ✨ MVP Features

### 🛒 Shopping Detection (6 Types)
- ⏰ **Urgency & Scarcity** - Countdown timers, limited stock claims
- 💰 **Anchoring** - Fake discounts, inflated original prices
- ⭐ **Social Proof** - Fake reviews, unverified claims
- 🎁 **FOMO** - Exclusivity, artificial scarcity, social pressure
- 📦 **Bundling** - Forced bundles, hidden costs, subscription traps
- 🎮 **Dark Patterns** - Deceptive UI, hidden options, confusing buttons

### 📱 Social Media Detection (6 Types)
- 🚨 **Misinformation** - False or misleading information
- 😠 **Emotional Manipulation** - Fear, anger, outrage triggers
- 🔄 **Echo Chambers** - Limited perspective diversity
- 🤖 **Fake Accounts** - Bot behavior, automated patterns
- 💬 **Toxic Content** - Hate speech, harassment
- 🗳️ **Political Manipulation** - Bias, propaganda

### 🤖 4 Chrome AI APIs
- **Prompt API** - Core detection engine
- **Writer API** - User-friendly warnings & tips
- **Translator API** - Multi-language support (8 languages)
- **Summarizer API** - Content analysis

### 🌍 Multi-Language Support
English, Spanish, French, Japanese, Hindi, Tamil, German, Chinese

### 🎨 Professional UI
- Floating badge with detection count
- Expandable side panel with detection cards
- Element highlighting with pulsing borders
- Language selector with real-time translation
- Detector breakdown summary
- Loading indicators for transparency

### 📊 Advanced Features
- Per-URL detection storage (multi-tab support)
- Deduplication system (no repetitive detections)
- Comprehensive debug logging
- Error handling and graceful fallbacks

## 🚀 Quick Start

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Build the extension
npm run build

# 3. Load in Chrome
# - Open chrome://extensions/
# - Enable "Developer mode"
# - Click "Load unpacked"
# - Select extension/dist folder
```

### Testing

```bash
# Start local server for demo page
python3 -m http.server 8000

# Open demo page
# http://localhost:8000/demo-shopping.html
```

## 📁 Project Structure

```
extension/
├── src/
│   ├── agents/
│   │   ├── shopping/           # Shopping Persuasion Agent
│   │   │   └── detectors/      # 6 shopping detectors
│   │   ├── social/             # Social Media Agent
│   │   │   └── detectors/      # 6 social detectors
│   │   └── base/               # Agent registry & base classes
│   ├── ai/                     # Chrome AI API wrappers
│   ├── panel/                  # React side panel UI
│   ├── content/                # Content script
│   ├── core/                   # Page context builder
│   └── utils/                  # Utilities (logging, language, etc.)
├── dist/                       # Built extension
└── manifest.json               # Chrome extension manifest
```

## 🎯 How It Works

### Shopping Sites
1. **Content Script** loads on shopping websites
2. **Shopping Agent** analyzes page for manipulation tactics
3. **6 Detectors** run in parallel (Urgency, Anchoring, Social Proof, FOMO, Bundling, Dark Patterns)
4. **Chrome AI APIs** score and classify findings
5. **Side Panel** displays results with warnings and tips

### Social Media Platforms
1. **Content Script** loads on social media (Facebook, Twitter, Instagram, TikTok, LinkedIn, Reddit, etc.)
2. **Social Media Agent** analyzes page and feed for manipulation
3. **6 Detectors** run in parallel (Misinformation, Emotional Manipulation, Echo Chambers, Fake Accounts, Toxicity, Political Manipulation)
4. **Scroll Detection** re-analyzes new content as users browse
5. **Chrome AI APIs** generate real-time analysis and warnings
6. **Side Panel** updates dynamically with new detections

### All Platforms
- **Multi-language** support translates content in real-time (8 languages)
- **Per-URL Caching** ensures each tab has independent data
- **Confidence Scoring** shows how certain the detection is

## 🏆 Key Achievements

✅ **12 Detection Types** - 6 shopping + 6 social (most projects have 1-3)  
✅ **2 Specialized Agents** - Shopping & Social Media (intelligent routing)  
✅ **4 Chrome AI APIs** - Prompt, Writer, Translator, Summarizer (most use 1-2)  
✅ **8 Languages** - Full multi-language support from day 1  
✅ **Real-Time Scroll Detection** - Social media feeds re-analyze on scroll  
✅ **Tab-Aware System** - Each tab maintains independent data  
✅ **Professional UI** - Floating badge, expandable panel, overlays  
✅ **Demo Page** - Shows all 6 shopping detectors working  
✅ **Production-Ready** - Error handling, logging, graceful fallbacks  

## 📊 Performance

- **Analysis Time**: 20-30 seconds per page
- **Detections**: 3-6 per page (high-quality)
- **Confidence**: 80-95%
- **Languages**: 8 supported
- **APIs**: 4 Chrome Built-in AI APIs

## 🔐 Privacy

- ✅ All processing on-device
- ✅ No data sent to servers
- ✅ Works completely offline
- ✅ Chrome Built-in AI for privacy

## 📚 Documentation

- **DEMO-INSTRUCTIONS.md** - How to test the extension
- **AI-APIS-USAGE.md** - Which APIs are used for what
- **ROADMAP.md** - Future plans (Phase 2-4)

## 🎓 For Judges

### Shopping Detection
1. **Install** the extension from `extension/dist`
2. **Open** demo page: `demo-shopping.html`
3. **Click** CognitiveSense badge to see 5+ detections
4. **Expand** panel to see AI analysis, warnings, and tips
5. **Try** language selector for multi-language support

### Social Media Detection
1. **Visit** Facebook, Twitter/X, Instagram, or any social platform
2. **Scroll** the feed to see real-time detection updates
3. **Check** console logs for detection details
4. **Click** badge to see all detections for that page
5. **Change** language to see real-time translation

### General
- **Check** console for comprehensive logging
- **Open** ARCHITECTURE-DIAGRAM.md to see system design
- **Read** VIDEO-SCRIPT.md for feature overview

## 📞 Questions?

See DEMO-INSTRUCTIONS.md for detailed testing guide.

---

**CognitiveSense** - Shop consciously. Browse safely. Stay aware.

*Built with Chrome Built-in AI for cognitive freedom and privacy.*
