// /**
//  * DarkPatternDetector - Detects UI manipulation and deceptive interface design
//  */

// import { PageContext, Detection } from '../../base/types';
// import { AIEngineManager } from '../../../ai/AIEngineManager';
// import { PromptEngine } from '../../../ai/PromptEngine';
// import { ShoppingDetector } from '../ShoppingAgent';

// interface DarkPatternData {
//   type: 'misleading_buttons' | 'hidden_options' | 'forced_continuity' | 'bait_switch' | 'confirm_shaming' | 'roach_motel';
//   text: string;
//   element?: HTMLElement;
//   severity: 'low' | 'medium' | 'high';
//   context?: string;
// }

// export class DarkPatternDetector implements ShoppingDetector {
//   name = 'DarkPatternDetector';

//   async detect(context: PageContext, aiManager: AIEngineManager): Promise<Detection[]> {
//     const detections: Detection[] = [];
    
//     try {
//       // Extract dark pattern content
//       const darkPatternData = this.extractDarkPatternData(context);
      
//       if (darkPatternData.length === 0) {
//         return detections;
//       }

//       // Analyze each dark pattern
//       for (const data of darkPatternData) {
//         const detection = await this.analyzeDarkPattern(data, context, aiManager);
//         if (detection) {
//           detections.push(detection);
//         }
//       }

//       return detections;
//     } catch (error) {
//       console.error('DarkPatternDetector failed:', error);
//       return detections;
//     }
//   }

//   private extractDarkPatternData(context: PageContext): DarkPatternData[] {
//     const data: DarkPatternData[] = [];
    
//     // Check buttons and form elements
//     this.checkButtons().forEach(buttonData => data.push(buttonData));
//     this.checkForms().forEach(formData => data.push(formData));
//     this.checkLinks().forEach(linkData => data.push(linkData));
//     this.checkText(context).forEach(textData => data.push(textData));
    
//     return data.slice(0, 8); // Limit to prevent overload
//   }

//   private checkButtons(): DarkPatternData[] {
//     const data: DarkPatternData[] = [];
//     const buttons = document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]') as NodeListOf<HTMLElement>;
    
//     buttons.forEach(button => {
//       const text = (button.textContent || '').trim();
//       const _lowerText = text.toLowerCase();
      
//       if (!text || text.length > 100) return;
      
//       // Misleading button patterns
//       if (this.isMisleadingButton(text, _lowerText, button)) {
//         data.push({
//           type: 'misleading_buttons',
//           text,
//           element: button,
//           severity: this.calculateButtonSeverity(text, button),
//           context: 'button'
//         });
//       }
      
//       // Confirm shaming patterns
//       if (this.isConfirmShaming(text, _lowerText)) {
//         data.push({
//           type: 'confirm_shaming',
//           text,
//           element: button,
//           severity: 'medium',
//           context: 'button'
//         });
//       }
//     });
    
//     return data;
//   }

//   private checkForms(): DarkPatternData[] {
//     const data: DarkPatternData[] = [];
//     const forms = document.querySelectorAll('form') as NodeListOf<HTMLFormElement>;
    
//     forms.forEach(form => {
//       // Check for pre-checked boxes (forced continuity)
//       const preCheckedBoxes = form.querySelectorAll('input[type="checkbox"]:checked, input[type="radio"]:checked') as NodeListOf<HTMLInputElement>;
      
//       preCheckedBoxes.forEach(checkbox => {
//         const label = this.findInputLabel(checkbox);
//         if (label) {
//           const labelText = label.textContent || '';
//           const _lowerText = labelText.toLowerCase();
          
//           // Check if it's a subscription or recurring charge
//           if (_lowerText.includes('newsletter') || _lowerText.includes('email') ||
//               _lowerText.includes('subscription') || _lowerText.includes('auto') ||
//               _lowerText.includes('recurring') || _lowerText.includes('monthly')) {
            
//             data.push({
//               type: 'forced_continuity',
//               text: labelText,
//               element: checkbox,
//               severity: 'high',
//               context: 'pre-checked option'
//             });
//           }
//         }
//       });
      
