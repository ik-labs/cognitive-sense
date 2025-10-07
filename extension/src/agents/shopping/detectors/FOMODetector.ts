/**
 * FOMODetector - Detects Fear of Missing Out manipulation tactics
 */

import { PageContext, Detection } from '../../base/types';
import { AIEngineManager } from '../../../ai/AIEngineManager';
import { PromptEngine } from '../../../ai/PromptEngine';
import { ShoppingDetector } from '../ShoppingAgent';

interface FOMOData {
  type: 'exclusivity' | 'scarcity' | 'social_pressure' | 'time_sensitive' | 'opportunity_cost';
  text: string;
  intensity: 'low' | 'medium' | 'high';
  triggers: string[];
  element?: HTMLElement;
}

export class FOMODetector implements ShoppingDetector {
  name = 'FOMODetector';

  async detect(context: PageContext, aiManager: AIEngineManager): Promise<Detection[]> {
    const detections: Detection[] = [];
    
    try {
      // Extract FOMO content
      const fomoData = this.extractFOMOData(context);
      
      if (fomoData.length === 0) {
        return detections;
      }

      // Analyze each FOMO tactic
      for (const data of fomoData) {
        const detection = await this.analyzeFOMO(data, context, aiManager);
        if (detection) {
          detections.push(detection);
        }
      }

      return detections;
    } catch (error) {
      console.error('FOMODetector failed:', error);
      return detections;
    }
  }

  private extractFOMOData(context: PageContext): FOMOData[] {
    const data: FOMOData[] = [];
    const pageText = context.content.text;
    const lines = pageText.split('\n').map(line => line.trim()).filter(Boolean);

    for (const line of lines) {
      if (line.length > 400) continue; // Skip very long lines
      
      const _lowerLine = line.toLowerCase();
      
      // Exclusivity patterns
      const exclusivityData = this.extractExclusivityData(line, _lowerLine);
      if (exclusivityData) data.push(exclusivityData);
      
      // Scarcity patterns
      const scarcityData = this.extractScarcityData(line, _lowerLine);
      if (scarcityData) data.push(scarcityData);
      
      // Social pressure patterns
      const socialPressureData = this.extractSocialPressureData(line, _lowerLine);
      if (socialPressureData) data.push(socialPressureData);
      
      // Time-sensitive patterns
      const timeSensitiveData = this.extractTimeSensitiveData(line, _lowerLine);
      if (timeSensitiveData) data.push(timeSensitiveData);
      
      // Opportunity cost patterns
      const opportunityCostData = this.extractOpportunityCostData(line, _lowerLine);
      if (opportunityCostData) data.push(opportunityCostData);
    }

    return data.slice(0, 12); // Limit to prevent overload
  }

  private extractExclusivityData(line: string, _lowerLine: string): FOMOData | null {
    const exclusivityTriggers = [
      { pattern: /exclusive(?:ly)?/i, trigger: 'exclusive', intensity: 'high' as const },
      { pattern: /limited\s*edition/i, trigger: 'limited edition', intensity: 'high' as const },
      { pattern: /members?\s*only/i, trigger: 'members only', intensity: 'high' as const },
      { pattern: /invitation\s*only/i, trigger: 'invitation only', intensity: 'high' as const },
      { pattern: /select\s*(?:customers?|members?)/i, trigger: 'select customers', intensity: 'medium' as const },
      { pattern: /vip\s*(?:access|offer|deal)/i, trigger: 'VIP access', intensity: 'medium' as const },
      { pattern: /premium\s*(?:access|members?)/i, trigger: 'premium access', intensity: 'medium' as const },
      { pattern: /rare\s*(?:opportunity|find|item)/i, trigger: 'rare opportunity', intensity: 'medium' as const },
      { pattern: /special\s*(?:access|invitation|offer)/i, trigger: 'special access', intensity: 'low' as const }
    ];

    for (const { pattern, trigger, intensity } of exclusivityTriggers) {
      if (pattern.test(line)) {
        return {
          type: 'exclusivity',
          text: line,
          intensity,
          triggers: [trigger]
        };
      }
    }

    return null;
  }

