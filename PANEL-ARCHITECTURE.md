# Detail Panel Architecture - Multi-Agent Support

**How the side panel adapts to different agents (Shopping vs Social)**

---

## 🎯 Overview

The detail panel is **agent-agnostic** - it automatically adapts based on which agent detected the content.

```
Content Script
    ↓
Detect page type (shopping vs social)
    ↓
Route to appropriate agent (ShoppingAgent vs SocialAgent)
    ↓
Agent returns detections with metadata
    ↓
Panel renders based on detection.agentKey
    ↓
User sees appropriate UI for that agent
```

---

## 📊 Panel Structure

### Universal Header (Same for all agents)
```
┌─────────────────────────────────────┐
│  🛡️ CognitiveSense                  │
│  ─────────────────────────────────  │
│  Overall Score: 65/100              │
│  Detections: 5 found                │
│  🌐 Language: English ▼             │
└─────────────────────────────────────┘
```

### Detector Breakdown (Adapts per agent)

**Shopping Sites:**
```
┌─────────────────────────────────────┐
│  Detector Breakdown                 │
├─────────────────────────────────────┤
│ ⏰ Urgency    │ 💰 Anchoring       │
│      2       │      1              │
├──────────────┼────────────────────┤
│ ⭐ Social    │ 🎁 FOMO            │
│   Proof      │                     │
│      0       │      1              │
├──────────────┼────────────────────┤
│ 📦 Bundling  │ 🎮 Dark Pattern    │
│      1       │      0              │
└──────────────┴────────────────────┘
```

**Social Sites:**
```
┌─────────────────────────────────────┐
│  Detector Breakdown                 │
├─────────────────────────────────────┤
│ 🚫 Misinformation │ 😠 Emotional   │
│        1          │  Manipulation   │
│                   │        2        │
├───────────────────┼────────────────┤
│ 🔄 Echo Chamber   │ 🤖 Fake Account│
│        1          │        0        │
├───────────────────┼────────────────┤
│ 🔴 Toxicity       │ 🎭 Political   │
│        0          │  Manipulation   │
│                   │        1        │
└───────────────────┴────────────────┘
```

---

## 🔄 How It Works

### Step 1: Page Load
```typescript
// Content script detects page type
const isShoppingPage = checkDomain(['amazon.com', 'flipkart.com', ...]);
const isSocialPage = checkDomain(['facebook.com', 'twitter.com', ...]);
```

### Step 2: Agent Selection
```typescript
// Route to appropriate agent
if (isShoppingPage) {
  agent = new ShoppingPersuasionAgent();
} else if (isSocialPage) {
  agent = new SocialMediaAgent();
}
```

### Step 3: Detection
```typescript
// Agent returns detections with agentKey
const detections = await agent.detect(context);

// Each detection includes:
{
  id: "urgency_123",
  agentKey: "shopping_persuasion",  // ← Identifies which agent
  type: "urgency",
  title: "⏰ Suspicious Countdown Timer",
  ...
}

// vs

{
  id: "misinformation_456",
  agentKey: "social_media",  // ← Different agent
  type: "misinformation",
  title: "🚫 Potential Misinformation",
  ...
}
```

### Step 4: Panel Rendering
```typescript
// Panel reads agentKey and renders accordingly
const renderDetectorBreakdown = (detections) => {
  const agentKey = detections[0].agentKey;
  
  if (agentKey === 'shopping_persuasion') {
    return <ShoppingDetectorBreakdown detections={detections} />;
  } else if (agentKey === 'social_media') {
    return <SocialDetectorBreakdown detections={detections} />;
  }
};
```

---

## 📱 Shopping Site Panel

### Example: Amazon Product Page

