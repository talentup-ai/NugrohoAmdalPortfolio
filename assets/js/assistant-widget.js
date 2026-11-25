/**
 * Asisten Mas Amdal - Interactive AI Portfolio Assistant Widget
 * Designed for: Nugroho Amdal, S.S., CI. Portfolio (https://nugrohoamdalportfolio.dpdns.org)
 * Features:
 *  - 1.2s smooth slide-up entrance with subtle pulse ring
 *  - 6s auto-dismiss bilingual callout bubble (1x per session)
 *  - Multi-channel handover (WhatsApp with contextual topic, LinkedIn, Instagram)
 *  - Interactive markdown link parser ([Text](URL))
 *  - Serverless Google Cloud Run (Gemini 2.5 Flash) backend with intelligent local fallback
 */

// =========================================================================
// KONFIGURASI BACKEND CLOUD RUN
// Ganti nilai string di bawah dengan URL produksi Google Cloud Run Anda.
// Contoh: const CLOUD_RUN_ENDPOINT = 'https://backend-assistant-one.vercel.app';
// Jika dibiarkan kosong (''), widget beroperasi dalam Mode Cerdas Lokal (Local Fallback).
// =========================================================================
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
      headerSubtitle: 'Siap menemani & bantu info portofolio',
      welcome: 'Halo! Selamat datang di portofolio Mas Amdal. Saya siap menemani Anda menjelajahi sistem HRIS, recruitment hub, studi kasus C-Level, maupun info pelatihan. Ada yang ingin Anda eksplorasi bersama?',
      quickPromptsLabel: 'Topik cepat yang sering ditanyakan:',
      prompts: [
        'Lihat demo sistem HRIS, Recruitment & EVP',
        'Info sesi Coaching & Bootcamp karier',
        'Info In-House Training & Speaking'
      ],
      handoverLabel: 'Ingin menyapa atau ngobrol langsung dengan Mas Amdal?',
      placeholder: 'Tulis pertanyaan atau pilih topik di atas...',
      sendBtnAria: 'Kirim pesan ke asisten',
      closeBtnAria: 'Tutup jendela asisten',
      waDefault: 'Halo Mas Amdal, saya sedang melihat portofolio Anda dan ingin berdiskusi lebih lanjut.',
      waContextPrefix: 'Halo Mas Amdal, saya baru saja berdiskusi dengan asisten portofolio Anda mengenai: '
    },
    en: {
      callout: "Need help exploring? Ask Mas Amdal's Assistant here 😸",
      btnLabel: "Ask Mas Amdal's Assistant",
      onlineStatus: 'Online',
      headerTitle: "Mas Amdal's Assistant",
      headerSubtitle: 'Here to guide you through the portfolio',
      welcome: "Hello! Welcome to Mas Amdal's portfolio. I'm here to guide you through his HRIS systems, recruitment hubs, C-Level case studies, and training programs. How may I assist you today?",
      quickPromptsLabel: 'Frequently explored topics:',
      prompts: [
        'Explore live HRIS, Recruitment & EVP demos',
        'Career Coaching & Bootcamp details',
        'In-House Training & Speaking services'
      ],
      handoverLabel: 'Prefer to connect or talk directly with Mas Amdal?',
      placeholder: 'Type your question or choose a topic above...',
      sendBtnAria: 'Send message to assistant',
      closeBtnAria: 'Close assistant window',
      waDefault: 'Hello Mas Amdal, I am exploring your portfolio and would love to connect directly.',
      waContextPrefix: 'Hello Mas Amdal, I was just discussing with your portfolio assistant regarding: '
    }
  };

  const t = isEn ? I18N.en : I18N.id;

  // Social & Contact URLs
  const CONTACT_LINKS = {
    whatsapp: 'https://wa.me/6285395940406',
    linkedin: 'https://www.linkedin.com/in/nugroho-amdal',
    instagram: 'https://instagram.com/nugrohoamdal'
  };

  // State Management
  let chatHistory = [];
  let isChatOpen = false;
  let isSending = false;
  let recentTopic = '';

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
        --amdal-gold: #F59E0B;
        --amdal-emerald: #10B981;
        --amdal-ease: cubic-bezier(0.16, 1, 0.3, 1);
      }

      /* Container */
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
        0% {
          box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7);
        }
        70% {
          box-shadow: 0 0 0 18px rgba(37, 99, 235, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
        }
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
        padding: 10px 14px 10px 14px;
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
        padding: 16px 18px;
        background: rgba(15, 23, 42, 0.85);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-shrink: 0;
      }

      .amdal-header-profile {
        display: flex;
        align-items: center;
        gap: 12px;
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
        max-width: 88%;
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
        padding: 12px 15px;
        font-size: 13.5px;
        line-height: 1.55;
        border-radius: 18px;
        word-break: break-word;
      }

      .amdal-msg-assistant .amdal-bubble {
        background: #1E293B;
        border: 1px solid rgba(255, 255, 255, 0.07);
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

      /* Clickable Markdown Resource Link Pills */
      .amdal-chat-link {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: rgba(37, 99, 235, 0.18);
        border: 1px solid rgba(96, 165, 250, 0.4);
        color: #93C5FD !important;
        padding: 3px 9px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        text-decoration: none;
        margin: 4px 2px;
        vertical-align: middle;
        transition: all 0.2s var(--amdal-ease);
      }

      .amdal-chat-link:hover {
        background: rgba(37, 99, 235, 0.35);
        color: #FFFFFF !important;
        border-color: #60A5FA;
        transform: translateY(-1px);
        box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
      }

      /* Quick Prompts Container */
      .amdal-prompts-container {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 8px;
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
        background: rgba(37, 99, 235, 0.15);
        border-color: rgba(96, 165, 250, 0.4);
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

      /* Multi-Channel Handover Panel */
      .amdal-handover-panel {
        padding: 12px 16px;
        background: rgba(15, 23, 42, 0.95);
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex-shrink: 0;
      }

      .amdal-handover-title {
        font-size: 11px;
        font-weight: 500;
        color: #94A3B8;
        text-align: center;
      }

      .amdal-handover-buttons {
        display: grid;
        grid-template-columns: 1.4fr 1fr 1fr;
        gap: 6px;
      }

      .amdal-handover-btn {
        padding: 7px 10px;
        border-radius: 10px;
        font-size: 11.5px;
        font-weight: 600;
        text-decoration: none;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: all 0.2s var(--amdal-ease);
      }

      .amdal-handover-wa {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        color: #FFFFFF;
        border: 1px solid rgba(16, 185, 129, 0.4);
      }

      .amdal-handover-wa:hover {
        background: linear-gradient(135deg, #10B981 0%, #059669 100%);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
        transform: translateY(-1px);
      }

      .amdal-handover-social {
        background: rgba(255, 255, 255, 0.05);
        color: #CBD5E1;
        border: 1px solid rgba(255, 255, 255, 0.09);
      }

      .amdal-handover-social:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #FFFFFF;
        border-color: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
      }

      /* Chat Input Bar */
      .amdal-chat-input-bar {
        padding: 10px 14px 14px 14px;
        background: #060B14;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
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
        font-size: 13px;
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

      /* Mobile Media Query */
      @media (max-width: 640px) {
        #amdal-assistant-root {
          bottom: 16px;
          right: 16px;
        }

        .amdal-widget-trigger {
          padding: 8px 14px 8px 10px;
        }

        .amdal-trigger-text {
          font-size: 12.5px;
        }

        .amdal-chat-window {
          position: fixed;
          bottom: 12px;
          right: 12px;
          left: 12px;
          width: auto;
          max-width: none;
          height: calc(100vh - 80px);
          max-height: 600px;
          margin-bottom: 0;
        }

        .amdal-callout-bubble {
          max-width: calc(100vw - 32px);
        }
      }
    `;
    document.head.appendChild(styleEl);
  }

  // Markdown Parser to HTML
  function renderMarkdown(mdText) {
    if (!mdText) return '';

    let html = mdText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Markdown Links: [Title](https://...)
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (match, title, url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="amdal-chat-link"><span>${title}</span> <svg style="width:11px;height:11px;display:inline-block;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>`;
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

    // Intelligent Local Fallback Engine (Human-Like Conversational Concierge)
  function generateLocalResponse(userMessage) {
    const text = userMessage.toLowerCase().trim();

    // 1. Simple Greetings & Small Talk (Short & Natural, no brochure dump)
    if (/^(halo|hai|hi|hello|pagi|siang|sore|malam|test|tes|permisi|assalamu|p)[\s!.,?]*$/i.test(text)) {
      if (isEn) {
        return "Hello! Warm welcome to Mas Amdal's portfolio. I'm his personal assistant here to help. Are you looking into his automated HR systems, career mentorship, or perhaps corporate training?";
      } else {
        return "Halo! Selamat datang di portofolio Mas Amdal. Saya asisten pribadi Mas Amdal yang siap menemani Anda hari ini. 😊\n\nAda hal spesifik yang ingin Anda ketahui seputar sistem HR, bimbingan karier, atau sesi corporate training bersama Mas Amdal?";
      }
    }

    // 2. Career Bimbingan / Dapat Kerja / Bootcamp / Coaching
    if (/kerja|bootcamp|bimbing|dapat kerja|mentor|coaching|cv|resume|interview|loker|lamar/i.test(text)) {
      recentTopic = 'Bimbingan Karier & Bootcamp Talent Up';
      if (isEn) {
        return "Mas Amdal offers structured career mentorship through [Talent Up Career Development Bootcamp](https://talentup.myscalev.com/careerdevelopment) and private [1-on-1 Career Coaching](https://nugrohoamdalportfolio.dpdns.org/products.html).\n\nTo be completely transparent: Mas Amdal **does not make empty job-placement guarantees**, but provides intensive tactical preparation—from ATS resume revamps and LinkedIn positioning to mock interviews and cross-border remote job hunting secrets.\n\nYou can also test your resume keyword score on the free [Career Clarity App](https://careerclarity-app.vercel.app/). What role or industry are you currently targeting?";
      } else {
        return "Untuk pendampingan karier, Mas Amdal memiliki program [Talent Up Career Development Bootcamp](https://talentup.myscalev.com/careerdevelopment) dan sesi privat [1-on-1 Career Coaching](https://nugrohoamdalportfolio.dpdns.org/products.html).\n\nSebagai catatan jujur: Mas Amdal **tidak menjual janji instan penyaluran kerja**, melainkan membekali Anda dengan senjata perang nyata—mulai dari bedah CV ATS mendalam, strategi menembus rekrutmen remote/multinasional, hingga simulasi wawancara intensif.\n\nAnda juga bisa mencoba cek kata kunci resume secara gratis di [Career Clarity App](https://careerclarity-app.vercel.app/). Boleh tahu posisi atau bidang apa yang sedang ingin Anda tuju saat ini?";
      }
    }

    // 3. Client Portfolio / Track Record / Siapa yang pernah di-handle
    if (/client|klien|handle|siapa aja|perusahaan|kampus|mitra|injourney|hadi|pengalaman/i.test(text)) {
      recentTopic = 'Portofolio Klien & Rekam Jejak Mas Amdal';
      if (isEn) {
        return "Mas Amdal has guided a broad range of leaders and organizations:\n\n- **Executive & Enterprise:** Coached **Pak Hadi (Division Head at Injourney Airports / PT Angkasa Pura II)** using the BLUF Framework and diplomatic hedging in high-stakes negotiations with 46 international airlines towards Skytrax 5-Star status.\n- **Global Scope:** Managed end-to-end HR operations for **~500 employees across 26 countries at The KPI Institute** (Melbourne/Remote).\n- **Industry & Higher Ed:** Facilitated masterclasses and speaking sessions for **NusaWork HR Tech, AIESEC**, as well as **Universitas Brawijaya (UB), UM, and UTM**.\n- **Job Seekers:** Mentored **1,150+ professionals and graduates** through Talent Up.\n\nIs there a specific organizational challenge or collaboration format you'd like to explore?";
      } else {
        return "Mas Amdal telah mendampingi beragam klien dari level eksekutif hingga ribuan talenta:\n\n- **Level Eksekutif & BUMN:** Pendampingan Executive Coaching untuk **Pak Hadi (Division Head di Injourney Airports / PT Angkasa Pura II)** menggunakan BLUF Framework & diplomatic hedging dalam negosiasi dengan 46 maskapai internasional menuju standar Skytrax 5-Star.\n- **Skala Global:** Mengelola operasional HR untuk **~500 karyawan lintas 26 negara di The KPI Institute** (Melbourne/Remote).\n- **Industri & Kampus:** Mengisi sesi pelatihan dan seminar di **NusaWork HR Tech, AIESEC**, serta kampus seperti **Universitas Brawijaya (UB), UM, dan UTM**.\n- **Profesional & Pencari Kerja:** Membimbing **1.150+ talenta** melalui Talent Up.\n\nApakah ada kebutuhan korporasi atau topik diskusi khusus yang sedang Anda rencanakan?";
      }
    }

    // 4. Automated HRIS & Payroll System
    if (/hris|payroll|gaji|pph|bpjs|pesangon|slip/i.test(text)) {
      recentTopic = 'Automated HRIS & Payroll 27-Sheet Zero-Macro';
      if (isEn) {
        return "Mas Amdal architected the **Automated HRIS & Payroll 27-Sheet Zero-Macro Engine**, a fully deterministic system built without macros or VBA to eliminate calculation errors.\n\nIt automatically calculates PPh 21 TER (PP 58/2023), BPJS, PP 35/2021 severance, tracks 5-year PKWT contracts, and exports mass PDF payslips via Google Apps Script.\n\nFeel free to explore the live simulation here:\n- [Interactive HRIS Dashboard Demo](https://nugrohoamdalportfolio.dpdns.org/hris-dashboard.html)\n- [Live Spreadsheet Preview](https://docs.google.com/spreadsheets/d/1pP88IkNPFuhmDDGQXu2AijxQprn5hrVNawwlZHRL9mg/preview)\n\nWould you like to discuss customizing this system for your company's payroll rules?";
      } else {
        return "Mas Amdal merancang **Automated HRIS & Payroll 27-Sheet Zero-Macro**, sistem operasional HR dan penggajian terintegrasi 27 sheet tanpa makro/VBA yang rumit.\n\nSistem ini menghitung otomatis PPh 21 TER (PP 58/2023), BPJS Kesehatan & Ketenagakerjaan, pesangon PP 35/2021, memantau kontrak PKWT 5 tahun, serta dilengkapi 33 audit rules dan ekspor massal slip gaji PDF.\n\nAnda bisa langsung mencoba simulasinya di sini:\n- [Simulasi Interaktif Dashboard HRIS](https://nugrohoamdalportfolio.dpdns.org/hris-dashboard.html)\n- [Pratinjau Spreadsheet HRIS & Payroll](https://docs.google.com/spreadsheets/d/1pP88IkNPFuhmDDGQXu2AijxQprn5hrVNawwlZHRL9mg/preview)\n\nApakah sistem penggajian di perusahaan Anda saat ini membutuhkan penyesuaian khusus?";
      }
    }

    // 5. Recruitment & MPP Hub
    if (/rekrut|recruitment|mpp|hiring|tat|sla|sourcing|talent pool/i.test(text)) {
      recentTopic = 'Automated Recruitment & Manpower Planning Hub';
      if (isEn) {
        return "The **Automated Recruitment & MPP Hub (10-Module)** was engineered by Mas Amdal to eliminate recruiter burnout and optimize time-to-hire through stage-by-stage SLA tracking, a consent-based talent pool, and 1-click WhatsApp/Email invitation generators.\n\nExplore the live interface:\n- [Interactive Recruitment Dashboard](https://nugrohoamdalportfolio.dpdns.org/recruitment-dashboard.html)\n- [Live Spreadsheet Preview](https://docs.google.com/spreadsheets/d/1jEyWThrkrcBAh1gMRVEz1IpD3dTopV6L6Ar8SeBNOyA/preview)\n\nHow is your current hiring volume and recruitment SLA managed?";
      } else {
        return "Mas Amdal merancang **Automated Recruitment & MPP Hub 10-Modul** untuk mengeliminasi recruiter burnout dan memangkas waktu rekrutmen melalui pelacakan SLA per tahapan, talent pool terpusat, dan generator undangan interview 1-klik terhubung ke WhatsApp & Email.\n\nSilakan jelajahi dasbornya di sini:\n- [Simulasi Dashboard Rekrutmen & MPP](https://nugrohoamdalportfolio.dpdns.org/recruitment-dashboard.html)\n- [Pratinjau Spreadsheet Recruitment Hub](https://docs.google.com/spreadsheets/d/1jEyWThrkrcBAh1gMRVEz1IpD3dTopV6L6Ar8SeBNOyA/preview)\n\nApakah saat ini tim rekrutmen Anda sedang menghadapi tantangan *time-to-hire* tertentu?";
      }
    }

    // 6. EVP Analytics & Culture Diagnostic
    if (/evp|culture|budaya|retensi|diagnostic|give-get|voe/i.test(text)) {
      recentTopic = 'Employee Value Proposition (EVP) Analytics';
      if (isEn) {
        return "The **EVP Analytics & Culture Diagnostic Engine (6-Tab)** bridges the gap between management promises and daily employee reality by auditing Credibility Gap, Evidence Gap, and Give-Get ratios, prioritizing zero-budget Quick Wins.\n\nCheck out the dashboard:\n- [Interactive EVP Dashboard Demo](https://nugrohoamdalportfolio.dpdns.org/evp-dashboard.html)\n- [Live Spreadsheet Preview](https://docs.google.com/spreadsheets/d/1bjEXI_uyu5ojFN9foBvKK7BhsLbYXDJkyymYlNb2fnc/preview)\n\nIs employee retention or employer branding alignment a current focus for your organization?";
      } else {
        return "**Employee Value Proposition (EVP) Analytics & Culture Diagnostic 6-Tab** dirancang Mas Amdal untuk mendiagnosis kesenjangan janji manajemen vs realitas karyawan lapangan, membedah Give-Get Ratio, serta menghasilkan Priority Action Score (PAS) untuk Quick Wins tanpa biaya tambahan.\n\nCoba simulasinya di sini:\n- [Simulasi Interaktif Dashboard EVP](https://nugrohoamdalportfolio.dpdns.org/evp-dashboard.html)\n- [Pratinjau Spreadsheet EVP Diagnostic](https://docs.google.com/spreadsheets/d/1bjEXI_uyu5ojFN9foBvKK7BhsLbYXDJkyymYlNb2fnc/preview)\n\nApakah retensi talenta atau kesiapan SOP kerja fleksibel sedang menjadi perhatian tim Anda?";
      }
    }

    // 7. Corporate In-House Training, Speaking & Rate Card
    if (/in-house|training|speaking|webinar|workshop|kuliah tamu|biaya|harga|rate card|honor/i.test(text)) {
      recentTopic = 'Corporate In-House Training & Keynote Speaking';
      if (isEn) {
        return "Mas Amdal is a **BNSP Level 4 Certified Instructor** and **Best HR of the Year 2023**.\n\n- **In-House Corporate Training Bundling (Batch):** Rp10.000.000 – Rp25.000.000 flat-rate for up to 30+ participants (no extra charge per head beyond 30).\n- **Keynote Speaking / Guest Lecture (60-90 Mins):** Rp3.000.000 – Rp8.000.000 (Corporate) / Rp1.000.000 – Rp1.500.000 (University/Non-Profit).\n- All formats can be flexibly aligned with your organizational budget and learning outcomes.\n\nReview the complete details: [Products & Rate Card](https://nugrohoamdalportfolio.dpdns.org/products.html).\n\nWhat topic or event date are you currently considering?";
      } else {
        return "Mas Amdal adalah **Certified Instructor BNSP Level 4** dan peraih **Best HR of the Year 2023**.\n\n- **In-House Corporate Training Bundling (Batch):** **Rp 10.000.000 – Rp 25.000.000 flat-rate** untuk s/d 30+ peserta (lebih dari 30 peserta harga tetap sama, materi tailored).\n- **Keynote Speaking / Kuliah Tamu (60–90 Menit):** Rp 3.000.000 – Rp 8.000.000 (Korporasi) / Rp 1.000.000 – Rp 1.500.000 (Universitas/Non-Profit disesuaikan).\n- Semua skema biaya sangat terbuka untuk penyesuaian ruang lingkup dan anggaran.\n\nLihat rincian lengkap: [Katalog Produk & Rate Card](https://nugrohoamdalportfolio.dpdns.org/products.html).\n\nKira-kira topik atau format sesi seperti apa yang sedang Anda rencanakan?";
      }
    }

    // 8. Specific Bio Inquiry (Only triggered if specifically asking about bio)
    if (/siapa (itu|sih|sebenarnya)? mas amdal|biodata|profil lengkap|tentang mas amdal|background mas amdal/i.test(text)) {
      recentTopic = 'Profil & Kredensial Mas Amdal';
      if (isEn) {
        return "**Nugroho Amdal, S.S., CI. ('Mas Amdal')** is an HR Technology & Workflow Architect, BNSP Level 4 Certified Instructor, and Best HR of the Year 2023. With experience managing ~500 employees across 26 countries at The KPI Institute, he specializes in deterministic HR systems, culture diagnostics, and executive communication coaching.\n\nLearn more about his journey: [Solution Stories & Case Studies](https://nugrohoamdalportfolio.dpdns.org/stories.html).\n\nWhat area of his expertise would you like to explore further?";
      } else {
        return "**Nugroho Amdal, S.S., CI. ('Mas Amdal')** adalah HR Technology & Workflow Architect, Certified Instructor BNSP Level 4, dan peraih Best HR of the Year 2023. Berpengalaman mengelola ~500 karyawan lintas 26 negara di The KPI Institute, Mas Amdal berfokus pada otomatisasi sistem HR, analitik budaya EVP, dan coaching komunikasi kepemimpinan.\n\nPelajari studi kasusnya di: [Bedah Studi Kasus & Solusi](https://nugrohoamdalportfolio.dpdns.org/stories.html).\n\nAda aspek tertentu yang ingin kita bahas bersama?";
      }
    }

    // Default Conversational Fallback
    recentTopic = 'Eksplorasi Portofolio Mas Amdal';
    if (isEn) {
      return "I'm here to help you navigate Mas Amdal's work! We can explore his live [HRIS & Payroll Demo](https://nugrohoamdalportfolio.dpdns.org/hris-dashboard.html), [Recruitment Hub](https://nugrohoamdalportfolio.dpdns.org/recruitment-dashboard.html), [EVP Analytics](https://nugrohoamdalportfolio.dpdns.org/evp-dashboard.html), or discuss [Bootcamp & Coaching](https://talentup.myscalev.com/careerdevelopment).\n\nWhat brings you here today?";
    } else {
      return "Saya siap membantu Anda menjelajahi portofolio Mas Amdal! Anda bisa melihat langsung simulasi sistem seperti [HRIS Dashboard](https://nugrohoamdalportfolio.dpdns.org/hris-dashboard.html), [Recruitment Hub](https://nugrohoamdalportfolio.dpdns.org/recruitment-dashboard.html), [EVP Analytics](https://nugrohoamdalportfolio.dpdns.org/evp-dashboard.html), maupun info seputar [Bootcamp & Coaching Karier](https://talentup.myscalev.com/careerdevelopment).\n\nAda topik yang ingin Anda eksplorasi lebih dulu?";
    }
  }

  // Update Dynamic Handover WhatsApp Link
  function updateHandoverLinks() {
    const waBtn = document.getElementById('amdal-handover-wa-btn');
    if (!waBtn) return;

    let textToSend = t.waDefault;
    if (recentTopic) {
      textToSend = `${t.waContextPrefix}${recentTopic}. Mohon info ketersediaan Mas Amdal untuk berdiskusi lebih lanjut.`;
    }
    waBtn.href = `${CONTACT_LINKS.whatsapp}?text=${encodeURIComponent(textToSend)}`;
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

    // 2. Chat Window Modal
    const chatWindow = document.createElement('div');
    chatWindow.id = 'amdal-chat-window';
    chatWindow.className = 'amdal-chat-window is-hidden';
    chatWindow.innerHTML = `
      <div class="amdal-chat-header">
        <div class="amdal-header-profile">
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

      <!-- Multi-Channel Handover Panel -->
      <div class="amdal-handover-panel">
        <div class="amdal-handover-title">${t.handoverLabel}</div>
        <div class="amdal-handover-buttons">
          <a href="${CONTACT_LINKS.whatsapp}?text=${encodeURIComponent(t.waDefault)}" 
             target="_blank" rel="noopener noreferrer" 
             class="amdal-handover-btn amdal-handover-wa" id="amdal-handover-wa-btn">
            <svg style="width: 14px; height: 14px;" fill="currentColor" viewBox="0 0 24 24"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.5c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.24-.75-.67-1.25-1.49-1.39-1.74-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.43 1.03 2.6c.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.17-.48-.29z"/></svg>
            <span>WhatsApp</span>
          </a>
          <a href="${CONTACT_LINKS.linkedin}" 
             target="_blank" rel="noopener noreferrer" 
             class="amdal-handover-btn amdal-handover-social">
            <svg style="width: 13px; height: 13px;" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.32a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z"/></svg>
            <span>LinkedIn</span>
          </a>
          <a href="${CONTACT_LINKS.instagram}" 
             target="_blank" rel="noopener noreferrer" 
             class="amdal-handover-btn amdal-handover-social">
            <svg style="width: 13px; height: 13px;" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            <span>Instagram</span>
          </a>
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

    // Bind Event Listeners
    setupEvents(calloutEl, chatWindow, triggerBtn);
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
      if (input) {
        setTimeout(() => input.focus(), 300);
      }
    } else {
      win.classList.remove('is-open');
      setTimeout(() => {
        win.classList.add('is-hidden');
        trigger.style.display = 'inline-flex';
      }, 350);
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

    const sendBtn = document.getElementById('amdal-send-btn');
    if (sendBtn) sendBtn.disabled = true;

    appendMessage('user', text);
    const indicator = showTypingIndicator();

    try {
      let assistantReply = '';

      if (CLOUD_RUN_ENDPOINT && CLOUD_RUN_ENDPOINT.trim() !== '') {
        // Send to Cloud Run Endpoint
        const endpoint = CLOUD_RUN_ENDPOINT.replace(/\/+$/, '') + '/api/chat';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: chatHistory.slice(-6)
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
      updateHandoverLinks();
    } catch (err) {
      console.warn('[Asisten Mas Amdal] Backend unreachable, using local fallback:', err.message);
      removeTypingIndicator();
      const fallbackReply = generateLocalResponse(text);
      appendMessage('assistant', fallbackReply);
      updateHandoverLinks();
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
