/**
 * SendMessage Maps Extractor — Content Script
 *
 * Injected into google.com/maps pages.
 * Communicates with popup.js via chrome.runtime.sendMessage.
 *
 * This script is declared in manifest.json content_scripts.
 * All heavy logic runs via chrome.scripting.executeScript from popup.js,
 * so this file is kept minimal to avoid conflicts with Maps internals.
 */

// Notify the extension that this tab is a Maps page
; (function () {
    if (window.__smExtractorLoaded) return
    window.__smExtractorLoaded = true

    // Visual indicator (small badge in corner while extracting)
    let badge = null

    function showBadge(msg) {
        if (!badge) {
            badge = document.createElement('div')
            badge.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: #059669;
        color: white;
        font-family: -apple-system, sans-serif;
        font-size: 12px;
        font-weight: 600;
        padding: 8px 18px;
        border-radius: 99px;
        z-index: 9999999;
        box-shadow: 0 4px 20px rgba(5,150,105,0.4);
        pointer-events: none;
        transition: opacity 0.3s;
      `
            document.body.appendChild(badge)
        }
        badge.textContent = msg
        badge.style.opacity = '1'
    }

    function hideBadge() {
        if (badge) badge.style.opacity = '0'
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
        if (msg.action === 'ping') {
            sendResponse({ ok: true, url: window.location.href })
        }
        if (msg.action === 'showBadge') {
            showBadge(msg.text)
            sendResponse({ ok: true })
        }
        if (msg.action === 'hideBadge') {
            hideBadge()
            sendResponse({ ok: true })
        }
        return true
    })

    console.log('[SendMessage Extractor] Content script carregado em:', window.location.href)
})()
