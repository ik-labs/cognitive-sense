/**
 * Debug utility for browser console logging
 */

export class Debug {
  private static readonly PREFIX = '[CognitiveSense]';
  private static readonly COLORS = {
    info: 'color: #3b82f6; font-weight: bold;',
    success: 'color: #10b981; font-weight: bold;',
    warning: 'color: #f59e0b; font-weight: bold;',
    error: 'color: #ef4444; font-weight: bold;',
    debug: 'color: #8b5cf6; font-weight: bold;'
  };

  static info(message: string, data?: any) {
    console.log(`%c${this.PREFIX} ℹ️ ${message}`, this.COLORS.info, data || '');
  }

  static success(message: string, data?: any) {
    console.log(`%c${this.PREFIX} ✅ ${message}`, this.COLORS.success, data || '');
  }

  static warning(message: string, data?: any) {
    console.warn(`%c${this.PREFIX} ⚠️ ${message}`, this.COLORS.warning, data || '');
  }

  static error(message: string, data?: any) {
    console.error(`%c${this.PREFIX} ❌ ${message}`, this.COLORS.error, data || '');
  }

  static debug(message: string, data?: any) {
    console.log(`%c${this.PREFIX} 🐛 ${message}`, this.COLORS.debug, data || '');
  }

  // Detection lifecycle logging
  static detectionStart(type: string, count: number) {
    this.info(`Starting ${type} detection (${count} items to analyze)`);
  }

  static detectionFound(type: string, score: number, severity: string) {
    this.success(`${type} detected - Score: ${score}/10, Severity: ${severity}`);
  }

  static contentGenerated(type: string, field: string) {
    this.success(`Generated ${field} for ${type} detection`);
  }

  static panelUpdated(url: string, detectionCount: number) {
    this.info(`Panel updated for ${url} - ${detectionCount} detections`);
  }

  static storageUpdated(hash: string, count: number) {
    this.success(`Saved ${count} detections with hash: ${hash}`);
  }

  // API logging
  static apiCall(apiName: string, status: 'start' | 'success' | 'error', data?: any) {
    if (status === 'start') {
      this.debug(`Calling ${apiName} API...`);
    } else if (status === 'success') {
      this.success(`${apiName} API response received`, data);
    } else {
      this.error(`${apiName} API failed`, data);
    }
  }
}