//       // Check for hidden required fields
//       const hiddenRequiredFields = form.querySelectorAll('input[required][type="hidden"], input[required][style*="display: none"]') as NodeListOf<HTMLInputElement>;
      
//       if (hiddenRequiredFields.length > 0) {
//         data.push({
//           type: 'hidden_options',
//           text: 'Hidden required fields detected',
//           element: form,
//           severity: 'high',
//           context: 'form validation'
//         });
//       }
//     });
    
//     return data;
//   }

//   private checkLinks(): DarkPatternData[] {
//     const data: DarkPatternData[] = [];
//     const links = document.querySelectorAll('a[href]') as NodeListOf<HTMLAnchorElement>;
    
//     links.forEach(link => {
//       const text = (link.textContent || '').trim();
//       const href = link.href;
//       const _lowerText = text.toLowerCase();
      
//       if (!text || text.length > 150) return;
      
//       // Bait and switch patterns
//       if (this.isBaitAndSwitch(text, href, _lowerText)) {
//         data.push({
//           type: 'bait_switch',
//           text,
//           element: link,
//           severity: 'medium',
//           context: `link to ${new URL(href).hostname}`
//         });
//       }
      
//       // Roach motel patterns (hard to cancel/unsubscribe)
//       if (this.isRoachMotel(text, _lowerText)) {
//         data.push({
//           type: 'roach_motel',
//           text,
//           element: link,
//           severity: 'low',
//           context: 'cancellation/unsubscribe'
//         });
//       }
//     });
    
//     return data;
//   }

//   private checkText(context: PageContext): DarkPatternData[] {
//     const data: DarkPatternData[] = [];
//     const pageText = context.content.text;
//     const lines = pageText.split('\n').map(line => line.trim()).filter(Boolean);
    
//     for (const line of lines) {
//       if (line.length > 200) continue;
      
//       const _lowerLine = line.toLowerCase();
      
//       // Bait and switch in text
//       if (this.isBaitAndSwitchText(line, _lowerLine)) {
//         data.push({
//           type: 'bait_switch',
//           text: line,
//           severity: 'medium',
//           context: 'promotional text'
//         });
//       }
//     }
    
//     return data;
//   }

//   private isMisleadingButton(text: string, __lowerText: string, element: HTMLElement): boolean {
//     // Check for misleading button text
//     const misleadingPatterns = [
//       // Buttons that don't do what they say
//       /^(?:no|cancel|skip|maybe\s*later)$/i,
//       // Buttons with confusing double negatives
//       /don'?t\s*not\s*want/i,
//       // Buttons that trick users into agreeing
//       /^(?:ok|continue|next)$/i // Only if in suspicious context
//     ];
    
//     // Check button styling for deception
//     const style = window.getComputedStyle(element);
//     const isStyleDeceptive = this.isDeceptiveButtonStyle(style, _lowerText);
    
//     // Check for misleading patterns
//     const hasPatternMatch = misleadingPatterns.some(pattern => pattern.test(text));
    
//     // Check context - is this button in a modal or popup?
//     const isInModal = this.isInModal(element);
    
//     return hasPatternMatch || isStyleDeceptive || (isInModal && this.isAmbiguousButton(_lowerText));
//   }

//   private isDeceptiveButtonStyle(style: CSSStyleDeclaration, text: string): boolean {
//     // Check if "No" or "Cancel" buttons are styled to look less prominent
//     if (text.includes('no') || text.includes('cancel') || text.includes('skip')) {
//       const fontSize = parseFloat(style.fontSize || '16');
//       const opacity = parseFloat(style.opacity || '1');
      
//       // Suspiciously small or faded
//       if (fontSize < 12 || opacity < 0.7) {
//         return true;
//       }
//     }
    
//     // Check if positive action buttons are overly prominent
//     if (text.includes('yes') || text.includes('continue') || text.includes('accept')) {
//       const backgroundColor = style.backgroundColor;
//       const _color = style.color;
      
//       // Very bright or attention-grabbing colors
//       if (backgroundColor.includes('rgb(255') || backgroundColor.includes('#ff')) {
//         return true;
//       }
//     }
    
//     return false;
//   }

