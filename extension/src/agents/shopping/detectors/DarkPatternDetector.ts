/**
 * DarkPatternDetector - Detects deceptive UI/UX dark patterns
 */

import { PageContext, Detection } from '../../base/types';
import { AIEngineManager } from '../../../ai/AIEngineManager';
import { Debug } from '../../../utils/Debug';
import { ShoppingDetector } from '../ShoppingAgent';

export class DarkPatternDetector implements ShoppingDetector {
  name = 'DarkPatternDetector';

  async detect(context: PageContext, aiManager: AIEngineManager): Promise<Detection[]> {
    const detections: Detection[] = [];
    
    try {
      Debug.debug('🔍 DarkPatternDetector: Starting detection...');
      
      const pageText = context.content.text;
      const darkPatterns = this.findDarkPatterns(pageText);
      
      Debug.debug(`📊 Found ${darkPatterns.length} potential dark patterns`);
      
      if (darkPatterns.length === 0) {
        return detections;
      }

      // Analyze each dark pattern
      for (const pattern of darkPatterns.slice(0, 3)) {
        try {
          const detection = await this.analyzeDarkPattern(pattern, context, aiManager);
          if (detection) {
            detections.push(detection);
            Debug.success(`✅ DarkPatternDetector: Found dark pattern`);
          }
        } catch (error) {
          Debug.warning(`⚠️ Failed to analyze dark pattern: ${error}`);
        }
      }

      return detections;
    } catch (error) {
      Debug.error('DarkPatternDetector failed', error);
      return detections;
    }
  }

  private findDarkPatterns(text: string): string[] {
    const patterns: string[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Dark pattern indicators - more aggressive
      if (/unsubscribe|cancel|opt.?out|hidden|trick|confirm|agree|accept|click|continue|proceed|next|skip|close|button|free.*trial|auto.?renewal|subscription|difficult|small.*text|terms|conditions|privacy|scroll|find|locate|bury|obscure|deceptive|confusing|misleading/i.test(lowerLine)) {
        patterns.push(line);
      }
    }

    return [...new Set(patterns)].slice(0, 10);
  }

  private async analyzeDarkPattern(
    content: string,
    context: PageContext,
    aiManager: AIEngineManager
  ): Promise<Detection | null> {
    try {
      Debug.apiCall('Prompt', 'start');
      
      const prompt = `Analyze this shopping content for dark pattern UI/UX deception:
"${content}"

Rate the dark pattern severity (0-10):
- 0-3: Not a dark pattern
- 4-6: Moderate deceptive design
- 7-10: Aggressive dark pattern

Respond with: SCORE: [0-10], TYPE: [hidden_costs|confusing_ui|forced_action|trick_question]`;

      const result = await aiManager.prompt.detect({
        prompt,
        context: `Page: ${context.url.href}`
      });

      Debug.apiCall('Prompt', 'success');

      const scoreMatch = result.text.match(/SCORE:\s*(\d+)/i);
      const typeMatch = result.text.match(/TYPE:\s*(\w+)/i);
      
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;
      const type = typeMatch ? typeMatch[1].toLowerCase() : 'confusing_ui';

      if (score < 4) return null;

      const severity = score >= 7 ? 'high' : score >= 5 ? 'medium' : 'low';

      return {
        id: `dark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentKey: 'shopping_persuasion',
        type: 'dark_pattern',
        score,
        severity,
        title: `⚠️ Dark Pattern Detected (${severity.toUpperCase()})`,
        description: `Deceptive UI/UX pattern detected: ${content.substring(0, 100)}...`,
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
      Debug.error('Failed to analyze dark pattern', error);
      return null;
    }
  }
}