```
┌─────────────────────────────────────────┐
│  🛡️ CognitiveSense                      │
│  ─────────────────────────────────────  │
│  Overall Score: 72/100                  │
│  5 Manipulation Tactics Detected        │
│  2 high severity                        │
│  🌐 English ▼                           │
├─────────────────────────────────────────┤
│  Detector Breakdown                     │
├─────────────────────────────────────────┤
│ ⏰ Urgency    │ 💰 Anchoring           │
│      2       │      1                  │
├──────────────┼─────────────────────────┤
│ ⭐ Social    │ 🎁 FOMO                │
│   Proof      │                         │
│      0       │      1                  │
├──────────────┼─────────────────────────┤
│ 📦 Bundling  │ 🎮 Dark Pattern        │
│      1       │      0                  │
├─────────────────────────────────────────┤
│  Detected Tactics                       │
├─────────────────────────────────────────┤
│ HIGH 95% confident                      │
│ ⏰ Suspicious Countdown Timer            │
│ Sale ends in 2 hours 30 minutes!        │
│ 🤖 AI Analysis: Prompt API              │
│ ⚠️ What This Means: [Read more]         │
│ 💡 Smart Tip: [Read more]               │
├─────────────────────────────────────────┤
│ MEDIUM 80% confident                    │
│ 💰 Anchoring Detected                   │
│ Was $599.99, now $149.99                │
│ 🤖 AI Analysis: Prompt API              │
│ ⚠️ What This Means: [Read more]         │
│ 💡 Smart Tip: [Read more]               │
└─────────────────────────────────────────┘
```

---

## 📱 Social Site Panel

### Example: Twitter/X Feed

```
┌─────────────────────────────────────────┐
│  🛡️ CognitiveSense                      │
│  ─────────────────────────────────────  │
│  Overall Score: 58/100                  │
│  5 Issues Detected                      │
│  1 high severity                        │
│  🌐 English ▼                           │
├─────────────────────────────────────────┤
│  Detector Breakdown                     │
├─────────────────────────────────────────┤
│ 🚫 Misinformation │ 😠 Emotional       │
│        1          │  Manipulation       │
│                   │        2            │
├───────────────────┼────────────────────┤
│ 🔄 Echo Chamber   │ 🤖 Fake Account    │
│        1          │        0            │
├───────────────────┼────────────────────┤
│ 🔴 Toxicity       │ 🎭 Political       │
│        0          │  Manipulation       │
│                   │        1            │
├─────────────────────────────────────────┤
│  Detected Issues                        │
├─────────────────────────────────────────┤
│ HIGH 92% confident                      │
│ 🚫 Potential Misinformation             │
│ "5G causes COVID-19"                    │
│ 🤖 AI Analysis: Prompt API              │
│ ⚠️ Fact Check: [View fact-checks]       │
│ 💡 Learn More: [Media literacy tips]    │
├─────────────────────────────────────────┤
│ MEDIUM 85% confident                    │
│ 😠 Emotional Manipulation               │
│ Using fear and outrage language         │
│ 🤖 AI Analysis: Prompt API              │
│ ⚠️ What This Means: [Read more]         │
│ 💡 Smart Tip: [Read more]               │
└─────────────────────────────────────────┘
```

---

## 🎨 UI Differences

### Shopping Panel Features
- **Detector Breakdown**: 6 shopping detectors
- **Detection Cards**: Show product/price info
- **Warnings**: Focus on financial impact
- **Tips**: Shopping advice
- **Badges**: "Prompt API", "Writer API"

### Social Panel Features
- **Detector Breakdown**: 6 social detectors
- **Detection Cards**: Show post/account info
- **Warnings**: Focus on misinformation/toxicity
- **Tips**: Media literacy advice
- **Badges**: "Prompt API", "Summarizer API"
- **Fact-Check Links**: External fact-checking
- **Perspective Diversity**: Alternative viewpoints

---

## 🔧 Implementation Details

### Panel Component Structure

```typescript
// Panel.tsx - Main component
export function Panel() {
  const [state, setState] = useState<PanelState>();
  
  // Detect which agent's detections we have
  const agentKey = state.detections[0]?.agentKey;
  
  return (
    <div className="panel">
      <Header />
      
      {/* Universal detector breakdown - adapts per agent */}
      <DetectorBreakdown 
        detections={state.detections}
        agentKey={agentKey}
      />
      
      {/* Agent-specific detection cards */}
      {agentKey === 'shopping_persuasion' ? (
        <ShoppingDetectionCards detections={state.detections} />
      ) : agentKey === 'social_media' ? (
        <SocialDetectionCards detections={state.detections} />
      ) : null}
    </div>
  );
}
```

### DetectorBreakdown Component

