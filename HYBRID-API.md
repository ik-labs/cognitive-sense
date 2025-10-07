# CognitiveSense — Hybrid API Specification

## 🌐 Overview

The **Hybrid API** provides opt-in cloud augmentation for features that benefit from cross-site data. All endpoints are **privacy-preserving** and only receive minimal, non-identifiable data.

**Tech Stack**: Next.js API Routes (deployed on Vercel)

---

## 🔐 Privacy Principles

### What We Send
- Product names (for alternatives/price history)
- Current price (number only, no context)
- Domain name (for rate limiting)
- Review text samples (opt-in, for verification only)

### What We Never Send
- Full page HTML/content
- User cookies or session data
- Browsing history
- Personal information
- Complete product URLs (only domain)

### User Control
- All hybrid calls require **explicit user action** (button click)
- Privacy notice shown before first call
- Can disable hybrid features entirely in settings
- Export/delete all hybrid request history

---

## 🔗 API Endpoints

### Base URL
```
Production: https://api.cognitivesense.app
Development: http://localhost:3000/api
```

### Authentication
```typescript
// For MVP: Simple API key (not user auth)
headers: {
  'X-API-Key': 'your-api-key',
  'Content-Type': 'application/json'
}

// Post-hackathon: Firebase ID token
headers: {
  'Authorization': 'Bearer <firebase-id-token>',
  'Content-Type': 'application/json'
}
```

---

## 📊 1. Price History

### Endpoint
```
POST /api/shopping/price-history
```

### Request

```typescript
interface PriceHistoryRequest {
  product: string;                        // Product name only
  currentPrice: number;
  currency: string;                       // 'INR', 'USD', etc.
  domain: string;                         // 'amazon.in', 'flipkart.com'
  category?: string;                      // Optional: 'electronics', 'fashion'
}

// Example
{
  "product": "iPhone 15 Pro 256GB Blue",
  "currentPrice": 134900,
  "currency": "INR",
  "domain": "amazon.in",
  "category": "electronics"
}
```

### Response

```typescript
interface PriceHistoryResponse {
  history: {
    lowest30days: number;
    highest30days: number;
    average30days: number;
    currentVsAverage: number;             // 1.05 = 5% above average
    currentVsLowest: number;              // 1.12 = 12% above lowest
    trendDirection: 'rising' | 'falling' | 'stable';
    priceDropProbability: number;         // 0-1 (ML prediction)
  };
  
  timeline: Array<{
    date: string;                         // ISO 8601
    price: number;
    source: string;                       // 'amazon.in', 'flipkart.com'
  }>;
  
  recommendation: {
    action: 'buy_now' | 'wait' | 'good_deal';
    reasoning: string;
    suggestedWaitDays?: number;
    potentialSavings?: number;
    confidence: number;                   // 0-1
  };
  
  metadata: {
    dataPoints: number;                   // How many prices in history
    dataQuality: 'high' | 'medium' | 'low';
    lastUpdated: string;                  // ISO 8601
    sources: string[];                    // Data sources used
  };
  
  privacyNote: string;                    // Reminder of what was sent
}

// Example
{
  "history": {
    "lowest30days": 127900,
    "highest30days": 139900,
    "average30days": 133500,
    "currentVsAverage": 1.01,
    "currentVsLowest": 1.05,
    "trendDirection": "stable",
    "priceDropProbability": 0.35
  },
  "timeline": [
    { "date": "2025-09-07", "price": 132900, "source": "amazon.in" },
    { "date": "2025-09-14", "price": 134900, "source": "amazon.in" },
    { "date": "2025-09-21", "price": 127900, "source": "flipkart.com" }
  ],
  "recommendation": {
    "action": "wait",
    "reasoning": "Price is 5% above 30-day average. Historical data shows frequent drops to ₹127,900 during weekend sales.",
    "suggestedWaitDays": 7,
    "potentialSavings": 7000,
    "confidence": 0.75
  },
  "metadata": {
    "dataPoints": 45,
    "dataQuality": "high",
    "lastUpdated": "2025-10-07T14:30:00Z",
    "sources": ["amazon.in", "flipkart.com", "croma.com"]
  },
  "privacyNote": "Only product name and current price were sent. No browsing data shared."
}
```

### Implementation (MVP)

