/**
 * FOMODetector - Detects Fear of Missing Out manipulation tactics
 */

import { PageContext, Detection } from '../../base/types';
import { AIEngineManager } from '../../../ai/AIEngineManager';
import { Debug } from '../../../utils/Debug';
import { ShoppingDetector } from '../ShoppingAgent';

export class FOMODetector implements ShoppingDetector {
  name = 'FOMODetector';

  async detect(context: PageContext, aiManager: AIEngineManager): Promise<Detection[]> {
    const detections: Detection[] = [];
    
    try {
      Debug.debug('🔍 FOMODetector: Starting detection...');
      
      const pageText = context.content.text;
      const fomoPatterns = this.findFOMOPatterns(pageText);
      
      Debug.debug(`📊 Found ${fomoPatterns.length} potential FOMO tactics`);
      
      if (fomoPatterns.length === 0) {
        return detections;
      }

      // Analyze each FOMO pattern
      for (const pattern of fomoPatterns.slice(0, 3)) {
        try {
          const detection = await this.analyzeFOMO(pattern, context, aiManager);
          if (detection) {
            detections.push(detection);
            Debug.success(`✅ FOMODetector: Found FOMO tactic`);
          }
        } catch (error) {
          Debug.warning(`⚠️ Failed to analyze FOMO pattern: ${error}`);
        }
      }

      return detections;
    } catch (error) {
      Debug.error('FOMODetector failed', error);
      return detections;
    }
  }

  private findFOMOPatterns(text: string): string[] {
    const patterns: string[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    for (const line of lines) {
      if (line.length > 400) continue;
      
      const lowerLine = line.toLowerCase();
      
      // FOMO patterns: only, last, limited, exclusive, don't miss, act now
      if (/(?:only|just|last|final|limited|exclusive|don'?t miss|act now|while\s*(?:stocks?|supplies?)\s*last|everyone|join\s*(?:thousands?|millions?))/i.test(lowerLine)) {
        patterns.push(line);
      }
    }

    return [...new Set(patterns)].slice(0, 10);
  }

  private async analyzeFOMO(
    content: string,
    context: PageContext,
    aiManager: AIEngineManager
  ): Promise<Detection | null> {
    try {
      Debug.apiCall('Prompt', 'start');
      
      const prompt = `Analyze this shopping content for FOMO (Fear of Missing Out) manipulation tactics:
"${content}"

Rate the FOMO manipulation severity (0-10):
- 0-3: Not FOMO
- 4-6: Moderate FOMO pressure
- 7-10: Aggressive FOMO tactics

Respond with: SCORE: [0-10], TYPE: [exclusivity|scarcity|social_pressure|time_sensitive]`;

      const result = await aiManager.prompt.detect({
        prompt,
        context: `Page: ${context.url.href}`
      });

      Debug.apiCall('Prompt', 'success');

      const scoreMatch = result.text.match(/SCORE:\s*(\d+)/i);
      const typeMatch = result.text.match(/TYPE:\s*(\w+)/i);
      
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;
      const type = typeMatch ? typeMatch[1].toLowerCase() : 'exclusivity';

      if (score < 4) return null;

      const severity = score >= 7 ? 'high' : score >= 5 ? 'medium' : 'low';

      return {
        id: `fomo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentKey: 'shopping_persuasion',
        type: 'fomo',
        score,
        severity,
        title: `⚠️ FOMO Tactic Detected (${severity.toUpperCase()})`,
        description: `Fear of Missing Out detected: ${content.substring(0, 100)}...`,
        reasoning: result.text,
        details: [
          { label: 'Type', value: type },
          { label: 'Severity', value: severity },
          { label: 'Content', value: content.substring(0, 80) + (content.length > 80 ? '...' : '') }
        ],
        actions: [],
        confidence: 0.8,
        timestamp: new Date(),
        pageUrl: context.url.href
      };
    } catch (error) {
      Debug.error('Failed to analyze FOMO', error);
      return null;
    }
  }
}
