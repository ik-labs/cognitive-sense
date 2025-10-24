# CognitiveSense Architecture Diagram

## 🏗️ System Architecture Overview

```mermaid
graph TB
    subgraph "Browser Extension"
        subgraph "Service Worker"
            SW["Service Worker<br/>(sw.ts)"]
            Storage["Chrome Storage API"]
            SW -->|manages| Storage
        end
        
        subgraph "Content Script"
            CS["Content Script<br/>(index.ts)"]
            PB["PageContextBuilder"]
            AR["AgentRegistry"]
            OM["OverlayManager"]
            
            CS -->|builds| PB
            CS -->|uses| AR
            CS -->|renders| OM
        end
        
        subgraph "AI Engine Manager"
            AEM["AIEngineManager"]
            PE["PromptEngine"]
            WE["WriterEngine"]
            TE["TranslatorEngine"]
            SE["SummarizerEngine"]
            
            AEM -->|manages| PE
            AEM -->|manages| WE
            AEM -->|manages| TE
            AEM -->|manages| SE
        end
        
        subgraph "Agent System"
            subgraph "Shopping Agent"
                SA["ShoppingPersuasionAgent"]
                UD["UrgencyDetector"]
                AD["AnchoringDetector"]
                SP["SocialProofDetector"]
                FD["FOMADetector"]
                BD["BundlingDetector"]
                DP["DarkPatternDetector"]
                
                SA -->|contains| UD
                SA -->|contains| AD
                SA -->|contains| SP
                SA -->|contains| FD
                SA -->|contains| BD
                SA -->|contains| DP
            end
            
            subgraph "Social Media Agent"
                SMA["SocialMediaAgent"]
                MD["MisinformationDetector"]
                EMD["EmotionalManipulationDetector"]
                ECD["EchoChamberDetector"]
                FAD["FakeAccountDetector"]
                TCD["ToxicContentDetector"]
                PMD["PoliticalManipulationDetector"]
                
                SMA -->|contains| MD
                SMA -->|contains| EMD
                SMA -->|contains| ECD
                SMA -->|contains| FAD
                SMA -->|contains| TCD
                SMA -->|contains| PMD
            end
            
            AR -->|registers| SA
            AR -->|registers| SMA
        end
        
        subgraph "UI Layer"
            Panel["Panel.tsx<br/>(React)"]
            Badge["Floating Badge"]
            Overlay["Element Overlays"]
            
            OM -->|renders| Badge
            OM -->|renders| Overlay
            Panel -->|displays| Badge
        end
        
        subgraph "Utilities"
            MLM["MultiLanguageManager"]
            Debug["Debug Logger"]
            LSM["LocalStorageManager"]
            
            Panel -->|uses| MLM
            CS -->|uses| Debug
            CS -->|uses| LSM
        end
    end
    
    subgraph "Chrome AI APIs"
        PA["Prompt API"]
        WA["Writer API"]
        TA["Translator API"]
        SA_API["Summarizer API"]
    end
    
    subgraph "Web Page"
        DOM["DOM Content"]
        URL["URL & Metadata"]
    end
    
    PE -->|calls| PA
    WE -->|calls| WA
    TE -->|calls| TA
    SE -->|calls| SA_API
    
    CS -->|analyzes| DOM
    CS -->|reads| URL
    PB -->|extracts| URL
    
    style SW fill:#e1f5ff
    style CS fill:#f3e5f5
    style AEM fill:#fff3e0
    style SA fill:#e8f5e9
    style SMA fill:#fce4ec
    style Panel fill:#f1f8e9
    style PA fill:#ffe0b2
    style WA fill:#ffe0b2
    style TA fill:#ffe0b2
    style SA_API fill:#ffe0b2
```

---

## Data Flow Diagram

```mermaid
graph LR
    subgraph "1. Page Load"
        PL["Page Loads"]
        DOMReady["DOM Ready"]
        PL -->|triggers| DOMReady
    end
    
    subgraph "2. Context Building"
        CB["PageContextBuilder"]
        Extract["Extract URL<br/>Domain<br/>Content<br/>Metadata"]
        CB -->|extracts| Extract
    end
    
    subgraph "3. Agent Selection"
        AS["AgentRegistry"]
        Check["Check Page Type<br/>Shopping vs Social"]
        AS -->|checks| Check
    end
    
    subgraph "4. Detection"
        Agent["Selected Agent"]
        Detectors["Run Detectors<br/>in Parallel"]
        Agent -->|runs| Detectors
    end
    
    subgraph "5. AI Processing"
        Prompt["Prompt API<br/>Detection Logic"]
        Writer["Writer API<br/>User Warnings"]
        Translator["Translator API<br/>Multi-language"]
        Detectors -->|uses| Prompt
        Detectors -->|uses| Writer
        Detectors -->|uses| Translator
    end
    
    subgraph "6. Storage"
        Store["Chrome Storage"]
        Cache["Per-URL Cache"]
        Store -->|saves| Cache
    end
    
    subgraph "7. Rendering"
        Panel["Panel Update"]
        Badge["Badge Count"]
        Overlay["Element Overlays"]
        Panel -->|shows| Badge
        Panel -->|shows| Overlay
    end
    
    DOMReady -->|triggers| CB
    CB -->|passes| AS
    AS -->|selects| Agent
    Prompt -->|returns| Store
    Writer -->|returns| Store
    Translator -->|returns| Store
    Store -->|triggers| Panel
    
    style PL fill:#e3f2fd
    style CB fill:#f3e5f5
    style AS fill:#e8f5e9
    style Agent fill:#fce4ec
    style Prompt fill:#fff3e0
    style Writer fill:#fff3e0
    style Translator fill:#fff3e0
    style Store fill:#f1f8e9
    style Panel fill:#e0f2f1
```