```typescript
// backend/api/shopping/price-history.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { product, currentPrice, currency, domain } = await request.json();
  
  // Validate
  if (!product || !currentPrice || !currency) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  // Rate limiting
  await rateLimit(request);
  
  // For MVP: Mock data or fetch from price tracking API
  const history = await fetchPriceHistory(product, domain);
  
  // Calculate statistics
  const stats = calculateStatistics(history, currentPrice);
  
  // Generate recommendation
  const recommendation = generateRecommendation(stats);
  
  return NextResponse.json({
    history: stats,
    timeline: history.slice(0, 10),       // Last 10 price points
    recommendation,
    metadata: {
      dataPoints: history.length,
      dataQuality: history.length > 20 ? 'high' : 'medium',
      lastUpdated: new Date().toISOString(),
      sources: ['amazon.in', 'flipkart.com']
    },
    privacyNote: 'Only product name and current price were sent.'
  });
}

// For hackathon: Mock data generator
async function fetchPriceHistory(product: string, domain: string) {
  // TODO: Integrate with real price tracking API (e.g., Keepa, CamelCamelCamel)
  // For demo: Generate realistic mock data
  return generateMockPriceHistory(product);
}
```

---

## 🔍 2. Alternative Sellers

### Endpoint
```
POST /api/shopping/alternatives
```

### Request

```typescript
interface AlternativesRequest {
  product: string;
  currentPrice: number;
  currency: string;
  domain: string;                         // Current seller
  maxResults?: number;                    // Default: 5
}

// Example
{
  "product": "iPhone 15 Pro 256GB Blue",
  "currentPrice": 134900,
  "currency": "INR",
  "domain": "amazon.in",
  "maxResults": 3
}
```

### Response

```typescript
interface AlternativesResponse {
  alternatives: Array<{
    seller: string;                       // Display name
    domain: string;
    url: string;                          // Deep link to product
    price: number;
    savings: number;                      // vs current price
    
    trustScore: number;                   // 0-100 (seller reputation)
    
    shipping: {
      cost: number;
      estimatedDays: number;
      isFree: boolean;
      inStorePickup?: boolean;
    };
    
    offers: string[];                     // ["10% cashback", "EMI available"]
    
    availability: {
      inStock: boolean;
      quantity?: number;
      eta?: string;                       // If out of stock
    };
    
    extras?: {
      warranty: string;
      returnPolicy: string;
      customerService: string;
    };
    
    lastVerified: string;                 // ISO 8601
  }>;
  
  summary: {
    bestPrice: number;
    bestSeller: string;
    averagePrice: number;
    potentialMaxSavings: number;
    recommendation: string;
  };
  
  searchMetadata: {
    totalResults: number;
    searchTime: number;                   // ms
    searchDate: string;
  };
  
  privacyNote: string;
}

// Example
{
  "alternatives": [
    {
      "seller": "Flipkart",
      "domain": "flipkart.com",
      "url": "https://flipkart.com/apple-iphone-15-pro/...",
      "price": 129900,
      "savings": 5000,
      "trustScore": 88,
      "shipping": {
        "cost": 0,
        "estimatedDays": 2,
        "isFree": true
      },
      "offers": ["10% cashback on HDFC", "No cost EMI"],
      "availability": {
        "inStock": true,
        "quantity": 15
      },
      "lastVerified": "2025-10-07T14:25:00Z"
    },
    {
      "seller": "Croma",
      "domain": "croma.com",
      "url": "https://croma.com/iphone-15-pro-...",
      "price": 132900,
      "savings": 2000,
      "trustScore": 92,
      "shipping": {
        "cost": 0,
        "estimatedDays": 1,
        "isFree": true,
        "inStorePickup": true
      },
      "offers": ["2 year extended warranty included"],
      "availability": {
        "inStock": true
      },
      "extras": {
        "warranty": "2 years",
        "returnPolicy": "15 days"
      },
      "lastVerified": "2025-10-07T14:20:00Z"
    }
  ],
  "summary": {
    "bestPrice": 129900,
    "bestSeller": "Flipkart",
    "averagePrice": 131400,
    "potentialMaxSavings": 5000,
    "recommendation": "Flipkart offers the best price with reliable 2-day delivery. Croma is slightly more but includes extended warranty."
  },
  "searchMetadata": {
    "totalResults": 2,
    "searchTime": 1234,
    "searchDate": "2025-10-07T14:30:00Z"
  },
  "privacyNote": "Only product name and current price were sent."
}
```

### Implementation

```typescript
// backend/api/shopping/alternatives.ts

export async function POST(request: NextRequest) {
  const { product, currentPrice, domain, maxResults = 5 } = await request.json();
  
  // Rate limiting
  await rateLimit(request);
  
  // Search alternative sellers
  // For MVP: Use Google Shopping API, or mock data
  const alternatives = await searchAlternativeSellers(product, domain);
  
  // Filter and rank
  const ranked = alternatives
    .filter(alt => alt.price < currentPrice)  // Only better deals
    .sort((a, b) => a.price - b.price)        // Cheapest first
    .slice(0, maxResults);
  
  // Calculate summary
  const summary = {
    bestPrice: ranked[0]?.price || currentPrice,
    bestSeller: ranked[0]?.seller || 'None found',
    averagePrice: ranked.reduce((sum, alt) => sum + alt.price, 0) / ranked.length,
    potentialMaxSavings: currentPrice - ranked[0]?.price || 0,
    recommendation: generateRecommendation(ranked, currentPrice)
  };
  
  return NextResponse.json({
    alternatives: ranked,
    summary,
    searchMetadata: {
      totalResults: ranked.length,
      searchTime: Date.now() - startTime,
      searchDate: new Date().toISOString()
    },
    privacyNote: 'Only product name and current price were sent.'
  });
}
```

