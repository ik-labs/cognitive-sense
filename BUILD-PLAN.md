# CognitiveSense — 7-Day Build Plan

## 🎯 Overview

**Timeline**: 7 days (70 hours total = 10 hrs/day)  
**Goal**: Production-ready Shopping Persuasion Agent with maximum impact  
**Win Probability**: 90% (if executed as planned)

---

## 📅 Day-by-Day Timeline

### Day 1: Foundation (8 hours) ✅ COMPLETE

**Goal**: Working extension skeleton with agent framework

#### Tasks
- [x] **Repo setup** (1h) ✅
  - Initialize monorepo structure
  - Set up extension/ and backend/ directories
  - Configure package.json, TypeScript, Vite
  - Install dependencies (React, shadcn/ui, etc.)

- [x] **MV3 Extension scaffold** (2h) ✅
  - Create manifest.json
  - Set up service worker (sw.ts)
  - Configure content script entry point
  - Set up side panel structure

- [x] **Agent framework** (3h) ✅
  - Implement Agent interface
  - Create AgentRegistry singleton
  - Build PageContextBuilder
  - Write initial tests

- [x] **Storage layer** (1h) ✅
  - LocalStorage wrapper
  - IndexedDB setup for history
  - Settings persistence

- [x] **Dev environment** (1h) ✅
  - Hot reload configuration
  - Chrome extension loading script
  - Debugging setup

**Deliverable**: ✅ Extension loads in Chrome, side panel opens, no errors

**Status**: **COMPLETE** - All foundation components working perfectly. Ready for Day 2!

---

### Day 2: Detection Logic (10 hours)

**Goal**: All 6 detectors working with basic AI integration

#### Tasks
- [ ] **AI engine wrappers** (2h)
  - PromptEngine.ts
  - SummarizerEngine.ts
  - WriterEngine.ts
  - LanguageEngine.ts (Detector + Translator)

- [ ] **Shopping Agent scaffold** (1h)
  - ShoppingAgent.ts main class
  - Implement Agent interface
  - canHandle() logic for product pages

- [ ] **Implement 6 detectors** (5h)
  - UrgencyDetector.ts (1h)
  - AnchoringDetector.ts (1h)
  - SocialProofDetector.ts (1h)
  - FOMODetector.ts (1h)
  - BundlingDetector.ts (0.5h)
  - DarkPatternDetector.ts (0.5h)

- [ ] **Score calculation** (1h)
  - Overall manipulation score algorithm
  - Weighted category scores
  - Risk level determination

- [ ] **Testing** (1h)
  - Unit tests for each detector
  - Test with sample HTML fixtures
  - Validate scoring logic

**Deliverable**: Detectors work on test pages, scores calculated correctly

---

### Day 3: UI - Overlays (10 hours)

**Goal**: Beautiful, functional content overlays

#### Tasks
- [ ] **shadcn/ui setup** (1h)
  - Configure Tailwind CSS
  - Install shadcn components (Button, Card, Badge, etc.)
  - Set up theme and design tokens

- [ ] **Tooltip component** (3h)
  - Build Tooltip.tsx
  - Implement positioning logic
  - Add animations (slide-in, fade)
  - Severity-based styling
  - Action buttons

- [ ] **Badge component** (1h)
  - Compact inline badges
  - Type-specific icons and colors

- [ ] **Highlight component** (1h)
  - Text highlighting
  - Colored underlines/backgrounds

- [ ] **OverlayInjector** (2h)
  - Injection system
  - Position calculation
  - Cleanup on page change
  - Handle dynamic content

- [ ] **Real site testing** (2h)
  - Test on 5 shopping sites (Amazon, Flipkart, Myntra, eBay, Croma)
  - Fix positioning issues
  - Adjust timing/triggers

**Deliverable**: Overlays appear correctly on real product pages

---

### Day 4: UI - Side Panel (10 hours)

**Goal**: Complete side panel dashboard

#### Tasks
- [ ] **Panel layout** (1h)
  - Header with logo
  - Tab navigation
  - Responsive container

- [ ] **ScoreCard component** (1.5h)
  - Overall score display
  - Risk level indicator
  - Animated counter

