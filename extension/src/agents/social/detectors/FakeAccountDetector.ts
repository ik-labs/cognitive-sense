/**
 * FakeAccountDetector - Detects fake accounts and bot behavior
 */

import { PageContext, Detection } from '../../base/types';
import { AIEngineManager } from '../../../ai/AIEngineManager';
import { Debug } from '../../../utils/Debug';

export class FakeAccountDetector {
  name = 'FakeAccountDetector';

  async detect(context: PageContext, aiManager: AIEngineManager): Promise<Detection[]> {
    const detections: Detection[] = [];
    
    try {
      Debug.debug('🔍 FakeAccountDetector: Starting detection...');
      
      const pageText = context.content.text;
      const fakeAccountPatterns = this.findFakeAccountPatterns(pageText);
      
      Debug.debug(`📊 Found ${fakeAccountPatterns.length} potential fake account indicators`);
      
      if (fakeAccountPatterns.length === 0) {
        return detections;
      }

      for (const pattern of fakeAccountPatterns.slice(0, 3)) {
        try {
          const detection = await this.analyzeFakeAccount(pattern, context, aiManager);
          if (detection) {
            detections.push(detection);
            Debug.success(`✅ FakeAccountDetector: Found fake account`);
          }
        } catch (error) {
          Debug.warning(`⚠️ Failed to analyze fake account: ${error}`);
        }
      }

      return detections;
    } catch (error) {
      Debug.error('FakeAccountDetector failed', error);
      return detections;
    }
  }

  private findFakeAccountPatterns(text: string): string[] {
    const patterns: string[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Fake account indicators
      if (/bot|automated|script|generated|spam|follower|engagement|follow back|dm|click|link|verify|confirm|account|profile|username|handle/i.test(lowerLine)) {
        patterns.push(line);
      }
    }

    return [...new Set(patterns)].slice(0, 10);
  }

  private async analyzeFakeAccount(
    content: string,
    context: PageContext,
    aiManager: AIEngineManager
  ): Promise<Detection | null> {
    try {
      Debug.apiCall('Prompt', 'start');
      
      const prompt = `Analyze this social media content for fake account/bot indicators:
"${content}"

Rate the fake account probability (0-10):
- 0-3: Likely genuine account
- 4-6: Suspicious behavior
- 7-10: Likely bot or fake account

Indicators: automated language, spam patterns, engagement bait, etc.

Respond with: SCORE: [0-10], TYPE: [bot|spam|fake|suspicious]`;

      const result = await aiManager.prompt.detect({
        prompt,
        context: `Page: ${context.url.href}`
      });

      Debug.apiCall('Prompt', 'success');

      const scoreMatch = result.text.match(/SCORE:\s*(\d+)/i);
      const typeMatch = result.text.match(/TYPE:\s*(\w+)/i);
      
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;
      const type = typeMatch ? typeMatch[1].toLowerCase() : 'suspicious';

      if (score < 4) return null;

      const severity = score >= 7 ? 'high' : score >= 5 ? 'medium' : 'low';

      return {
        id: `fake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentKey: 'social_media',
        type: 'fake_account',
        score,
        severity,
        title: `🤖 Fake Account Detected (${severity.toUpperCase()})`,
        description: `Suspicious account behavior: ${content.substring(0, 100)}...`,
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
      Debug.error('Failed to analyze fake account', error);
      return null;
    }
  }
}