---

## Agent Decision Tree

```mermaid
graph TD
    Start["Page Loads"]
    GetDomain["Get Domain<br/>from URL"]
    
    GetDomain -->|shopping site?| ShopCheck{Amazon<br/>Flipkart<br/>eBay?}
    GetDomain -->|social platform?| SocialCheck{Facebook<br/>Twitter<br/>Instagram?}
    
    ShopCheck -->|YES| ShoppingAgent["🛒 Shopping Agent<br/>6 Detectors"]
    ShoppingAgent -->|Analyze| ShopDetect["Urgency<br/>Anchoring<br/>Social Proof<br/>FOMO<br/>Bundling<br/>Dark Patterns"]
    
    SocialCheck -->|YES| SocialAgent["📱 Social Agent<br/>6 Detectors"]
    SocialAgent -->|Analyze| SocialDetect["Misinformation<br/>Emotional Manipulation<br/>Echo Chamber<br/>Fake Account<br/>Toxicity<br/>Political Manipulation"]
    
    ShopCheck -->|NO| NoAgent["No Agent<br/>Page Not Supported"]
    SocialCheck -->|NO| NoAgent
    
    ShopDetect -->|Results| Panel["Update Panel<br/>with Detections"]
    SocialDetect -->|Results| Panel
    NoAgent -->|Skip| Panel
    
    style ShoppingAgent fill:#e8f5e9
    style SocialAgent fill:#fce4ec
    style ShopDetect fill:#c8e6c9
    style SocialDetect fill:#f8bbd0
    style Panel fill:#e0f2f1
```

---

## Chrome AI APIs Integration

```mermaid
graph TB
    subgraph "Detection Engines"
        Detectors["12 Detectors<br/>(Shopping + Social)"]
    end
    
    subgraph "Chrome AI APIs"
        subgraph "Prompt API"
            PA["Core Detection<br/>Logic & Analysis"]
        end
        
        subgraph "Writer API"
            WA["User-Friendly<br/>Warnings & Tips"]
        end
        
        subgraph "Translator API"
            TA["Multi-Language<br/>Support<br/>8 Languages"]
        end
        
        subgraph "Summarizer API"
            SA["Future<br/>Summarization"]
        end
    end
    
    subgraph "Output"
        Detection["Detection Object"]
        Warning["Warning Text"]
        Tip["Smart Tip"]
        Translated["Translated Content"]
    end
    
    Detectors -->|uses| PA
    Detectors -->|uses| WA
    Detectors -->|uses| TA
    Detectors -->|uses| SA
    
    PA -->|generates| Detection
    WA -->|generates| Warning
    WA -->|generates| Tip
    TA -->|translates| Translated
    
    Detection -->|combines| Output["Final Detection<br/>with AI Analysis"]
    Warning -->|combines| Output
    Tip -->|combines| Output
    Translated -->|combines| Output
    
    style PA fill:#fff9c4
    style WA fill:#fff9c4
    style TA fill:#fff9c4
    style SA fill:#fff9c4
    style Output fill:#e0f2f1
```

---

## Multi-Language Pipeline

```mermaid
graph LR
    subgraph "Detection"
        D["Detector<br/>Generates<br/>Content"]
    end
    
    subgraph "Language Detection"
        LD["MultiLanguageManager"]
        Script["Script Detection"]
        Keyword["Keyword Analysis"]
        
        LD -->|uses| Script
        LD -->|uses| Keyword
    end
    
    subgraph "Translation"
        Translator["Translator API"]
        Title["Translate Title"]
        Desc["Translate Description"]
        Warning["Translate Warning"]
        Tip["Translate Tip"]
        
        Translator -->|translates| Title
        Translator -->|translates| Desc
        Translator -->|translates| Warning
        Translator -->|translates| Tip
    end
    
    subgraph "Storage & Display"
        Store["Store in<br/>localStorage"]
        Panel["Display in<br/>Panel"]
    end
    
    D -->|detects language| LD
    LD -->|language code| Translator
    Title -->|combined| Store
    Desc -->|combined| Store
    Warning -->|combined| Store
    Tip -->|combined| Store
    Store -->|retrieves| Panel
    
    style D fill:#f3e5f5
    style LD fill:#e3f2fd
    style Translator fill:#fff9c4
    style Store fill:#e8f5e9
    style Panel fill:#e0f2f1
```

---

## Scroll Detection Flow - Social Media

