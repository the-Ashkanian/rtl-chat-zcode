(() => {
  const VERSION = '0.2.3'
  const STYLE_ID = 'rtl-chat-style'
  const BADGE_ID = 'rtl-chat-badge'
  const VIA = 'ext'

  const CSS = `
/* RTL Chat v0.2.3 — direction decided per message by first letter (JS sets [dir]).
   Timeline stays ltr (app default); only Persian messages flip to rtl.
   User bubbles always sit on the right; assistant Persian goes right, English/code left. */

[data-v4-timeline-scroll],
[data-v4-timeline-message-layer],
[data-v4-timeline-content-column],
[data-v4-timeline-virtual-history],
[data-trajectory-timeline],
[data-v4-draft-greeting],
[data-v4-draft-suggested-prompts],
[data-testid="chat-empty"] {
  direction: ltr;
}

/* User row is flex-col + items-end (bubble on the right in original LTR).
   Kept ltr so user bubbles always stay on the right.
   Text direction still comes from each bubble's own [dir]. */
[data-v4-timeline-scroll] [class*="group/user-row"] {
  direction: ltr;
}

/* Composer sits inside timeline-scroll (rtl) — restore original LTR chrome/toolbars */
[data-v4-composer-dock],
[data-v4-composer-dock-content],
[data-v4-composer-dock] form,
[data-v4-composer-dock] [class*="group/toolbar"] {
  direction: ltr !important;
}

/* Question (elicitation) dialog: keep the card chrome LTR; JS sets [dir]
   on each text leaf from its own first letter, and [dir] aligns via start. */
[data-elicitation-dialog-card],
[data-elicitation-dialog-body],
[data-elicitation-dialog-footer] {
  direction: ltr;
}
[data-elicitation-dialog-card] [dir] {
  text-align: start;
}
/* Flip Tailwind text-left inside an RTL dialog node (option buttons). */
[data-elicitation-dialog-card] [dir="rtl"][class~="text-left"],
[data-elicitation-dialog-card] [dir="rtl"] [class~="text-left"] {
  text-align: right !important;
}

/* Message roots: JS sets dir from first word. text-align:start follows it
   (rtl → right, ltr → left). Do NOT force direction/text-align here. */
[data-trajectory-message-role],
[data-trajectory-message-content],
[data-trajectory-expanded-content-shell],
[data-trajectory-user-content-card],
[data-v4-user-input-bubble],
[data-v4-user-input-attachments],
[data-v4-user-input-media-attachments],
[data-v4-user-input-epilogue],
[data-v4-user-input-collapsible-content],
[data-reasoning-content],
[data-trajectory-role-label],
[data-trajectory-message-actions],
[data-trajectory-call-metadata] {
  text-align: start;
}

[data-trajectory-role-label] {
  padding-right: 0 !important;
  padding-left: 0.25rem !important;
}

/* Radius flip only when that user message is actually RTL (first word Persian) */
[data-v4-user-input-bubble][dir="rtl"] {
  border-top-left-radius: 0.125rem !important;
  border-top-right-radius: 0.75rem !important;
}

/* Editor: dir set live by JS from typed first word — no blanket rtl */
[data-lexical-editor="true"] p,
[data-testid="chat-input"] p {
  text-align: start;
}

/* Placeholder pinned right only while editor itself is rtl */
[data-v4-composer-dock] [data-lexical-editor="true"][dir="rtl"] ~ .pointer-events-none,
[data-v4-composer-dock] [data-testid="chat-input"][dir="rtl"] ~ .pointer-events-none {
  left: auto !important;
  right: 0 !important;
}

[data-streamdown="code-block"],
[data-streamdown="code-block-body"],
[data-streamdown="code-block-header"],
[data-streamdown="code-block-actions"],
[data-streamdown="inline-code"],
[data-streamdown="table"],
[data-streamdown="table-wrapper"],
[data-streamdown="table-header"],
[data-streamdown="table-body"],
[data-streamdown="table-row"],
[data-streamdown="table-cell"],
[data-streamdown="table-header-cell"],
[data-streamdown="mermaid"],
[data-streamdown="mermaid-block"],
pre,
code,
kbd,
samp,
.katex,
[data-inline-diff-preview],
[data-diff-viewer],
[data-diff-span],
[data-tool-name] {
  direction: ltr !important;
  text-align: left !important;
  unicode-bidi: isolate !important;
}

/* Flip Tailwind text-left only inside an RTL message root */
[data-v4-timeline-scroll] [dir="rtl"] [class~="text-left"],
[data-v4-timeline-scroll] [class~="text-left"][dir="rtl"] {
  text-align: right !important;
}
`

  const DIR_SELECTORS = [
    '[data-trajectory-message-content]',
    '[data-trajectory-expanded-content-shell]',
    '[data-trajectory-user-content-card]',
    '[data-v4-user-input-bubble]',
    '[data-reasoning-content]',
    '[data-streamdown]',
    '[data-v4-draft-greeting]',
    '[data-elicitation-dialog-card]',
    '[data-elicitation-dialog-card] [role="option"]',
    '[data-elicitation-dialog-card] p',
    '[data-elicitation-dialog-card] li',
    '[data-lexical-editor="true"]',
    '[data-lexical-editor="true"] p',
    '[data-testid="chat-input"]',
    '[data-testid="chat-input"] p'
  ]

  const SELECTORS = [
    '[data-workspace-conversation-frame]',
    '[data-v4-timeline-scroll]',
    '[data-v4-timeline-content-column]',
    '[data-trajectory-timeline]',
    '[data-trajectory-message-role="user"]',
    '[data-trajectory-message-role="assistant"]',
    '[data-v4-user-input-bubble]',
    '[data-v4-composer-dock="true"]',
    '[data-lexical-editor="true"]',
    '[data-testid="chat-input"]',
    '[data-streamdown="code-block"]',
    '[data-v4-draft-greeting]'
  ]

  // First letter → direction: Persian/Arabic letter → rtl, Latin letter → ltr.
  // Leading digits/punctuation/emoji/whitespace are skipped; no letter → null.
  function firstWordDir(text) {
    const t = String(text || '')
    if (!t.trim()) return null
    for (const ch of t) {
      if (/\s/.test(ch)) continue
      if (/[؀-ۿݐ-ݿࢠ-ࣿיִ-﷿ﹰ-﻿]/.test(ch)) return 'rtl'
      if (/[A-Za-z]/.test(ch)) return 'ltr'
    }
    return null
  }

  function via() {
    window.__RTL_CHAT_VIAS = window.__RTL_CHAT_VIAS || []
    if (!window.__RTL_CHAT_VIAS.includes(VIA)) window.__RTL_CHAT_VIAS.push(VIA)
    return window.__RTL_CHAT_VIAS.join('+')
  }

  function ensureStyle() {
    let style = document.getElementById(STYLE_ID)
    if (!style) {
      style = document.createElement('style')
      style.id = STYLE_ID
      ;(document.head || document.documentElement).appendChild(style)
    }
    if (style.textContent !== CSS) style.textContent = CSS
  }

  function applyDir(el, emptyDefault) {
    if (!el) return
    const text = el.innerText || el.textContent || ''
    let d = firstWordDir(text)
    if (!d && !text.trim() && emptyDefault) d = emptyDefault
    if (!d) return
    if (el.dir !== d) el.dir = d
  }

  // Inline/leaf labels only — never a block that wraps whole messages
  function isLeafish(el) {
    const blockish = /^(P|DIV|SECTION|ARTICLE|UL|OL|LI|H[1-6]|TABLE|TR|FORM)$/
    if (blockish.test(el.tagName)) return false
    for (const c of el.children) {
      if (blockish.test(c.tagName)) return false
    }
    return true
  }

  function applyDirs() {
    const seen = new Set()

    // turn-unit mixes user + assistant — never set dir from the whole block
    for (const el of document.querySelectorAll('[data-v4-turn-unit]')) {
      if (el.hasAttribute('dir')) el.removeAttribute('dir')
    }

    for (const sel of DIR_SELECTORS) {
      let nodes = []
      try { nodes = document.querySelectorAll(sel) } catch (_) { continue }
      for (const el of nodes) {
        if (seen.has(el)) continue
        seen.add(el)
        const isEditor = el.matches('[data-lexical-editor="true"], [data-testid="chat-input"]')
        const isEditorP = el.matches('p') && !!el.closest('[data-lexical-editor="true"], [data-testid="chat-input"]')
        applyDir(el, isEditor || isEditorP ? 'rtl' : null)
      }
    }

    // Each text block under the timeline decides by its own first word
    // (paragraphs, history triggers, headings — not composer chrome)
    const blockSel = [
      '[data-v4-timeline-scroll] p',
      '[data-v4-timeline-scroll] button[data-testid^="chat-assistant-history-trigger"]',
      '[data-v4-timeline-scroll] h1',
      '[data-v4-timeline-scroll] h2',
      '[data-v4-timeline-scroll] h3',
      '[data-v4-timeline-scroll] h4',
      '[data-v4-timeline-scroll] li'
    ].join(',')
    for (const el of document.querySelectorAll(blockSel)) {
      if (seen.has(el)) continue
      if (el.closest('[data-v4-composer-dock]')) continue
      seen.add(el)
      applyDir(el, null)
    }

    // Leaf labels (system rows, truncated spans) with no directed ancestor
    // — searched in the timeline AND in the question (elicitation) dialog.
    const leafRoots = [
      document.querySelector('[data-v4-timeline-scroll]'),
      document.querySelector('[data-elicitation-dialog-card]')
    ].filter(Boolean)
    for (const timeline of leafRoots) {
      const walker = document.createTreeWalker(timeline, NodeFilter.SHOW_TEXT)
      let node
      const leafSeen = new Set()
      while ((node = walker.nextNode())) {
        const text = (node.nodeValue || '').trim()
        if (text.length < 3) continue
        let el = node.parentElement
        if (!el || leafSeen.has(el) || seen.has(el)) continue
        if (el.closest('[data-v4-composer-dock]')) continue
        if (el.closest('[dir]')) continue
        if (!isLeafish(el)) continue
        leafSeen.add(el)
        seen.add(el)
        applyDir(el, null)
      }
    }

    const ed = document.querySelector('[data-lexical-editor="true"], [data-testid="chat-input"]')
    if (ed && !ed.__rtlChatHooked) {
      ed.__rtlChatHooked = true
      const update = () => {
        applyDir(ed, 'rtl')
        ed.querySelectorAll('p').forEach(p => applyDir(p, 'rtl'))
      }
      ed.addEventListener('input', update)
      ed.addEventListener('keyup', update)
    }
  }

  function updateBadge() {
    let badge = document.getElementById(BADGE_ID)
    if (!badge) {
      badge = document.createElement('div')
      badge.id = BADGE_ID
      ;(document.body || document.documentElement).appendChild(badge)
    }
    badge.style.cssText = [
      'position:fixed',
      'bottom:14px',
      'right:16px',
      'left:auto',
      'z-index:2147483647',
      'background:rgba(185,28,28,0.92)',
      'color:#fff',
      'padding:2px 7px',
      'border-radius:4px',
      'font:700 11px/1.3 system-ui,sans-serif',
      'letter-spacing:0.06em',
      'direction:ltr',
      'pointer-events:none',
      'box-shadow:0 1px 3px rgba(0,0,0,.25)'
    ].join(';')
    badge.textContent = 'RTL'
    window.__RTL_CHAT = {
      version: VERSION,
      via: via(),
      style: !!document.getElementById(STYLE_ID),
      ready: document.readyState
    }
  }

  function boot() {
    const first = !window.__RTL_CHAT_BOOTED
    window.__RTL_CHAT_BOOTED = true
    if (first) document.documentElement.setAttribute('data-rtl-chat', 'on')
    via()
    ensureStyle()
    applyDirs()
    updateBadge()
    if (window.__RTL_CHAT_TIMER) clearInterval(window.__RTL_CHAT_TIMER)
    window.__RTL_CHAT_TIMER = setInterval(() => {
      ensureStyle()
      applyDirs()
      updateBadge()
    }, 2000)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true })
  } else {
    boot()
  }
})()
