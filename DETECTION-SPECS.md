# CognitiveSense — Detection Specifications

## 🎯 Overview

The Shopping Persuasion Agent detects **6 manipulation categories**. Each uses a combination of heuristics, AI analysis, and optional hybrid enrichment.

---

## 1️⃣ Urgency & Scarcity Detection

### What We Detect

- Countdown timers (JS-based or server-side)
- Stock scarcity claims ("Only X left")
- Time-limited offers ("Deal ends in Y hours")
- Flash sale banners
- Urgency language ("Hurry!", "Act now!", "Don't miss out")

### Detection Parameters

```typescript
interface UrgencyDetection {
  signals: {
    hasCountdownTimer: boolean;
    countdownValue?: number;              // Minutes remaining
    scarcityText?: string;                // "Only 3 left in stock"
    scarcityCount?: number;
    urgencyPhrases: string[];             // Matched phrases
    flashSaleBadge: boolean;
  };
  
  scoring: {
    severityScore: number;                // 0-10
    confidenceScore: number;              // 0-1
  };
  
  context: {
    isRecurring: boolean;                 // Seen this message before?
    firstSeen?: Date;
    timesShown: number;
  };
  
  aiAnalysis: {
    authenticity: 'genuine' | 'suspicious' | 'fake';
    reasoning: string;
    recommendedAction: 'wait_24h' | 'proceed_caution' | 'safe';
  };
}
```

### AI Prompt

```
Analyze this product page for urgency manipulation:

TEXT: "${pageExcerpt}"

Rate 0-10:
- Urgency Score: How much time pressure is being applied?
- Authenticity: Is this real scarcity or artificial?

List tactics used (countdown, stock claims, urgent language).
Recommend: wait 24h / proceed with caution / safe to buy.

Format:
UrgencyScore: [0-10]
Authenticity: [genuine|suspicious|fake]
Tactics: [list]
Reasoning: [2 sentences]
Action: [wait|caution|safe]
```

### Scoring Algorithm

```typescript
function calculateUrgencyScore(detection: UrgencyDetection): number {
  let score = 0;
  
  if (detection.signals.hasCountdownTimer) score += 3;
  if (detection.signals.scarcityCount && detection.signals.scarcityCount < 5) score += 2;
  if (detection.signals.urgencyPhrases.length > 0) score += detection.signals.urgencyPhrases.length;
  if (detection.signals.flashSaleBadge) score += 2;
  if (detection.context.isRecurring) score += 3;  // Fake urgency!
  
  return Math.min(score, 10);
}
```

### UI Response

**Tooltip**:
```
⚠️ Urgency Detected (8/10)

"Only 3 left!" - This message hasn't changed in 48 hours. 
Real stock is likely higher.

[Wait 24 Hours] [Find Alternatives] [Dismiss]
```

---

## 2️⃣ Anchoring & Price Manipulation

### What We Detect

- Fake "original price" (strikethrough)
- Inflated discount percentages
- Hidden costs (shipping, taxes revealed late)
- MRP manipulation (India-specific)
- Multiple confusing discounts
- Round number patterns (too perfect pricing)

### Detection Parameters

```typescript
interface AnchoringDetection {
  pricing: {
    currentPrice: number;
    originalPrice?: number;
    currency: string;
    claimedDiscount: number;              // Percentage claimed
    actualDiscount?: number;              // If history available
  };
  
  patterns: {
    hasStrikethrough: boolean;
    roundNumberPattern: boolean;          // ₹9,999 → ₹2,999
    multipleDiscounts: string[];          // ["50% off", "Extra 20%"]
    hiddenCosts: Array<{
      type: 'shipping' | 'tax' | 'handling' | 'warranty';
      amount: number;
      revealedAt: 'cart' | 'checkout' | 'hidden';
    }>;
  };
  
  scoring: {
    manipulationScore: number;            // 0-10
    suspicionLevel: 'low' | 'medium' | 'high';
  };
  
  aiAnalysis: {
    priceRealism: 'realistic' | 'suspicious' | 'fake';
    marketEstimate?: { min: number; max: number; };
    reasoning: string;
    redFlags: string[];
  };
  
  hybridData?: {                          // Opt-in cloud data
    priceHistory: {
      lowest30days: number;
      average30days: number;
      highest30days: number;
      currentVsAverage: number;           // Percentage difference
      trend: 'rising' | 'falling' | 'stable';
    };
  };
}
```

