<script>
  /** @type {{ label: string, val: number, max: number, color: string, suffix?: string, pct?: boolean, total?: number }} */
  let { label, val, max, color, suffix = '', pct = false, total = 0 } = $props()
  const w = $derived(max > 0 ? Math.round((val / max) * 100) : 0)
  const right = $derived(
    pct && total > 0 ? `${Math.round((val / total) * 100)}%` : `${val.toFixed(3)}${suffix}`,
  )
</script>

<div class="bar-row">
  <span class="bar-lbl" title={label}>{label.length > 18 ? label.slice(0, 17) + '…' : label}</span>
  <div class="bar-bg">
    <div class="bar-fill" style="width: {w}%; background: {color};"></div>
  </div>
  <span class="bar-val">{right}</span>
</div>
