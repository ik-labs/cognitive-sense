# CognitiveSense — System Architecture

## 🏗️ Modular Agent System

### Core Agent Interface

```typescript
// agents/base/Agent.ts
export interface Agent {
  key: AgentKey;                        // 'shopping_persuasion' | 'news_bias' | 'social_pulse'
  name: string;
  description: string;
  
  // Lifecycle
  initialize(config: AgentConfig): Promise<void>;
  canHandle(context: PageContext): boolean;
  
  // Detection
  detect(context: PageContext): Promise<Detection>;
  
  // UI
  render(detection: Detection): OverlaySpec;
  getSidebarComponent(): ReactComponent;
  
  // Hybrid (optional)
  hybridAction?(detection: Detection, action: string): Promise<HybridResult>;
}
```

### Agent Registry (Singleton)

```typescript
// agents/base/AgentRegistry.ts
export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<AgentKey, Agent> = new Map();
  
  register(agent: Agent): void {
    this.agents.set(agent.key, agent);
  }
  
  getActiveAgents(context: PageContext, settings: UserSettings): Agent[] {
    return Array.from(this.agents.values()).filter(agent =>
      settings.isEnabled(agent.key, context.domain) && agent.canHandle(context)
    );
  }
}

// Usage
const registry = AgentRegistry.getInstance();
registry.register(new ShoppingPersuasionAgent());
// Future: registry.register(new NewsBiasAgent());
```

---

## 🔍 3-Layer Detection Pipeline

### Layer 1: Fast Heuristics (< 100ms)

```typescript
class HeuristicDetector {
  detectUrgencyKeywords(text: string): Match[];
  detectPricePatterns(text: string): PriceInfo[];
  detectCountdownTimers(dom: Document): TimerInfo[];
}
```

**Purpose**: Quick initial scan using regex and DOM queries

### Layer 2: Built-in AI (< 3s)

```typescript
class AIDetector {
  async summarize(text: string): Promise<string>;
  async classify(text: string): Promise<Classification>;
  async detectLanguage(text: string): Promise<string>;
  async generateWarning(detection: Detection, lang: string): Promise<string>;
}
```

**APIs Used**: Prompt, Summarizer, Writer, Language Detector, Translator

### Layer 3: Hybrid (opt-in, < 5s)

```typescript
class HybridDetector {
  async fetchPriceHistory(product: string): Promise<PriceHistory>;
  async findAlternatives(product: ProductInfo): Promise<Alternative[]>;
  async verifyReviews(reviews: Review[]): Promise<AuthenticityScore>;
}
```

**Purpose**: Cross-site data enrichment via backend API

---

## 📦 Repository Structure

```
/extension
  /src
    /agents
      /base              # Agent interface + registry
      /shopping          # Shopping agent + 6 detectors
      /news              # Stub for future
      /social            # Stub for future
    /ai                  # Chrome AI wrappers (Prompt, Summarizer, Writer, Language)
    /content             # Content script, DOM extraction, overlays
    /panel               # Side panel UI (React + shadcn)
    /core                # PageContext, TriggerEngine, BehaviorLearning
    /api                 # Backend client
    /storage             # chrome.storage.local + IndexedDB
    /lib                 # Utils
  manifest.json
  sw.ts                  # Service worker

/backend                 # Next.js API (optional)
  /api/shopping          # price-history, alternatives, verify-reviews
  middleware.ts          # Auth + rate limit

/docs                    # All documentation files
```

---

## 🔄 Page Analysis Flow

```typescript
// content/ContentScript.ts

async function analyzePage() {
  // 1. Build context
  const context = await new PageContextBuilder().build();
  
  // 2. Get active agents
  const registry = AgentRegistry.getInstance();
  const agents = registry.getActiveAgents(context, userSettings);
  
  // 3. Run detections (parallel)
  const detections = await Promise.all(
    agents.map(agent => agent.detect(context))
  );
  
  // 4. Filter by thresholds
  const significant = detections.filter(d => d.score >= threshold);
  
  // 5. Render overlays
  const injector = new OverlayInjector();
  significant.forEach(detection => {
    const spec = agent.render(detection);
    injector.inject(spec, detection);
  });
  
  // 6. Update side panel
  chrome.runtime.sendMessage({
    type: 'UPDATE_DETECTIONS',
    detections: significant
  });
  
  // 7. Save to history
  await storage.saveDetections(significant);
}
```

---

## 🧠 AI Engine Wrappers

### Prompt Engine