- [ ] **BreakdownChart component** (2h)
  - 6 category bars
  - Color-coded by severity
  - Smooth animations

- [ ] **TacticsList component** (1.5h)
  - Detected tactics list
  - Severity badges
  - Expandable details

- [ ] **RecommendationCard component** (1h)
  - Action buttons
  - Hybrid call indicators

- [ ] **HistoryTab** (2h)
  - Timeline view
  - Summary statistics
  - Export functionality

- [ ] **SettingsTab** (1h)
  - Agent toggles
  - Sensitivity slider
  - Domain controls

- [ ] **PrivacyTab** (1h)
  - Privacy info
  - Data controls
  - Export/delete buttons

**Deliverable**: Side panel fully functional and beautiful

---

### Day 5: Advanced Features (10 hours)

**Goal**: Multi-language, visual analysis, behavioral learning, backend

#### Tasks
- [ ] **Multi-language support** (3h)
  - Language detection on page load
  - Tooltip translation
  - Test on Hindi/Tamil shopping sites
  - Cache translations

- [ ] **Visual analysis** (2h)
  - Image hash generation
  - Stock photo detection (basic)
  - Integrate into product analysis

- [ ] **Behavioral learning** (2h)
  - Track user actions (accept/dismiss)
  - Adjust thresholds dynamically
  - Suggestion system

- [ ] **Backend stub** (3h)
  - Next.js API setup on Vercel
  - Implement 3 endpoints with mock data:
    - `/api/shopping/price-history`
    - `/api/shopping/alternatives`
    - `/api/shopping/verify-reviews`
  - Rate limiting middleware
  - Extension integration

**Deliverable**: Advanced features working, backend responds with mock data

---

### Day 6: Polish & Testing (12 hours)

**Goal**: Production quality, bug-free

#### Tasks
- [ ] **Extensive testing** (4h)
  - Test on 20 real shopping sites
  - Different browsers (Chrome, Edge)
  - Various product types (electronics, fashion, books)
  - Edge cases (no price, no reviews, etc.)

- [ ] **AI prompt tuning** (2h)
  - Iterate on prompts for accuracy
  - Test different phrasings
  - Validate output parsing
  - Handle edge cases in responses

- [ ] **Bug fixes** (2h)
  - Fix all critical bugs found
  - Handle API unavailability gracefully
  - Error boundaries in React components

- [ ] **Performance optimization** (1h)
  - Reduce analysis time to < 2s
  - Lazy load components
  - Debounce detection triggers
  - Memory leak checks

- [ ] **UI polish** (2h)
  - Icon refinement
  - Spacing/alignment fixes
  - Loading states
  - Empty states
  - Micro-interactions

- [ ] **Documentation** (1h)
  - Complete README.md
  - Privacy.md
  - Add code comments
  - API documentation

**Deliverable**: Extension is production-ready, feels professional

---

### Day 7: Demo & Submit (10 hours)

**Goal**: Perfect demo video and submission

#### Tasks
- [ ] **Demo video planning** (1h)
  - Write detailed script
  - Choose demo sites
  - Plan screen recordings

- [ ] **Record demo** (3h)
  - Record multiple takes
  - Capture all features
  - Screen record with voiceover
  - B-roll for transitions

- [ ] **Video editing** (3h)
  - Professional editing (cuts, transitions)
  - Add text overlays (API names, feature highlights)
  - Background music
  - Export in HD

- [ ] **Screenshots** (1h)
  - Side panel views
  - Overlay examples
  - Settings/Privacy screens
  - Before/after comparisons

- [ ] **Final polish** (1h)
  - README formatting
  - Privacy.md review
  - Links verification
  - License file

- [ ] **Submission** (1h)
  - Devpost submission form
  - GitHub repo public
  - Video upload (YouTube/Vimeo)
  - Final testing of submission

**Deliverable**: Submitted to hackathon with stunning demo

---

## 🎬 Demo Video Script (3 minutes)

### Act 1: Hook & Problem (20 seconds)

**Visual**: Split screen of 3 shopping sites with manipulative tactics highlighted

**Voiceover**:
> "Online shopping uses psychological manipulation to make you buy. Fake urgency. Inflated discounts. Fake reviews. You don't realize you're being manipulated—until now."

