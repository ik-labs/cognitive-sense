/**
 * PoliticalManipulationDetector - Detects political bias and propaganda
 */

import { PageContext, Detection } from '../../base/types';
import { AIEngineManager } from '../../../ai/AIEngineManager';
import { Debug } from '../../../utils/Debug';

export class PoliticalManipulationDetector {
  name = 'PoliticalManipulationDetector';

  async detect(context: PageContext, aiManager: AIEngineManager): Promise<Detection[]> {
    const detections: Detection[] = [];
    
    try {
      Debug.debug('🔍 PoliticalManipulationDetector: Starting detection...');
      
      const pageText = context.content.text;
      const politicalPatterns = this.findPoliticalPatterns(pageText);
      
      Debug.debug(`📊 Found ${politicalPatterns.length} potential political manipulation`);
      
      if (politicalPatterns.length === 0) {
        return detections;
      }

      for (const pattern of politicalPatterns.slice(0, 3)) {
        try {
          const detection = await this.analyzePoliticalManipulation(pattern, context, aiManager);
          if (detection) {
            detections.push(detection);
            Debug.success(`✅ PoliticalManipulationDetector: Found political manipulation`);
          }
        } catch (error) {
          Debug.warning(`⚠️ Failed to analyze political manipulation: ${error}`);
        }
      }

      return detections;
    } catch (error) {
      Debug.error('PoliticalManipulationDetector failed', error);
      return detections;
    }
  }

  private findPoliticalPatterns(text: string): string[] {
    const patterns: string[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Political indicators
      if (/democrat|republican|liberal|conservative|left|right|socialist|capitalist|communist|fascist|election|vote|campaign|politician|party|government|policy|law|bill|congress|senate/i.test(lowerLine)) {
        patterns.push(line);
      }
    }

    return [...new Set(patterns)].slice(0, 10);
  }

  private async analyzePoliticalManipulation(
    content: string,
    context: PageContext,
    aiManager: AIEngineManager
  ): Promise<Detection | null> {
    try {
      Debug.apiCall('Prompt', 'start');
      
      const prompt = `Analyze this social media content for political bias or propaganda:
"${content}"

Rate the political manipulation severity (0-10):
- 0-3: Neutral or factual
- 4-6: Moderate political bias
- 7-10: Strong propaganda or manipulation

Identify bias direction and propaganda techniques.

Respond with: SCORE: [0-10], BIAS: [left|right|neutral|unclear]`;

      const result = await aiManager.prompt.detect({
        prompt,
        context: `Page: ${context.url.href}`
      });

      Debug.apiCall('Prompt', 'success');

      const scoreMatch = result.text.match(/SCORE:\s*(\d+)/i);
      const biasMatch = result.text.match(/BIAS:\s*(\w+)/i);
      
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;
      const bias = biasMatch ? biasMatch[1].toLowerCase() : 'unclear';

      if (score < 4) return null;

      const severity = score >= 7 ? 'high' : score >= 5 ? 'medium' : 'low';

      return {
        id: `political_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentKey: 'social_media',
        type: 'political_manipulation',
        score,
        severity,
        title: `🎭 Political Manipulation (${severity.toUpperCase()})`,
        description: `Political bias or propaganda: ${content.substring(0, 100)}...`,
        reasoning: result.text,
        details: [
          { label: 'Bias', value: bias },
          { label: 'Severity', value: severity },
          { label: 'Content', value: content.substring(0, 80) + (content.length > 80 ? '...' : '') }
        ],
        actions: [],
        confidence: 0.8,
        timestamp: new Date(),
        pageUrl: context.url.href
      };
    } catch (error) {
      Debug.error('Failed to analyze political manipulation', error);
      return null;
    }
  }
}