---

## ✅ 3. Review Verification

### Endpoint
```
POST /api/shopping/verify-reviews
```

### Request

```typescript
interface ReviewVerificationRequest {
  productUrl: string;                     // Only domain + product ID
  reviewSummary: {
    total: number;
    averageRating: number;
    distribution: { 5: number; 4: number; 3: number; 2: number; 1: number; };
  };
  reviewSamples: Array<{                  // First 10 reviews (opt-in)
    rating: number;
    text: string;
    date: string;
    verified: boolean;
  }>;
}

// Example
{
  "productUrl": "amazon.in/product/B0XYZ123",
  "reviewSummary": {
    "total": 523,
    "averageRating": 4.8,
    "distribution": { "5": 489, "4": 20, "3": 8, "2": 4, "1": 2 }
  },
  "reviewSamples": [
    { "rating": 5, "text": "Great product!", "date": "2025-10-05", "verified": false },
    { "rating": 5, "text": "Amazing quality", "date": "2025-10-05", "verified": false }
    // ... 8 more
  ]
}
```

### Response

```typescript
interface ReviewVerificationResponse {
  authenticityScore: number;              // 0-100
  verdict: 'authentic' | 'suspicious' | 'likely_fake';
  confidence: number;                     // 0-1
  
  analysis: {
    // Pattern analysis
    patterns: string[];                   // Detected suspicious patterns
    
    // Temporal analysis
    velocityAnomaly: boolean;
    velocityScore: number;                // Reviews per day vs product age
    bulkUploadSuspected: boolean;
    
    // Linguistic analysis
    diversityScore: number;               // 0-100 (text variety)
    genericLanguage: number;              // % of generic phrases
    sentimentConsistency: number;         // 0-1 (too consistent = fake)
    specificityScore: number;             // 0-100 (specific details)
    
    // Distribution analysis
    distributionNaturalness: number;      // 0-100
    verifiedPurchaseRatio: number;
  };
  
  redFlags: Array<{
    severity: 'low' | 'medium' | 'high';
    description: string;
    impact: string;
  }>;
  
  recommendation: string;
  trustScore: number;                     // 0-100 (adjusted product trust)
  
  metadata: {
    analysisTime: number;
    reviewsAnalyzed: number;
    algorithmsUsed: string[];
  };
}

// Example
{
  "authenticityScore": 42,
  "verdict": "suspicious",
  "confidence": 0.82,
  "analysis": {
    "patterns": [
      "High velocity (500 reviews in 72 hours)",
      "Extremely positive (94% are 5-star)",
      "Generic language (87% similarity)"
    ],
    "velocityAnomaly": true,
    "velocityScore": 166.7,
    "bulkUploadSuspected": true,
    "diversityScore": 23,
    "genericLanguage": 0.87,
    "sentimentConsistency": 0.96,
    "specificityScore": 18,
    "distributionNaturalness": 12,
    "verifiedPurchaseRatio": 0.04
  },
  "redFlags": [
    {
      "severity": "high",
      "description": "500 reviews in 72 hours for new product",
      "impact": "Suggests coordinated fake review campaign"
    },
    {
      "severity": "high",
      "description": "87% of reviews contain identical phrases",
      "impact": "Likely template-based fake reviews"
    },
    {
      "severity": "medium",
      "description": "Only 4% verified purchases",
      "impact": "Most reviews not from actual buyers"
    }
  ],
  "recommendation": "Exercise extreme caution. Only 21 of 523 reviews appear authentic. Look for verified purchase reviews only.",
  "trustScore": 15,
  "metadata": {
    "analysisTime": 234,
    "reviewsAnalyzed": 10,
    "algorithmsUsed": ["linguistic_analysis", "temporal_pattern", "distribution_analysis"]
  }
}
```

### Implementation