### AI Prompt

```
Analyze this pricing information:

Current: ₹${currentPrice}
Original: ₹${originalPrice}
Discount: ${discount}%
Product: ${productCategory}
Site: ${domain}

Evaluate:
1. Realism (0-10): Is the "original" price believable?
2. Authenticity: Is this discount genuine?
3. Market Range: Typical price for this product?
4. Red Flags: Suspicious patterns?

Format:
Realism: [0-10]
Authentic: [yes|suspicious|no]
Estimate: ₹[min]-₹[max]
RedFlags: [list]
Reasoning: [2 sentences]
```

### Scoring Algorithm

```typescript
function calculateAnchoringScore(detection: AnchoringDetection): number {
  let score = 0;
  
  if (detection.pricing.claimedDiscount > 50) score += 3;
  if (detection.pricing.claimedDiscount > 70) score += 2;  // Too good to be true
  if (detection.patterns.roundNumberPattern) score += 2;
  if (detection.patterns.multipleDiscounts.length > 1) score += 2;
  if (detection.patterns.hiddenCosts.length > 0) score += 3;
  if (detection.aiAnalysis.priceRealism === 'fake') score += 4;
  
  return Math.min(score, 10);
}
```

### UI Response

**Tooltip**:
```
⚓ Price Manipulation Detected (7/10)

Original price (₹9,999) seems inflated. Typical market 
price: ₹3,500-₹4,500. Real discount likely ~30%, not 70%.

Hidden shipping: ₹150 (revealed at checkout)

[Check Price History] [Compare Prices] [Dismiss]
```

---

## 3️⃣ Social Proof Manipulation

### What We Detect

- Fake reviews (pattern analysis)
- Suspicious rating distributions
- "X people bought this" claims
- Trending/bestseller badges (unverified)
- Verified vs unverified purchase ratio
- Review velocity anomalies

### Detection Parameters

```typescript
interface SocialProofDetection {
  reviews: {
    total: number;
    averageRating: number;
    distribution: {
      5: number; 4: number; 3: number; 2: number; 1: number;
    };
    verifiedPurchasePercent: number;
    recentVelocity: number;               // Reviews per day
    productAge: number;                   // Days since launch
  };
  
  claims: Array<{
    type: 'purchase_count' | 'viewer_count' | 'trending';
    text: string;                         // "127 bought in last hour"
    count?: number;
    timeWindow?: string;
    isVerifiable: boolean;
  }>;
  
  badges: Array<{
    text: string;                         // "#1 Bestseller", "Trending"
    verifiable: boolean;
    source?: string;
  }>;
  
  scoring: {
    authenticityScore: number;            // 0-100
    redFlags: string[];
  };
  
  aiAnalysis: {
    verdict: 'authentic' | 'suspicious' | 'likely_fake';
    confidence: number;
    reasoning: string;
    concerns: string[];
  };
  
  hybridData?: {                          // Opt-in verification
    crossSiteReviews?: number;
    authenticityFromAPI: number;          // External verification score
  };
}
```

### AI Prompt

```
Review authenticity analysis:

Total: ${total} reviews
Rating: ${avgRating} ⭐
Distribution: 5★:${r5} 4★:${r4} 3★:${r3} 2★:${r2} 1★:${r1}
Verified: ${verifiedPercent}%
Velocity: ${velocity} reviews/day (age: ${age} days)

Sample reviews:
"${review1}"
"${review2}"
"${review3}"

Evaluate:
1. Authenticity (0-100): How genuine?
2. Red Flags: Suspicious patterns?
3. Distribution: Natural or manipulated?
4. Language: Generic or specific?

Format:
Authenticity: [0-100]
Verdict: [authentic|suspicious|fake]
RedFlags: [list]
Reasoning: [2 sentences]
```