  private extractScarcityData(line: string, _lowerLine: string): FOMOData | null {
    const scarcityTriggers = [
      { pattern: /almost\s*(?:gone|sold\s*out|finished)/i, trigger: 'almost gone', intensity: 'high' as const },
      { pattern: /(?:final|last)\s*(?:few|pieces?|items?)/i, trigger: 'final few', intensity: 'high' as const },
      { pattern: /running\s*(?:low|out)/i, trigger: 'running low', intensity: 'medium' as const },
      { pattern: /limited\s*(?:stock|supply|quantity)/i, trigger: 'limited stock', intensity: 'medium' as const },
      { pattern: /while\s*(?:stocks?|supplies?)\s*last/i, trigger: 'while supplies last', intensity: 'medium' as const },
      { pattern: /won'?t\s*last\s*long/i, trigger: 'won\'t last long', intensity: 'medium' as const },
      { pattern: /selling\s*(?:fast|quickly)/i, trigger: 'selling fast', intensity: 'low' as const },
      { pattern: /high\s*demand/i, trigger: 'high demand', intensity: 'low' as const }
    ];

    for (const { pattern, trigger, intensity } of scarcityTriggers) {
      if (pattern.test(line)) {
        return {
          type: 'scarcity',
          text: line,
          intensity,
          triggers: [trigger]
        };
      }
    }

    return null;
  }

  private extractSocialPressureData(line: string, _lowerLine: string): FOMOData | null {
    const socialPressureTriggers = [
      { pattern: /everyone\s*(?:is|wants?|loves?|has)/i, trigger: 'everyone wants', intensity: 'medium' as const },
      { pattern: /don'?t\s*(?:be\s*)?(?:left\s*out|miss\s*out)/i, trigger: 'don\'t be left out', intensity: 'high' as const },
      { pattern: /join\s*(?:thousands?|millions?)\s*of/i, trigger: 'join thousands', intensity: 'medium' as const },
      { pattern: /be\s*(?:part\s*of|among)\s*the\s*(?:first|few)/i, trigger: 'be among the first', intensity: 'medium' as const },
      { pattern: /what\s*are\s*you\s*waiting\s*for/i, trigger: 'what are you waiting for', intensity: 'low' as const },
      { pattern: /others\s*are\s*(?:buying|getting)/i, trigger: 'others are buying', intensity: 'low' as const }
    ];

    for (const { pattern, trigger, intensity } of socialPressureTriggers) {
      if (pattern.test(line)) {
        return {
          type: 'social_pressure',
          text: line,
          intensity,
          triggers: [trigger]
        };
      }
    }

    return null;
  }

  private extractTimeSensitiveData(line: string, _lowerLine: string): FOMOData | null {
    const timeSensitiveTriggers = [
      { pattern: /(?:last|final)\s*chance/i, trigger: 'last chance', intensity: 'high' as const },
      { pattern: /now\s*or\s*never/i, trigger: 'now or never', intensity: 'high' as const },
      { pattern: /(?:act|buy|order)\s*(?:now|today|immediately)/i, trigger: 'act now', intensity: 'medium' as const },
      { pattern: /don'?t\s*(?:wait|delay|hesitate)/i, trigger: 'don\'t wait', intensity: 'medium' as const },
      { pattern: /time\s*is\s*running\s*out/i, trigger: 'time running out', intensity: 'high' as const },
      { pattern: /before\s*it'?s\s*(?:too\s*late|gone)/i, trigger: 'before it\'s too late', intensity: 'high' as const },
      { pattern: /grab\s*(?:it|yours?)\s*(?:now|today)/i, trigger: 'grab it now', intensity: 'low' as const }
    ];

    for (const { pattern, trigger, intensity } of timeSensitiveTriggers) {
      if (pattern.test(line)) {
        return {
          type: 'time_sensitive',
          text: line,
          intensity,
          triggers: [trigger]
        };
      }
    }

    return null;
  }

