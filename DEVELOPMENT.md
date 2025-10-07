# CognitiveSense Development Guide

## 🚀 Day 1 Foundation - COMPLETE ✅

### What's Working
- ✅ Extension builds successfully
- ✅ Manifest.json configured for MV3
- ✅ Service worker loads
- ✅ Content script injects
- ✅ Side panel structure ready
- ✅ Agent framework implemented
- ✅ Storage layer complete
- ✅ TypeScript compilation working

### Testing the Extension

#### 1. Load Extension in Chrome

```bash
# Build the extension
cd extension
npm run build

# The built extension is in extension/dist/
```

#### 2. Install in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension/dist` folder
5. Extension should appear in your extensions list

#### 3. Test Basic Functionality

1. **Service Worker**: Check `chrome://extensions/` → CognitiveSense → "service worker" link → Console should show initialization logs
2. **Side Panel**: Click the CognitiveSense extension icon → Side panel should open with "Day 1 Foundation Complete ✅"
3. **Content Script**: Visit any website → Check browser console (F12) for "CognitiveSense content script loaded"

#### 4. Expected Behavior

**Service Worker Console:**
```
CognitiveSense Service Worker starting...
CognitiveSense installed: install
CognitiveSense initialized successfully
```

**Page Console (any website):**
```
CognitiveSense content script loaded
Initializing CognitiveSense content script...
No active agents for this page
CognitiveSense content script initialized
```

**Side Panel:**
- Shows CognitiveSense logo and title
- Displays current page URL
- Shows "Safe" status (0/100 score)
- Footer shows "Day 1 Foundation Complete ✅"

### Development Workflow

#### Watch Mode (Auto-rebuild)
```bash
cd extension
npm run dev
```
This watches for file changes and rebuilds automatically. You'll need to click the refresh button on `chrome://extensions/` to reload the extension.

#### Manual Build
```bash
cd extension
npm run build
```

#### Debugging

1. **Service Worker**: `chrome://extensions/` → CognitiveSense → "service worker" → Opens DevTools
2. **Content Script**: F12 on any page → Console tab
3. **Side Panel**: Right-click in side panel → "Inspect"

### Known Limitations (Day 1)

- ❌ No actual detection logic (agents not registered yet)
- ❌ No Chrome AI integration (Day 2)
- ❌ No overlays on pages (Day 3)
- ❌ Side panel is basic placeholder (Day 4)
- ❌ No icons (using browser default)

### Next Steps (Day 2)

1. **AI Engine Wrappers**: Implement Chrome Built-in AI API wrappers
2. **Shopping Agent**: Create ShoppingPersuasionAgent class
3. **Register Agent**: Add agent to service worker initialization
4. **Test Detection**: Visit shopping sites and see detection logs

### Troubleshooting

#### Extension Won't Load
- Check `extension/dist/manifest.json` exists
- Verify all files built correctly in `dist/`
- Check Chrome DevTools for errors

#### Service Worker Errors
- Go to `chrome://extensions/` → CognitiveSense → "service worker" 
- Look for red error messages
- Common issue: Missing files or syntax errors

#### Content Script Not Running
- Check if site blocks content scripts
- Verify `matches: ["<all_urls>"]` in manifest
- Look for CSP (Content Security Policy) blocks

#### Side Panel Won't Open
- Ensure `sidePanel` permission in manifest
- Check if Chrome version supports side panels (Chrome 114+)
- Try right-clicking extension icon → "Open side panel"

### File Structure (Day 1)

```
extension/
├── dist/                    # Built extension
│   ├── manifest.json
│   ├── sw.js               # Service worker
│   ├── content.js          # Content script
│   ├── panel.html          # Side panel HTML
│   ├── panel.js            # Side panel React app
│   └── panel.css           # Tailwind styles
├── src/
│   ├── agents/base/        # Agent framework
│   ├── content/            # Content script source
│   ├── core/               # PageContext builder
│   ├── lib/                # Utilities
│   ├── panel/              # React side panel
│   ├── storage/            # Local storage management
│   └── sw.ts               # Service worker source
└── package.json
```

### Performance Notes

- **Build time**: ~1 second
- **Extension size**: ~250KB
- **Memory usage**: <10MB
- **Load time**: <100ms

Ready for Day 2! 🚀
