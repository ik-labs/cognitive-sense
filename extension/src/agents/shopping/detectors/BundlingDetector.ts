/**
 * BundlingDetector - Detects forced bundling and hidden cost tactics
 */

import { PageContext, Detection } from '../../base/types';
import { AIEngineManager } from '../../../ai/AIEngineManager';
import { Debug } from '../../../utils/Debug';
import { ShoppingDetector } from '../ShoppingAgent';

export class BundlingDetector implements ShoppingDetector {
  name = 'BundlingDetector';

  async detect(context: PageContext, aiManager: AIEngineManager): Promise<Detection[]> {
    const detections: Detection[] = [];
    
    try {
      Debug.debug('🔍 BundlingDetector: Starting detection...');
      
      const pageText = context.content.text;
      const bundlingPatterns = this.findBundlingPatterns(pageText);
      
      Debug.debug(`📊 Found ${bundlingPatterns.length} potential bundling tactics`);
      
      if (bundlingPatterns.length === 0) {
        return detections;
      }

      // Analyze each bundling pattern
      for (const pattern of bundlingPatterns.slice(0, 3)) { // Limit to 3
        try {
          const detection = await this.analyzeBundling(pattern, context, aiManager);
          if (detection) {
            detections.push(detection);
            Debug.success(`✅ BundlingDetector: Found ${detection.type}`);
          }
        } catch (error) {
          Debug.warning(`⚠️ Failed to analyze bundling pattern: ${error}`);
        }
      }

      return detections;
    } catch (error) {
      Debug.error('BundlingDetector failed', error);
      return detections;
    }
  }

  private findBundlingPatterns(text: string): string[] {
    const patterns: string[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Forced bundle patterns
      if (/bundle|combo|package|set/.test(lowerLine) && 
          /(?:buy|get|purchase).*(?:together|all)/.test(lowerLine)) {
        patterns.push(line);
        continue;
      }
      
      // Hidden costs patterns
      if (/(?:\+|plus|additional).*(?:shipping|fee|tax|charge|cost)/.test(lowerLine)) {
        patterns.push(line);
        continue;
      }
      
      // Subscription trap patterns
      if (/(?:auto|automatic).*(?:renew|bill|charge|subscription)/.test(lowerLine) ||
          /free.*trial.*then/.test(lowerLine)) {
        patterns.push(line);
        continue;
      }
      
      // Upsell pressure patterns
      if (/(?:add|upgrade|complete).*(?:only|just).*\$/.test(lowerLine) ||
          /(?:frequently|also).*bought.*together/.test(lowerLine)) {
        patterns.push(line);
        continue;
      }
      
      // Add-on manipulation patterns
      if (/(?:protection|warranty|insurance).*(?:plan|coverage)/.test(lowerLine) ||
          /(?:highly|strongly).*recommended/.test(lowerLine)) {
        patterns.push(line);
      }
    }

    return [...new Set(patterns)]; // Remove duplicates
  }