//   private isInModal(element: HTMLElement): boolean {
//     let parent = element.parentElement;
//     while (parent) {
//       const className = parent.className || '';
//       const role = parent.getAttribute('role') || '';
      
//       if (className.includes('modal') || className.includes('popup') || 
//           className.includes('dialog') || role === 'dialog') {
//         return true;
//       }
      
//       parent = parent.parentElement;
//     }
//     return false;
//   }

//   private isAmbiguousButton(text: string): boolean {
//     const ambiguousButtons = ['ok', 'continue', 'next', 'proceed', 'got it'];
//     return ambiguousButtons.some(button => text === button);
//   }

//   private isConfirmShaming(text: string, __lowerText: string): boolean {
//     const confirmShamingPatterns = [
//       /no\s*thanks,?\s*i\s*don'?t\s*want\s*to\s*save/i,
//       /no,?\s*i\s*don'?t\s*want\s*(?:the\s*)?(?:deal|discount|offer)/i,
//       /i\s*don'?t\s*want\s*to\s*(?:save|improve|protect)/i,
//       /no,?\s*i\s*prefer\s*to\s*pay\s*(?:more|full\s*price)/i,
//       /skip\s*this\s*(?:amazing\s*)?(?:deal|offer)/i,
//       /i\s*don'?t\s*need\s*(?:protection|warranty|insurance)/i
//     ];
    
//     return confirmShamingPatterns.some(pattern => pattern.test(text));
//   }

//   private isBaitAndSwitch(_text: string, href: string, __lowerText: string): boolean {
//     // Check if link text promises something but URL suggests otherwise
//     try {
//       const url = new URL(href);
      
//       // Free trial that leads to payment page
//       if (_lowerText.includes('free') && 
//           (url.pathname.includes('payment') || url.pathname.includes('billing') || 
//            url.pathname.includes('checkout') || url.search.includes('plan='))) {
//         return true;
//       }
      
//       // Download that leads to signup
//       if (_lowerText.includes('download') && 
//           (url.pathname.includes('signup') || url.pathname.includes('register'))) {
//         return true;
//       }
      
//       // Learn more that leads to purchase
//       if (_lowerText.includes('learn') && 
//           (url.pathname.includes('buy') || url.pathname.includes('purchase'))) {
//         return true;
//       }
      
//     } catch (error) {
//       // Invalid URL, skip
//     }
    
//     return false;
//   }

//   private isBaitAndSwitchText(text: string, __lowerText: string): boolean {
//     const baitSwitchPatterns = [
//       /free\s*(?:trial|download|access).*(?:then|after).*\$[\d,]+/i,
//       /(?:starts?\s*at|from)\s*\$[\d,]+.*(?:additional|extra|plus)/i,
//       /no\s*(?:cost|charge|fee).*(?:but|however|except)/i
//     ];
    
//     return baitSwitchPatterns.some(pattern => pattern.test(text));
//   }

//   private isRoachMotel(text: string, __lowerText: string): boolean {
//     const roachMotelPatterns = [
//       /cancel.*(?:call|phone|contact)/i,
//       /unsubscribe.*(?:call|phone|contact)/i,
//       /to\s*cancel.*(?:must|need\s*to|required)/i,
//       /cancellation.*(?:fee|charge|penalty)/i
//     ];
    
//     return roachMotelPatterns.some(pattern => pattern.test(text));
//   }

//   private calculateButtonSeverity(text: string, element: HTMLElement): 'low' | 'medium' | 'high' {
//     let severity: 'low' | 'medium' | 'high' = 'low';
    
//     // High severity for clearly deceptive buttons
//     if (text.includes('don\'t not') || text.match(/no.*want.*save/i)) {
//       severity = 'high';
//     }
    
//     // Medium severity for ambiguous buttons in modals
//     else if (this.isInModal(element) && this.isAmbiguousButton(text.toLowerCase())) {
//       severity = 'medium';
//     }
    
//     return severity;
//   }

//   private findInputLabel(input: HTMLInputElement): HTMLElement | null {
//     // Try to find associated label
//     if (input.id) {
//       const label = document.querySelector(`label[for="${input.id}"]`) as HTMLElement;
//       if (label) return label;
//     }
    