### Scoring Algorithm

```typescript
function calculateSocialProofScore(detection: SocialProofDetection): number {
  let score = 0;
  
  // High velocity
  if (detection.reviews.recentVelocity > detection.reviews.productAge) score += 3;
  
  // Unnatural distribution (>90% 5-star)
  const fiveStarPercent = detection.reviews.distribution[5] / detection.reviews.total;
  if (fiveStarPercent > 0.9) score += 3;
  
  // Low verified percentage
  if (detection.reviews.verifiedPurchasePercent < 20) score += 2;
  
  // Unverifiable claims
  const unverifiable = detection.claims.filter(c => !c.isVerifiable);
  score += Math.min(unverifiable.length * 2, 4);
  
  // AI verdict
  if (detection.aiAnalysis.verdict === 'likely_fake') score += 4;
  
  return Math.min(score, 10);
}
```

### UI Response

**Tooltip**:
```
👥 Review Authenticity Concerns (6/10)

🚩 500 reviews in 3 days (new product)
🚩 94% are 5-star (unnatural distribution)
🚩 Generic language: "great product!" repeated 47 times

Only 23 verified purchases out of 500 reviews.

[View Verified Only] [Check Other Sites] [Dismiss]
```

---

## 4️⃣ FOMO (Fear of Missing Out)

### What We Detect

- "Last chance" language
- Exclusive/limited edition claims
- Pre-order pressure
- "Others are viewing" notifications
- Emotional trigger words
- Scarcity + urgency combination

### Detection Parameters

```typescript
interface FOMODetection {
  triggers: Array<{
    phrase: string;
    category: 'exclusivity' | 'last_chance' | 'competition' | 'regret';
    emotionalWeight: number;              // 0-10
    location: string;                     // Where on page
  }>;
  
  psychologicalTactics: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  
  liveSignals: {
    othersViewing?: number;
    othersInCart?: number;
    recentPurchases?: string[];
  };
  
  scoring: {
    fomoScore: number;                    // 0-10
    manipulationLevel: 'low' | 'medium' | 'high' | 'extreme';
  };
  
  aiAnalysis: {
    primaryEmotion: 'fear' | 'greed' | 'envy' | 'regret';
    intensity: number;
    ethicalConcerns: string[];
  };
}
```

### AI Prompt

```
FOMO (fear of missing out) analysis:

TEXT: "${pageExcerpt}"

Identify:
1. FOMO Score (0-10): How much psychological pressure?
2. Primary Emotion: Fear, greed, envy, or regret?
3. Tactics: Specific FOMO techniques used
4. Ethical Level: Acceptable or manipulative?

Format:
FOMOScore: [0-10]
Emotion: [fear|greed|envy|regret]
Tactics: [list]
EthicalConcern: [none|minor|major|severe]
Reasoning: [2 sentences]
```

### Scoring Algorithm

```typescript
function calculateFOMOScore(detection: FOMODetection): number {
  let score = 0;
  
  // Emotional triggers
  detection.triggers.forEach(trigger => {
    score += trigger.emotionalWeight * 0.5;
  });
  
  // Live social proof (often fake)
  if (detection.liveSignals.othersViewing) score += 2;
  if (detection.liveSignals.recentPurchases?.length) score += 2;
  
  // High-severity tactics
  const highSeverity = detection.psychologicalTactics.filter(t => t.severity === 'high');
  score += highSeverity.length * 2;
  
  return Math.min(score, 10);
}
```

### UI Response

**Tooltip**:
```
😱 FOMO Tactics Detected (9/10)

Extreme psychological pressure detected:
• "Last chance - only today!"
• "12 people viewing right now"
• "Don't miss out on this exclusive deal"

This is designed to override rational decision-making.

[Take A Break] [Save For Later] [Dismiss]
```

---

## 5️⃣ Bundling Deception

### What We Detect

