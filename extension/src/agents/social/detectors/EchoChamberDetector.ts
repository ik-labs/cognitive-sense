/**
 * EchoChamberDetector - Detects filter bubbles and echo chambers
 */

import { PageContext, Detection } from '../../base/types';
import { AIEngineManager } from '../../../ai/AIEngineManager';
import { Debug } from '../../../utils/Debug';

export class EchoChamberDetector {
  name = 'EchoChamberDetector';

  async detect(context: PageContext, aiManager: AIEngineManager): Promise<Detection[]> {
    const detections: Detection[] = [];
    
    try {
      Debug.debug('🔍 EchoChamberDetector: Starting detection...');
      
      const pageText = context.content.text;
      const echoChamberPatterns = this.findEchoChamberPatterns(pageText);
      
      Debug.debug(`📊 Found ${echoChamberPatterns.length} potential echo chamber indicators`);
      
      if (echoChamberPatterns.length === 0) {
        return detections;
      }

      for (const pattern of echoChamberPatterns.slice(0, 3)) {
        try {
          const detection = await this.analyzeEchoChamber(pattern, context, aiManager);
          if (detection) {
            detections.push(detection);
            Debug.success(`✅ EchoChamberDetector: Found echo chamber`);
          }
        } catch (error) {
          Debug.warning(`⚠️ Failed to analyze echo chamber: ${error}`);
        }
      }

      return detections;
    } catch (error) {
      Debug.error('EchoChamberDetector failed', error);
      return detections;
    }
  }

  private findEchoChamberPatterns(text: string): string[] {
    const patterns: string[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Echo chamber indicators
      if (/agree|disagree|opinion|believe|think|support|oppose|for|against|side|us|them|we|they|group|community|tribe|movement/i.test(lowerLine)) {
        patterns.push(line);
      }
    }

    return [...new Set(patterns)].slice(0, 10);
  }

  private async analyzeEchoChamber(
    content: string,
    context: PageContext,
    aiManager: AIEngineManager
  ): Promise<Detection | null> {
    try {
      Debug.apiCall('Prompt', 'start');
      
      const prompt = `Analyze this social media content for echo chamber/filter bubble indicators:
"${content}"

Rate the echo chamber severity (0-10):
- 0-3: Diverse perspectives
- 4-6: Some viewpoint clustering
- 7-10: Strong echo chamber indicators

Respond with: SCORE: [0-10], PERSPECTIVE: [diverse|clustered|polarized]`;

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
        id: `echo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentKey: 'social_media',
        type: 'echo_chamber',
        score,
        severity,
        title: `🔄 Echo Chamber Detected (${severity.toUpperCase()})`,
        description: `Limited perspective diversity: ${content.substring(0, 100)}...`,
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
      Debug.error('Failed to analyze echo chamber', error);
      return null;
    }
  }
}
