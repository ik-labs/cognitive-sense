/**
 * EmotionalManipulationDetector - Detects emotional manipulation tactics
 */

import { PageContext, Detection } from '../../base/types';
import { AIEngineManager } from '../../../ai/AIEngineManager';
import { Debug } from '../../../utils/Debug';

export class EmotionalManipulationDetector {
  name = 'EmotionalManipulationDetector';

  async detect(context: PageContext, aiManager: AIEngineManager): Promise<Detection[]> {
    const detections: Detection[] = [];
    
    try {
      Debug.debug('🔍 EmotionalManipulationDetector: Starting detection...');
      
      const pageText = context.content.text;
      const emotionalPatterns = this.findEmotionalPatterns(pageText);
      
      Debug.debug(`📊 Found ${emotionalPatterns.length} potential emotional manipulation`);
      
      if (emotionalPatterns.length === 0) {
        return detections;
      }

      for (const pattern of emotionalPatterns.slice(0, 3)) {
        try {
          const detection = await this.analyzeEmotionalManipulation(pattern, context, aiManager);
          if (detection) {
            detections.push(detection);
            Debug.success(`✅ EmotionalManipulationDetector: Found emotional manipulation`);
          }
        } catch (error) {
          Debug.warning(`⚠️ Failed to analyze emotional manipulation: ${error}`);
        }
      }

      return detections;
    } catch (error) {
      Debug.error('EmotionalManipulationDetector failed', error);
      return detections;
    }
  }

  private findEmotionalPatterns(text: string): string[] {
    const patterns: string[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Emotional trigger words
      if (/angry|outrage|furious|disgusting|shocking|horrifying|terrifying|devastating|heartbreaking|unbelievable|disgusted|hate|love|fear|panic|crisis|emergency|urgent/i.test(lowerLine)) {
        patterns.push(line);
      }
    }

    return [...new Set(patterns)].slice(0, 10);
  }

  private async analyzeEmotionalManipulation(
    content: string,
    context: PageContext,
    aiManager: AIEngineManager
  ): Promise<Detection | null> {
    try {
      Debug.apiCall('Prompt', 'start');
      
      const prompt = `Analyze this social media content for emotional manipulation:
"${content}"

Rate the emotional manipulation severity (0-10):
- 0-3: Neutral or factual
- 4-6: Moderate emotional language
- 7-10: Heavy emotional manipulation

Identify emotions: fear, anger, outrage, sadness, etc.

Respond with: SCORE: [0-10], EMOTIONS: [list]`;

      const result = await aiManager.prompt.detect({
        prompt,
        context: `Page: ${context.url.href}`
      });

      Debug.apiCall('Prompt', 'success');

      const scoreMatch = result.text.match(/SCORE:\s*(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;

      if (score < 4) return null;

      const severity = score >= 7 ? 'high' : score >= 5 ? 'medium' : 'low';

      return {
        id: `emotional_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentKey: 'social_media',
        type: 'emotional_manipulation',
        score,
        severity,
        title: `😠 Emotional Manipulation (${severity.toUpperCase()})`,
        description: `Content using emotional triggers: ${content.substring(0, 100)}...`,
        reasoning: result.text,
        details: [
          { label: 'Severity', value: severity },
          { label: 'Content', value: content.substring(0, 80) + (content.length > 80 ? '...' : '') }
        ],
        actions: [],
        confidence: 0.8,
        timestamp: new Date(),
        pageUrl: context.url.href
      };
    } catch (error) {
      Debug.error('Failed to analyze emotional manipulation', error);
      return null;
    }
  }
}