  private extractOpportunityCostData(line: string, _lowerLine: string): FOMOData | null {
    const opportunityCostTriggers = [
      { pattern: /you'?ll\s*regret\s*(?:missing|not)/i, trigger: 'you\'ll regret', intensity: 'high' as const },
      { pattern: /once\s*in\s*a\s*lifetime/i, trigger: 'once in a lifetime', intensity: 'high' as const },
      { pattern: /never\s*(?:again|see\s*this)/i, trigger: 'never again', intensity: 'high' as const },
      { pattern: /miss\s*(?:out\s*on\s*)?this\s*(?:deal|opportunity)/i, trigger: 'miss this opportunity', intensity: 'medium' as const },
      { pattern: /(?:can'?t|won'?t)\s*find\s*(?:this|better)/i, trigger: 'won\'t find better', intensity: 'medium' as const },
      { pattern: /(?:unique|rare)\s*opportunity/i, trigger: 'unique opportunity', intensity: 'low' as const }
    ];

    for (const { pattern, trigger, intensity } of opportunityCostTriggers) {
      if (pattern.test(line)) {
        return {
          type: 'opportunity_cost',
          text: line,
          intensity,
          triggers: [trigger]
        };
      }
    }

    return null;
  }

  private async analyzeFOMO(
    data: FOMOData,
    context: PageContext,
    aiManager: AIEngineManager
  ): Promise<Detection | null> {
    try {
      // Use AI to analyze the FOMO content
      const prompt = `${PromptEngine.prompts.fomo}\n\n"${data.text}"\n\nType: ${data.type}\nIntensity: ${data.intensity}\nTriggers: ${data.triggers.join(', ')}`;
      
      const aiResult = await aiManager.prompt.detect({
        prompt,
        context: `Page: ${context.url.href}, FOMO Type: ${data.type}`
      });

      // Calculate manipulation score
      const score = this.calculateFOMOScore(data, aiResult.text);

      if (score < 5) return null; // FOMO tactics need higher threshold

      const severity = score >= 8 ? 'high' : score >= 6 ? 'medium' : 'low';

      return {
        id: `fomo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentKey: 'shopping_persuasion',
        type: 'fomo',
        score,
        severity,
        title: this.generateTitle(data, severity),
        description: this.generateDescription(data),
        reasoning: aiResult.reasoning || 'FOMO manipulation analysis',
        details: [
          { label: 'FOMO Type', value: data.type.replace('_', ' ') },
          { label: 'Intensity', value: data.intensity },
          { label: 'Triggers', value: data.triggers.join(', ') },
          { label: 'Content', value: data.text.slice(0, 100) + (data.text.length > 100 ? '...' : '') }
        ],
        actions: [
          {
            label: 'Take a Break',
            variant: 'primary',
            icon: '⏸️',
            onClick: () => this.suggestBreak()
          },
          {
            label: 'Reality Check',
            variant: 'secondary',
            icon: '🤔',
            onClick: () => this.performRealityCheck(data)
          }
        ],
        confidence: aiResult.confidence,
        timestamp: new Date(),
        pageUrl: context.url.href,
        learnMoreUrl: 'https://cognitivesense.app/learn/fomo-tactics'
      };
    } catch (error) {
      console.error('Failed to analyze FOMO:', error);
      return this.fallbackAnalysis(data, context);
    }
  }

  private calculateFOMOScore(data: FOMOData, aiResponse: string): number {
    let score = 0;

    // Base score by type and intensity
    const typeScores = {
      exclusivity: { high: 7, medium: 5, low: 3 },
      scarcity: { high: 8, medium: 6, low: 4 },
      social_pressure: { high: 6, medium: 4, low: 2 },
      time_sensitive: { high: 8, medium: 6, low: 4 },
      opportunity_cost: { high: 9, medium: 7, low: 5 }
    };

    score += typeScores[data.type][data.intensity];

    // Add points for multiple triggers
    score += Math.min(3, data.triggers.length - 1);

    // AI response analysis
    const lowerResponse = aiResponse.toLowerCase();
    if (lowerResponse.includes('manipulation') || lowerResponse.includes('pressure')) {
      score += 2;
    }
    if (lowerResponse.includes('emotional') || lowerResponse.includes('fear')) {
      score += 1;
    }

    // Boost for particularly manipulative phrases
    const manipulativeWords = [
      'regret', 'never again', 'last chance', 'now or never',
      'left out', 'missing out', 'everyone'
    ];
    
    const textLower = data.text.toLowerCase();
    manipulativeWords.forEach(word => {
      if (textLower.includes(word)) score += 0.5;
    });

    return Math.min(10, Math.round(score));
  }

  private generateTitle(data: FOMOData, severity: string): string {
    const typeNames = {
      exclusivity: 'Exclusivity Pressure',
      scarcity: 'Artificial Scarcity',
      social_pressure: 'Social Pressure',
      time_sensitive: 'Time Pressure',
      opportunity_cost: 'Fear Tactics'
    };

    const severityPrefixes = {
      high: '⚠️ High',
      medium: '⚠️ Moderate',
      low: 'Mild'
    };

    const typeName = typeNames[data.type] || 'FOMO Tactics';
    const prefix = severityPrefixes[severity as keyof typeof severityPrefixes] || '';

    return `${prefix} ${typeName}`;
  }

  private generateDescription(data: FOMOData): string {
    const descriptions = {
      exclusivity: 'This content creates artificial exclusivity to make you feel special and pressure you to buy.',
      scarcity: 'Scarcity claims are designed to create urgency and fear of missing out.',
      social_pressure: 'Social pressure tactics make you feel like you need to conform or you\'ll be left out.',
      time_sensitive: 'Time-sensitive language creates artificial urgency to pressure quick decisions.',
      opportunity_cost: 'This content uses fear of regret to pressure you into immediate action.'
    };

    const baseDescription = descriptions[data.type] || 'This content uses FOMO tactics to pressure purchasing decisions.';
    
    return `${baseDescription} Triggers detected: ${data.triggers.join(', ')}.`;
  }

  private fallbackAnalysis(data: FOMOData, context: PageContext): Detection | null {
    // Calculate score based on intensity and type
    let score = 0;
    
    switch (data.intensity) {
      case 'high': score += 6; break;
      case 'medium': score += 4; break;
      case 'low': score += 2; break;
    }

    // Boost for certain types
    if (data.type === 'opportunity_cost') score += 2;
    if (data.type === 'scarcity') score += 1;

    if (score < 5) return null;

    const severity = score >= 8 ? 'high' : score >= 6 ? 'medium' : 'low';

    return {
      id: `fomo_fallback_${Date.now()}`,
      agentKey: 'shopping_persuasion',
      type: 'fomo',
      score: Math.min(10, score),
      severity,
      title: this.generateTitle(data, severity),
      description: this.generateDescription(data),
      reasoning: 'Pattern-based FOMO detection',
      details: [
        { label: 'Type', value: data.type.replace('_', ' ') },
        { label: 'Intensity', value: data.intensity },
        { label: 'Triggers', value: data.triggers.join(', ') }
      ],
      actions: [
        {
          label: 'Take a Break',
          variant: 'primary',
          icon: '⏸️',
          onClick: () => this.suggestBreak()
        }
      ],
      confidence: 0.7,
      timestamp: new Date(),
      pageUrl: context.url.href
    };
  }

  private suggestBreak(): void {
    const messages = [
      '💡 Take a 24-hour cooling-off period before making this purchase.',
      '🧘 Step away from the screen and think: "Do I really need this item?"',
      '⏰ Good deals come regularly - you don\'t need to rush.',
      '🤔 Ask yourself: "Would I buy this without the pressure language?"',
      '💰 Consider if this money could be better spent elsewhere.'
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    alert(`🛡️ CognitiveSense Recommendation:\n\n${randomMessage}\n\nRemember: FOMO tactics are designed to bypass rational thinking. Take time to make thoughtful decisions.`);
  }

  private performRealityCheck(data: FOMOData): void {
    let message = '🤔 Reality Check Questions:\n\n';
    
    switch (data.type) {
      case 'exclusivity':
        message += '• Is this really exclusive, or just marketing?\n• How many "exclusive" offers have you seen?\n• Would this product be valuable without the exclusivity claim?';
        break;
      case 'scarcity':
        message += '• Is the scarcity real or artificial?\n• Have you seen this "limited stock" before?\n• Can you find this product elsewhere?';
        break;
      case 'social_pressure':
        message += '• Do you really need to follow what "everyone" is doing?\n• Is this decision right for YOUR situation?\n• Would your friends pressure you to buy something?';
        break;
      case 'time_sensitive':
        message += '• Is this deadline real or arbitrary?\n• What happens if you wait?\n• Have you seen this "last chance" extended before?';
        break;
      case 'opportunity_cost':
        message += '• Will you really regret not buying this?\n• How many "once in a lifetime" deals have you seen?\n• What are you giving up to buy this?';
        break;
    }
    
    message += '\n\n💡 Remember: Good products sell themselves without pressure tactics.';
    
    alert(message);
  }
}