- Hidden mandatory add-ons
- "Free" items with conditions
- Forced bundles
- Subscription traps (auto-renewal)
- Pre-selected expensive options
- Unclear total cost

### Detection Parameters

```typescript
interface BundlingDetection {
  bundles: Array<{
    items: string[];
    isOptional: boolean;
    breakdown: Array<{
      item: string;
      price: number;
      canRemove: boolean;
      isPreSelected: boolean;
    }>;
    advertised Total价格: number;
    actualTotal: number;
  }>;
  
  deceptions: Array<{
    type: 'hidden_cost' | 'forced_bundle' | 'fake_free' | 'pre_selected' | 'subscription_trap';
    description: string;
    impact: number;                       // Extra cost in currency
    severity: 'minor' | 'moderate' | 'severe';
  }>;
  
  freeClaims: Array<{
    text: string;                         // "Free shipping"
    condition?: string;                   // "on orders > ₹999"
    isGenuinelyFree: boolean;
    hiddenCost?: number;
  }>;
  
  scoring: {
    deceptionScore: number;               // 0-10
    hiddenCostsTotal: number;
    transparencyRating: 'transparent' | 'unclear' | 'deceptive';
  };
}
```

### Scoring Algorithm

```typescript
function calculateBundlingScore(detection: BundlingDetection): number {
  let score = 0;
  
  // Hidden costs
  if (detection.scoring.hiddenCostsTotal > 0) {
    const percentageHidden = detection.scoring.hiddenCostsTotal / detection.bundles[0]?.actualTotal;
    score += Math.min(percentageHidden * 10, 4);
  }
  
  // Forced bundles
  const forced = detection.bundles.filter(b => !b.isOptional);
  score += forced.length * 2;
  
  // Pre-selected expensive options
  const preSelected = detection.deceptions.filter(d => d.type === 'pre_selected');
  score += preSelected.length * 2;
  
  // Fake "free" claims
  const fakeFree = detection.freeClaims.filter(f => !f.isGenuinelyFree);
  score += fakeFree.length * 2;
  
  return Math.min(score, 10);
}
```

### UI Response

**Tooltip**:
```
📦 Bundling Deception Detected (5/10)

Hidden costs found:
• Extended warranty (₹999) - pre-selected
• "Free" shipping requires ₹999 minimum order
• Subscription auto-renewal after trial

Real total: ₹4,148 (not ₹2,999 as advertised)

[Remove Hidden Items] [See Full Cost] [Dismiss]
```

---

## 6️⃣ Dark Patterns (UI/UX Manipulation)

### What We Detect

- Pre-checked checkboxes (unwanted add-ons)
- Confirmshaming ("No, I don't want to save money")
- Hidden cancel buttons
- Roach motel (easy to subscribe, hard to cancel)
- Trick questions
- Misdirection in UI

### Detection Parameters

```typescript
interface DarkPatternDetection {
  formPatterns: Array<{
    type: 'pre_checked' | 'hidden_field' | 'confusing_language' | 'tiny_text';
    element: string;                      // CSS selector
    description: string;
    impact: 'minor' | 'moderate' | 'severe';
    costImpact?: number;
  }>;
  
  buttonPatterns: Array<{
    type: 'confirmshaming' | 'misdirection' | 'trick_question' | 'visual_trick';
    acceptButton: { text: string; prominence: number; };
    declineButton: { text: string; prominence: number; };
    manipulation: string;
  }>;
  
  navigationIssues: Array<{
    type: 'hidden_cancel' | 'roach_motel' | 'forced_continuity' | 'obstruction';
    severity: number;
    description: string;
  }>;
  
  scoring: {
    darkPatternScore: number;             // 0-10
    ethicalViolations: string[];
    userHarmLevel: 'low' | 'medium' | 'high';
  };
  
  aiAnalysis: {
    uiEthicsRating: 'ethical' | 'concerning' | 'manipulative' | 'predatory';
    specificIssues: string[];
    userRights: string[];                 // What user should know
  };
}
```

### AI Prompt

