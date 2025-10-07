// Content script wrapper that loads the actual content script as a module
(async function() {
  try {
    // Dynamically import the content script as a module
    const src = chrome.runtime.getURL('content.js');
    await import(src);
  } catch (error) {
    console.error('Failed to load CognitiveSense content script:', error);
  }
})();
