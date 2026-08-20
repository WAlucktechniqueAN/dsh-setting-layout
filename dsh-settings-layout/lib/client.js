// dsh-settings-layout — browser half bundle.
//
// Controls the DSH web settings panel's position and size:
//   - a new "面板布局" page in Settings: nine-cell docking presets, X/Y
//     offsets, width/height inputs, size presets, height-auto, reset
//   - window-like interaction: drag the panel's title-bar blank area to move
//     it, drag any edge/corner to resize it (the opposite edge stays anchored)
//   - the layout persists in localStorage, so it survives page reloads and
//     process restarts (unlike a dynamic plugin)
//
// Implementation notes:
//   - The settings dialog is the ONLY aria-modal element that uses
//     `aria-labelledby` (the Modal primitive and the image lightbox use
//     `aria-label`), so the selectors below cannot leak onto other dialogs.
//   - Geometry is driven by CSS custom properties on :root plus two rules
//     that anchor the dialog: the overlay's flex alignment (docking) and the
//     dialog's width/height/margin/transform (size + offset). Updating the
//     variables (by re-inserting one <style> tag) moves the panel live.
window.__ModuleLoader__.load({
  id: 'dsh-settings-layout',
  factory: (require) => {
    const React = require('react')

    const name = 'dsh-settings-layout'
    const inject = ['slots']
    const STORAGE_KEY = 'dsh.settings-layout.v1'

    function apply(ctx) {
      // ── layout store: defaults + persisted values ──
      const DEFAULTS = {
        justify: 'center', // overlay flex alignment (docking anchor)
        align: 'center',
        margin: '0',       // 24px inset when docked to an edge
        x: 0,              // translate offset px (drag)
        y: 0,
        width: 800,
        height: '',        // '' = shipped default min(800px, calc(100vh - 48px))
      }
      let persisted = null
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (raw !== null) {
          const parsed = JSON.parse(raw)
          if (parsed !== null && typeof parsed === 'object') persisted = parsed
        }
      } catch (_) { /* storage unavailable — run without persistence */ }

      const store = {
        ...DEFAULTS,
        ...(persisted !== null ? persisted : {}),
        listeners: new Set(),
        get() {
          return {
            justify: this.justify, align: this.align, margin: this.margin,
            x: this.x, y: this.y, width: this.width, height: this.height,
          }
        },
        set(patch) {
          if (patch.justify !== undefined) this.justify = patch.justify
          if (patch.align !== undefined) this.align = patch.align
          if (patch.margin !== undefined) this.margin = patch.margin
          if (patch.x !== undefined) this.x = patch.x
          if (patch.y !== undefined) this.y = patch.y
          if (patch.width !== undefined) this.width = patch.width
          if (patch.height !== undefined) this.height = patch.height
          schedulePersist()
          for (const fn of this.listeners) fn()
        },
        reset() {
          this.justify = 'center'
          this.align = 'center'
          this.margin = '0'
          this.x = 0
          this.y = 0
          this.width = 800
          this.height = ''
          schedulePersist()
          for (const fn of this.listeners) fn()
        },
        subscribe(fn) {
          this.listeners.add(fn)
          return () => { this.listeners.delete(fn) }
        },
      }

      // ── persistence: rAF-throttled localStorage write ──
      let persistPending = false
      function schedulePersist() {
        if (persistPending) return
        persistPending = true
        window.requestAnimationFrame(() => {
          persistPending = false
          try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store.get()))
          } catch (_) { /* storage unavailable */ }
        })
      }

      // ── live stylesheet (one <style> tag, rebuilt on change) ──
      const DIALOG_SEL = "[role='dialog'][aria-modal='true'][aria-labelledby]"
      const POSITIONS = [
        { id: 'tl', label: '左上', justify: 'flex-start', align: 'flex-start', margin: '24px' },
        { id: 'tc', label: '中上', justify: 'center', align: 'flex-start', margin: '24px 0 0' },
        { id: 'tr', label: '右上', justify: 'flex-end', align: 'flex-start', margin: '24px' },
        { id: 'ml', label: '左中', justify: 'flex-start', align: 'center', margin: '0 0 0 24px' },
        { id: 'mc', label: '居中', justify: 'center', align: 'center', margin: '0' },
        { id: 'mr', label: '右中', justify: 'flex-end', align: 'center', margin: '0 24px 0 0' },
        { id: 'bl', label: '左下', justify: 'flex-start', align: 'flex-end', margin: '24px' },
        { id: 'bc', label: '中下', justify: 'center', align: 'flex-end', margin: '0 0 24px' },
        { id: 'br', label: '右下', justify: 'flex-end', align: 'flex-end', margin: '24px' },
      ]
      const SIZE_PRESETS = [
        { id: 'compact', label: '紧凑 640×480', width: 640, height: 480 },
        { id: 'standard', label: '标准 800', width: 800, height: '' },
        { id: 'wide', label: '宽屏 960', width: 960, height: '' },
      ]

      function buildCss(s) {
        return [
          ':root {',
          `  --dsw-settings-justify: ${s.justify};`,
          `  --dsw-settings-align: ${s.align};`,
          `  --dsw-settings-margin: ${s.margin};`,
          `  --dsw-settings-x: ${s.x}px;`,
          `  --dsw-settings-y: ${s.y}px;`,
          `  --dsw-settings-width: ${s.width}px;`,
          `  --dsw-settings-height: ${s.height === '' ? 'min(800px, calc(100vh - 48px))' : s.height + 'px'};`,
          '}',
          "div:has(> [role='dialog'][aria-modal='true'][aria-labelledby]) {",
          '  justify-content: var(--dsw-settings-justify);',
          '  align-items: var(--dsw-settings-align);',
          '}',
          "[role='dialog'][aria-modal='true'][aria-labelledby] {",
          '  width: var(--dsw-settings-width);',
          '  height: var(--dsw-settings-height);',
          '  max-width: calc(100vw - 48px);',
          '  max-height: calc(100vh - 48px);',
          '  margin: var(--dsw-settings-margin);',
          '  transform: translate(var(--dsw-settings-x), var(--dsw-settings-y));',
          '  user-select: none;',
          '}',
        ].join('\n')
      }

      let styleTag = null
      let cssDirty = false
      function rebuildCss() {
        if (styleTag !== null) styleTag.remove()
        styleTag = document.createElement('style')
        styleTag.textContent = buildCss(store.get())
        document.head.append(styleTag)
      }
      function syncCss() {
        if (cssDirty) return
        cssDirty = true
        window.requestAnimationFrame(() => {
          cssDirty = false
          rebuildCss()
        })
      }
      ctx.effect(() => store.subscribe(syncCss))
      ctx.effect(() => () => {
        if (styleTag !== null) {
          styleTag.remove()
          styleTag = null
        }
      })
      rebuildCss()

      // ── window-like drag & resize (document-level pointer delegation) ──
      const EDGE = 10
      const MIN_W = 320
      const MIN_H = 240
      const clampN = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
      function getDialog(el) {
        if (el === null || el === undefined || typeof el.closest !== 'function') return null
        return el.closest(DIALOG_SEL)
      }
      function isInteractive(el) {
        if (el === null || el === undefined || typeof el.closest !== 'function') return false
        return el.closest('button, input, select, textarea, a, [role="button"], [contenteditable="true"]') !== null
      }
      function edgeOf(e, rect) {
        const x = e.clientX
        const y = e.clientY
        const west = x - rect.left < EDGE
        const east = rect.right - x < EDGE
        const north = y - rect.top < EDGE
        const south = rect.bottom - y < EDGE
        if (west && north) return 'nw'
        if (east && north) return 'ne'
        if (west && south) return 'sw'
        if (east && south) return 'se'
        if (west) return 'w'
        if (east) return 'e'
        if (north) return 'n'
        if (south) return 's'
        return null
      }
      const EDGE_CURSORS = {
        nw: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', se: 'nwse-resize',
        w: 'ew-resize', e: 'ew-resize', n: 'ns-resize', s: 'ns-resize',
      }

      let dragState = null

      function onPointerDown(e) {
        if (e.button !== 0 && e.pointerType === 'mouse') return // primary button only
        const dlg = getDialog(e.target)
        if (dlg === null) return
        const rect = dlg.getBoundingClientRect()
        const edge = edgeOf(e, rect)
        if (edge !== null) {
          dragState = {
            mode: 'resize', edge,
            startX: e.clientX, startY: e.clientY,
            baseX: store.x, baseY: store.y,
            baseW: store.width,
            baseH: store.height === '' ? rect.height : store.height,
          }
          try { dlg.setPointerCapture(e.pointerId) } catch (_) { /* ignore */ }
          e.preventDefault()
          return
        }
        if (isInteractive(e.target)) return
        // Exclude the content scroll area (panel → content → options).
        const content = dlg.lastElementChild
        if (content !== null) {
          const options = content.lastElementChild
          if (options !== null && (options === e.target || options.contains(e.target))) return
        }
        dragState = {
          mode: 'drag',
          startX: e.clientX, startY: e.clientY,
          baseX: store.x, baseY: store.y,
        }
        try { dlg.setPointerCapture(e.pointerId) } catch (_) { /* ignore */ }
        e.preventDefault()
      }

      function onPointerMove(e) {
        if (dragState !== null) {
          const dx = e.clientX - dragState.startX
          const dy = e.clientY - dragState.startY
          if (dragState.mode === 'drag') {
            store.set({ x: Math.round(dragState.baseX + dx), y: Math.round(dragState.baseY + dy) })
          } else {
            const vw = window.innerWidth
            const vh = window.innerHeight
            const maxW = vw - 48
            const maxH = vh - 48
            const ed = dragState.edge
            let w = dragState.baseW
            let h = dragState.baseH
            if (ed.indexOf('e') !== -1) w = clampN(dragState.baseW + dx, MIN_W, maxW)
            if (ed.indexOf('w') !== -1) w = clampN(dragState.baseW - dx, MIN_W, maxW)
            if (ed.indexOf('s') !== -1) h = clampN(dragState.baseH + dy, MIN_H, maxH)
            if (ed.indexOf('n') !== -1) h = clampN(dragState.baseH - dy, MIN_H, maxH)
            const patch = { width: Math.round(w) }
            // Anchor the opposite edge:
            //   east  edge → west  side fixed, x -= Δw/2
            //   west  edge → east  side fixed, x += Δw/2
            //   south edge → north side fixed, y += Δh/2
            //   north edge → south side fixed, y -= Δh/2
            if (ed.indexOf('w') !== -1) patch.x = Math.round(dragState.baseX - (w - dragState.baseW) / 2)
            if (ed.indexOf('e') !== -1) patch.x = Math.round(dragState.baseX + (w - dragState.baseW) / 2)
            if (ed.indexOf('n') !== -1 || ed.indexOf('s') !== -1) {
              patch.height = Math.round(h)
              if (ed.indexOf('n') !== -1) patch.y = Math.round(dragState.baseY - (h - dragState.baseH) / 2)
              else patch.y = Math.round(dragState.baseY + (h - dragState.baseH) / 2)
            }
            store.set(patch)
          }
          return
        }
        // Hover cursor feedback.
        const dlg = getDialog(e.target)
        if (dlg === null) return
        const rect = dlg.getBoundingClientRect()
        const edge = edgeOf(e, rect)
        if (edge !== null) {
          dlg.style.cursor = EDGE_CURSORS[edge]
          return
        }
        const inHeader = e.clientY - rect.top < 44
        if (inHeader && !isInteractive(e.target)) {
          dlg.style.cursor = 'move'
          return
        }
        if (dlg.style.cursor !== '') dlg.style.cursor = ''
      }

      function endDrag() { dragState = null }

      document.addEventListener('pointerdown', onPointerDown, true)
      document.addEventListener('pointermove', onPointerMove, true)
      document.addEventListener('pointerup', endDrag, true)
      document.addEventListener('pointercancel', endDrag, true)
      ctx.effect(() => () => {
        document.removeEventListener('pointerdown', onPointerDown, true)
        document.removeEventListener('pointermove', onPointerMove, true)
        document.removeEventListener('pointerup', endDrag, true)
        document.removeEventListener('pointercancel', endDrag, true)
      })

      // ── "面板布局" settings page ──
      const h = React.createElement
      const inputStyle = {
        width: 72, height: 30, padding: '0 8px', boxSizing: 'border-box',
        border: '1px solid var(--dsw-alias-border-l1)', borderRadius: 8,
        background: 'var(--dsw-alias-bg-layer-1)', color: 'var(--dsw-alias-label-primary)',
        font: 'inherit', fontSize: 13, outline: 'none',
      }
      const btnBase = {
        height: 30, padding: '0 12px', border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 8, background: 'var(--dsw-alias-bg-layer-1)',
        color: 'var(--dsw-alias-label-primary)', cursor: 'pointer',
        font: 'inherit', fontSize: 13, lineHeight: '28px', whiteSpace: 'nowrap',
      }
      const btnActive = {
        borderColor: 'var(--dsw-alias-brand-primary)',
        background: 'var(--dsw-alias-brand-primary)',
        color: 'var(--dsw-alias-bg-layer-1)',
      }
      const rowStyle = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }
      const headingStyle = { margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: 'var(--dsw-alias-label-primary)' }

      function NumField({ label, value, min, max, step, nudgeBase, suffix, placeholder, onCommit }) {
        const inputRef = React.useRef(null)
        const commit = () => {
          const el = inputRef.current
          if (el === null) return
          const raw = el.value.trim()
          if (raw === '') return
          const n = Number(raw)
          if (Number.isNaN(n)) return
          const clamped = Math.min(max, Math.max(min, n))
          el.value = String(clamped)
          onCommit(clamped)
        }
        const nudge = (delta) => {
          const el = inputRef.current
          if (el === null) return
          const raw = el.value.trim()
          const cur = raw === '' ? NaN : Number(raw)
          const base = Number.isNaN(cur) ? (nudgeBase !== undefined ? nudgeBase : min) : cur
          const next = Math.min(max, Math.max(min, base + delta))
          el.value = String(next)
          onCommit(next)
        }
        return h('label', { style: { ...rowStyle, fontSize: 13, color: 'var(--dsw-alias-label-secondary)' } },
          h('span', { style: { minWidth: 44 } }, label),
          h('button', { type: 'button', style: btnBase, onClick: () => nudge(-step), title: '减小' }, '-'),
          h('input', {
            ref: inputRef,
            type: 'number',
            defaultValue: value,
            min, max, step,
            placeholder: placeholder !== undefined ? placeholder : '',
            onKeyDown: (e) => { if (e.key === 'Enter') { commit(); e.currentTarget.blur() } },
            onBlur: commit,
            style: inputStyle,
          }),
          h('button', { type: 'button', style: btnBase, onClick: () => nudge(step), title: '增大' }, '+'),
          suffix !== undefined ? h('span', null, suffix) : null,
        )
      }

      function PanelLayoutSection(props) {
        const [state, setState] = React.useState(store.get())
        React.useEffect(() => store.subscribe(() => setState(store.get())), [])
        const activePos = POSITIONS.find(p => p.justify === state.justify && p.align === state.align) || POSITIONS[4]
        return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 18 } },
          h('p', { style: { margin: 0, fontSize: 13, lineHeight: '20px', color: 'var(--dsw-alias-label-secondary)' } },
            '调整「设置」面板的停靠位置与大小，改动实时生效，并自动保存（刷新/重启后保持）。'),
          h('p', { style: { margin: 0, fontSize: 13, lineHeight: '20px', color: 'var(--dsw-alias-label-secondary)' } },
            '也可以像窗口一样操作：拖动面板顶部标题栏空白处移动位置；拖动面板边缘/四角调整大小。'),
          h('section', null,
            h('h3', { style: headingStyle }, '位置'),
            h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 68px)', gap: 6, marginBottom: 12 } },
              POSITIONS.map(p => h('button', {
                key: p.id, type: 'button', title: p.label,
                onClick: () => store.set({ justify: p.justify, align: p.align, margin: p.margin, x: 0, y: 0 }),
                style: { ...btnBase, ...(activePos.id === p.id ? btnActive : {}), padding: '0 8px' },
              }, p.label))),
            h('div', { style: rowStyle },
              h(NumField, { key: 'x', label: 'X 偏移', value: state.x, min: -1200, max: 1200, step: 10, onCommit: (v) => store.set({ x: v }), suffix: 'px' }),
              h(NumField, { key: 'y', label: 'Y 偏移', value: state.y, min: -1200, max: 1200, step: 10, onCommit: (v) => store.set({ y: v }), suffix: 'px' }),
            ),
          ),
          h('section', null,
            h('h3', { style: headingStyle }, '大小'),
            h('div', { style: rowStyle },
              h(NumField, { key: 'w', label: '宽度', value: state.width, min: 320, max: 1600, step: 20, onCommit: (v) => store.set({ width: v }), suffix: 'px' }),
              h(NumField, { key: 'h', label: '高度', value: state.height === '' ? '' : state.height, min: 0, max: 1400, step: 20, nudgeBase: 640, placeholder: 'auto', onCommit: (v) => store.set({ height: v <= 0 ? '' : v }), suffix: 'px' }),
            ),
            h('div', { style: { ...rowStyle, marginTop: 10 } },
              h('span', { style: { fontSize: 13, color: 'var(--dsw-alias-label-secondary)' } }, '预设：'),
              SIZE_PRESETS.map(p => h('button', {
                key: p.id, type: 'button',
                onClick: () => store.set({ width: p.width, height: p.height }),
                style: { ...btnBase, ...(state.width === p.width && state.height === p.height ? btnActive : {}) },
              }, p.label)),
              h('button', {
                type: 'button',
                onClick: () => store.set({ height: '' }),
                style: { ...btnBase, ...(state.height === '' ? btnActive : {}) },
              }, '高度自适应'),
            ),
          ),
          h('div', { style: rowStyle },
            h('button', {
              type: 'button',
              onClick: () => store.reset(),
              style: { ...btnBase, borderColor: 'var(--dsw-alias-state-warn-primary)', color: 'var(--dsw-alias-state-warn-primary)' },
            }, '恢复默认'),
            typeof props.close === 'function' ? h('button', {
              type: 'button',
              onClick: () => props.close(),
              style: { ...btnBase, borderColor: 'var(--dsw-alias-brand-primary)', color: 'var(--dsw-alias-brand-primary)' },
            }, '完成') : null,
          ),
        )
      }

      ctx.slots.inject('settings.section', () => ctx.slots.register(
        { name: 'settings.section', id: 'panel-layout', order: 900, label: '面板布局' },
        (props) => h(PanelLayoutSection, { close: props.close }),
      ))
    }

    return { name, inject, apply }
  },
})
