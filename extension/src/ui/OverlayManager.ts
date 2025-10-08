/**
 * OverlayManager - Manages visual overlays for detected manipulations
 */

import { Detection } from '../agents/base/types';

export class OverlayManager {
  private overlays: Map<string, HTMLElement> = new Map();
  private tooltips: Map<string, HTMLElement> = new Map();
  private floatingBadge: HTMLElement | null = null;

  /**
   * Render all detections on the page
   */
  async render(detections: Detection[]): Promise<void> {
    // Clear existing overlays
    this.clear();

    if (detections.length === 0) {
      return;
    }

    // Create floating summary badge
    this.createFloatingBadge(detections);

    // Highlight detected elements (if they have associated DOM elements)
    for (const detection of detections) {
      this.highlightDetection(detection);
    }

    console.log(`✨ Rendered ${detections.length} visual overlays`);
  }

  /**
   * Create floating badge showing detection count
   */
  private createFloatingBadge(detections: Detection[]): void {
    const badge = document.createElement('div');
    badge.id = 'cognitive-sense-badge';
    badge.className = 'cognitive-sense-floating-badge';
    
    const highCount = detections.filter(d => d.severity === 'high').length;
    const mediumCount = detections.filter(d => d.severity === 'medium').length;
    
    badge.innerHTML = `
      <div class="cs-badge-content">
        <div class="cs-badge-icon">🛡️</div>
        <div class="cs-badge-info">
          <div class="cs-badge-title">CognitiveSense</div>
          <div class="cs-badge-stats">
            ${highCount > 0 ? `<span class="cs-badge-high">${highCount} high</span>` : ''}
            ${mediumCount > 0 ? `<span class="cs-badge-medium">${mediumCount} medium</span>` : ''}
          </div>
        </div>
        <div class="cs-badge-arrow">▼</div>
      </div>
      <div class="cs-badge-panel" style="display: none;">
        ${this.renderBadgePanel(detections)}
      </div>
    `;

    // Toggle panel on click
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      const panel = badge.querySelector('.cs-badge-panel') as HTMLElement;
      if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      }
    });

    // Wire up "View Details" button to open side panel
    setTimeout(() => {
      const viewDetailsBtn = badge.querySelector('#cs-view-details');
      if (viewDetailsBtn) {
        viewDetailsBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
        });
      }
    }, 100);

    document.body.appendChild(badge);
    this.floatingBadge = badge;

    // Inject styles
    this.injectStyles();
  }

  /**
   * Render badge panel content
   */
  private renderBadgePanel(detections: Detection[]): string {
    return `
      <div class="cs-panel-header">
        <h3>Detected Manipulations</h3>
        <p>${detections.length} tactics found</p>
      </div>
      <div class="cs-panel-list">
        ${detections.map(d => this.renderDetectionCard(d)).join('')}
      </div>
      <div class="cs-panel-footer">
        <button class="cs-btn-primary" id="cs-view-details">View Details</button>
      </div>
    `;
  }

  /**
   * Render individual detection card
   */
  private renderDetectionCard(detection: Detection): string {
    const severityColor = {
      high: '#ef4444',
      medium: '#f59e0b',
      low: '#10b981'
    }[detection.severity];

    const severityIcon = {
      high: '🔴',
      medium: '🟡',
      low: '🟢'
    }[detection.severity];

    return `
      <div class="cs-detection-card cs-severity-${detection.severity}">
        <div class="cs-card-header">
          <span class="cs-severity-badge" style="background: ${severityColor}">
            ${severityIcon} ${detection.severity.toUpperCase()}
          </span>
          <span class="cs-confidence">
            ${Math.round((detection.confidence || 0.5) * 100)}% confident
          </span>
        </div>
        <div class="cs-card-title">${detection.title}</div>
        <div class="cs-card-description">${detection.description}</div>
        ${detection.reasoning ? `
          <div class="cs-card-reasoning">
            <strong>AI Analysis:</strong> ${detection.reasoning}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Highlight a detection on the page
   */
  private highlightDetection(detection: Detection): void {
    if (!detection.element) {
      return; // No element to highlight
    }

    const element = detection.element;
    const highlightId = `cs-highlight-${detection.id}`;

    // Check if already highlighted
    if (this.overlays.has(highlightId)) {
      return;
    }

    // Add highlight class and data attribute
    element.classList.add('cs-highlighted-element');
    element.setAttribute('data-cs-detection-id', detection.id);
    element.setAttribute('data-cs-severity', detection.severity);

    // Create pulsing border overlay
    const overlay = document.createElement('div');
    overlay.className = `cs-element-highlight cs-severity-${detection.severity}`;
    overlay.setAttribute('data-detection-id', detection.id);

    // Position overlay over element
    const updatePosition = () => {
      const rect = element.getBoundingClientRect();
      overlay.style.cssText = `
        position: fixed;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        pointer-events: none;
        z-index: 2147483646;
        border-radius: 4px;
        transition: all 0.3s ease;
      `;
    };

    updatePosition();

    // Update position on scroll/resize
    const updateHandler = () => updatePosition();
    window.addEventListener('scroll', updateHandler, { passive: true });
    window.addEventListener('resize', updateHandler, { passive: true });

    // Store cleanup function
    (overlay as any).__cleanup = () => {
      window.removeEventListener('scroll', updateHandler);
      window.removeEventListener('resize', updateHandler);
    };

    document.body.appendChild(overlay);
    this.overlays.set(highlightId, overlay);

    // Add hover tooltip
    this.createHoverTooltip(element, detection);
  }

  /**
   * Create hover tooltip for highlighted element
   */
  private createHoverTooltip(element: HTMLElement, detection: Detection): void {
    const tooltipId = `cs-tooltip-${detection.id}`;
    
    element.addEventListener('mouseenter', () => {
      // Remove existing tooltip
      const existing = document.getElementById(tooltipId);
      if (existing) {
        existing.remove();
      }

      const tooltip = document.createElement('div');
      tooltip.id = tooltipId;
      tooltip.className = 'cs-hover-tooltip';
      tooltip.innerHTML = `
        <div class="cs-tooltip-header">
          <span class="cs-tooltip-severity cs-severity-${detection.severity}">
            ${detection.severity.toUpperCase()}
          </span>
          <span class="cs-tooltip-confidence">
            ${Math.round(detection.confidence * 100)}%
          </span>
        </div>
        <div class="cs-tooltip-title">${detection.title}</div>
        <div class="cs-tooltip-description">${detection.description}</div>
      `;

      // Position tooltip
      const rect = element.getBoundingClientRect();
      tooltip.style.cssText = `
        position: fixed;
        top: ${rect.bottom + 10}px;
        left: ${rect.left}px;
        max-width: 300px;
        z-index: 2147483647;
      `;

      document.body.appendChild(tooltip);
      this.tooltips.set(tooltipId, tooltip);
    });

    element.addEventListener('mouseleave', () => {
      const tooltip = document.getElementById(tooltipId);
      if (tooltip) {
        tooltip.remove();
        this.tooltips.delete(tooltipId);
      }
    });
  }

  /**
   * Clear all overlays
   */
  clear(): void {
    // Remove floating badge
    if (this.floatingBadge) {
      this.floatingBadge.remove();
      this.floatingBadge = null;
    }

    // Remove all overlays and cleanup handlers
    this.overlays.forEach(overlay => {
      if ((overlay as any).__cleanup) {
        (overlay as any).__cleanup();
      }
      overlay.remove();
    });
    this.overlays.clear();

    // Remove all tooltips
    this.tooltips.forEach(tooltip => tooltip.remove());
    this.tooltips.clear();

    // Remove highlight classes from elements
    document.querySelectorAll('.cs-highlighted-element').forEach(el => {
      el.classList.remove('cs-highlighted-element');
      el.removeAttribute('data-cs-detection-id');
      el.removeAttribute('data-cs-severity');
    });
  }

  /**
   * Inject CSS styles for overlays
   */
  private injectStyles(): void {
    // Check if styles already injected
    if (document.getElementById('cognitive-sense-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'cognitive-sense-styles';
    style.textContent = `
      /* Floating Badge */
      .cognitive-sense-floating-badge {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 2147483647;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        cursor: pointer;
        transition: all 0.3s ease;
        max-width: 400px;
      }

      .cognitive-sense-floating-badge:hover {
        box-shadow: 0 6px 30px rgba(0, 0, 0, 0.2);
        transform: translateY(-2px);
      }

      .cs-badge-content {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
      }

      .cs-badge-icon {
        font-size: 24px;
        line-height: 1;
      }

      .cs-badge-info {
        flex: 1;
      }

      .cs-badge-title {
        font-weight: 600;
        font-size: 14px;
        color: #1f2937;
        margin-bottom: 4px;
      }

      .cs-badge-stats {
        display: flex;
        gap: 8px;
        font-size: 12px;
      }

      .cs-badge-high {
        color: #ef4444;
        font-weight: 600;
      }

      .cs-badge-medium {
        color: #f59e0b;
        font-weight: 600;
      }

      .cs-badge-arrow {
        color: #6b7280;
        font-size: 12px;
      }

      /* Badge Panel */
      .cs-badge-panel {
        border-top: 1px solid #e5e7eb;
        max-height: 500px;
        overflow-y: auto;
        background: #f9fafb;
      }

      .cs-panel-header {
        padding: 16px;
        background: white;
        border-bottom: 1px solid #e5e7eb;
      }

      .cs-panel-header h3 {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
      }

      .cs-panel-header p {
        margin: 0;
        font-size: 13px;
        color: #6b7280;
      }

      .cs-panel-list {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      /* Detection Cards */
      .cs-detection-card {
        background: white;
        border-radius: 8px;
        padding: 12px;
        border-left: 4px solid #e5e7eb;
        transition: all 0.2s ease;
      }

      .cs-detection-card:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transform: translateX(-2px);
      }

      .cs-detection-card.cs-severity-high {
        border-left-color: #ef4444;
      }

      .cs-detection-card.cs-severity-medium {
        border-left-color: #f59e0b;
      }

      .cs-detection-card.cs-severity-low {
        border-left-color: #10b981;
      }

      .cs-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .cs-severity-badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 700;
        color: white;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .cs-confidence {
        font-size: 11px;
        color: #6b7280;
        font-weight: 500;
      }

      .cs-card-title {
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 6px;
      }

      .cs-card-description {
        font-size: 13px;
        color: #4b5563;
        line-height: 1.5;
        margin-bottom: 8px;
      }

      .cs-card-reasoning {
        font-size: 12px;
        color: #6b7280;
        background: #f3f4f6;
        padding: 8px;
        border-radius: 4px;
        line-height: 1.4;
      }

      .cs-card-reasoning strong {
        color: #4b5563;
        display: block;
        margin-bottom: 4px;
      }

      /* Panel Footer */
      .cs-panel-footer {
        padding: 12px 16px;
        background: white;
        border-top: 1px solid #e5e7eb;
      }

      .cs-btn-primary {
        width: 100%;
        padding: 10px 16px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s ease;
      }

      .cs-btn-primary:hover {
        background: #2563eb;
      }

      /* Scrollbar styling */
      .cs-badge-panel::-webkit-scrollbar {
        width: 6px;
      }

      .cs-badge-panel::-webkit-scrollbar-track {
        background: #f3f4f6;
      }

      .cs-badge-panel::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 3px;
      }

      .cs-badge-panel::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
      }

      /* Animations */
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .cognitive-sense-floating-badge {
        animation: slideIn 0.3s ease-out;
      }

      /* Mobile responsive */
      @media (max-width: 640px) {
        .cognitive-sense-floating-badge {
          top: 10px;
          right: 10px;
          max-width: calc(100vw - 20px);
        }
      }

      /* Element Highlighting */
      .cs-element-highlight {
        border: 3px solid;
        box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.5);
        animation: csPulse 2s ease-in-out infinite;
      }

      .cs-element-highlight.cs-severity-high {
        border-color: #ef4444;
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2), 0 0 20px rgba(239, 68, 68, 0.3);
      }

      .cs-element-highlight.cs-severity-medium {
        border-color: #f59e0b;
        box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2), 0 0 20px rgba(245, 158, 11, 0.3);
      }

      .cs-element-highlight.cs-severity-low {
        border-color: #10b981;
        box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2), 0 0 20px rgba(16, 185, 129, 0.3);
      }

      @keyframes csPulse {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.7;
          transform: scale(1.02);
        }
      }

      /* Highlighted Element Cursor */
      .cs-highlighted-element {
        cursor: help !important;
        position: relative;
      }

      /* Hover Tooltip */
      .cs-hover-tooltip {
        background: white;
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        padding: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: csTooltipFadeIn 0.2s ease-out;
      }

      @keyframes csTooltipFadeIn {
        from {
          opacity: 0;
          transform: translateY(-5px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .cs-tooltip-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .cs-tooltip-severity {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 700;
        color: white;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .cs-tooltip-severity.cs-severity-high {
        background: #ef4444;
      }

      .cs-tooltip-severity.cs-severity-medium {
        background: #f59e0b;
      }

      .cs-tooltip-severity.cs-severity-low {
        background: #10b981;
      }

      .cs-tooltip-confidence {
        font-size: 11px;
        color: #6b7280;
        font-weight: 500;
      }

      .cs-tooltip-title {
        font-size: 13px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 6px;
      }

      .cs-tooltip-description {
        font-size: 12px;
        color: #4b5563;
        line-height: 1.5;
      }
    `;

    document.head.appendChild(style);
  }
}
