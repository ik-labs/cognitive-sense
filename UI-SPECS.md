# CognitiveSense — UI Specifications

## 🎨 Design System

### Color Palette

```typescript
const colors = {
  // Risk levels
  safe: { bg: '#ecfdf5', border: '#10b981', text: '#065f46' },
  caution: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  warning: { bg: '#fed7aa', border: '#f97316', text: '#9a3412' },
  danger: { bg: '#fecaca', border: '#ef4444', text: '#991b1b' },
  
  // UI elements
  primary: '#3b82f6',
  secondary: '#6b7280',
  background: '#ffffff',
  surface: '#f9fafb',
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    tertiary: '#9ca3af'
  }
};
```

### Typography

```typescript
const typography = {
  heading: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 600,
    sizes: {
      h1: '24px',
      h2: '20px',
      h3: '16px'
    }
  },
  body: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 400,
    sizes: {
      large: '16px',
      medium: '14px',
      small: '12px'
    }
  }
};
```

### Spacing

```typescript
const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px'
};
```

---

## 🎯 Content Overlays

### Tooltip Component

**When**: User hovers over or detection triggers
**Purpose**: Show detailed manipulation info with actions

```tsx
// content/components/Tooltip.tsx

interface TooltipProps {
  detection: Detection;
  severity: 'low' | 'medium' | 'high';
  anchor: HTMLElement;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ detection, severity, anchor, position }: TooltipProps) {
  const colors = getSeverityColors(severity);
  
  return (
    <div className="cs-tooltip" style={{
      position: 'fixed',
      background: colors.bg,
      border: `2px solid ${colors.border}`,
      borderRadius: '8px',
      padding: '12px',
      maxWidth: '320px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 10000
    }}>
      {/* Header */}
      <div className="cs-tooltip-header">
        <span className="cs-icon">{detection.icon}</span>
        <span className="cs-title">{detection.title}</span>
        <span className="cs-score">{detection.score}/10</span>
      </div>
      
      {/* Description */}
      <p className="cs-description">{detection.description}</p>
      
      {/* Details */}
      {detection.details.length > 0 && (
        <div className="cs-details">
          {detection.details.map(detail => (
            <div key={detail.label} className="cs-detail-row">
              <span className="cs-detail-label">{detail.icon} {detail.label}:</span>
              <span className="cs-detail-value">{detail.value}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Actions */}
      <div className="cs-actions">
        {detection.actions.map(action => (
          <button
            key={action.label}
            className={`cs-button cs-button-${action.variant}`}
            onClick={action.onClick}
          >
            {action.icon} {action.label}
          </button>
        ))}
      </div>
      
      {/* Footer */}
      {detection.learnMoreUrl && (
        <a href={detection.learnMoreUrl} target="_blank" className="cs-learn-more">
          Learn more about this tactic →
        </a>
      )}
    </div>
  );
}
```

**Example: Urgency Tooltip**

```tsx
<Tooltip
  detection={{
    icon: '⚠️',
    title: 'Urgency Detected',
    score: 8,
    severity: 'high',
    description: 'This countdown timer is likely artificial. We\'ve seen the same "3 hours left" message for 48 hours.',
    details: [
      { icon: '⏰', label: 'Tactic', value: 'Countdown Timer + Scarcity' },
      { icon: '🎯', label: 'Confidence', value: '85%' },
      { icon: '📅', label: 'First Seen', value: '2 days ago' }
    ],
    actions: [
      { label: 'Wait 24 Hours', variant: 'primary', icon: '⏳', onClick: () => {} },
      { label: 'Find Alternatives', variant: 'secondary', icon: '🔍', onClick: () => {} },
      { label: 'Dismiss', variant: 'ghost', onClick: () => {} }
    ],
    learnMoreUrl: 'https://cognitivesense.dev/docs/urgency'
  }}
  severity="high"
  anchor={element}
  position="bottom"
/>
```

---

### Badge Component

**When**: Inline, always visible indicator
**Purpose**: Quick visual cue without interaction

