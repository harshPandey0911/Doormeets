/**
 * Flutter JS Bridge Utility
 * Handles communication between React (Frontend) and Flutter (Native)
 * via InAppWebView JavaScript Handlers.
 */

class FlutterBridge {
  constructor() {
    this.isFlutter = typeof window.flutter_inappwebview !== 'undefined' || !!window.navigator.userAgent.match(/Flutter/i);
    this.ready = false;
    this._init();
  }

  _init() {
    // Listen for the specific event dispatched by InAppWebView when it's ready
    window.addEventListener('flutterInAppWebViewPlatformReady', () => {
      this.ready = true;
      this.isFlutter = true;
      console.log('✅ Flutter Bridge Initialized');
    });
  }

  /**
   * Universal call to any Flutter JS Handler
   * @param {string} handlerName - Name of the handler registered in Flutter
   * @param {any} args - Arguments to pass to Flutter
   * @returns {Promise<any>}
   */
  async callHandler(handlerName, args = null) {
    if (!this.isFlutter) {
      console.warn(`Attempted to call ${handlerName} outside of Flutter environment.`);
      return { success: false, error: 'NOT_FLUTTER' };
    }

    try {
      // Small delay to ensure bridge is fully linked if called immediately
      if (!window.flutter_inappwebview?.callHandler) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const result = await window.flutter_inappwebview.callHandler(handlerName, args);
      return result;
    } catch (error) {
      console.error(`Flutter Handler [${handlerName}] failed:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Simplified Camera Access
   * Triggers native camera and returns a standard JS File object
   * @returns {Promise<File|null>}
   */
  async openCamera() {
    const response = await this.callHandler('openCamera');

    if (response?.success && response.base64) {
      // Convert Base64 string to a JS File object
      return this.base64ToFile(
        response.base64,
        response.fileName || `camera_${Date.now()}.jpg`,
        response.mimeType || 'image/jpeg'
      );
    }
    return null;
  }

  /**
   * Utility: Convert Base64 to File
   */
  base64ToFile(base64, filename, mimeType) {
    const byteString = atob(base64.split(',')[1] || base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeType });
    return new File([blob], filename, { type: mimeType });
  }

  /**
   * Utility: Trigger Haptic Feedback
   */
  async hapticFeedback(type = 'medium') {
    return this.callHandler('haptic', { type });
  }
}

export const flutterBridge = new FlutterBridge();
export default flutterBridge;