//     // Check parent elements
//     let parent = input.parentElement;
//     while (parent && parent.tagName !== 'FORM') {
//       if (parent.tagName === 'LABEL') {
//         return parent;
//       }
//       parent = parent.parentElement;
//     }
    
//     return null;
//   }

//   private async analyzeDarkPattern(
//     data: DarkPatternData,
//     context: PageContext,
//     aiManager: AIEngineManager
//   ): Promise<Detection | null> {
//     try {
//       // Use AI to analyze the dark pattern
//       const prompt = `${PromptEngine.prompts.darkPatterns}\n\n"${data.text}"\n\nType: ${data.type}\nContext: ${data.context || 'unknown'}\nSeverity: ${data.severity}`;
      
//       const aiResult = await aiManager.prompt.detect({
//         prompt,
//         context: `Page: ${context.url.href}, Dark Pattern: ${data.type}`
//       });

//       // Calculate manipulation score
//       const score = this.calculateDarkPatternScore(data, aiResult.text);

//       if (score < 5) return null; // Dark patterns need higher threshold

//       const severity = score >= 8 ? 'high' : score >= 6 ? 'medium' : 'low';

//       return {
//         id: `dark_pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//         agentKey: 'shopping_persuasion',
//         type: 'dark_patterns',
//         score,
//         severity,
//         title: this.generateTitle(data, severity),
//         description: this.generateDescription(data),
//         reasoning: aiResult.reasoning || 'Dark pattern UI analysis',
//         details: [
//           { label: 'Pattern Type', value: data.type.replace('_', ' ') },
//           { label: 'Context', value: data.context || 'UI element' },
//           { label: 'Content', value: data.text.slice(0, 100) + (data.text.length > 100 ? '...' : '') }
//         ],
//         actions: [
//           {
//             label: 'Read Carefully',
//             variant: 'primary',
//             icon: '👀',
//             onClick: () => this.highlightElement(data.element)
//           },
//           {
//             label: 'Learn About Dark Patterns',
//             variant: 'secondary',
//             icon: '📚',
//             onClick: () => this.showDarkPatternEducation(data.type)
//           }
//         ],
//         confidence: aiResult.confidence,
//         timestamp: new Date(),
//         pageUrl: context.url.href,
//         learnMoreUrl: 'https://cognitivesense.app/learn/dark-patterns'
//       };
//     } catch (error) {
//       console.error('Failed to analyze dark pattern:', error);
//       return this.fallbackAnalysis(data, context);
//     }
//   }

//   private calculateDarkPatternScore(data: DarkPatternData, aiResponse: string): number {
//     let score = 0;

//     // Base score by type
//     const typeScores = {
//       misleading_buttons: 7,
//       hidden_options: 8,
//       forced_continuity: 9,
//       bait_switch: 6,
//       confirm_shaming: 5,
//       roach_motel: 4
//     };

//     score += typeScores[data.type];

//     // Severity modifier
//     const severityModifiers = { high: 2, medium: 1, low: 0 };
//     score += severityModifiers[data.severity];

//     // AI response analysis
//     const lowerResponse = aiResponse.toLowerCase();
//     if (lowerResponse.includes('deceptive') || lowerResponse.includes('misleading')) {
//       score += 2;
//     }
//     if (lowerResponse.includes('manipulation') || lowerResponse.includes('dark pattern')) {
//       score += 1;
//     }

//     return Math.min(10, score);
//   }

//   private generateTitle(data: DarkPatternData, severity: string): string {
//     const typeNames = {
//       misleading_buttons: 'Misleading Buttons',
//       hidden_options: 'Hidden Options',
//       forced_continuity: 'Forced Continuity',
//       bait_switch: 'Bait and Switch',
//       confirm_shaming: 'Confirm Shaming',
//       roach_motel: 'Difficult Cancellation'
//     };

//     const severityPrefixes = {
//       high: '⚠️ Deceptive',
//       medium: '⚠️ Suspicious',
//       low: 'Potential'
//     };

//     const typeName = typeNames[data.type] || 'Dark Pattern';
//     const prefix = severityPrefixes[severity as keyof typeof severityPrefixes] || '';