```mermaid
graph TD
    Start["Page Loads"]
    Detect["Detect if<br/>Social Media"]
    
    Detect -->|YES| ScrollListener["Enable Scroll<br/>Listener"]
    Detect -->|NO| PageLoadOnly["Page Load<br/>Only"]
    
    ScrollListener -->|User Scrolls| Debounce["Debounce<br/>2 Seconds"]
    Debounce -->|Scroll Stops| ReAnalyze["Re-analyze<br/>Page"]
    ReAnalyze -->|New Content| Detectors["Run Detectors<br/>on New Content"]
    Detectors -->|Results| UpdatePanel["Update Panel<br/>with New Detections"]
    UpdatePanel -->|Loop| ScrollListener
    
    PageLoadOnly -->|Initial Analysis| InitialDetectors["Run Detectors<br/>Once"]
    InitialDetectors -->|Results| InitialPanel["Display Panel"]
    
    style ScrollListener fill:#fce4ec
    style Debounce fill:#f8bbd0
    style ReAnalyze fill:#f8bbd0
    style Detectors fill:#f8bbd0
    style UpdatePanel fill:#e0f2f1
    style PageLoadOnly fill:#e8f5e9
```

---

## Component Hierarchy

```mermaid
graph TB
    App["CognitiveSense<br/>Extension"]
    
    App -->|Service Worker| SW["sw.ts"]
    App -->|Content Script| CS["content/index.ts"]
    App -->|UI Panel| Panel["panel/Panel.tsx"]
    
    CS -->|uses| AR["AgentRegistry"]
    CS -->|uses| AEM["AIEngineManager"]
    CS -->|uses| OM["OverlayManager"]
    CS -->|uses| PB["PageContextBuilder"]
    
    AR -->|manages| SA["ShoppingAgent"]
    AR -->|manages| SMA["SocialMediaAgent"]
    
    SA -->|contains| ShopDet["6 Shopping<br/>Detectors"]
    SMA -->|contains| SocialDet["6 Social<br/>Detectors"]
    
    AEM -->|manages| PE["PromptEngine"]
    AEM -->|manages| WE["WriterEngine"]
    AEM -->|manages| TE["TranslatorEngine"]
    AEM -->|manages| SE["SummarizerEngine"]
    
    Panel -->|uses| MLM["MultiLanguageManager"]
    Panel -->|displays| Badge["Badge"]
    Panel -->|displays| Cards["Detection Cards"]
    
    OM -->|renders| Badge
    OM -->|renders| Overlay["Element Overlays"]
    
    style App fill:#e0f2f1
    style SW fill:#e1f5ff
    style CS fill:#f3e5f5
    style Panel fill:#f1f8e9
    style AR fill:#e8f5e9
    style AEM fill:#fff3e0
    style SA fill:#c8e6c9
    style SMA fill:#f8bbd0
```

---

## Key Architecture Principles

### 1. **Agent-Based Design**
- Modular agents for different page types
- Easy to add new agents (News Bias, Social Pulse)
- Each agent manages its own detectors

### 2. **Separation of Concerns**
- Content Script: Page analysis
- Service Worker: Background tasks
- Panel: UI rendering
- Utilities: Shared functionality

### 3. **Chrome AI API Integration**
- Prompt API: Core detection logic
- Writer API: User-friendly content
- Translator API: Multi-language support
- Summarizer API: Future expansion

### 4. **Performance Optimization**
- Per-URL caching (each tab independent)
- Debounced scroll detection
- Parallel detector execution
- Lazy loading of detectors

### 5. **User Experience**
- Tab-aware panel (correct data per tab)
- Real-time language switching
- Clear visual indicators
- Actionable warnings and tips

---

## Scalability

```mermaid
graph LR
    Current["Current MVP<br/>2 Agents<br/>12 Detectors"]
    
    Phase2["Phase 2<br/>+News Bias Agent<br/>+6 Detectors"]
    Phase3["Phase 3<br/>+Social Pulse Agent<br/>+6 Detectors"]
    Phase4["Phase 4<br/>Global Expansion<br/>50+ Sites"]
    
    Current -->|Add| Phase2
    Phase2 -->|Add| Phase3
    Phase3 -->|Add| Phase4
    
    style Current fill:#e0f2f1
    style Phase2 fill:#e8f5e9
    style Phase3 fill:#fce4ec
    style Phase4 fill:#fff9c4
```

---

## Deployment Architecture

```mermaid
graph TB
    Dev["Development<br/>Local Testing"]
    Build["Build Process<br/>npm run build"]
    Dist["Distribution<br/>dist/ folder"]
    Chrome["Chrome Web Store<br/>Extension Upload"]
    Users["Users<br/>Install Extension"]
    
    Dev -->|commit| Build
    Build -->|generates| Dist
    Dist -->|package| Chrome
    Chrome -->|download| Users
    
    style Dev fill:#e3f2fd
    style Build fill:#f3e5f5
    style Dist fill:#e8f5e9
    style Chrome fill:#fff9c4
    style Users fill:#e0f2f1
```

---

**This architecture is designed for scalability, maintainability, and performance!** 🎉
