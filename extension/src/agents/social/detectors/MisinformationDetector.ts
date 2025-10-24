/**
 * MisinformationDetector - Detects false or misleading information
 */

import { PageContext, Detection } from '../../base/types';
import { AIEngineManager } from '../../../ai/AIEngineManager';
import { Debug } from '../../../utils/Debug';

export class MisinformationDetector {
  name = 'MisinformationDetector';

  async detect(context: PageContext, aiManager: AIEngineManager): Promise<Detection[]> {
    const detections: Detection[] = [];
    
    try {
      Debug.debug('🔍 MisinformationDetector: Starting detection...');
      
      const pageText = context.content.text;
      const misinformationPatterns = this.findMisinformationPatterns(pageText);
      
      Debug.debug(`📊 Found ${misinformationPatterns.length} potential misinformation`);
      
      if (misinformationPatterns.length === 0) {
        return detections;
      }

      for (const pattern of misinformationPatterns.slice(0, 3)) {
        try {
          const detection = await this.analyzeMisinformation(pattern, context, aiManager);
          if (detection) {
            detections.push(detection);
            Debug.success(`✅ MisinformationDetector: Found misinformation`);
          }
        } catch (error) {
          Debug.warning(`⚠️ Failed to analyze misinformation: ${error}`);
        }
      }

      return detections;
    } catch (error) {
      Debug.error('MisinformationDetector failed', error);
      return detections;
    }
  }

  private findMisinformationPatterns(text: string): string[] {
    const patterns: string[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Misinformation indicators
      if (/claim|fact|truth|evidence|study|research|scientist|expert|prove|debunk|false|lie|hoax|conspiracy|theory/i.test(lowerLine)) {
        patterns.push(line);
      }
    }

    return [...new Set(patterns)].slice(0, 10);
  }

  private async analyzeMisinformation(
    content: string,
    context: PageContext,
    aiManager: AIEngineManager
  ): Promise<Detection | null> {
    try {
      Debug.apiCall('Prompt', 'start');
      
      const prompt = `Analyze this social media content for misinformation:
"${content}"

Rate the misinformation severity (0-10):
- 0-3: Likely factual or opinion
- 4-6: Contains some false claims
- 7-10: Clearly false or misleading

Respond with: SCORE: [0-10], CATEGORY: [health|politics|science|other]`;

      const result = await aiManager.prompt.detect({
        prompt,
        context: `Page: ${context.url.href}`
      });

      Debug.apiCall('Prompt', 'success');

      const scoreMatch = result.text.match(/SCORE:\s*(\d+)/i);
      const categoryMatch = result.text.match(/CATEGORY:\s*(\w+)/i);
      
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;
      const category = categoryMatch ? categoryMatch[1].toLowerCase() : 'other';

      if (score < 4) return null;

      const severity = score >= 7 ? 'high' : score >= 5 ? 'medium' : 'low';

      return {
        id: `misinformation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentKey: 'social_media',
        type: 'misinformation',
        score,
        severity,
        title: `🚫 Potential Misinformation (${severity.toUpperCase()})`,
        description: `Possible false or misleading claim: ${content.substring(0, 100)}...`,
        reasoning: result.text,
        details: [
          { label: 'Category', value: category },
          { label: 'Severity', value: severity },
          { label: 'Content', value: content.substring(0, 80) + (content.length > 80 ? '...' : '') }
        ],
        actions: [],
        confidence: 0.8,
        timestamp: new Date(),
        pageUrl: context.url.href
      };
    } catch (error) {
      Debug.error('Failed to analyze misinformation', error);
      return null;
    }
  }
}