```typescript
// ai/PromptEngine.ts
export class PromptEngine {
  private session: any;
  
  async initialize() {
    this.session = await ai.languageModel.create({
      systemPrompt: SHOPPING_AGENT_SYSTEM_PROMPT
    });
  }
  
  async classify(text: string, type: ManipulationType): Promise<Analysis> {
    const prompt = this.buildPrompt(text, type);
    const response = await this.session.prompt(prompt);
    return this.parseResponse(response);
  }
}
```

### Summarizer Engine

```typescript
// ai/SummarizerEngine.ts
export class SummarizerEngine {
  async summarize(text: string): Promise<string> {
    const session = await ai.summarizer.create({
      type: 'key-points',
      length: 'short'
    });
    return await session.summarize(text);
  }
}
```

### Language Engine

```typescript
// ai/LanguageEngine.ts
export class LanguageEngine {
  async detectLanguage(text: string): Promise<string> {
    const detector = await ai.languageDetector.create();
    const results = await detector.detect(text.slice(0, 1000));
    return results[0]?.detectedLanguage || 'en';
  }
  
  async translate(text: string, targetLang: string): Promise<string> {
    const translator = await ai.translator.create({
      sourceLanguage: 'en',
      targetLanguage: targetLang
    });
    return await translator.translate(text);
  }
  
  async localizeWarning(detection: Detection, lang: string): Promise<string> {
    const template = this.getTemplate(detection.type);
    const warning = this.fillTemplate(template, detection);
    return lang === 'en' ? warning : await this.translate(warning, lang);
  }
}
```

### Writer Engine

```typescript
// ai/WriterEngine.ts
export class WriterEngine {
  async generateTooltip(detection: Detection): Promise<string> {
    const writer = await ai.writer.create({
      tone: 'neutral',
      length: 'short'
    });
    
    const prompt = `Write a friendly warning about ${detection.type} manipulation: ${detection.summary}`;
    return await writer.write(prompt);
  }
}
```

---

## 🎨 UI Components

### Overlay Injector

```typescript
// content/OverlayInjector.ts
export class OverlayInjector {
  inject(spec: OverlaySpec, detection: Detection): void {
    const overlay = this.createOverlay(spec);
    this.positionOverlay(overlay, spec.anchor);
    document.body.appendChild(overlay);
  }
  
  private createOverlay(spec: OverlaySpec): HTMLElement {
    // Render React component
    const container = document.createElement('div');
    container.className = `cs-overlay cs-${spec.severity}`;
    ReactDOM.createRoot(container).render(<Tooltip spec={spec} />);
    return container;
  }
}
```

### Side Panel Components

```typescript
// panel/Panel.tsx
export function Panel() {
  const detections = useDetections();
  
  return (
    <div className="cs-panel">
      <ScoreCard overall={detections.overallScore} />
      <BreakdownChart breakdown={detections.breakdown} />
      <TacticsList tactics={detections.tactics} />
      <RecommendationCard recommendations={detections.recommendations} />
      
      <Tabs>
        <Tab name="History"><HistoryTab /></Tab>
        <Tab name="Settings"><SettingsTab /></Tab>
        <Tab name="Privacy"><PrivacyTab /></Tab>
      </Tabs>
    </div>
  );
}
```

---

## 💾 Storage Layer

```typescript
// storage/LocalStorage.ts
export class StorageManager {
  // Detection history (last 100)
  async saveDetection(detection: Detection): Promise<void> {
    const history = await this.getHistory();
    history.unshift(detection);
    await chrome.storage.local.set({ 
      detectionHistory: history.slice(0, 100) 
    });
  }
  
  // Agent configs
  async saveAgentConfig(key: AgentKey, config: AgentConfig): Promise<void> {
    const configs = await this.getAllConfigs();
    configs[key] = config;
    await chrome.storage.local.set({ agentConfigs: configs });
  }
  
  // Per-domain settings
  async saveDomainSettings(domain: string, settings: DomainSettings): Promise<void> {
    await chrome.storage.local.set({ [`domain:${domain}`]: settings });
  }
}
```

---

## 🔐 Privacy Architecture

### Data Flow

**Local Only (Default)**:
```
Page → Extract → Summarize (AI) → Classify (AI) → Render → Store Locally
```

**Hybrid (Opt-in)**:
```
Detection → User Clicks "Find Alternatives" → 
Send {productName, price} → Backend → 
Return {alternatives} → Display
```

### What's Stored Locally

- Detection history (signals only, no page content)
- Agent configurations
- User preferences
- Behavior learning data

### What's Never Stored

