# CognitiveSense — MVP Revised (Shopping Agent - Maximum Impact)

## 🎯 Executive Summary

**Goal**: Build a world-class Shopping Persuasion Detection agent for Top 3 placement in the Chrome Built-in AI Challenge 2025.

**Strategy**: 
- Single agent executed brilliantly (Shopping Persuasion)
- Modular architecture enabling rapid agent expansion post-hackathon
- Maximum use of Chrome Built-in AI APIs (Prompt, Summarizer, Writer, Language Detector, Translator)
- Privacy-first hybrid augmentation
- Production-quality polish and UX

**Target Prize Categories**:
- ✅ Best Overall Application
- ✅ Best Hybrid AI Application  
- ✅ Best Use of Built-in AI APIs

---

## 🏆 Why This Wins

### Technical Sophistication ✅
- **6 detection categories** showing comprehensive understanding
- **3-layer detection pipeline** (heuristics → AI → hybrid)
- **5 Chrome AI APIs** showcased (Prompt, Summarizer, Writer, Language Detector, Translator)
- **Modular architecture** demonstrating extensible framework design
- **Behavioral learning** for adaptive, personalized detection
- **Multi-modal analysis** (text + visual)

### Real Utility ✅
- **Universal problem** - everyone shops online, everyone faces manipulation
- **Measurable impact** - "money saved" metric users can track
- **Immediate value** - works on real sites today
- **Multi-language** - global reach beyond English

### Visual Polish ✅
- **Production-quality UI** using shadcn/ui components
- **Real-time feedback** with contextual overlays
- **Beautiful visualizations** (score cards, charts, breakdowns)
- **Professional demo video** showcasing all features

### Innovation ✅
- **Privacy-first hybrid** architecture (local default, opt-in cloud)
- **Multi-modal detection** (text analysis + image verification)
- **Adaptive learning** that personalizes to user behavior
- **Framework thinking** designed for expansion, not just a single hack

### Differentiation vs 2024 Winners ✅
- **No comparable shopping manipulation detector** in 2024 gallery
- **More comprehensive** than single-purpose tools (Truthify, InsightLense)
- **Thoughtful architecture** not just a prototype
- **Clear product vision** with post-hackathon roadmap

---

## 📦 What We're Building

### The Shopping Persuasion Agent

A comprehensive manipulation detection system that analyzes product pages in real-time and identifies:

1. **Urgency & Scarcity** - Countdown timers, "Only X left", time pressure
2. **Anchoring & Price Manipulation** - Fake discounts, inflated prices, hidden costs
3. **Social Proof Manipulation** - Fake reviews, suspicious ratings, unverified claims
4. **FOMO (Fear of Missing Out)** - "Last chance", exclusivity, emotional triggers
5. **Bundling Deception** - Hidden add-ons, fake "free" offers, subscription traps
6. **Dark Patterns** - Pre-checked boxes, confirmshaming, hard-to-cancel

### Key Features

**Local-First AI Detection**:
- Runs on-device using Chrome Built-in AI APIs
- No data leaves the browser by default
- Fast (< 2 seconds per page)
- Works offline

**Beautiful User Experience**:
- Real-time overlays (tooltips, highlights, badges)
- Side panel dashboard with manipulation scores
- Detection history and impact tracking
- Per-site customization

**Hybrid Cloud Augmentation** (opt-in):
- Price history lookup
- Alternative seller search
- Review verification
- Image authenticity checking

**Multi-Language Support**:
- Automatic language detection
- Translated warnings and tooltips
- Works on shopping sites globally

**Adaptive Learning**:
- Learns from user interactions
- Personalizes detection thresholds
- Suggests configuration optimizations

---

## 🏗️ Architecture Overview

### Modular Agent System

CognitiveSense is built on a **pluggable agent framework**:

```
AgentRegistry
├── ShoppingPersuasionAgent (MVP - fully implemented)
├── NewsBiasAgent (future - stub in code)
└── SocialPulseAgent (future - stub in code)
```

Each agent implements a standard interface:
- `detect()` - Analyze page content
- `render()` - Display overlays
- `hybridAction()` - Optional cloud enrichment
- `getSidebarComponent()` - Panel UI

**Why this matters**: Judges see we're building a framework, not just a single feature. Adding agents 2 & 3 post-hackathon takes days, not weeks.

### 3-Layer Detection Pipeline

**Layer 1: Fast Heuristics** (< 100ms)
- Regex pattern matching
- DOM queries for specific elements
- Keyword detection
- **Purpose**: Quick initial scan, filter obvious cases

**Layer 2: Built-in AI Analysis** (< 3s)
- Summarizer: Compress page content
- Prompt API: Classify manipulation tactics
- Writer: Generate user-friendly warnings
- Language Detector + Translator: Multi-language support
- **Purpose**: Deep understanding, contextual analysis

**Layer 3: Hybrid Enrichment** (opt-in, < 5s)
- Backend API calls for cross-site data
- Price history, alternatives, review verification
- **Purpose**: Leverage web intelligence while preserving privacy

---

## 📄 Documentation Structure

This MVP is documented across multiple files for clarity:

1. **mvp-revised.md** (this file) - Overview, strategy, goals
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Detailed system design, interfaces, code structure
3. **[DETECTION-SPECS.md](./DETECTION-SPECS.md)** - All 6 detection categories with parameters
4. **[HYBRID-API.md](./HYBRID-API.md)** - Backend API specifications, endpoints
5. **[UI-SPECS.md](./UI-SPECS.md)** - Component designs, overlays, side panel
6. **[BUILD-PLAN.md](./BUILD-PLAN.md)** - 7-day timeline, demo script, success metrics

---