//     return `${prefix} ${typeName}`;
//   }

//   private generateDescription(data: DarkPatternData): string {
//     const descriptions = {
//       misleading_buttons: 'Button text or design may be misleading you into unintended actions.',
//       hidden_options: 'Important options or information may be hidden or obscured.',
//       forced_continuity: 'You may be automatically signed up for recurring charges.',
//       bait_switch: 'The offer may not be what it initially appears to be.',
//       confirm_shaming: 'The interface is trying to shame you into making a purchase.',
//       roach_motel: 'It may be difficult to cancel or unsubscribe from this service.'
//     };

//     return descriptions[data.type] || 'Dark pattern detected in the user interface.';
//   }

//   private fallbackAnalysis(data: DarkPatternData, context: PageContext): Detection | null {
//     // Simple scoring based on type and severity
//     let score = 0;
    
//     switch (data.type) {
//       case 'forced_continuity': score = 8; break;
//       case 'hidden_options': score = 7; break;
//       case 'misleading_buttons': score = 6; break;
//       case 'bait_switch': score = 5; break;
//       case 'confirm_shaming': score = 4; break;
//       case 'roach_motel': score = 3; break;
//     }

//     // Severity modifier
//     if (data.severity === 'high') score += 1;

//     if (score < 5) return null;

//     const severity = score >= 8 ? 'high' : score >= 6 ? 'medium' : 'low';

//     return {
//       id: `dark_pattern_fallback_${Date.now()}`,
//       agentKey: 'shopping_persuasion',
//       type: 'dark_patterns',
//       score,
//       severity,
//       title: this.generateTitle(data, severity),
//       description: this.generateDescription(data),
//       reasoning: 'Pattern-based dark pattern detection',
//       details: [
//         { label: 'Type', value: data.type.replace('_', ' ') },
//         { label: 'Context', value: data.context || 'UI element' }
//       ],
//       actions: [
//         {
//           label: 'Be Careful',
//           variant: 'primary',
//           icon: '⚠️',
//           onClick: () => this.showWarning(data)
//         }
//       ],
//       confidence: 0.7,
//       timestamp: new Date(),
//       pageUrl: context.url.href
//     };
//   }

//   private highlightElement(element?: HTMLElement): void {
//     if (!element) {
//       alert('💡 Read all buttons and options carefully before clicking. Look for confusing language or misleading design.');
//       return;
//     }

//     // Temporarily highlight the element
//     const originalStyle = element.style.cssText;
//     element.style.cssText += 'border: 3px solid red !important; background-color: rgba(255, 0, 0, 0.1) !important;';
    
//     setTimeout(() => {
//       element.style.cssText = originalStyle;
//     }, 3000);

//     alert('💡 The highlighted element may be using dark patterns. Read it carefully before interacting.');
//   }

//   private showDarkPatternEducation(type: string): void {
//     const educationContent = {
//       misleading_buttons: 'Misleading buttons use confusing text or design to trick you into clicking the wrong option. Always read button text carefully.',
//       hidden_options: 'Important information or choices may be hidden in small text, collapsed sections, or styled to be less visible.',
//       forced_continuity: 'Pre-checked boxes or default settings may sign you up for recurring charges. Always review all options.',
//       bait_switch: 'The initial offer may change or have additional requirements not clearly stated upfront.',
//       confirm_shaming: 'Interfaces that make you feel bad for declining an offer, using language like "No, I don\'t want to save money."',
//       roach_motel: 'Easy to sign up but difficult to cancel - look for clear cancellation policies before subscribing.'
//     };

//     const content = educationContent[type as keyof typeof educationContent] || 'Dark patterns are deceptive UI designs that trick users into unintended actions.';
    
//     alert(`🎓 About ${type.replace('_', ' ')}:\n\n${content}\n\n💡 Always read carefully and take your time with important decisions.`);
//   }

//   private showWarning(data: DarkPatternData): void {
//     alert(`⚠️ Dark Pattern Warning:\n\n${this.generateDescription(data)}\n\nContent: "${data.text}"\n\n💡 Take extra care when interacting with this element.`);
//   }
// }
