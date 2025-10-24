/**
 * ToxicContentDetector - Detects toxic, hateful, and harassing content
 */

import { PageContext, Detection } from '../../base/types';
import { AIEngineManager } from '../../../ai/AIEngineManager';
import { Debug } from '../../../utils/Debug';

export class ToxicContentDetector {
  name = 'ToxicContentDetector';

  async detect(context: PageContext, aiManager: AIEngineManager): Promise<Detection[]> {
    const detections: Detection[] = [];
    
    try {
      Debug.debug('🔍 ToxicContentDetector: Starting detection...');
      
      const pageText = context.content.text;
      const toxicPatterns = this.findToxicPatterns(pageText);
      
      Debug.debug(`📊 Found ${toxicPatterns.length} potential toxic content`);
      
      if (toxicPatterns.length === 0) {
        return detections;
      }

      for (const pattern of toxicPatterns.slice(0, 3)) {
        try {
          const detection = await this.analyzeToxicity(pattern, context, aiManager);
          if (detection) {
            detections.push(detection);
            Debug.success(`✅ ToxicContentDetector: Found toxic content`);
          }
        } catch (error) {
          Debug.warning(`⚠️ Failed to analyze toxicity: ${error}`);
        }
      }

      return detections;
    } catch (error) {
      Debug.error('ToxicContentDetector failed', error);
      return detections;
    }
  }

  private findToxicPatterns(text: string): string[] {
    const patterns: string[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Toxic indicators
      if (/hate|racist|sexist|discriminate|harassment|bully|threat|violence|attack|abuse|toxic|offensive|slur|derogatory|insult/i.test(lowerLine)) {
        patterns.push(line);
      }
    }

    return [...new Set(patterns)].slice(0, 10);
  }

  private async analyzeToxicity(
    content: string,
    context: PageContext,
    aiManager: AIEngineManager
  ): Promise<Detection | null> {
    try {
      Debug.apiCall('Prompt', 'start');
      
      const prompt = `Analyze this social media content for toxic or harmful language:
"${content}"

Rate the toxicity severity (0-10):
- 0-3: Non-toxic
- 4-6: Mildly toxic or offensive
- 7-10: Highly toxic, hateful, or harassing

Categories: hate speech, harassment, threats, discrimination, etc.

Respond with: SCORE: [0-10], CATEGORY: [hate|harassment|threat|discrimination|other]`;

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
        id: `toxic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentKey: 'social_media',
        type: 'toxicity',
        score,
        severity,
        title: `🔴 Toxic Content (${severity.toUpperCase()})`,
        description: `Harmful or offensive content: ${content.substring(0, 100)}...`,
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
      Debug.error('Failed to analyze toxicity', error);
      return null;
    }
  }
}