```
Dark pattern analysis:

FORM HTML: "${formHTML}"
BUTTON TEXT: Accept: "${acceptText}", Decline: "${declineText}"

Evaluate:
1. Dark Pattern Score (0-10): How manipulative is the UI?
2. Type: confirmshaming, misdirection, trick question?
3. Impact: How does this harm users?
4. Ethics: acceptable, concerning, or predatory?

Format:
DarkPatternScore: [0-10]
Type: [type]
Impact: [description]
Ethics: [ethical|concerning|manipulative|predatory]
Reasoning: [2 sentences]
```

### Scoring Algorithm

```typescript
function calculateDarkPatternScore(detection: DarkPatternDetection): number {
  let score = 0;
  
  // Form manipulations
  const severeForm = detection.formPatterns.filter(f => f.impact === 'severe');
  score += severeForm.length * 3;
  
  // Button manipulations
  detection.buttonPatterns.forEach(bp => {
    if (bp.type === 'confirmshaming') score += 3;
    if (bp.type === 'misdirection') score += 2;
  });
  
  // Navigation issues
  const roachMotel = detection.navigationIssues.find(n => n.type === 'roach_motel');
  if (roachMotel) score += 4;
  
  // AI ethics rating
  if (detection.aiAnalysis.uiEthicsRating === 'predatory') score += 3;
  
  return Math.min(score, 10);
}
```

### UI Response

**Tooltip**:
```
🎭 Dark Pattern Detected (7/10)

Manipulative UI found:
• Pre-checked "Add 2-year warranty (₹999)"
• Decline button: "No, I don't want protection" (confirmshaming)
• Cancel subscription link hidden in footer (tiny text)

These tactics exploit cognitive biases.

[Uncheck All] [Learn More] [Dismiss]
```

---

## 🎯 Overall Manipulation Score

### Calculation

```typescript
function calculateOverallScore(detections: AllDetections): ManipulationScore {
  // Weighted average (some tactics are worse than others)
  const weights = {
    urgency: 1.0,
    anchoring: 1.2,           // Price manipulation is serious
    socialProof: 1.0,
    fomo: 1.3,                // FOMO is highly manipulative
    bundling: 1.1,
    darkPatterns: 1.4         // Dark patterns are most unethical
  };
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const [category, score] of Object.entries(detections)) {
    weightedSum += score * weights[category];
    totalWeight += weights[category];
  }
  
  const overall = (weightedSum / totalWeight) * 10;  // Scale to 0-100
  
  return {
    overall: Math.round(overall),
    risk: overall > 70 ? 'danger' : overall > 50 ? 'warning' : overall > 30 ? 'caution' : 'safe',
    breakdown: detections,
    recommendation: generateRecommendation(overall, detections)
  };
}
```

### Risk Levels

| Score | Risk Level | UI Color | Recommendation |
|-------|------------|----------|----------------|
| 0-30 | Safe | Green | Proceed normally |
| 31-50 | Caution | Yellow | Be aware of tactics |
| 51-70 | Warning | Orange | Proceed carefully |
| 71-100 | Danger | Red | Wait 24h or avoid |

---

## 🧪 Testing Each Detector

### Test Data

```typescript
const testCases = {
  urgency: {
    high: 'Only 2 left! Deal ends in 3 hours! Don\'t miss out!',
    medium: 'Limited time offer - ends tonight',
    low: 'Available for next 30 days'
  },
  
  anchoring: {
    high: 'Was ₹9,999 Now ₹2,999 (70% off!)',
    medium: 'Save ₹500',
    low: '₹2,999'
  },
  
  // ... test cases for each category
};

// Run tests
describe('Detectors', () => {
  it('urgency scores high manipulation correctly', () => {
    const score = urgencyDetector.detect(testCases.urgency.high);
    expect(score).toBeGreaterThan(7);
  });
});
```

---

**See Also**:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [HYBRID-API.md](./HYBRID-API.md) - Backend endpoints
- [UI-SPECS.md](./UI-SPECS.md) - Component designs
- [BUILD-PLAN.md](./BUILD-PLAN.md) - Implementation timeline
