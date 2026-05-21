<script>
  import { dash, currentMonth, currentYear, periodLabel } from '../lib/ghg.js'
  import BarBlock from './BarBlock.svelte'
</script>

<div class="page-title">Tổng quan phát thải GHG</div>
<div class="page-sub">
  Kỳ báo cáo: <strong>{periodLabel($currentMonth, $currentYear)}</strong> · Cập nhật tự động khi nhập dữ liệu
</div>

<div class="stat-grid">
  <div class="stat stat-accent">
    <div class="stat-label">Tổng CO₂e</div>
    <div class="stat-val">{$dash.total}</div>
    <div class="stat-unit">tấn CO₂e</div>
  </div>
  <div class="stat stat-danger">
    <div class="stat-label">Scope 1 · Trực tiếp</div>
    <div class="stat-val">{$dash.s1}</div>
    <div class="stat-unit">tấn CO₂e</div>
  </div>
  <div class="stat stat-warn">
    <div class="stat-label">Scope 2 · Gián tiếp</div>
    <div class="stat-val">{$dash.s2}</div>
    <div class="stat-unit">tấn CO₂e</div>
  </div>
  <div class="stat stat-info">
    <div class="stat-label">Scope 3 · Giá trị chuỗi</div>
    <div class="stat-val">{$dash.s3}</div>
    <div class="stat-unit">tấn CO₂e</div>
  </div>
</div>

<div class="dash-grid">
  <div class="card">
    <div class="card-head">
      <div class="card-head-left"><div class="card-title">Cơ cấu phát thải theo nguồn</div></div>
    </div>
    <div class="card-body">
      {#if $dash.sources.length === 0}
        <div class="empty"><div class="empty-icon">📊</div>Chưa có dữ liệu</div>
      {:else}
        {#each $dash.sources as s}
          <BarBlock
            label={s[0]}
            val={s[1]}
            max={$dash.maxS}
            color={s[2]}
            pct={true}
            total={$dash.totalTon}
          />
        {/each}
      {/if}
    </div>
  </div>
  <div class="card">
    <div class="card-head">
      <div class="card-head-left"><div class="card-title">Top nguồn phát thải cao nhất</div></div>
    </div>
    <div class="card-body">
      {#if $dash.allItems.length === 0}
        <div class="empty"><div class="empty-icon">📋</div>Chưa có dữ liệu</div>
      {:else}
        {#each $dash.allItems as a}
          <BarBlock label={a.label} val={a.val} max={$dash.maxA} color="#1A6B3C" suffix=" t" />
        {/each}
      {/if}
    </div>
  </div>
  <div class="card">
    <div class="card-head">
      <div class="card-head-left"><div class="card-title">Phát thải theo phòng ban (Scope 3)</div></div>
    </div>
    <div class="card-body">
      {#if $dash.deptArr.length === 0}
        <div class="empty"><div class="empty-icon">🏢</div>Chưa có dữ liệu</div>
      {:else}
        {#each $dash.deptArr as d}
          <BarBlock label={d[0]} val={d[1]} max={$dash.maxD} color="#1B4F8A" suffix=" t" />
        {/each}
      {/if}
    </div>
  </div>
  <div class="card">
    <div class="card-head">
      <div class="card-head-left"><div class="card-title">Stationary Combustion — Scope 1 & 2</div></div>
    </div>
    <div class="card-body">
      {#if $dash.offItems.length === 0}
        <div class="empty"><div class="empty-icon">🏭</div>Chưa có dữ liệu</div>
      {:else}
        {#each $dash.offItems as o}
          <BarBlock
            label={o.label}
            val={o.val}
            max={$dash.maxO}
            color={o.scope === 1 ? '#C0392B' : '#B85C00'}
            suffix=" t"
          />
        {/each}
      {/if}
    </div>
  </div>
</div>