```tsx
// content/components/Badge.tsx

interface BadgeProps {
  type: 'urgency' | 'price' | 'reviews' | 'fomo';
  score: number;
  compact?: boolean;
}

export function Badge({ type, score, compact = false }: BadgeProps) {
  const severity = score > 7 ? 'high' : score > 4 ? 'medium' : 'low';
  const colors = getSeverityColors(severity);
  const icon = getTypeIcon(type);
  
  if (compact) {
    return (
      <span className="cs-badge-compact" style={{
        display: 'inline-block',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: '4px',
        padding: '2px 6px',
        fontSize: '11px',
        fontWeight: 600,
        color: colors.text
      }}>
        {icon} {score}
      </span>
    );
  }
  
  return (
    <div className="cs-badge" style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: '6px',
      padding: '4px 10px'
    }}>
      <span className="cs-badge-icon">{icon}</span>
      <span className="cs-badge-text">{getTypeLabel(type)}</span>
      <span className="cs-badge-score" style={{ 
        fontWeight: 600, 
        color: colors.text 
      }}>
        {score}/10
      </span>
    </div>
  );
}
```

---

### Highlight Component

**When**: Emphasize specific text on page
**Purpose**: Show exact manipulative text

```tsx
// content/components/Highlight.tsx

interface HighlightProps {
  element: HTMLElement;
  severity: 'low' | 'medium' | 'high';
  tooltip?: string;
}

export function Highlight({ element, severity, tooltip }: HighlightProps) {
  const colors = getSeverityColors(severity);
  
  // Wrap element content
  element.style.background = colors.bg;
  element.style.border = `2px solid ${colors.border}`;
  element.style.borderRadius = '4px';
  element.style.padding = '2px 4px';
  
  if (tooltip) {
    element.setAttribute('title', tooltip);
  }
  
  // Add indicator icon
  const indicator = document.createElement('span');
  indicator.textContent = '⚠️';
  indicator.style.marginLeft = '4px';
  indicator.style.fontSize = '12px';
  element.appendChild(indicator);
}

// Usage
highlighter.highlight(
  document.querySelector('.countdown-timer'),
  'high',
  'This countdown resets every hour'
);
```

---

## 📱 Side Panel UI

### Main Panel Layout

```tsx
// panel/Panel.tsx

export function Panel() {
  const [activeTab, setActiveTab] = useState('overview');
  const detections = useDetections();
  const settings = useSettings();
  
  return (
    <div className="cs-panel">
      {/* Header */}
      <header className="cs-panel-header">
        <div className="cs-logo">
          <span className="cs-logo-icon">🛡️</span>
          <h1>CognitiveSense</h1>
        </div>
        <button className="cs-settings-icon">⚙️</button>
      </header>
      
      {/* Current Page Analysis */}
      <section className="cs-current-page">
        <PageHeader url={detections.currentUrl} />
        <ScoreCard overall={detections.overallScore} />
        <BreakdownChart breakdown={detections.breakdown} />
        <TacticsList tactics={detections.detectedTactics} />
        <RecommendationCard recommendations={detections.recommendations} />
      </section>
      
      {/* Tabs */}
      <nav className="cs-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          📝 History
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
        <button 
          className={activeTab === 'privacy' ? 'active' : ''}
          onClick={() => setActiveTab('privacy')}
        >
          🔒 Privacy
        </button>
      </nav>
      
      {/* Tab Content */}
      <div className="cs-tab-content">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'settings' && <SettingsTab />}
        {activeTab === 'privacy' && <PrivacyTab />}
      </div>
    </div>
  );
}
```

---

### Score Card Component