**On-screen text**:
- "Only 3 left!" (highlighting countdown)
- "Was ₹9,999 Now ₹2,999" (striking through)
- "500 reviews in 3 days" (circling)

---

### Act 2: Solution Introduction (15 seconds)

**Visual**: Chrome extension icon, then side panel appearing

**Voiceover**:
> "CognitiveSense is a privacy-first Chrome extension that detects manipulation in real-time using Chrome's Built-in AI. Everything runs locally on your device."

**On-screen text**:
- "Privacy-First"
- "On-Device AI"
- "Real-Time Detection"

---

### Act 3: Live Demo - High Manipulation Page (60 seconds)

**Visual**: Navigate to Amazon product page with high manipulation

**Voiceover**:
> "Let me show you. I'm visiting an Amazon product page..."

**Actions**:
1. Page loads
2. **Tooltip appears instantly**: "⚠️ Manipulation Score: 85/100 - HIGH RISK"
3. Hover over countdown → tooltip explains: "This countdown has been running for 48 hours"
4. Click extension icon → side panel opens
5. Show breakdown chart: all 6 categories with scores
6. **Zoom in on specific detections**:
   - Urgency: 8/10 - "Countdown timer likely artificial"
   - Anchoring: 7/10 - "70% discount suspicious"
   - FOMO: 10/10 - "'Last chance' emotional pressure"
   - Reviews: 6/10 - "94% five-star rating unnatural"

**Voiceover during panel**:
> "CognitiveSense detected 6 manipulation tactics. The countdown is fake. The discount is inflated. And the reviews look suspicious."

**On-screen text**: Highlight each Chrome AI API being used
- "Prompt API" (classification)
- "Summarizer" (content compression)
- "Writer" (tooltip generation)

---

### Act 4: Hybrid Cloud Features (45 seconds)

**Visual**: Click "Check Price History" button

**Voiceover**:
> "I can opt-in for cloud assistance..."

**Actions**:
1. Click "📊 Check Price History"
2. **Privacy notice appears**: "Sending: product name + price (no browsing data)"
3. Results load: Graph showing 30-day price history
4. **Highlight**: "Price is 5% above average. Usually drops to ₹127,900"
5. Click "🔍 Find Alternatives"
6. Results show: 2 better options
   - Flipkart: ₹129,900 (₹5,000 savings)
   - Croma: ₹132,900 (in-store pickup)

**Voiceover**:
> "The price history shows this isn't a good deal. And I can find the same product ₹5,000 cheaper on Flipkart. All while preserving my privacy—only the product name was sent, never my browsing data."

**On-screen text**: "Privacy-Preserved Hybrid AI"

---

### Act 5: Different Site (30 seconds)

**Visual**: Quick montage of 3 different sites

**Voiceover**:
> "It works across all shopping sites..."

**Actions**:
1. Flipkart → different tactics (bundling, hidden costs)
2. Myntra → fashion-specific manipulation (FOMO, exclusivity)
3. eBay → auction pressure tactics

**Show history tab**: "8 manipulations caught today"

---

### Act 6: Multi-Language (15 seconds)

**Visual**: Visit Hindi shopping site

**Voiceover**:
> "And it works in any language."

**Actions**:
1. Load Hindi shopping site
2. Tooltip appears **in Hindi**: "तात्कालिकता का पता चला"
3. Side panel shows translated content

**On-screen text**: 
- "Language Detector API"
- "Translator API"

---

### Act 7: Technology & Architecture (20 seconds)

**Visual**: Code editor showing Agent interface, then architecture diagram

**Voiceover**:
> "Built with Chrome's Prompt, Summarizer, Writer, Language Detector, and Translator APIs. CognitiveSense uses a modular agent architecture—this Shopping Agent is just the beginning."

**On-screen text**:
- "Modular Framework"
- "Extensible Architecture"
- "Coming Soon: News Bias, Social Wellness"

---

### Act 8: Impact (15 seconds)

**Visual**: History tab showing statistics

**Voiceover**:
> "In just 3 days, CognitiveSense helped me avoid 8 manipulative purchases and saved me over ₹8,000."