  private async analyzeBundling(
    content: string,
    context: PageContext,
    aiManager: AIEngineManager
  ): Promise<Detection | null> {
    try {
      Debug.apiCall('Prompt', 'start');
      
      const prompt = `Analyze this shopping content for bundling/hidden cost manipulation tactics:
"${content}"

Rate the manipulation severity (0-10):
- 0-3: Not manipulative
- 4-6: Moderate bundling/upsell pressure
- 7-10: Aggressive forced bundling or hidden costs

Respond with: SCORE: [0-10], TYPE: [forced_bundle|hidden_costs|subscription_trap|upsell_pressure|addon_manipulation]`;

      const result = await aiManager.prompt.detect({
        prompt,
        context: `Page: ${context.url.href}`
      });

      Debug.apiCall('Prompt', 'success');

      // Parse score from response
      const scoreMatch = result.text.match(/SCORE:\s*(\d+)/i);
      const typeMatch = result.text.match(/TYPE:\s*(\w+)/i);
      
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;
      const type = typeMatch ? typeMatch[1].toLowerCase() : 'forced_bundle';

      if (score < 4) return null;

      const severity = score >= 7 ? 'high' : score >= 5 ? 'medium' : 'low';

      return {
        id: `bundling_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentKey: 'shopping_persuasion',
        type: 'bundling',
        score,
        severity,
        title: `⚠️ ${this.getTitleForType(type)} (${severity.toUpperCase()})`,
        description: `Potential bundling or hidden cost tactic detected: ${content.substring(0, 100)}...`,
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
      Debug.error('Failed to analyze bundling', error);
      return null;
    }
  }

  private getTitleForType(type: string): string {
    const titles: Record<string, string> = {
      'forced_bundle': 'Forced Bundling',
      'hidden_costs': 'Hidden Costs',
      'subscription_trap': 'Subscription Trap',
      'upsell_pressure': 'Upsell Pressure',
      'addon_manipulation': 'Add-on Manipulation'
    };
    return titles[type] || 'Bundling Tactic';
  }
}

// export class BundlingDetector implements ShoppingDetector {
//   name = 'BundlingDetector';

//   async detect(context: PageContext, aiManager: AIEngineManager): Promise<Detection[]> {
//     const detections: Detection[] = [];
    
//     try {
//       // Extract bundling content
//       const bundlingData = this.extractBundlingData(context);
      
//       if (bundlingData.length === 0) {
//         return detections;
//       }

//       // Analyze each bundling tactic
//       for (const data of bundlingData) {
//         const detection = await this.analyzeBundling(data, context, aiManager);
//         if (detection) {
//           detections.push(detection);
//         }
//       }

//       return detections;
//     } catch (error) {
//       console.error('BundlingDetector failed:', error);
//       return detections;
//     }
//   }

//   private extractBundlingData(context: PageContext): BundlingData[] {
//     const _data: BundlingData[] = [];
//     const pageText = context.content.text;
//     const lines = pageText.split('\n').map(line => line.trim()).filter(Boolean);

//     for (const line of lines) {
//       if (line.length > 500) continue; // Skip very long lines
      
//       const _lowerLine = line.toLowerCase();
      
//       // Forced bundle patterns
//       const forcedBundleData = this.extractForcedBundleData(line, _lowerLine);
//       if (forcedBundleData) data.push(forcedBundleData);
      
//       // Hidden costs patterns
//       const hiddenCostsData = this.extractHiddenCostsData(line, _lowerLine);
//       if (hiddenCostsData) data.push(hiddenCostsData);
      
//       // Subscription trap patterns
//       const subscriptionTrapData = this.extractSubscriptionTrapData(line, _lowerLine);
//       if (subscriptionTrapData) data.push(subscriptionTrapData);
      
//       // Upsell pressure patterns
//       const upsellPressureData = this.extractUpsellPressureData(line, _lowerLine);
//       if (upsellPressureData) data.push(upsellPressureData);
      
//       // Add-on manipulation patterns
//       const addonManipulationData = this.extractAddonManipulationData(line, _lowerLine);
//       if (addonManipulationData) data.push(addonManipulationData);
//     }

//     // Also check form elements for bundling
//     this.extractFromForms().forEach(formData => {
//       data.push(formData);
//     });

//     return data.slice(0, 10); // Limit to prevent overload
//   }

//   private extractForcedBundleData(line: string, _lowerLine: string): BundlingData | null {
//     const bundlePatterns = [
//       /bundle\s*(?:deal|offer|package)/i,
//       /(?:combo|package)\s*(?:deal|offer)/i,
//       /buy\s*(?:together|as\s*a\s*set)/i,
//       /complete\s*(?:set|package|bundle)/i,
//       /(?:must|need\s*to)\s*buy\s*(?:together|all)/i,
//       /cannot\s*(?:buy|purchase)\s*separately/i,
//       /only\s*available\s*(?:as\s*)?(?:bundle|package|set)/i
//     ];

//     for (const pattern of bundlePatterns) {
//       if (pattern.test(line)) {
//         // Try to extract items from the bundle
//         const items = this.extractBundleItems(line);
        
//         return {
//           type: 'forced_bundle',
//           text: line,
//           items
//         };
//       }
//     }

//     return null;
//   }

//   private extractHiddenCostsData(line: string, _lowerLine: string): BundlingData | null {
//     const hiddenCostPatterns = [
//       /(?:\+\s*)?(?:shipping|delivery|handling)\s*(?:fees?|costs?|charges?)/i,
//       /additional\s*(?:fees?|costs?|charges?)/i,
//       /(?:processing|service|convenience)\s*(?:fee|charge)/i,
//       /(?:taxes?|duties)\s*(?:not\s*included|extra|additional)/i,
//       /(?:installation|setup)\s*(?:fee|charge|cost)/i,
//       /(?:membership|subscription)\s*(?:required|fee)/i,
//       /(?:plus|additional)\s*\$[\d,]+/i,
//       /\*\s*(?:shipping|taxes?|fees?)\s*(?:not\s*included|extra)/i
//     ];

//     for (const pattern of hiddenCostPatterns) {
//       if (pattern.test(line)) {
//         // Try to extract cost information
//         const costs = this.extractCostInfo(line);
        
//         return {
//           type: 'hidden_costs',
//           text: line,
//           costs
//         };
//       }
//     }

//     return null;
//   }

//   private extractSubscriptionTrapData(line: string, _lowerLine: string): BundlingData | null {
//     const subscriptionPatterns = [
//       /auto[\s-]?(?:renew|renewal|bill|charge|pay)/i,
//       /(?:automatically|will)\s*(?:renew|bill|charge)/i,
//       /(?:recurring|monthly|yearly)\s*(?:billing|payment|charge)/i,
//       /(?:subscription|membership)\s*(?:auto|automatically)\s*renews?/i,
//       /cancel\s*(?:anytime|before|within)/i,
//       /free\s*trial\s*(?:then|followed\s*by)/i,
//       /(?:continues|bills?)\s*(?:at|for)\s*\$[\d,]+/i,
//       /(?:unless|until)\s*(?:you\s*)?cancel/i
//     ];

//     for (const pattern of subscriptionPatterns) {
//       if (pattern.test(line)) {
//         return {
//           type: 'subscription_trap',
//           text: line
//         };
//       }
//     }

//     return null;
//   }

//   private extractUpsellPressureData(line: string, _lowerLine: string): BundlingData | null {
//     const upsellPatterns = [
//       /(?:upgrade|add)\s*(?:to|for)\s*(?:only|just)\s*\$[\d,]+/i,
//       /(?:why\s*not|also)\s*(?:add|include|get)/i,
//       /(?:customers?\s*who\s*bought\s*this\s*also|frequently\s*bought\s*together)/i,
//       /(?:complete\s*your|don'?t\s*forget)\s*(?:order|purchase)/i,
//       /(?:recommended|suggested)\s*(?:for\s*you|add[\s-]?ons?)/i,
//       /(?:you\s*might\s*also\s*like|similar\s*items)/i,
//       /(?:save\s*more\s*with|better\s*value\s*with)/i
//     ];

//     for (const pattern of upsellPatterns) {
//       if (pattern.test(line)) {
//         return {
//           type: 'upsell_pressure',
//           text: line
//         };
//       }
//     }

//     return null;
//   }

//   private extractAddonManipulationData(line: string, _lowerLine: string): BundlingData | null {
//     const addonPatterns = [
//       /(?:protection|warranty|insurance)\s*(?:plan|coverage)/i,
//       /(?:extended|additional)\s*warranty/i,
//       /(?:highly|strongly)\s*recommended/i,
//       /(?:most\s*customers?|everyone)\s*(?:adds?|gets?|buys?)/i,
//       /(?:essential|must[\s-]?have)\s*(?:add[\s-]?on|accessory)/i,
//       /(?:without\s*this|you\s*need\s*this)/i,
//       /(?:protect\s*your\s*investment|peace\s*of\s*mind)/i
//     ];

//     for (const pattern of addonPatterns) {
//       if (pattern.test(line)) {
//         return {
//           type: 'addon_manipulation',
//           text: line
//         };
//       }
//     }

//     return null;
//   }

//   private extractBundleItems(text: string): string[] {
//     const items: string[] = [];
    
//     // Look for item lists (with +, &, and, etc.)
//     const itemPatterns = [
//       /([^+&,]+)\s*\+\s*([^+&,]+)/g,
//       /([^+&,]+)\s*&\s*([^+&,]+)/g,
//       /([^+&,]+)\s*and\s*([^+&,]+)/g,
//       /([^+&,]+),\s*([^+&,]+)/g
//     ];

//     for (const pattern of itemPatterns) {
//       const matches = [...text.matchAll(pattern)];
//       matches.forEach(match => {
//         items.push(match[1].trim(), match[2].trim());
//       });
//     }

//     return [...new Set(items)].slice(0, 5); // Remove duplicates and limit
//   }

//   private extractCostInfo(text: string): BundlingData['costs'] | undefined {
//     // Try to extract pricing information
//     const priceMatches = [...text.matchAll(/[\$₹€£](\d+(?:,\d{3})*(?:\.\d{2})?)/g)];
    
//     if (priceMatches.length >= 2) {
//       const prices = priceMatches.map(match => ({
//         amount: parseFloat(match[1].replace(/,/g, '')),
//         currency: match[0].charAt(0)
//       }));

//       return {
//         base: prices[0].amount,
//         additional: prices[1].amount,
//         total: prices[0].amount + prices[1].amount,
//         currency: prices[0].currency
//       };
//     }

//     return undefined;
//   }

//   private extractFromForms(): BundlingData[] {
//     const _data: BundlingData[] = [];
    
//     // Check for pre-checked checkboxes (common bundling tactic)
//     const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked') as NodeListOf<HTMLInputElement>;
    
//     checkboxes.forEach(checkbox => {
//       const label = this.findCheckboxLabel(checkbox);
//       if (label) {
//         const labelText = label.textContent || '';
//         const _lowerText = labelText.toLowerCase();
        
//         // Check if it's a bundling-related checkbox
//         if (_lowerText.includes('warranty') || _lowerText.includes('protection') ||
//             _lowerText.includes('insurance') || _lowerText.includes('add') ||
//             _lowerText.includes('upgrade') || _lowerText.includes('subscription')) {
          
//           data.push({
//             type: 'addon_manipulation',
//             text: labelText,
//             element: checkbox
//           });
//         }
//       }
//     });

//     return data;
//   }

//   private findCheckboxLabel(checkbox: HTMLInputElement): HTMLElement | null {
//     // Try to find associated label
//     if (checkbox.id) {
//       const label = document.querySelector(`label[for="${checkbox.id}"]`) as HTMLElement;
//       if (label) return label;
//     }

//     // Check parent elements
//     let parent = checkbox.parentElement;
//     while (parent && parent.tagName !== 'FORM') {
//       if (parent.tagName === 'LABEL') {
//         return parent;
//       }
//       parent = parent.parentElement;
//     }

//     return null;
//   }

//   private async analyzeBundling(
//     _data: BundlingData,
//     context: PageContext,
//     aiManager: AIEngineManager
//   ): Promise<Detection | null> {
//     try {
//       // Use AI to analyze the bundling content
//       const prompt = `${PromptEngine.prompts.bundling}\n\n"${data.text}"\n\nType: ${data.type}${data.items ? `\nItems: ${data.items.join(', ')}` : ''}${data.costs ? `\nCosts: ${JSON.stringify(data.costs)}` : ''}`;
      
//       const aiResult = await aiManager.prompt.detect({
//         prompt,
//         context: `Page: ${context.url.href}, Bundling Type: ${data.type}`
//       });

//       // Calculate manipulation score
//       const score = this.calculateBundlingScore(data, aiResult.text);

//       if (score < 4) return null;

//       const severity = score >= 7 ? 'high' : score >= 5 ? 'medium' : 'low';

//       return {
//         id: `bundling_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//         agentKey: 'shopping_persuasion',
//         type: 'bundling',
//         score,
//         severity,
//         title: this.generateTitle(data, severity),
//         description: this.generateDescription(data),
//         reasoning: aiResult.reasoning || 'Bundling manipulation analysis',
//         details: [
//           { label: 'Bundling Type', value: data.type.replace('_', ' ') },
//           { label: 'Content', value: data.text.slice(0, 100) + (data.text.length > 100 ? '...' : '') },
//           ...(data.items ? [{ label: 'Items', value: data.items.join(', ') }] : []),
//           ...(data.costs ? [{ label: 'Additional Cost', value: `${data.costs.currency}${data.costs.additional}` }] : [])
//         ],
//         actions: [
//           {
//             label: 'Calculate Value',
//             variant: 'primary',
//             icon: '🧮',
//             onClick: () => this.calculateIndividualValue(data)
//           },
//           {
//             label: 'Check Separately',
//             variant: 'secondary',
//             icon: '🔍',
//             onClick: () => this.checkSeparatePricing(data)
//           }
//         ],
//         confidence: aiResult.confidence,
//         timestamp: new Date(),
//         pageUrl: context.url.href,
//         learnMoreUrl: 'https://cognitivesense.app/learn/bundling-tactics'
//       };
//     } catch (error) {
//       console.error('Failed to analyze bundling:', error);
//       return this.fallbackAnalysis(data, context);
//     }
//   }

//   private calculateBundlingScore(_data: BundlingData, aiResponse: string): number {
//     let score = 0;

//     // Base score by type
//     const typeScores = {
//       forced_bundle: 6,
//       hidden_costs: 8,
//       subscription_trap: 9,
//       upsell_pressure: 4,
//       addon_manipulation: 5
//     };

//     score += typeScores[data.type];

//     // Additional scoring factors
//     if (data.items && data.items.length > 3) {
//       score += 1; // Many items in bundle
//     }

//     if (data.costs && data.costs.additional > data.costs.base * 0.3) {
//       score += 2; // High additional costs
//     }

//     // AI response analysis
//     const lowerResponse = aiResponse.toLowerCase();
//     if (lowerResponse.includes('forced') || lowerResponse.includes('manipulation')) {
//       score += 2;
//     }
//     if (lowerResponse.includes('hidden') || lowerResponse.includes('deceptive')) {
//       score += 1;
//     }

//     // Text analysis for manipulative language
//     const textLower = data.text.toLowerCase();
//     const manipulativeWords = [
//       'must', 'required', 'essential', 'recommended', 'everyone',
//       'automatically', 'unless', 'protect', 'peace of mind'
//     ];
    
//     manipulativeWords.forEach(word => {
//       if (textLower.includes(word)) score += 0.5;
//     });

//     return Math.min(10, Math.round(score));
//   }

//   private generateTitle(_data: BundlingData, severity: string): string {
//     const typeNames = {
//       forced_bundle: 'Forced Bundling',
//       hidden_costs: 'Hidden Costs',
//       subscription_trap: 'Subscription Trap',
//       upsell_pressure: 'Upsell Pressure',
//       addon_manipulation: 'Add-on Manipulation'
//     };

//     const severityPrefixes = {
//       high: '⚠️ High Risk',
//       medium: '⚠️ Moderate',
//       low: 'Potential'
//     };

//     const typeName = typeNames[data.type] || 'Bundling Tactics';
//     const prefix = severityPrefixes[severity as keyof typeof severityPrefixes] || '';

//     return `${prefix} ${typeName}`;
//   }

//   private generateDescription(data: BundlingData): string {
//     const descriptions = {
//       forced_bundle: 'You may be forced to buy items together that you could purchase separately.',
//       hidden_costs: 'Additional costs may not be clearly disclosed upfront.',
//       subscription_trap: 'This may automatically charge you recurring fees that are difficult to cancel.',
//       upsell_pressure: 'You\'re being pressured to buy additional items you may not need.',
//       addon_manipulation: 'Add-ons are being presented as essential when they may be optional.'
//     };

//     const baseDescription = descriptions[data.type] || 'Bundling tactics detected that may not be in your best interest.';
    
//     if (data.items && data.items.length > 0) {
//       return `${baseDescription} Items: ${data.items.slice(0, 3).join(', ')}${data.items.length > 3 ? '...' : ''}.`;
//     }
    
//     return baseDescription;
//   }

//   private fallbackAnalysis(_data: BundlingData, context: PageContext): Detection | null {
//     // Simple scoring based on type
//     let score = 0;
    
//     switch (data.type) {
//       case 'subscription_trap': score = 7; break;
//       case 'hidden_costs': score = 6; break;
//       case 'forced_bundle': score = 5; break;
//       case 'addon_manipulation': score = 4; break;
//       case 'upsell_pressure': score = 3; break;
//     }

//     if (score < 4) return null;

//     const severity = score >= 7 ? 'high' : score >= 5 ? 'medium' : 'low';

//     return {
//       id: `bundling_fallback_${Date.now()}`,
//       agentKey: 'shopping_persuasion',
//       type: 'bundling',
//       score,
//       severity,
//       title: this.generateTitle(data, severity),
//       description: this.generateDescription(data),
//       reasoning: 'Pattern-based bundling detection',
//       details: [
//         { label: 'Type', value: data.type.replace('_', ' ') }
//       ],
//       actions: [
//         {
//           label: 'Review Carefully',
//           variant: 'primary',
//           icon: '🔍',
//           onClick: () => this.reviewBundling(data)
//         }
//       ],
//       confidence: 0.6,
//       timestamp: new Date(),
//       pageUrl: context.url.href
//     };
//   }

//   private calculateIndividualValue(_data: BundlingData): void {
//     let message = '💡 Bundle Value Analysis:\n\n';
    
//     if (data.items && data.items.length > 0) {
//       message += `Items in bundle: ${data.items.join(', ')}\n\n`;
//       message += '✅ To check value:\n';
//       message += '• Research each item\'s individual price\n';
//       message += '• Add up individual prices\n';
//       message += '• Compare to bundle price\n';
//       message += '• Consider if you need ALL items\n\n';
//     }
    
//     if (data.costs) {
//       message += `Base cost: ${data.costs.currency}${data.costs.base}\n`;
//       message += `Additional: ${data.costs.currency}${data.costs.additional}\n`;
//       message += `Total: ${data.costs.currency}${data.costs.total}\n\n`;
//     }
    
//     message += '🤔 Ask yourself:\n';
//     message += '• Do I need everything in this bundle?\n';
//     message += '• Can I buy items separately for less?\n';
//     message += '• Are the "extras" actually valuable to me?';
    
//     alert(message);
//   }

//   private checkSeparatePricing(_data: BundlingData): void {
//     alert(`💡 Check Separate Pricing:\n\n• Search for each item individually\n• Compare prices on different sites\n• Look for the same items sold separately\n• Calculate if buying separately is cheaper\n• Consider if you actually need all items\n\n🔍 Tip: Many "bundles" cost more than buying items separately!`);
//   }

//   private reviewBundling(_data: BundlingData): void {
//     let message = '🔍 Bundling Review Checklist:\n\n';
    
//     switch (data.type) {
//       case 'forced_bundle':
//         message += '• Can you buy items separately?\n• Do you need all bundled items?\n• Is the bundle price fair?';
//         break;
//       case 'hidden_costs':
//         message += '• What are the total costs?\n• Are all fees disclosed upfront?\n• Can you avoid additional charges?';
//         break;
//       case 'subscription_trap':
//         message += '• How easy is it to cancel?\n• What are the recurring charges?\n• Do you really need a subscription?';
//         break;
//       case 'upsell_pressure':
//         message += '• Do you need the additional items?\n• Are you being pressured to decide now?\n• Can you add items later if needed?';
//         break;
//       case 'addon_manipulation':
//         message += '• Are add-ons truly essential?\n• What happens if you don\'t buy them?\n• Can you get similar protection elsewhere?';
//         break;
//     }
    
//     alert(message);
//   }
// }