```tsx
// panel/components/ScoreCard.tsx

interface ScoreCardProps {
  overall: number;                        // 0-100
}

export function ScoreCard({ overall }: ScoreCardProps) {
  const risk = overall > 70 ? 'danger' : overall > 50 ? 'warning' : overall > 30 ? 'caution' : 'safe';
  const colors = getRiskColors(risk);
  const label = getRiskLabel(risk);
  
  return (
    <div className="cs-score-card" style={{
      background: colors.bg,
      border: `2px solid ${colors.border}`,
      borderRadius: '12px',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div className="cs-score-value" style={{
        fontSize: '48px',
        fontWeight: 700,
        color: colors.text
      }}>
        {overall}
        <span style={{ fontSize: '24px', opacity: 0.7 }}>/100</span>
      </div>
      
      <div className="cs-score-label" style={{
        fontSize: '16px',
        fontWeight: 600,
        color: colors.text,
        marginTop: '8px'
      }}>
        {label}
      </div>
      
      <div className="cs-score-description" style={{
        fontSize: '14px',
        color: colors.text,
        opacity: 0.8,
        marginTop: '4px'
      }}>
        {getDescription(risk)}
      </div>
    </div>
  );
}

function getDescription(risk: string): string {
  const descriptions = {
    safe: 'This page appears trustworthy',
    caution: 'Some manipulation detected',
    warning: 'Multiple manipulation tactics found',
    danger: 'HIGH RISK - Proceed with extreme caution'
  };
  return descriptions[risk];
}
```

---

### Breakdown Chart Component

```tsx
// panel/components/BreakdownChart.tsx

interface BreakdownChartProps {
  breakdown: {
    urgency: number;
    anchoring: number;
    socialProof: number;
    fomo: number;
    bundling: number;
    darkPatterns: number;
  };
}

export function BreakdownChart({ breakdown }: BreakdownChartProps) {
  const categories = [
    { key: 'urgency', label: 'Urgency', icon: '⚡' },
    { key: 'anchoring', label: 'Anchoring', icon: '⚓' },
    { key: 'socialProof', label: 'Social Proof', icon: '👥' },
    { key: 'fomo', label: 'FOMO', icon: '😱' },
    { key: 'bundling', label: 'Bundling', icon: '📦' },
    { key: 'darkPatterns', label: 'Dark Patterns', icon: '🎭' }
  ];
  
  return (
    <div className="cs-breakdown-chart">
      <h3 className="cs-breakdown-title">Detection Breakdown</h3>
      
      <div className="cs-breakdown-bars">
        {categories.map(cat => {
          const score = breakdown[cat.key];
          const severity = score > 7 ? 'high' : score > 4 ? 'medium' : 'low';
          const colors = getSeverityColors(severity);
          
          return (
            <div key={cat.key} className="cs-breakdown-row">
              <div className="cs-breakdown-label">
                <span className="cs-breakdown-icon">{cat.icon}</span>
                <span className="cs-breakdown-name">{cat.label}</span>
              </div>
              
              <div className="cs-breakdown-bar-container">
                <div 
                  className="cs-breakdown-bar"
                  style={{
                    width: `${score * 10}%`,
                    background: colors.border,
                    height: '24px',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              
              <div className="cs-breakdown-score" style={{ 
                fontWeight: 600, 
                color: colors.text 
              }}>
                {score}/10
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

### Tactics List Component

```tsx
// panel/components/TacticsList.tsx

interface TacticsListProps {
  tactics: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    action?: () => void;
  }>;
}