- Full page HTML
- Personal browsing history
- User-identifiable data without consent

### Hybrid Calls Send

- Product name (when finding alternatives)
- Current price (for price history)
- Review text sample (for verification, opt-in)
- **Never**: Full page content, cookies, personal data

---

## 🚀 Extension Lifecycle

### Service Worker Initialization

```typescript
// sw.ts
chrome.runtime.onInstalled.addListener(async () => {
  // Register agents
  const registry = AgentRegistry.getInstance();
  registry.register(new ShoppingPersuasionAgent());
  await registry.initialize();
  
  // Set defaults
  await initializeDefaultSettings();
});

// Handle messages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'HYBRID_REQUEST') {
    handleHybridRequest(msg.data).then(sendResponse);
    return true;
  }
});
```

### Content Script Entry

```typescript
// content/ContentScript.ts
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

async function init() {
  await analyzePage();
  observeMutations();
}
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// agents/shopping/__tests__/UrgencyDetector.test.ts
describe('UrgencyDetector', () => {
  it('detects countdown timers', () => {
    const html = '<div id="timer">03:45:12</div>';
    const detection = detector.detect(html);
    expect(detection.hasCountdownTimer).toBe(true);
  });
  
  it('scores urgency correctly', () => {
    const text = 'Only 2 left! Ends in 3 hours!';
    const score = detector.scoreUrgency(text);
    expect(score).toBeGreaterThan(7);
  });
});
```

### E2E Tests

```typescript
// Test on mock pages with known manipulation patterns
describe('Shopping Agent E2E', () => {
  it('detects manipulation on high-risk page', async () => {
    await page.goto('mock://high-manipulation-product');
    
    const overlay = await page.waitForSelector('.cs-overlay');
    expect(overlay).toBeDefined();
    
    const score = await page.$eval('.cs-score', el => el.textContent);
    expect(parseInt(score)).toBeGreaterThan(70);
  });
});
```

---

## 📈 Performance Targets

| Metric | Target | Why |
|--------|--------|-----|
| Page analysis | < 2s | User doesn't notice |
| Overlay render | < 100ms | Smooth interaction |
| Memory usage | < 50MB | Chrome's limits |
| CPU (content script) | < 20% | Don't slow browsing |
| Storage | < 10MB | Respect user space |

---

## 🔧 Configuration Schema

```typescript
interface AgentConfig {
  enabled: boolean;
  sensitivity: number;                  // 0-1
  thresholds: {
    urgency: number;
    anchoring: number;
    socialProof: number;
    fomo: number;
    bundling: number;
    darkPatterns: number;
  };
  ui: {
    showOverlays: boolean;
    position: 'top' | 'bottom' | 'left' | 'right';
    autoHide: boolean;
    autoHideDelay: number;
  };
  domains: {
    whitelist?: string[];
    blacklist?: string[];
  };
}
```

---

## 🎯 Key Design Decisions

### Why Modular Agents?

- **Extensibility**: Add news/social agents post-hackathon in days
- **Maintainability**: Each agent is independent
- **Testability**: Test agents in isolation
- **Demo Value**: Shows architectural thinking

### Why 3-Layer Detection?

- **Performance**: Fast heuristics filter obvious cases
- **Accuracy**: AI for nuanced analysis
- **Value**: Hybrid for cross-site intelligence
- **Privacy**: User controls each layer

### Why Local-First?

- **Privacy**: No data leaves device by default
- **Speed**: No network latency
- **Reliability**: Works offline
- **Trust**: Users have full control

### Why React + shadcn?

- **Polish**: Professional UI out of the box
- **Speed**: Component library accelerates development
- **Consistency**: Design system ensures coherence
- **Modern**: Shows we care about UX

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `agents/base/Agent.ts` | Agent interface definition |
| `agents/shopping/ShoppingAgent.ts` | Main shopping agent |
| `agents/shopping/detectors/` | 6 detector implementations |
| `ai/PromptEngine.ts` | Chrome Prompt API wrapper |
| `content/ContentScript.ts` | Entry point for page analysis |
| `panel/Panel.tsx` | Side panel main component |
| `sw.ts` | Service worker (extension lifecycle) |
| `manifest.json` | MV3 manifest |

---

**See Also**:
- [DETECTION-SPECS.md](./DETECTION-SPECS.md) - Detection parameters
- [HYBRID-API.md](./HYBRID-API.md) - Backend endpoints
- [UI-SPECS.md](./UI-SPECS.md) - Component designs
- [BUILD-PLAN.md](./BUILD-PLAN.md) - Implementation timeline
