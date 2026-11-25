/**
 * Asisten Mas Amdal - Hospitality Concierge & Diagnostic Advisor
 * Designed for: Nugroho Amdal, S.S., CI. Portfolio (https://nugrohoamdalportfolio.dpdns.org)
 * Features:
 *  - Full-screen dynamic viewport on mobile with visualViewport keyboard avoidance
 *  - Auto-collapsing header after first message to maximize chat reading space
 *  - Contextual Channel Routing (Dynamic WhatsApp, LinkedIn, Instagram link pills)
 *  - 10-turn history memory synchronization with Gemini 2.5/Flash multi-model cascade
 *  - Interactive markdown link parser with dedicated channel branding
 */

const CLOUD_RUN_ENDPOINT = 'https://backend-assistant-one.vercel.app';

(function () {
  'use strict';

  // Prevent multiple initializations
  if (window.__amdalAssistantLoaded) return;
  window.__amdalAssistantLoaded = true;

  // Language Detection (id or en)
  const isEn = document.documentElement.getAttribute('data-lang') === 'en';

  // Text Dictionaries
  const I18N = {
    id: {
      callout: 'Butuh bantuan jelajahi portofolio? Tanya Asisten Mas Amdal di sini 😸',
      btnLabel: 'Tanya Asisten Mas Amdal',
      onlineStatus: 'Online',
      headerTitle: 'Asisten Mas Amdal',
      headerSubtitle: 'Hospitality Concierge & Diagnostic Advisor',
      welcome: 'Halo! Selamat datang di portofolio Mas Amdal. Lagi cari solusi untuk tim/perusahaan atau mau diskusi seputar pengembangan karier nih? Cerita santai aja, aku siap bantu arahin 😊',
      quickPromptsLabel: 'Topik cepat yang sering ditanyakan:',
      prompts: [
        'Lihat demo sistem HRIS & Rekrutmen',
        'Diskusi persiapan karier & interview',
        'Info In-House Training & Speaking'
      ],
      placeholder: 'Tulis pesan Anda di sini...',
      sendBtnAria: 'Kirim pesan ke asisten',
      closeBtnAria: 'Tutup jendela asisten'
    },
    en: {
      callout: "Need help exploring? Ask Mas Amdal's Assistant here 😸",
      btnLabel: "Ask Mas Amdal's Assistant",
      onlineStatus: 'Online',
      headerTitle: "Mas Amdal's Assistant",
      headerSubtitle: 'Hospitality Concierge & Diagnostic Advisor',
      welcome: "Hi there! Welcome to Mas Amdal's portfolio. Are you exploring HR solutions for your team or looking for career guidance? Feel free to share what's on your mind—happy to help!",
      quickPromptsLabel: 'Frequently explored topics:',
      prompts: [
        'Explore live HRIS & Recruitment demos',
        'Career mentorship & interview prep',
        'In-House Training & Speaking details'
      ],
      placeholder: 'Type your message here...',
      sendBtnAria: 'Send message to assistant',
      closeBtnAria: 'Close assistant window'
    }
  };

  const t = isEn ? I18N.en : I18N.id;

  // Social & Contact Official URLs
  const CONTACT_LINKS = {
    whatsapp: 'https://wa.me/6285395940406',
    linkedin: 'https://www.linkedin.com/in/nugroho-amdal',
    instagram: 'https://instagram.com/nugrohoamdal'
  };

  // State Management
  let chatHistory = [];
  let isChatOpen = false;
  let isSending = false;

  // Inject Styles
  function injectStyles() {
    if (document.getElementById('amdal-assistant-styles')) return;

    const styleEl = document.createElement('style');
    styleEl.id = 'amdal-assistant-styles';
    styleEl.textContent = `
      :root {
        --amdal-obsidian: #060B14;
        --amdal-slate: #0F172A;
        --amdal-slate-card: #1E293B;
        --amdal-slate-border: rgba(255, 255, 255, 0.1);
        --amdal-blue: #2563EB;
        --amdal-blue-hover: #1D4ED8;
        --amdal-blue-light: #60A5FA;
        --amdal-emerald: #10B981;
        --amdal-ease: cubic-bezier(0.16, 1, 0.3, 1);
      }

      /* Root Container */
      #amdal-assistant-root {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 99999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Helvetica, Arial, sans-serif;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        pointer-events: none;
      }

      #amdal-assistant-root * {
        box-sizing: border-box;
      }

      /* Main Action Floating Button */
      .amdal-widget-trigger {
        pointer-events: auto;
        opacity: 0;
        transform: translateY(32px) scale(0.96);
        transition: transform 0.6s var(--amdal-ease), opacity 0.6s var(--amdal-ease), box-shadow 0.3s ease;
        background: linear-gradient(135deg, #0F172A 0%, #060B14 100%);
        border: 1px solid rgba(59, 130, 246, 0.35);
        border-radius: 9999px;
        padding: 10px 18px 10px 14px;
        color: #FFFFFF;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        box-shadow: 0 12px 30px -4px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
        user-select: none;
        backdrop-filter: blur(12px);
      }

      .amdal-widget-trigger.is-visible {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .amdal-widget-trigger:hover {
        transform: translateY(-2px) scale(1.02);
        border-color: rgba(96, 165, 250, 0.6);
        box-shadow: 0 16px 36px -4px rgba(37, 99, 235, 0.35), 0 0 0 1px rgba(96, 165, 250, 0.2);
      }

      .amdal-widget-trigger:active {
        transform: translateY(1px) scale(0.98);
      }

      .amdal-trigger-avatar {
        width: 32px;
        height: 32px;
        border-radius: 9999px;
        background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        font-weight: 700;
        font-size: 13px;
        letter-spacing: -0.5px;
        border: 1.5px solid rgba(255, 255, 255, 0.2);
        position: relative;
        flex-shrink: 0;
      }

      .amdal-online-dot {
        width: 8px;
        height: 8px;
        border-radius: 9999px;
        background-color: var(--amdal-emerald);
        border: 1.5px solid #0F172A;
        position: absolute;
        bottom: -1px;
        right: -1px;
      }

      .amdal-trigger-text {
        font-size: 13.5px;
        font-weight: 600;
        color: #F8FAFC;
        letter-spacing: 0.1px;
        white-space: nowrap;
      }

      /* Subtle Pulse Ring on Entrance */
      @keyframes amdalPulseRing {
        0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
        70% { box-shadow: 0 0 0 18px rgba(37, 99, 235, 0); }
        100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
      }

      .amdal-pulse-effect {
        animation: amdalPulseRing 1.8s var(--amdal-ease) 1.2s 1 normal forwards;
      }

      /* Auto-Dismiss Callout Bubble */
      .amdal-callout-bubble {
        pointer-events: auto;
        opacity: 0;
        transform: translateY(12px) scale(0.96);
        transition: opacity 0.5s var(--amdal-ease), transform 0.5s var(--amdal-ease);
        background: #0F172A;
        border: 1px solid rgba(59, 130, 246, 0.35);
        border-radius: 16px;
        padding: 10px 14px;
        margin-bottom: 10px;
        max-width: 320px;
        box-shadow: 0 16px 32px -4px rgba(0, 0, 0, 0.65), 0 0 16px rgba(37, 99, 235, 0.15);
        display: flex;
        align-items: center;
        gap: 10px;
        backdrop-filter: blur(16px);
      }

      .amdal-callout-bubble.is-visible {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .amdal-callout-bubble.is-hiding {
        opacity: 0;
        transform: translateY(8px) scale(0.96);
        pointer-events: none;
      }

      .amdal-callout-text {
        font-size: 12.5px;
        line-height: 1.45;
        color: #E2E8F0;
        font-weight: 500;
        cursor: pointer;
      }

      .amdal-callout-close {
        background: transparent;
        border: none;
        color: #94A3B8;
        padding: 4px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        line-height: 1;
        transition: color 0.2s ease, background 0.2s ease;
      }

      .amdal-callout-close:hover {
        color: #FFFFFF;
        background: rgba(255, 255, 255, 0.1);
      }

      /* Chat Window Modal */
      .amdal-chat-window {
        pointer-events: auto;
        width: 400px;
        max-width: calc(100vw - 32px);
        height: 600px;
        max-height: calc(100vh - 100px);
        background: linear-gradient(180deg, #0F172A 0%, #060B14 100%);
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 24px;
        box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(37, 99, 235, 0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        margin-bottom: 12px;
        opacity: 0;
        transform: translateY(20px) scale(0.96);
        transition: opacity 0.35s var(--amdal-ease), transform 0.35s var(--amdal-ease);
        backdrop-filter: blur(20px);
      }

      .amdal-chat-window.is-open {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .amdal-chat-window.is-hidden {
        display: none;
      }

      /* Window Header */
      .amdal-chat-header {
        padding: 14px 18px;
        background: rgba(15, 23, 42, 0.88);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-shrink: 0;
        transition: all 0.3s var(--amdal-ease);
        position: relative;
      }

      /* Collapsed Header State: Minimal floating bar with clean close button */
      .amdal-chat-header.is-collapsed {
        padding: 8px 14px;
        background: rgba(15, 23, 42, 0.65);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        min-height: 42px;
      }

      .amdal-chat-header.is-collapsed .amdal-header-profile {
        display: none;
      }

      .amdal-chat-header.is-collapsed .amdal-header-actions {
        margin-left: auto;
      }

      .amdal-chat-header.is-collapsed .amdal-icon-btn {
        width: 28px;
        height: 28px;
        font-size: 13px;
        background: rgba(255, 255, 255, 0.08);
      }

      .amdal-header-profile {
        display: flex;
        align-items: center;
        gap: 12px;
        transition: opacity 0.25s ease;
      }

      .amdal-header-avatar {
        width: 38px;
        height: 38px;
        border-radius: 9999px;
        background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        font-weight: 700;
        font-size: 14px;
        border: 1.5px solid rgba(96, 165, 250, 0.4);
        position: relative;
        flex-shrink: 0;
      }

      .amdal-header-info h3 {
        margin: 0;
        font-size: 14.5px;
        font-weight: 700;
        color: #FFFFFF;
        line-height: 1.25;
      }

      .amdal-header-info p {
        margin: 2px 0 0 0;
        font-size: 11.5px;
        color: #94A3B8;
        line-height: 1.2;
      }

      .amdal-header-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .amdal-icon-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: #94A3B8;
        width: 32px;
        height: 32px;
        border-radius: 9999px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .amdal-icon-btn:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #FFFFFF;
        border-color: rgba(255, 255, 255, 0.2);
      }

      /* Messages Area */
      .amdal-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        overscroll-behavior: contain;
      }

      .amdal-chat-messages::-webkit-scrollbar {
        width: 5px;
      }

      .amdal-chat-messages::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 9999px;
      }

      /* Message Bubbles */
      .amdal-msg {
        display: flex;
        flex-direction: column;
        max-width: 90%;
        animation: amdalFadeIn 0.3s var(--amdal-ease) forwards;
      }

      @keyframes amdalFadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .amdal-msg-assistant {
        align-self: flex-start;
      }

      .amdal-msg-user {
        align-self: flex-end;
      }

      .amdal-bubble {
        padding: 12px 16px;
        font-size: 13.5px;
        line-height: 1.55;
        border-radius: 18px;
        word-break: break-word;
      }

      .amdal-msg-assistant .amdal-bubble {
        background: #1E293B;
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: #E2E8F0;
        border-top-left-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      }

      .amdal-msg-user .amdal-bubble {
        background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
        color: #FFFFFF;
        border-top-right-radius: 4px;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
      }

      /* Contextual Channel Link Pills */
      .amdal-chat-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(37, 99, 235, 0.16);
        border: 1px solid rgba(96, 165, 250, 0.38);
        color: #93C5FD !important;
        padding: 4px 10px;
        border-radius: 9999px;
        font-size: 12px;
        font-weight: 600;
        text-decoration: none;
        margin: 3px 2px;
        vertical-align: middle;
        transition: all 0.2s var(--amdal-ease);
      }

      .amdal-chat-link:hover {
        background: rgba(37, 99, 235, 0.32);
        color: #FFFFFF !important;
        border-color: #60A5FA;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
      }

      .amdal-link-icon {
        width: 12.5px;
        height: 12.5px;
        display: inline-block;
        flex-shrink: 0;
      }

      /* WhatsApp Dynamic Pill */
      .amdal-link-wa {
        background: rgba(16, 185, 129, 0.15);
        border-color: rgba(52, 211, 153, 0.45);
        color: #6EE7B7 !important;
      }

      .amdal-link-wa:hover {
        background: rgba(16, 185, 129, 0.32);
        border-color: #34D399;
        color: #FFFFFF !important;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }

      /* LinkedIn Dynamic Pill */
      .amdal-link-linkedin {
        background: rgba(14, 118, 168, 0.18);
        border-color: rgba(56, 189, 248, 0.45);
        color: #7DD3FC !important;
      }

      .amdal-link-linkedin:hover {
        background: rgba(14, 118, 168, 0.35);
        border-color: #38BDF8;
        color: #FFFFFF !important;
        box-shadow: 0 4px 12px rgba(14, 118, 168, 0.3);
      }

      /* Instagram Dynamic Pill */
      .amdal-link-instagram {
        background: rgba(225, 48, 108, 0.15);
        border-color: rgba(244, 114, 182, 0.45);
        color: #F472B6 !important;
      }

      .amdal-link-instagram:hover {
        background: rgba(225, 48, 108, 0.32);
        border-color: #F472B6;
        color: #FFFFFF !important;
        box-shadow: 0 4px 12px rgba(225, 48, 108, 0.3);
      }

      /* Quick Prompts Container */
      .amdal-prompts-container {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 10px;
      }

      .amdal-prompts-label {
        font-size: 11px;
        font-weight: 600;
        color: #94A3B8;
        letter-spacing: 0.2px;
        margin-bottom: 2px;
      }

      .amdal-prompt-chip {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #CBD5E1;
        padding: 8px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        text-align: left;
        cursor: pointer;
        transition: all 0.2s var(--amdal-ease);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .amdal-prompt-chip:hover {
        background: rgba(37, 99, 235, 0.18);
        border-color: rgba(96, 165, 250, 0.45);
        color: #FFFFFF;
        transform: translateX(2px);
      }

      /* Typing Indicator */
      .amdal-typing-dots {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 10px 14px;
        background: #1E293B;
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 16px;
        border-top-left-radius: 4px;
      }

      .amdal-dot {
        width: 6px;
        height: 6px;
        border-radius: 9999px;
        background: #94A3B8;
        animation: amdalPulseDot 1.4s infinite ease-in-out both;
      }

      .amdal-dot:nth-child(1) { animation-delay: -0.32s; }
      .amdal-dot:nth-child(2) { animation-delay: -0.16s; }

      @keyframes amdalPulseDot {
        0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
        40% { transform: scale(1); opacity: 1; }
      }

      /* Chat Input Bar */
      .amdal-chat-input-bar {
        padding: 12px 14px 14px 14px;
        background: #060B14;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }

      .amdal-input-field {
        flex: 1;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 14px;
        padding: 10px 14px;
        color: #FFFFFF;
        font-size: 13.5px;
        outline: none;
        transition: border-color 0.2s ease, background 0.2s ease;
      }

      .amdal-input-field:focus {
        border-color: var(--amdal-blue-light);
        background: rgba(255, 255, 255, 0.09);
      }

      .amdal-input-field::placeholder {
        color: #64748B;
      }

      .amdal-send-btn {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
        border: none;
        color: #FFFFFF;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.2s var(--amdal-ease);
      }

      .amdal-send-btn:hover {
        background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
      }

      .amdal-send-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      /* Full-Screen Dynamic Viewport on Mobile (< 768px) */
      @media (max-width: 767px) {
        #amdal-assistant-root {
          bottom: 0;
          right: 0;
          left: 0;
          top: 0;
          width: 100vw;
          height: 100%;
          pointer-events: none;
        }

        .amdal-chat-window {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100dvh;
          max-width: 100vw;
          max-height: 100dvh;
          border-radius: 0;
          border: none;
          margin: 0;
          z-index: 999999;
          bottom: 0;
          right: 0;
          left: 0;
          top: 0;
        }

        .amdal-widget-trigger {
          position: fixed;
          bottom: 16px;
          right: 16px;
          padding: 8px 14px 8px 10px;
        }

        .amdal-trigger-text {
          font-size: 12.5px;
        }

        .amdal-callout-bubble {
          position: fixed;
          bottom: 68px;
          right: 16px;
          max-width: calc(100vw - 32px);
        }

        .amdal-chat-messages {
          padding: 12px 14px;
        }

        .amdal-chat-input-bar {
          padding: 8px 12px 12px 12px;
        }
      }
    `;
    document.head.appendChild(styleEl);
  }

  // Markdown Parser to HTML with Contextual Link Icons
  function renderMarkdown(mdText) {
    if (!mdText) return '';

    let html = mdText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Markdown Links: [Title](https://...)
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (match, title, url) => {
      let iconSvg = '';
      let pillClass = 'amdal-chat-link';

      if (/wa\.me|whatsapp\.com/i.test(url)) {
        pillClass += ' amdal-link-wa';
        iconSvg = `<svg class="amdal-link-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.5c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.24-.75-.67-1.25-1.49-1.39-1.74-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.43 1.03 2.6c.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.17-.48-.29z"/></svg>`;
      } else if (/linkedin\.com/i.test(url)) {
        pillClass += ' amdal-link-linkedin';
        iconSvg = `<svg class="amdal-link-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.32a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z"/></svg>`;
      } else if (/instagram\.com/i.test(url)) {
        pillClass += ' amdal-link-instagram';
        iconSvg = `<svg class="amdal-link-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`;
      } else {
        iconSvg = `<svg class="amdal-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>`;
      }

      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${pillClass}"><span>${title}</span>${iconSvg}</a>`;
    });

    // Bold: **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Bullet points: - text
    html = html.replace(/(?:^|\n)[ \t]*[-*][ \t]+([^\n]+)/g, '<div style="margin: 3px 0; padding-left: 12px; position: relative;"><span style="position: absolute; left: 0; color: #60A5FA;">•</span>$1</div>');

    // Paragraph breaks
    html = html.replace(/\n\n+/g, '<div style="height: 8px;"></div>');
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  // Intelligent Local Fallback Engine (Diagnostic Concierge Pattern)
  function generateLocalResponse(userMessage) {
    const text = userMessage.toLowerCase().trim();

    // 1. Simple Greetings & Small Talk (0 Links, Empathetic Listening)
    if (/^(halo|hai|hi|hello|pagi|siang|sore|malam|test|tes|permisi|assalamu|p)[\s!.,?]*$/i.test(text)) {
      if (isEn) {
        return "Hello! Warm welcome to Mas Amdal's portfolio. Are you exploring HR solutions for your team or looking for career guidance? Feel free to share what's on your mind—happy to help!";
      } else {
        return "Halo! Senang sekali Anda mampir ke portofolio Mas Amdal. Apakah Anda sedang mencari solusi sistem HR untuk tim, atau ingin berdiskusi seputar pengembangan karier? Boleh cerita santai apa yang sedang menjadi fokus Anda saat ini 😊";
      }
    }

    // 2. Flight Attendant / Aviation Inquiry
    if (/flight attendant|pramugari|pramugara|cabin crew|aviasi|maskapai|aviation/i.test(text)) {
      if (/nol|ragu|belum pernah|baru mulai|bingung mulai|tips/i.test(text) || !/interview|bahasa inggris|inggris|jadwal|booking/i.test(text)) {
        // Diagnosis Phase (0 Links)
        if (isEn) {
          return "That's an inspiring path! Cabin crew recruitment is known for its rigorous grooming and panel interviews, especially for international carriers. To give the best advice, have you attended walk-in interviews before, or are you preparing from scratch? Which stage feels most challenging right now?";
        } else {
          return "Wah, keren banget targetnya ke flight attendant! Persaingannya memang ketat ya di tahap grooming dan panel interview, apalagi kalau mengincar maskapai internasional. Biar aku nggak asal kasih saran, sekarang Kakak sudah pernah ikut walk-in interview sebelumnya atau baru persiapan dari nol? Bagian mana nih yang paling bikin deg-degan—CV, Bahasa Inggris, atau sesi interview-nya?";
        }
      } else {
        // Prescription Phase (1 Precise Link)
        if (isEn) {
          return "I understand completely—aviation English and panel interviews require genuine confidence under pressure. Mas Amdal guides candidates through targeted [1-on-1 Career Coaching](https://nugrohoamdalportfolio.dpdns.org/products.html) focusing on airline panel simulations and English STAR techniques. Are you aiming for domestic carriers or global ones like Emirates or Singapore Airlines?";
        } else {
          return "Paham banget Kak, interview bahasa Inggris di aviasi memang menuntut kelancaran dan ketenangan merespons skenario pelayanan penumpang. Untuk persiapan intensif dari nol, Mas Amdal biasa mendampingi lewat [1-on-1 Career Coaching](https://nugrohoamdalportfolio.dpdns.org/products.html) khusus simulasi panel interview dan teknik STAR berbahasa Inggris. Boleh tahu target maskapai incaran Kakak domestik seperti Garuda/Batik atau internasional seperti Emirates/Qatar/Singapore Airlines?";
        }
      }
    }

    // 3. Doubt / Reputation Validation (Routing LinkedIn)
    if (/ragu|reputasi|terbukti|beneran|kredibilitas|bukti|review|testimoni/i.test(text)) {
      if (isEn) {
        return "It is completely natural to verify credentials first! Mas Amdal mentored C-Level leadership at Injourney Airports during strategic negotiations with 46 international airlines towards Skytrax 5-Star status. To explore his verified certifications and global track record, feel free to visit [LinkedIn Mas Amdal](https://www.linkedin.com/in/nugroho-amdal).";
      } else {
        return "Wajar banget Kak kalau ingin memastikan dulu, apalagi standar aviasi dan korporat memang sangat ketat. Mas Amdal sendiri pernah mendampingi level eksekutif (Division Head Injourney Airports) dalam negosiasi dengan 46 maskapai internasional menuju standar Skytrax 5-Star. Biar makin yakin sama rekam jejak dan proyek globalnya, Kakak bisa kepoin langsung [LinkedIn Mas Amdal](https://www.linkedin.com/in/nugroho-amdal) di sini ya—semua sertifikasi BNSP dan histori kolaborasinya tercatat lengkap di sana.";
      }
    }

    // 4. Career Mentorship / Bootcamp / Coaching
    if (/kerja|bootcamp|bimbing|dapat kerja|mentor|coaching|cv|resume|interview|loker|lamar/i.test(text)) {
      if (/biaya|harga|jadwal|daftar|ikut/i.test(text)) {
        return "Mas Amdal menyediakan program [Talent Up Career Development Bootcamp](https://talentup.myscalev.com/careerdevelopment) serta sesi privat [1-on-1 Career Coaching](https://nugrohoamdalportfolio.dpdns.org/products.html) (mulai Rp150.000 untuk fresh graduate). Kalau ingin bahas kecocokan jadwal dan kebutuhan Kakak, langsung hubungi [WhatsApp Mas Amdal](https://wa.me/6285395940406?text=Halo%20Mas%20Amdal%2C%20saya%20tertarik%20konsultasi%20bimbingan%20karier) ya!";
      } else {
        return "Untuk bimbingan karier, Mas Amdal tidak menjual janji kosong penyaluran kerja instan, melainkan membekali kandidat dengan taktik nyata—mulai dari bedah CV ATS, strategi rekrutmen remote internasional, hingga simulasi interview. Anda juga bisa mencoba tes kata kunci gratis di [Career Clarity App](https://careerclarity-app.vercel.app/). Boleh tahu bidang pekerjaan atau industri apa yang sedang ingin Anda tuju?";
      }
    }

    // 5. Automated HRIS & Payroll System
    if (/hris|payroll|gaji|pph|bpjs|pesangon|slip/i.test(text)) {
      if (/demo|lihat|coba|link/i.test(text)) {
        return "Anda bisa langsung mencoba [Simulasi Interaktif Dashboard HRIS](https://nugrohoamdalportfolio.dpdns.org/hris-dashboard.html) buatan Mas Amdal. Sistem 27-sheet zero-macro ini menghitung otomatis PPh 21 TER, BPJS, dan pesangon PP 35/2021 secara deterministik. Apakah di perusahaan Anda ada skema tunjangan khusus yang sedang ingin dirapikan?";
      } else {
        return "Otomatisasi payroll memang krusial untuk mencegah human error dan kepatuhan regulasi PPh 21 TER serta BPJS. Boleh tahu saat ini tim HR Anda mengelola berapa karyawan dan kendala utamanya lebih di kalkulasi pajak, absensi, atau distribusi slip gaji?";
      }
    }

    // 6. Recruitment & MPP Hub
    if (/rekrut|recruitment|mpp|hiring|tat|sla|sourcing|talent pool/i.test(text)) {
      if (/demo|lihat|coba|link/i.test(text)) {
        return "Silakan jelajahi [Simulasi Recruitment Hub](https://nugrohoamdalportfolio.dpdns.org/recruitment-dashboard.html) untuk melihat pelacakan SLA rekrutmen dan generator undangan interview otomatis. Apakah volume hiring tim Anda saat ini tergolong tinggi per bulannya?";
      } else {
        return "Menata pipeline rekrutmen dan manpower planning memang sangat membantu menjaga waktu pemenuhan kandidat (time-to-hire). Boleh tahu kendala terbesarnya saat ini ada di sourcing kandidat, screening awal, atau koordinasi jadwal interview dengan user?";
      }
    }

    // 7. Corporate In-House Training, Speaking & Rate Card (Routing WhatsApp)
    if (/in-house|training|speaking|webinar|workshop|kuliah tamu|biaya|harga|rate card|honor/i.test(text)) {
      return "Mas Amdal adalah BNSP Level 4 Certified Instructor dan Best HR of the Year 2023. Untuk In-House Training korporat mulai Rp10.000.000 (flat s/d 30+ peserta) dan Keynote Speaking mulai Rp3.000.000, rincian lengkapnya ada di [Katalog Produk & Rate Card](https://nugrohoamdalportfolio.dpdns.org/products.html). Untuk diskusi penyesuaian materi dan jadwal, yuk langsung terhubung di [WhatsApp Mas Amdal](https://wa.me/6285395940406?text=Halo%20Mas%20Amdal%2C%20kami%20tertarik%20mengundang%20untuk%20sesi%20training%2Fspeaking)!";
    }

    // 8. General / Fallback
    if (isEn) {
      return "I'm here to help you navigate Mas Amdal's portfolio! We can discuss his live [HRIS Dashboard Demo](https://nugrohoamdalportfolio.dpdns.org/hris-dashboard.html) or [Career Coaching](https://nugrohoamdalportfolio.dpdns.org/products.html). What specific topic would you like to explore together?";
    } else {
      return "Saya siap membantu Anda menjelajahi portofolio Mas Amdal! Anda bisa mencoba [Simulasi HRIS Dashboard](https://nugrohoamdalportfolio.dpdns.org/hris-dashboard.html) maupun berdiskusi seputar [1-on-1 Coaching Karier](https://nugrohoamdalportfolio.dpdns.org/products.html). Boleh tahu topik apa yang paling menarik perhatian Anda?";
    }
  }

  // DOM Elements Builder
  function createWidgetDOM() {
    const root = document.createElement('div');
    root.id = 'amdal-assistant-root';

    // 1. Auto-Dismiss Callout Bubble
    const calloutEl = document.createElement('div');
    calloutEl.id = 'amdal-callout';
    calloutEl.className = 'amdal-callout-bubble';
    calloutEl.innerHTML = `
      <div class="amdal-callout-text" id="amdal-callout-trigger-text">${t.callout}</div>
      <button type="button" class="amdal-callout-close" id="amdal-callout-close-btn" aria-label="Dismiss callout">✕</button>
    `;

    // 2. Chat Window Modal (Clean Layout, No Static Footer)
    const chatWindow = document.createElement('div');
    chatWindow.id = 'amdal-chat-window';
    chatWindow.className = 'amdal-chat-window is-hidden';
    chatWindow.innerHTML = `
      <div class="amdal-chat-header" id="amdal-chat-header">
        <div class="amdal-header-profile" id="amdal-header-profile">
          <div class="amdal-header-avatar">
            MA
            <div class="amdal-online-dot"></div>
          </div>
          <div class="amdal-header-info">
            <h3>${t.headerTitle}</h3>
            <p>${t.headerSubtitle}</p>
          </div>
        </div>
        <div class="amdal-header-actions">
          <button type="button" class="amdal-icon-btn" id="amdal-close-window-btn" aria-label="${t.closeBtnAria}">
            ✕
          </button>
        </div>
      </div>

      <div class="amdal-chat-messages" id="amdal-messages-container">
        <!-- Initial Welcome Message -->
        <div class="amdal-msg amdal-msg-assistant">
          <div class="amdal-bubble">
            ${renderMarkdown(t.welcome)}
            <div class="amdal-prompts-container">
              <div class="amdal-prompts-label">${t.quickPromptsLabel}</div>
              ${t.prompts.map(p => `
                <button type="button" class="amdal-prompt-chip" data-prompt="${p}">
                  <span>${p}</span>
                  <span style="opacity: 0.6; font-size: 11px;">→</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Input Field -->
      <form class="amdal-chat-input-bar" id="amdal-chat-form">
        <input type="text" class="amdal-input-field" id="amdal-input-field" 
               placeholder="${t.placeholder}" autocomplete="off" maxlength="1000">
        <button type="submit" class="amdal-send-btn" id="amdal-send-btn" aria-label="${t.sendBtnAria}">
          <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
        </button>
      </form>
    `;

    // 3. Main Floating Button
    const triggerBtn = document.createElement('button');
    triggerBtn.type = 'button';
    triggerBtn.id = 'amdal-widget-trigger';
    triggerBtn.className = 'amdal-widget-trigger';
    triggerBtn.setAttribute('aria-label', t.btnLabel);
    triggerBtn.innerHTML = `
      <div class="amdal-trigger-avatar">
        MA
        <div class="amdal-online-dot"></div>
      </div>
      <span class="amdal-trigger-text">${t.btnLabel}</span>
    `;

    root.appendChild(calloutEl);
    root.appendChild(chatWindow);
    root.appendChild(triggerBtn);
    document.body.appendChild(root);

    // Bind Event Listeners & Visual Viewport
    setupEvents(calloutEl, chatWindow, triggerBtn);
    setupVisualViewport();
  }

  // Setup Visual Viewport for Virtual Keyboard Awareness on Mobile
  function setupVisualViewport() {
    if (!window.visualViewport) return;

    const adaptToViewport = () => {
      if (!isChatOpen || window.innerWidth >= 768) {
        const win = document.getElementById('amdal-chat-window');
        if (win && window.innerWidth >= 768) {
          win.style.height = '';
          win.style.top = '';
        }
        return;
      }

      const win = document.getElementById('amdal-chat-window');
      if (!win) return;

      const vv = window.visualViewport;
      // Fit exact visual viewport height and offset to stay pinned above keyboard
      win.style.height = `${vv.height}px`;
      win.style.top = `${vv.offsetTop}px`;

      const container = document.getElementById('amdal-messages-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    };

    window.visualViewport.addEventListener('resize', adaptToViewport);
    window.visualViewport.addEventListener('scroll', adaptToViewport);
  }

  // Setup Interaction Events
  function setupEvents(calloutEl, chatWindow, triggerBtn) {
    // 1. Entrance Sequence (1.2s delay)
    setTimeout(() => {
      triggerBtn.classList.add('is-visible', 'amdal-pulse-effect');

      // Check if callout was dismissed in this session
      const isCalloutDismissed = sessionStorage.getItem('amdal_callout_dismissed') === 'true';
      if (!isCalloutDismissed) {
        calloutEl.classList.add('is-visible');

        // Auto-dismiss after 6 seconds
        setTimeout(() => {
          dismissCallout(calloutEl);
        }, 6000);
      }
    }, 1200);

    // Callout Click Handlers
    const calloutCloseBtn = document.getElementById('amdal-callout-close-btn');
    const calloutText = document.getElementById('amdal-callout-trigger-text');

    if (calloutCloseBtn) {
      calloutCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dismissCallout(calloutEl);
      });
    }

    if (calloutText) {
      calloutText.addEventListener('click', () => {
        dismissCallout(calloutEl);
        toggleChat(true);
      });
    }

    // Toggle Chat on Main Button Click
    triggerBtn.addEventListener('click', () => {
      dismissCallout(calloutEl);
      toggleChat(!isChatOpen);
    });

    // Close Window Button
    const closeBtn = document.getElementById('amdal-close-window-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        toggleChat(false);
      });
    }

    // Quick Prompt Chips Delegation
    const messagesContainer = document.getElementById('amdal-messages-container');
    messagesContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.amdal-prompt-chip');
      if (chip) {
        const promptText = chip.getAttribute('data-prompt');
        if (promptText) {
          handleUserSend(promptText);
        }
      }
    });

    // Chat Form Submit
    const form = document.getElementById('amdal-chat-form');
    const input = document.getElementById('amdal-input-field');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = input.value.trim();
      if (val && !isSending) {
        handleUserSend(val);
        input.value = '';
      }
    });
  }

  // Dismiss Callout Gracefully
  function dismissCallout(calloutEl) {
    if (!calloutEl || calloutEl.classList.contains('is-hiding')) return;
    calloutEl.classList.add('is-hiding');
    sessionStorage.setItem('amdal_callout_dismissed', 'true');
    setTimeout(() => {
      calloutEl.style.display = 'none';
    }, 500);
  }

  // Toggle Chat Window
  function toggleChat(open) {
    isChatOpen = open;
    const win = document.getElementById('amdal-chat-window');
    const trigger = document.getElementById('amdal-widget-trigger');
    const input = document.getElementById('amdal-input-field');

    if (open) {
      win.classList.remove('is-hidden');
      requestAnimationFrame(() => {
        win.classList.add('is-open');
      });
      trigger.style.display = 'none';

      // Adapt to mobile visual viewport if mobile
      if (window.innerWidth < 768 && window.visualViewport) {
        win.style.height = `${window.visualViewport.height}px`;
        win.style.top = `${window.visualViewport.offsetTop}px`;
      }

      if (input) {
        setTimeout(() => input.focus(), 300);
      }
    } else {
      win.classList.remove('is-open');
      setTimeout(() => {
        win.classList.add('is-hidden');
        trigger.style.display = 'inline-flex';
        win.style.height = '';
        win.style.top = '';
      }, 350);
    }
  }

  // Collapse Header on User Interaction
  function collapseHeader() {
    const headerEl = document.getElementById('amdal-chat-header');
    if (headerEl && !headerEl.classList.contains('is-collapsed')) {
      headerEl.classList.add('is-collapsed');
    }
  }

  // Append Message Bubble
  function appendMessage(role, text) {
    const container = document.getElementById('amdal-messages-container');
    if (!container) return;

    const msgEl = document.createElement('div');
    msgEl.className = `amdal-msg amdal-msg-${role}`;

    const bubbleEl = document.createElement('div');
    bubbleEl.className = 'amdal-bubble';
    bubbleEl.innerHTML = renderMarkdown(text);

    msgEl.appendChild(bubbleEl);
    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight;

    // Record History
    chatHistory.push({ role, text });
  }

  // Show Typing Indicator
  function showTypingIndicator() {
    const container = document.getElementById('amdal-messages-container');
    if (!container) return null;

    const indicator = document.createElement('div');
    indicator.id = 'amdal-typing-indicator';
    indicator.className = 'amdal-msg amdal-msg-assistant';
    indicator.innerHTML = `
      <div class="amdal-typing-dots">
        <span class="amdal-dot"></span>
        <span class="amdal-dot"></span>
        <span class="amdal-dot"></span>
      </div>
    `;
    container.appendChild(indicator);
    container.scrollTop = container.scrollHeight;
    return indicator;
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('amdal-typing-indicator');
    if (indicator) indicator.remove();
  }

  // Handle User Message Submission
  async function handleUserSend(text) {
    if (!text || isSending) return;
    isSending = true;

    // Smoothly collapse header to maximize reading room
    collapseHeader();

    const sendBtn = document.getElementById('amdal-send-btn');
    if (sendBtn) sendBtn.disabled = true;

    appendMessage('user', text);
    const indicator = showTypingIndicator();

    try {
      let assistantReply = '';

      if (CLOUD_RUN_ENDPOINT && CLOUD_RUN_ENDPOINT.trim() !== '') {
        // Send to Vercel/Cloud Run Endpoint with 10-turn history
        const endpoint = CLOUD_RUN_ENDPOINT.replace(/\/+$/, '') + '/api/chat';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: chatHistory.slice(-10)
          })
        });

        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }

        const data = await res.json();
        assistantReply = data.reply || data.message || '';
      } else {
        // Intelligent Local Fallback Mode
        await new Promise(r => setTimeout(r, 600)); // Natural response delay
        assistantReply = generateLocalResponse(text);
      }

      removeTypingIndicator();
      appendMessage('assistant', assistantReply);
    } catch (err) {
      console.warn('[Asisten Mas Amdal] Backend unreachable, using local fallback:', err.message);
      removeTypingIndicator();
      const fallbackReply = generateLocalResponse(text);
      appendMessage('assistant', fallbackReply);
    } finally {
      isSending = false;
      if (sendBtn) sendBtn.disabled = false;
    }
  }

  // Global Function for external trigger
  window.openAmdalAssistant = function (initialPrompt) {
    toggleChat(true);
    if (initialPrompt && typeof initialPrompt === 'string') {
      setTimeout(() => {
        handleUserSend(initialPrompt);
      }, 400);
    }
  };

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectStyles();
      createWidgetDOM();
    });
  } else {
    injectStyles();
    createWidgetDOM();
  }
})();