**On-screen text**:
- "Sites Analyzed: 24"
- "Manipulations Caught: 8"
- "Money Saved: ₹8,250"

---

### Act 9: Call to Action (10 seconds)

**Visual**: GitHub repo, download link

**Voiceover**:
> "CognitiveSense. Shop consciously. Open source and privacy-first."

**On-screen text**:
- "github.com/yourorg/cognitive-sense"
- "Available Now"
- "Built for Chrome Built-in AI Challenge 2025"

---

## 📊 Success Metrics

### Must-Have (MVP Complete)

- [ ] All 6 detection types work accurately on 10+ shopping sites
- [ ] Beautiful, professional UI (overlays + side panel)
- [ ] Works in 3+ languages (English, Hindi, Tamil/Spanish)
- [ ] Hybrid features functional (mock or real data)
- [ ] Performance < 2s per page analysis
- [ ] Demo video complete (3 min, professional quality)
- [ ] Documentation complete (README, Privacy.md)
- [ ] No critical bugs
- [ ] Extension published (Chrome Web Store or unlisted for judges)

### Nice-to-Have (Extra Polish)

- [ ] Visual analysis working (stock photo detection)
- [ ] Behavioral learning active
- [ ] Real backend API (not just mocks)
- [ ] Works in 5+ languages
- [ ] Smooth animations throughout
- [ ] Onboarding flow for new users

### Stretch Goals (Time Permitting)

- [ ] Export history as PDF/CSV
- [ ] Comparison mode (2 products side-by-side)
- [ ] Browser notifications for high-risk pages
- [ ] WhatsApp/Email sharing of detections

---

## 🎯 Daily Checkpoints

### End of Each Day

- [ ] **Code committed** to Git with clear commit messages
- [ ] **Tests passing** (if applicable)
- [ ] **Demo-able** on at least 1 real site
- [ ] **No blockers** for next day

### Mid-Week Check (End of Day 3)

- [ ] Extension loads and runs without errors
- [ ] Detections visible on real pages
- [ ] UI looks professional
- [ ] On track for Day 7 submission

### Pre-Demo Check (End of Day 6)

- [ ] All features working
- [ ] Tested on 10+ sites
- [ ] No critical bugs
- [ ] Ready to record demo

---

## ⚠️ Risk Mitigation

### Chrome AI APIs Not Working

**Risk**: Built-in AI APIs unavailable or unreliable  
**Mitigation**:
1. Test APIs early (Day 1)
2. Build fallback mode (regex + keyword detection)
3. Show error banner: "AI unavailable - using basic detection"

### Running Behind Schedule

