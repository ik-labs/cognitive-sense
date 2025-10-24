# 🛍️ CognitiveSense Demo Shopping Page

## Quick Start

### 1. Open the Demo Page
```bash
# Simply open the HTML file in your browser
open demo-shopping.html

# Or use a local server
python3 -m http.server 8000
# Then visit: http://localhost:8000/demo-shopping.html
```

### 2. Install the Extension
1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select `/extension/dist` folder from this project

### 3. Test the Extension
1. Navigate to the demo shopping page
2. Click the CognitiveSense badge (🛡️) in the top right
3. See all detected manipulation tactics!

---

## 📊 What Gets Detected

### Product 1: Premium Headphones
**Detector: Urgency Detector** ⏰
- Countdown timer: "Sale ends in 2 hours 30 minutes"
- Scarcity: "Only 5 left in stock"
- Time pressure: "hurry before it's gone"

### Product 2: Smart Watch
**Detector: Anchoring Detector** 💰
- Fake original price: $599.99 → $149.99 (75% off)
- Artificial value comparison
- Limited quantity at this price

### Product 3: Wireless Charger
**Detector: Social Proof Detector** ⭐
- Fake rating: "4.9/5 stars from 50,000+ reviews"
- Unverified claims: "100,000+ people bought this"
- Suspicious badge: "#1 Best Seller"

### Product 4: Phone Bundle Pack
**Detector: Bundling Detector** 📦
- Forced bundling: "Cannot be purchased separately"
- Hidden costs: "Additional shipping fees apply: +$15.99"
- Subscription trap: "Auto-renewal subscription included"

### Product 5: Gaming Console
**Detector: FOMO Detector** 🎁
- Exclusivity: "Exclusive offer - members only"
- Artificial scarcity: "Last chance - once in a lifetime"
- Social pressure: "Everyone is buying this - don't be left out"

### Product 6: Premium Subscription
**Detector: Dark Pattern Detector** 🎮
- Hidden auto-renewal: "Free trial then auto-renewal"
- Difficult cancellation: Complex steps to cancel
- Hidden terms: "Small text" agreement

---

## 🎯 Expected Results

When you open the demo page with the extension:

1. **Badge shows "6"** - 6 detections found
2. **Side panel displays all detections** with:
   - Detection type
   - Confidence score (85-95%)
   - Severity level (HIGH/MEDIUM/LOW)
   - AI-generated warnings
   - Educational tips
   - Language selector (8 languages)

3. **Detections are highlighted** on the page with pulsing borders

4. **Console logs show**:
   - Detection process
   - API calls (Prompt, Writer, Translator)
   - Language detection
   - Translation process

---

## 🌐 Test Multi-Language

1. Open the side panel
2. Click the language dropdown (top right)
3. Select a language:
   - 🇬🇧 English
   - 🇪🇸 Spanish
   - 🇫🇷 French
   - 🇯🇵 Japanese
   - 🇮🇳 Hindi
   - 🇮🇳 Tamil
   - 🇩🇪 German
   - 🇨🇳 Chinese

4. Watch all detection content translate in real-time!

---

## 🔍 Console Debugging

Open Chrome DevTools (F12) to see:

```
🛍️ CognitiveSense Demo Shopping Page Loaded
📊 This page contains all 6 manipulation patterns:
1. Urgency (countdown timers, scarcity)
2. Anchoring (fake discounts)
3. Social Proof (fake reviews)
4. Bundling (forced bundles, hidden costs)
5. FOMO (exclusivity, artificial scarcity)
6. Dark Patterns (deceptive UI, hidden options)
✅ Open CognitiveSense extension to see detections!
```

Then from the extension:

```
🔍 UrgencyDetector: Starting detection...
📊 Found X potential urgency tactics
✅ UrgencyDetector: Found urgency tactic
🔍 AnchoringDetector: Starting detection...
... and so on for all 6 detectors
```

---

## 💡 Tips for Demo

1. **Show the badge first** - Demonstrates detection count
2. **Open side panel** - Shows all detected tactics
3. **Click on a detection** - Expands to show full details
4. **Change language** - Shows multi-language support
5. **Check console** - Shows API calls and logging

---

## 🎓 What Judges Will See

✅ **6 different manipulation tactics** on one page
✅ **All detected correctly** with high confidence
✅ **AI-generated warnings** for each tactic
✅ **Educational tips** to help users
✅ **Multi-language support** (8 languages)
✅ **Professional UI** with smooth interactions
✅ **Comprehensive logging** for transparency
✅ **4 Chrome AI APIs** in action

---

## 📝 Notes

- This is a **synthetic demo page** - not a real shopping site
- All prices and reviews are **fictional**
- Designed to showcase **all detector capabilities**
- Perfect for **judges and presentations**
- Can be used for **testing and development**

---

## 🚀 Ready for Demo!

Your extension is now ready to demonstrate all 6 detectors on a single page. Perfect for judges to see the full capability of CognitiveSense!