export function TacticsList({ tactics }: TacticsListProps) {
  if (tactics.length === 0) {
    return (
      <div className="cs-tactics-empty">
        <span className="cs-tactics-empty-icon">✅</span>
        <p>No manipulation tactics detected on this page</p>
      </div>
    );
  }
  
  return (
    <div className="cs-tactics-list">
      <h3 className="cs-tactics-title">Detected Tactics ({tactics.length})</h3>
      
      <div className="cs-tactics-items">
        {tactics.map((tactic, index) => {
          const colors = getSeverityColors(tactic.severity);
          const icon = getSeverityIcon(tactic.severity);
          
          return (
            <div 
              key={index} 
              className="cs-tactic-item"
              style={{
                borderLeft: `3px solid ${colors.border}`,
                padding: '12px',
                marginBottom: '8px',
                background: colors.bg,
                borderRadius: '6px'
              }}
            >
              <div className="cs-tactic-header">
                <span className="cs-tactic-icon">{icon}</span>
                <span className="cs-tactic-type">{tactic.type}</span>
              </div>
              <p className="cs-tactic-description">{tactic.description}</p>
              
              {tactic.action && (
                <button 
                  className="cs-tactic-action"
                  onClick={tactic.action}
                >
                  Learn More →
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

### Recommendation Card Component

```tsx
// panel/components/RecommendationCard.tsx

interface RecommendationCardProps {
  recommendations: {
    primary: string;
    actions: Array<{
      label: string;
      icon: string;
      onClick: () => void;
      isHybrid?: boolean;
    }>;
  };
}

export function RecommendationCard({ recommendations }: RecommendationCardProps) {
  return (
    <div className="cs-recommendations">
      <h3 className="cs-recommendations-title">💡 Recommendations</h3>
      
      <p className="cs-recommendations-text">{recommendations.primary}</p>
      
      <div className="cs-recommendations-actions">
        {recommendations.actions.map(action => (
          <button
            key={action.label}
            className="cs-recommendation-button"
            onClick={action.onClick}
          >
            {action.icon} {action.label}
            {action.isHybrid && (
              <span className="cs-hybrid-badge" title="Uses cloud data">
                ☁️
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

### History Tab

```tsx
// panel/components/HistoryTab.tsx

export function HistoryTab() {
  const history = useDetectionHistory(50);  // Last 50
  const stats = useHistoryStats();
  
  return (
    <div className="cs-history-tab">
      {/* Summary Stats */}
      <div className="cs-history-stats">
        <StatCard 
          icon="🌐"
          label="Sites Analyzed"
          value={stats.sitesAnalyzed}
        />
        <StatCard 
          icon="⚠️"
          label="Manipulations Caught"
          value={stats.manipulationsCaught}
        />
        <StatCard 
          icon="💰"
          label="Potential Savings"
          value={`₹${stats.potentialSavings.toLocaleString()}`}
        />
      </div>
      
      {/* Timeline */}
      <div className="cs-history-timeline">
        <h3>Recent Activity</h3>
        
        {history.map(entry => (
          <div key={entry.id} className="cs-history-entry">
            <div className="cs-history-time">
              {formatRelativeTime(entry.timestamp)}
            </div>
            <div className="cs-history-content">
              <div className="cs-history-domain">
                <FaviconIcon domain={entry.domain} />
                <span>{entry.domain}</span>
              </div>
              <div className="cs-history-score">
                Score: {entry.score}/100
              </div>
              <div className="cs-history-tactics">
                {entry.tactics.map(tactic => (
                  <Badge key={tactic} type={tactic} compact />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Export */}
      <button className="cs-export-button" onClick={exportHistory}>
        📥 Export History (JSON)
      </button>
    </div>
  );
}
```

---

### Settings Tab

```tsx
// panel/components/SettingsTab.tsx

export function SettingsTab() {
  const [settings, setSettings] = useSettings();
  
  return (
    <div className="cs-settings-tab">
      {/* Agent Controls */}
      <section className="cs-settings-section">
        <h3>Agent Controls</h3>
        
        <Toggle
          label="🛍️ Shopping Persuasion"
          description="Detect manipulation in product pages"
          checked={settings.agents.shopping}
          onChange={(v) => updateAgent('shopping', v)}
        />
        
        <Slider
          label="Detection Sensitivity"
          description="Higher = more detections, may have false positives"
          value={settings.sensitivity}
          min={0}
          max={1}
          step={0.1}
          onChange={(v) => updateSensitivity(v)}
        />
      </section>
      
      {/* Domain Settings */}
      <section className="cs-settings-section">
        <h3>Per-Domain Settings</h3>
        
        <DomainList 
          domains={settings.domains}
          onEdit={(domain) => editDomainSettings(domain)}
        />
        
        <button className="cs-add-domain" onClick={addDomain}>
          + Add Domain Rule
        </button>
      </section>
      
      {/* Hybrid Features */}
      <section className="cs-settings-section">
        <h3>Cloud Features</h3>
        
        <Toggle
          label="Enable Hybrid Assist"
          description="Allow opt-in cloud calls for price history, alternatives, etc."
          checked={settings.hybridEnabled}
          onChange={(v) => updateHybrid(v)}
        />
        
        <div className="cs-privacy-notice">
          🔒 Only minimal data (product name, price) is sent. No browsing history.
        </div>
      </section>
      
      {/* Reset */}
      <button className="cs-reset-button" onClick={resetToDefaults}>
        Reset to Defaults
      </button>
    </div>
  );
}
```

---

### Privacy Tab

```tsx
// panel/components/PrivacyTab.tsx

export function PrivacyTab() {
  const privacyStats = usePrivacyStats();
  
  return (
    <div className="cs-privacy-tab">
      <h2>Your Privacy</h2>
      
      <div className="cs-privacy-summary">
        <p>
          CognitiveSense is <strong>privacy-first</strong>. All detection happens 
          locally on your device using Chrome's Built-in AI.
        </p>
      </div>
      
      {/* What's Stored */}
      <section className="cs-privacy-section">
        <h3>📦 What's Stored Locally</h3>
        <ul>
          <li>Detection history (last 100 events)</li>
          <li>Your settings and preferences</li>
          <li>Behavioral learning data</li>
        </ul>
        <div className="cs-storage-size">
          Current usage: {privacyStats.storageSize}
        </div>
      </section>
      
      {/* What's NOT Stored */}
      <section className="cs-privacy-section">
        <h3>🚫 What's Never Stored</h3>
        <ul>
          <li>Full page content or HTML</li>
          <li>Your browsing history</li>
          <li>Personal information</li>
          <li>Cookies or session data</li>
        </ul>
      </section>
      
      {/* Hybrid Calls */}
      <section className="cs-privacy-section">
        <h3>☁️ Hybrid Cloud Calls</h3>
        <p>
          When you click "Find Alternatives" or "Check Price History", we send:
        </p>
        <ul>
          <li>Product name only</li>
          <li>Current price (number)</li>
          <li>Domain (e.g., "amazon.in")</li>
        </ul>
        <p><strong>Never sent:</strong> Full URLs, cookies, or browsing data</p>
        
        <div className="cs-hybrid-stats">
          <div>Hybrid calls today: {privacyStats.hybridCallsToday}</div>
          <button onClick={viewHybridHistory}>View History</button>
        </div>
      </section>
      
      {/* Data Controls */}
      <section className="cs-privacy-section">
        <h3>🛠️ Your Data, Your Control</h3>
        
        <button className="cs-export-button" onClick={exportAllData}>
          📥 Export All Data
        </button>
        
        <button className="cs-delete-button" onClick={deleteAllData}>
          🗑️ Delete All Data
        </button>
        
        <div className="cs-local-mode">
          <Toggle
            label="100% Local Mode"
            description="Disable all cloud features. Extension works completely offline."
            checked={privacyStats.localOnlyMode}
            onChange={toggleLocalOnlyMode}
          />
        </div>
      </section>
      
      {/* Links */}
      <div className="cs-privacy-links">
        <a href="https://cognitivesense.dev/privacy" target="_blank">
          Privacy Policy →
        </a>
        <a href="https://cognitivesense.dev/data" target="_blank">
          Data Practices →
        </a>
      </div>
    </div>
  );
}
```

---

## 🎭 Animations & Transitions

### Overlay Entrance

```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.cs-tooltip {
  animation: slideIn 0.2s ease-out;
}
```

### Score Counter Animation

```tsx
function AnimatedScore({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const increment = value / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span>{displayValue}</span>;
}
```

---

## 📐 Responsive Design

All components work in:
- Side panel (400px width)
- Content overlays (variable width)
- Mobile (future consideration)

```css
.cs-panel {
  width: 100%;
  max-width: 400px;
  min-height: 100vh;
  overflow-y: auto;
}

.cs-tooltip {
  max-width: min(90vw, 320px);
}
```

---

## 🧪 Component Testing

```tsx
// panel/__tests__/ScoreCard.test.tsx

describe('ScoreCard', () => {
  it('shows danger state for high scores', () => {
    const { getByText } = render(<ScoreCard overall={85} />);
    expect(getByText('HIGH RISK')).toBeInTheDocument();
  });
  
  it('shows safe state for low scores', () => {
    const { getByText } = render(<ScoreCard overall={15} />);
    expect(getByText(/trustworthy/i)).toBeInTheDocument();
  });
});
```

---

**See Also**:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [DETECTION-SPECS.md](./DETECTION-SPECS.md) - Detection parameters
- [HYBRID-API.md](./HYBRID-API.md) - Backend endpoints
- [BUILD-PLAN.md](./BUILD-PLAN.md) - Implementation timeline