**Risk**: Features taking longer than estimated  
**Mitigation**:
1. Cut behavioral learning (nice-to-have)
2. Use mock backend data (don't integrate real APIs)
3. Reduce languages to 2 (English + Hindi)
4. Simplify visual analysis

### Bugs on Demo Day

**Risk**: Critical bug found on Day 7  
**Mitigation**:
1. Record demo early (Day 6 evening)
2. Have backup recording if needed
3. Test extensively on Day 6

---

## 🛠️ Tools & Resources

### Development
- **IDE**: VS Code / Cursor
- **Extension testing**: Chrome DevTools, React DevTools
- **Version control**: Git + GitHub
- **Package manager**: npm/pnpm

### Design
- **UI components**: shadcn/ui
- **Icons**: Lucide React, emoji
- **Colors**: Tailwind CSS palette
- **Fonts**: Inter (from Google Fonts)

### Demo Production
- **Screen recording**: OBS Studio, QuickTime, Loom
- **Video editing**: DaVinci Resolve, Final Cut Pro, Adobe Premiere
- **Audio**: Audacity (voiceover editing)
- **Thumbnail**: Figma, Canva

### Backend
- **Hosting**: Vercel (Next.js)
- **Database**: Not needed for MVP (mock data)
- **Rate limiting**: Vercel KV or Upstash Redis

---

## 📝 Submission Checklist

### GitHub Repository

- [ ] Public repository
- [ ] Clear README.md with:
  - [ ] Project description
  - [ ] Installation instructions
  - [ ] Chrome AI APIs used (explicit list)
  - [ ] Screenshots
  - [ ] Demo video link
- [ ] Privacy.md explaining data practices
- [ ] LICENSE file (MIT or Apache 2.0)
- [ ] Clean commit history
- [ ] All code commented

### Devpost Submission

- [ ] Project title: "CognitiveSense"
- [ ] Tagline (1 sentence)
- [ ] Detailed description
- [ ] Demo video uploaded (YouTube/Vimeo)
- [ ] Screenshots (4-6 images)
- [ ] Built With tags:
  - [ ] Chrome Built-in AI
  - [ ] Chrome Prompt API
  - [ ] Chrome Summarizer
  - [ ] Chrome Writer
  - [ ] Chrome Language Detector
  - [ ] Chrome Translator
  - [ ] React
  - [ ] TypeScript
  - [ ] Next.js (backend)
- [ ] Links:
  - [ ] GitHub repo
  - [ ] Demo video
  - [ ] (Optional) Live extension link

### Chrome Web Store (Optional)

- [ ] Extension packaged (.zip)
- [ ] Store listing draft
- [ ] Privacy policy published
- [ ] Screenshots for store

---

## 💡 Pro Tips for Winning

### Technical Excellence

1. **Code quality matters**: Clean, documented, well-structured code
2. **Test thoroughly**: Judges notice bugs immediately
3. **Performance**: Fast load times show attention to detail
4. **Error handling**: Graceful failures, helpful error messages

### Demo Video

1. **First 10 seconds**: Hook judges immediately
2. **Show, don't tell**: Live demo > talking head
3. **Highlight APIs**: Make it obvious which Chrome AI APIs you're using
4. **Professional production**: Good audio, smooth editing
5. **End with impact**: Show the value clearly

### Differentiation

1. **Framework over feature**: Show you built for scale
2. **Privacy messaging**: Emphasize privacy-first repeatedly
3. **Real utility**: Solve a universal problem
4. **Polish**: Professional UI signals serious project

### Judging Criteria

Based on typical hackathon judging:
- **Innovation** (30%): Novel use of Chrome AI APIs
- **Technical Implementation** (30%): Code quality, architecture
- **Design & UX** (20%): Visual polish, usability
- **Impact** (20%): Does it solve a real problem?

---

## 🚀 Post-Hackathon Roadmap

### Week 1-2: Add Second Agent

- Implement News Bias agent
- Reuse detection pipeline
- New set of prompts for news analysis

### Week 3-4: Add Third Agent

- Implement Social Pulse agent
- Session tracking
- Break nudges

### Month 2: Production Launch

- Full backend with user accounts
- Sync across devices
- Analytics dashboard
- Community template marketplace

### Month 3: Monetization

- Free tier (basic features)
- Pro tier ($4.99/month): Advanced analytics, priority support
- Team tier ($9.99/user/month): Org policies, shared settings

---

## ✅ Final Pre-Submission Checklist

**48 Hours Before Deadline**:

- [ ] Extension tested on clean Chrome profile
- [ ] Demo video reviewed by someone else
- [ ] All links working
- [ ] Privacy.md reviewed by someone else
- [ ] Screenshots show best features
- [ ] README grammar/spelling checked
- [ ] GitHub repo organized

**24 Hours Before Deadline**:

- [ ] Submission form filled out
- [ ] Draft saved on Devpost
- [ ] Backup video uploaded to 2 platforms
- [ ] Extension packaged and tested
- [ ] Emergency contact info shared with team

**Submission Day**:

- [ ] Final test of all features
- [ ] Submit early (don't wait until last minute)
- [ ] Confirm submission received
- [ ] Celebrate! 🎉

---

## 📞 Resources

- **Chrome AI APIs Docs**: https://developer.chrome.com/docs/ai/built-in
- **Hackathon Rules**: https://googlechromeai2025.devpost.com/rules
- **Extension Docs**: https://developer.chrome.com/docs/extensions/
- **shadcn/ui**: https://ui.shadcn.com/
- **Next.js**: https://nextjs.org/docs

---

**Remember**: 
- Focus on one thing done excellently
- Privacy messaging is critical
- Demo video is 90% of judging
- Judges want to see innovation, not feature count

**You've got this! 🚀**