## 🎯 Scope Definition

### In Scope (MVP)

**Core Detection**:
- ✅ All 6 manipulation categories (Urgency, Anchoring, Social Proof, FOMO, Bundling, Dark Patterns)
- ✅ Overall manipulation score (0-100)
- ✅ Per-category scoring and breakdown

**UI/UX**:
- ✅ Real-time content overlays (tooltips, badges, highlights)
- ✅ Side panel dashboard with score visualization
- ✅ Detection history (last 50 events)
- ✅ Settings tab (per-agent, per-domain toggles)
- ✅ Privacy tab (what's tracked, export data)

**AI Integration**:
- ✅ Prompt API for classification
- ✅ Summarizer for content compression
- ✅ Writer for tooltip generation
- ✅ Language Detector for auto-detection
- ✅ Translator for multi-language support

**Hybrid Features**:
- ✅ Price history lookup (backend API)
- ✅ Alternative seller search
- ✅ Basic review verification
- ✅ Privacy-preserving calls (minimal data sent)

**Advanced Features**:
- ✅ Multi-language support (3+ languages)
- ✅ Visual analysis (basic image checking)
- ✅ Behavioral learning (adaptive thresholds)

**Polish**:
- ✅ Professional UI (shadcn/ui components)
- ✅ Icons and branding
- ✅ Performance optimization
- ✅ Demo video (3 minutes)
- ✅ Complete documentation

### Out of Scope (Post-Hackathon)

- ❌ News Bias agent (implemented)
- ❌ Social Pulse agent (implemented)
- ❌ User accounts and cloud sync
- ❌ Team/org features
- ❌ Community template marketplace
- ❌ Mobile companion app
- ❌ Browser extension for Firefox/Safari
- ❌ Advanced analytics dashboard
- ❌ Monetization/billing

---

## 🎨 Design Principles

### 1. Privacy-First
- Local processing by default
- No data leaves device without explicit user consent
- Clear privacy explanations in UI
- User can run in "100% local mode"
- Hybrid calls are clearly labeled and optional

### 2. User Agency
- Users control which agents run where
- Per-domain configuration
- Adjustable sensitivity thresholds
- Can disable any detection category
- Export all data at any time

### 3. Non-Intrusive
- Overlays don't break page layout
- Detections only appear above threshold
- User can dismiss warnings
- Learns from user behavior to reduce noise

### 4. Explainable
- Every detection includes reasoning
- Score breakdowns show what triggered alert
- "Learn more" links for each tactic
- Clear action recommendations

### 5. Beautiful & Professional
- Consistent design system (shadcn/ui)
- Smooth animations and transitions
- Attention to typography and spacing
- Delightful micro-interactions

---

## 🚀 Quick Start (For Judges/Developers)

### Installation

```bash
# Clone repo
git clone https://github.com/your-org/cognitive-sense
cd cognitive-sense

# Install extension dependencies
cd extension
npm install
npm run build

# Load in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select extension/dist folder

# Optional: Run backend (for hybrid features)
cd ../backend
npm install
npm run dev
```

### Demo Sites

Test the extension on these shopping sites:
- Amazon India (high manipulation)
- Flipkart (moderate manipulation)
- Myntra (fashion-specific tactics)
- eBay (auction pressure tactics)

### What to Look For

1. **Real-time detection** - Overlays appear within 2 seconds
2. **Side panel** - Click extension icon to see dashboard
3. **Manipulation score** - Overall risk assessment
4. **Hybrid features** - Click "Find Alternatives" button
5. **Multi-language** - Visit Hindi/Tamil shopping sites
6. **History** - Track detections across multiple sites

---

## 📊 Success Criteria

### Must-Have (MVP Complete)
- ✅ All 6 detection types working accurately
- ✅ Beautiful overlays + side panel
- ✅ Works reliably on 10+ shopping sites
- ✅ Multi-language support (3+ languages)
- ✅ Basic hybrid features (real or high-quality mocks)
- ✅ Demo video recorded and polished
- ✅ Complete documentation (README, Privacy.md)
- ✅ Performance < 2s per page analysis

### Nice-to-Have (Extra Polish)
- ✅ Visual analysis (image checking)
- ✅ Behavioral learning active
- ✅ Real backend API (not just mocks)
- ✅ Works in 5+ languages
- ✅ Smooth animations and transitions

### Stretch Goals (Time Permitting)
- ✅ Onboarding flow for new users
- ✅ Export detection history as JSON
- ✅ Comparison mode (2 products side-by-side)
- ✅ Browser notifications for high-risk detections

---

## 📞 Questions & Support

For detailed technical specifications, see:
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Detection Logic**: [DETECTION-SPECS.md](./DETECTION-SPECS.md)
- **Backend APIs**: [HYBRID-API.md](./HYBRID-API.md)
- **UI Components**: [UI-SPECS.md](./UI-SPECS.md)
- **Build Timeline**: [BUILD-PLAN.md](./BUILD-PLAN.md)

---

## 🎯 Next Steps

1. **Read**: [ARCHITECTURE.md](./ARCHITECTURE.md) - Understand the modular system
2. **Review**: [DETECTION-SPECS.md](./DETECTION-SPECS.md) - Study detection parameters
3. **Plan**: [BUILD-PLAN.md](./BUILD-PLAN.md) - Follow the 7-day timeline
4. **Build**: Start with Day 1 foundation setup
5. **Test**: Use real shopping sites frequently
6. **Polish**: Reserve full Day 7 for demo video

---

**Last Updated**: 2025-10-07  
**Target Completion**: 7 days from start  
**Estimated Effort**: 70 hours (10 hrs/day)  
**Win Probability**: 90% (if executed as planned)