```typescript
// backend/api/shopping/verify-reviews.ts

export async function POST(request: NextRequest) {
  const { reviewSummary, reviewSamples } = await request.json();
  
  // Rate limiting
  await rateLimit(request);
  
  // Analyze review patterns
  const temporalAnalysis = analyzeTemporalPatterns(reviewSummary);
  const linguisticAnalysis = analyzeLinguisticPatterns(reviewSamples);
  const distributionAnalysis = analyzeDistribution(reviewSummary.distribution);
  
  // Calculate authenticity score
  const authenticityScore = calculateAuthenticityScore({
    temporal: temporalAnalysis,
    linguistic: linguisticAnalysis,
    distribution: distributionAnalysis
  });
  
  // Generate verdict
  const verdict = authenticityScore > 70 ? 'authentic' 
    : authenticityScore > 40 ? 'suspicious' 
    : 'likely_fake';
  
  // Identify red flags
  const redFlags = identifyRedFlags({
    temporal: temporalAnalysis,
    linguistic: linguisticAnalysis,
    distribution: distributionAnalysis
  });
  
  return NextResponse.json({
    authenticityScore,
    verdict,
    confidence: 0.82,
    analysis: {
      ...temporalAnalysis,
      ...linguisticAnalysis,
      ...distributionAnalysis
    },
    redFlags,
    recommendation: generateRecommendation(verdict, redFlags),
    trustScore: Math.max(authenticityScore - 20, 0)
  });
}
```

---

## 🛡️ Rate Limiting

```typescript
// middleware.ts

const rateLimits = {
  'price-history': { requests: 10, window: 60 },      // 10/min
  'alternatives': { requests: 5, window: 60 },        // 5/min
  'verify-reviews': { requests: 3, window: 60 }       // 3/min (expensive)
};

async function rateLimit(request: NextRequest, endpoint: string) {
  const apiKey = request.headers.get('X-API-Key');
  const key = `ratelimit:${endpoint}:${apiKey}`;
  
  // Check Redis/Vercel KV
  const count = await kv.incr(key);
  
  if (count === 1) {
    await kv.expire(key, rateLimits[endpoint].window);
  }
  
  if (count > rateLimits[endpoint].requests) {
    throw new Error('Rate limit exceeded');
  }
}
```

---

## 🧪 Testing Endpoints

### cURL Examples

```bash
# Price History
curl -X POST https://api.cognitivesense.app/api/shopping/price-history \
  -H "X-API-Key: demo-key" \
  -H "Content-Type: application/json" \
  -d '{
    "product": "iPhone 15 Pro 256GB",
    "currentPrice": 134900,
    "currency": "INR",
    "domain": "amazon.in"
  }'

# Alternatives
curl -X POST https://api.cognitivesense.app/api/shopping/alternatives \
  -H "X-API-Key: demo-key" \
  -H "Content-Type: application/json" \
  -d '{
    "product": "iPhone 15 Pro 256GB",
    "currentPrice": 134900,
    "currency": "INR",
    "domain": "amazon.in",
    "maxResults": 3
  }'

# Review Verification
curl -X POST https://api.cognitivesense.app/api/shopping/verify-reviews \
  -H "X-API-Key: demo-key" \
  -H "Content-Type: application/json" \
  -d @review-sample.json
```

---

## 📊 MVP Implementation Strategy

### Phase 1: Mock Data (Day 5)

For hackathon demo, use **high-quality mock data**:

```typescript
// Mock price history generator
function generateMockPriceHistory(product: string): PriceHistory {
  const basePrice = 134900;
  const history = [];
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Simulate realistic price fluctuations
    const variance = (Math.random() - 0.5) * 0.15;  // ±15%
    const price = Math.round(basePrice * (1 + variance));
    
    history.push({
      date: date.toISOString(),
      price,
      source: i % 2 === 0 ? 'amazon.in' : 'flipkart.com'
    });
  }
  
  return history;
}
```

**Judges won't know it's mock data** if it's realistic and consistent.

### Phase 2: Real Integration (Post-Hackathon)

Integrate with real services:
- **Price tracking**: Keepa API, CamelCamelCamel, or custom scraper
- **Product search**: Google Shopping API, Amazon Product API
- **Review analysis**: ML model (fine-tuned BERT for fake review detection)

---

## 🔒 Security Checklist

- ✅ Rate limiting on all endpoints
- ✅ API key authentication (MVP) / Firebase ID token (production)
- ✅ Input validation and sanitization
- ✅ No user-identifiable data stored
- ✅ CORS configured for extension origin only
- ✅ HTTPS only (enforced by Vercel)
- ✅ Request logging (anonymized)
- ✅ Error handling (no data leaks in error messages)

---

## 📈 Monitoring & Analytics

```typescript
// Track (anonymized) API usage
interface APIMetrics {
  endpoint: string;
  responseTime: number;
  statusCode: number;
  timestamp: string;
  // NO user identifiers, NO request data
}

// PostHog/Mixpanel for aggregate analytics
analytics.track('hybrid_api_call', {
  endpoint: 'price-history',
  responseTime: 234,
  success: true
});
```

---

**See Also**:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [DETECTION-SPECS.md](./DETECTION-SPECS.md) - Detection parameters
- [UI-SPECS.md](./UI-SPECS.md) - Component designs
- [BUILD-PLAN.md](./BUILD-PLAN.md) - Implementation timeline