```typescript
// Adapts based on agentKey
function DetectorBreakdown({ detections, agentKey }) {
  const detectorConfig = {
    shopping_persuasion: [
      { type: 'urgency', emoji: '⏰', label: 'Urgency' },
      { type: 'anchoring', emoji: '💰', label: 'Anchoring' },
      { type: 'social_proof', emoji: '⭐', label: 'Social Proof' },
      { type: 'fomo', emoji: '🎁', label: 'FOMO' },
      { type: 'bundling', emoji: '📦', label: 'Bundling' },
      { type: 'dark_pattern', emoji: '🎮', label: 'Dark Pattern' }
    ],
    social_media: [
      { type: 'misinformation', emoji: '🚫', label: 'Misinformation' },
      { type: 'emotional_manipulation', emoji: '😠', label: 'Emotional' },
      { type: 'echo_chamber', emoji: '🔄', label: 'Echo Chamber' },
      { type: 'fake_account', emoji: '🤖', label: 'Fake Account' },
      { type: 'toxicity', emoji: '🔴', label: 'Toxicity' },
      { type: 'political_manipulation', emoji: '🎭', label: 'Political' }
    ]
  };
  
  const config = detectorConfig[agentKey];
  
  return (
    <div className="detector-breakdown">
      {config.map(detector => {
        const count = detections.filter(d => d.type === detector.type).length;
        return (
          <div key={detector.type} className="detector-box">
            <div className="label">{detector.emoji} {detector.label}</div>
            <div className="count">{count}</div>
          </div>
        );
      })}
    </div>
  );
}
```

---

## 🚀 Multi-Agent Flow

### Timeline: How it works

```
User visits Amazon.com
    ↓
Content script loads
    ↓
Detects shopping domain
    ↓
Initializes ShoppingPersuasionAgent
    ↓
Runs 6 shopping detectors
    ↓
Returns detections with agentKey: 'shopping_persuasion'
    ↓
Panel renders shopping UI
    ↓
Shows: Urgency, Anchoring, Social Proof, FOMO, Bundling, Dark Pattern

─────────────────────────────────────────────────────────────

User visits Twitter.com
    ↓
Content script loads
    ↓
Detects social domain
    ↓
Initializes SocialMediaAgent
    ↓
Runs 6 social detectors
    ↓
Returns detections with agentKey: 'social_media'
    ↓
Panel renders social UI
    ↓
Shows: Misinformation, Emotional, Echo Chamber, Fake Account, Toxicity, Political
```

---

## 💡 Key Insights

### Same Panel, Different Content
- **One panel component** serves all agents
- **Adapts based on agentKey** in detections
- **No hardcoding** of agent-specific logic
- **Scalable** for future agents

### Agent Metadata
Each detection includes:
```typescript
{
  agentKey: 'shopping_persuasion' | 'social_media' | 'news_bias' | ...
  type: string;  // Detector-specific type
  title: string;
  description: string;
  // ... other fields
}
```

### Panel Knows What to Show
```
if (agentKey === 'shopping_persuasion') {
  // Show shopping detectors: Urgency, Anchoring, etc.
  // Show price-related warnings
  // Show shopping tips
} else if (agentKey === 'social_media') {
  // Show social detectors: Misinformation, Emotional, etc.
  // Show fact-check links
  // Show media literacy tips
}
```

---

## 🎯 Future Agents

When you add more agents, the panel automatically supports them:

```typescript
// NewsGuardAgent
{
  agentKey: 'news_bias',
  type: 'political_bias',
  // ... news-specific fields
}

// AIDetectionAgent
{
  agentKey: 'ai_safety',
  type: 'deepfake',
  // ... AI-specific fields
}
```

Just add new detector configs and detection card components!

---

## 📊 Summary

| Aspect | Shopping | Social | Future |
|--------|----------|--------|--------|
| **Agent** | ShoppingPersuasionAgent | SocialMediaAgent | NewsGuardAgent |
| **Detectors** | 6 shopping | 6 social | 6 news |
| **Panel** | Same component | Same component | Same component |
| **Adaptation** | Via agentKey | Via agentKey | Via agentKey |
| **Detector Breakdown** | Shopping UI | Social UI | News UI |
| **Detection Cards** | Shopping format | Social format | News format |

---

## ✅ Benefits

✅ **Single panel component** - No duplication  
✅ **Automatic adaptation** - Based on agentKey  
✅ **Scalable** - Easy to add new agents  
✅ **Maintainable** - Clear separation of concerns  
✅ **User-friendly** - Appropriate UI for each context  

---

**The panel is agent-agnostic by design!** 🎯
