/**
 * ContentGenerator - Uses Writer API to generate user-friendly content
 */

import { AIEngineManager } from './AIEngineManager';
import { Detection } from '../agents/base/types';

export class ContentGenerator {
  private aiManager: AIEngineManager;

  constructor() {
    this.aiManager = AIEngineManager.getInstance();
  }

  /**
   * Generate user-friendly warning for a detection
   */
  async generateUserFriendlyWarning(detection: Detection): Promise<string> {
    try {
      const response = await this.aiManager.writer.write({
        type: 'warning',
        context: `Shopping manipulation tactic: ${detection.type}. Severity: ${detection.severity}. Description: ${detection.description}`,
        tone: 'friendly',
        length: 'short',
        audience: 'general'
      });

      console.log(`✍️ Generated user-friendly warning for ${detection.type}`);
      return response.content;
    } catch (error) {
      console.error('Failed to generate user-friendly warning:', error);
      return this.getFallbackWarning(detection);
    }
  }

  /**
   * Generate educational tip for a detection
   */
  async generateEducationalTip(detection: Detection): Promise<string> {
    try {
      const response = await this.aiManager.writer.write({
        type: 'recommendation',
        context: `Help consumers avoid this manipulation tactic: ${detection.type}. Type: ${detection.type}`,
        tone: 'educational',
        length: 'short',
        audience: 'general'
      });

      console.log(`💡 Generated educational tip for ${detection.type}`);
      return response.content;
    } catch (error) {
      console.error('Failed to generate educational tip:', error);
      return this.getFallbackTip(detection);
    }
  }

  /**
   * Fallback warning if Writer API unavailable
   */
  private getFallbackWarning(detection: Detection): string {
    const warnings: Record<string, string> = {
      urgency: '⏰ This uses time pressure to rush your decision. Take a moment to think!',
      anchoring: '💰 The original price may be inflated. Compare prices elsewhere first.',
      social_proof: '👥 These claims might not be verified. Check independent reviews.',
      fomo: '😰 This creates fear of missing out. Remember, good deals come back!',
      bundling: '📦 Hidden items might be added. Review your cart carefully.',
      dark_pattern: '⚠️ This design is meant to confuse. Read carefully before clicking.'
    };

    return warnings[detection.type] || `⚠️ ${detection.description}`;
  }

  /**
   * Fallback tip if Writer API unavailable
   */
  private getFallbackTip(detection: Detection): string {
    const tips: Record<string, string> = {
      urgency: '💡 Legitimate deals rarely disappear. Take time to compare before buying.',
      anchoring: '💡 Always check price history on Google Shopping or similar tools.',
      social_proof: '💡 Look for verified reviews with photos from real customers.',
      fomo: '💡 Exclusive offers are marketing tactics. Better deals often appear later.',
      bundling: '💡 Always review what\'s in your cart before checkout.',
      dark_pattern: '💡 Read all options carefully. Don\'t assume defaults are best for you.'
    };

    return tips[detection.type] || '💡 Compare options and take your time with purchasing decisions.';
  }
}
