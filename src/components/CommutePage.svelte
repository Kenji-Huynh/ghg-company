<script>
  import { DEPT_OPTIONS, COMMUTE_VEHICLES } from '../lib/constants.js'
  import { COMPANIES } from '../lib/companies.js'
  import { calcCommute } from '../lib/calculations.js'
  import { commuteList, upsertCommute, deleteCommuteById } from '../lib/ghg.js'
  import { confirmDanger, confirmAction, toastOk, toastErr } from '../lib/notify.js'

  let cName = $state('')
  let cEmpid = $state('')
  let cDept = $state('')
  let cCompany = $state(COMPANIES[0])
  let cVehicle = $state(COMMUTE_VEHICLES[0].value)
  let cKm = $state(0)
  let cDays = $state(22)
  let cMonths = $state(1)
  let cCarpool = $state(1)
  let cWfh = $state(0)
  let cDeptFilter = $state('')

  const commuteDeptOptions = $derived.by(() => {
    return [...new Set($commuteList.map((c) => c.dept).filter(Boolean))].sort()
  })

  const filteredCommute = $derived.by(() => {
    return cDeptFilter ? $commuteList.filter((c) => c.dept === cDeptFilter) : [...$commuteList]
  })

  const stats = $derived.by(() => {
    const list = filteredCommute
    const total = list.reduce((s, c) => s + (c.co2 || 0), 0)
    const avg = list.length ? total / list.length : 0
    return { total, avg: Math.round(avg), n: list.length }
  })

  const vehicleChart = $derived.by(() => {
    const vMap = {}
    for (const c of filteredCommute) {
      vMap[c.vehicle] = (vMap[c.vehicle] || 0) + (c.co2 || 0)
    }
    const vArr = Object.entries(vMap).sort((a, b) => b[1] - a[1])
    const maxV = Math.max(...vArr.map((v) => v[1]), 1)
    const colors = ['#1A6B3C', '#B85C00', '#1B4F8A', '#C0392B', '#555', '#888', '#aaa']
    return { vArr, maxV, colors }
  })

  const live = $derived.by(() => {
    const ef = Number(cVehicle) || 0
    const km = Number(cKm) || 0
    const days = Number(cDays) || 22
    const months = Number(cMonths) || 1
    const wfh = Number(cWfh) || 0
    const carpool = Number(cCarpool) || 1
    const co2 = calcCommute(ef, km, days, months, wfh, carpool)
    const effectiveDays = Math.max(0, days - wfh)
    const detail =
      co2 > 0
        ? `${km}km×2 × ${effectiveDays}ngày × ${months}tháng × EF${ef} ÷ ${carpool}người = ${Math.round(co2)} kg`
        : ''
    return { co2, detail }
  })

  async function saveCommute() {
    const name = cName.trim()
    const empId = cEmpid.trim()
    if (!name || !empId) {
      toastErr('Vui lòng nhập họ tên và mã nhân viên')
      return
    }
    const ok = await confirmAction('Xác nhận lưu thông tin đi làm?', `Ước tính: ${live.co2} kg CO₂e (cả kỳ)`)
    if (!ok) return

    const ef = Number(cVehicle) || 0
    const km = Number(cKm) || 0
    const days = Number(cDays) || 22
    const months = Number(cMonths) || 1
    const wfh = Number(cWfh) || 0
    const carpool = Number(cCarpool) || 1
    const co2 = live.co2
    const vehicleLabel =
      COMMUTE_VEHICLES.find((v) => v.value === ef || v.value == cVehicle)?.label.split(' (')[0] ?? ''

    const existing = $commuteList.find((c) => c.empId === empId)
    const effectiveDays = Math.max(0, days - wfh)
    upsertCommute({
      id: existing?.id ?? Date.now().toString(),
      name,
      empId,
      dept: cDept,
      company: cCompany,
      vehicle: vehicleLabel,
      ef,
      km,
      days,
      months,
      wfh,
      carpool,
      effectiveDays,
      co2,
      savedAt: new Date().toISOString(),
    })
    toastOk(existing ? `Đã cập nhật thông tin đi làm của ${name}` : `Đã lưu thông tin đi làm của ${name} — ${co2} kg CO₂e`)
    await resetForm(false)
  }

  /** @param {boolean} [ask] */
  async function resetForm(ask = true) {
    if (ask) {
      const ok = await confirmAction('Xóa nội dung form?', '')
      if (!ok) return
    }
    cName = ''
    cEmpid = ''
    cDept = ''
    cCompany = COMPANIES[0]
    cVehicle = COMMUTE_VEHICLES[0].value
    cKm = 0
    cDays = 22
    cMonths = 1
    cCarpool = 1
    cWfh = 0
    if (ask) toastOk('Đã xóa form')
  }

  async function deleteRow(id) {
    const ok = await confirmDanger('Xóa nhân viên khỏi bảng đi làm?', '', 'Xóa')
    if (!ok) return
    deleteCommuteById(id)
    toastOk('Đã xóa')
  }
</script>

<div class="page-title">Carbon đi làm hàng ngày (Commute)</div>
<div class="page-sub">
  Scope 3.7 · Employee commuting · Phát thải từ quãng đường đi làm của từng nhân viên
</div>

<div class="card">
  <div class="card-head">
    <div class="card-head-left">
      <div class="card-title">Thêm / cập nhật thông tin đi làm</div>
      <span class="card-scope scope-s3">SCOPE 3.7</span>
    </div>
  </div>
  <div class="card-body">
    <div class="g3">
      <div class="field">
        <label>Họ và tên <span class="required">*</span></label>
        <input type="text" placeholder="Nguyễn Văn A" bind:value={cName} />
      </div>
      <div class="field">
        <label>Mã nhân viên <span class="required">*</span></label>
        <input type="text" placeholder="NV-00123" bind:value={cEmpid} />
      </div>
      <div class="field">
        <label>Phòng ban</label>
        <select bind:value={cDept}>
          <option value="">-- Chọn --</option>
          {#each DEPT_OPTIONS as d}
            <option value={d}>{d}</option>
          {/each}
        </select>
      </div>
      <div class="field">
        <label>Công ty <span class="required">*</span></label>
        <select bind:value={cCompany}>
          {#each COMPANIES as co}
            <option value={co}>{co}</option>
          {/each}
        </select>
      </div>
      <div class="field">
        <label>Phương tiện chính</label>
        <select bind:value={cVehicle}>
          {#each COMMUTE_VEHICLES as v}
            <option value={v.value}>{v.label}</option>
          {/each}
        </select>
      </div>
      <div class="field field-unit">
        <label>Khoảng cách 1 chiều</label>
        <input type="number" placeholder="15" min="0" step="0.1" bind:value={cKm} />
        <span class="unit">km</span>
      </div>
      <div class="field">
        <label>Số ngày đi làm / tháng</label>
        <input type="number" placeholder="22" min="0" max="31" bind:value={cDays} />
      </div>
      <div class="field">
        <label>Số tháng trong kỳ báo cáo</label>
        <input type="number" min="1" bind:value={cMonths} />
      </div>
      <div class="field">
        <label>Có đi xe chung (carpool)?</label>
        <select bind:value={cCarpool}>
          <option value={1}>Không (đi một mình)</option>
          <option value={2}>Có — 2 người</option>
          <option value={3}>Có — 3 người</option>
          <option value={4}>Có — 4 người</option>
        </select>
      </div>
      <div class="field">
        <label>Làm việc từ xa (WFH) / tháng</label>
        <input type="number" placeholder="0" min="0" bind:value={cWfh} />
      </div>
    </div>

    <div class="live-box">
      <span style="font-size:12px;color:var(--text2)">CO₂ ước tính (cả kỳ):</span>
      <span class="live-mono">{live.co2 > 0 ? live.co2 : '—'}</span>
      <span style="font-size:12px;color:var(--text2)">kg CO₂e</span>
      <span style="font-size:11px;color:var(--text3);font-family:var(--mono)">{live.detail}</span>
    </div>

    <div class="actions-bar">
      <button type="button" class="btn btn-primary" onclick={saveCommute}>Lưu thông tin đi làm</button>
      <button type="button" class="btn" onclick={() => resetForm(true)}>Xóa form</button>
    </div>
  </div>
</div>

<div class="card">
  <div class="card-head">
    <div class="card-head-left"><div class="card-title">Bảng tổng hợp đi làm theo nhân viên</div></div>
    <select
      style="padding:6px 10px;font-size:12px;border:1px solid var(--border);border-radius:var(--radius)"
      bind:value={cDeptFilter}
    >
      <option value="">Tất cả phòng ban</option>
      {#each commuteDeptOptions as d}
        <option value={d}>{d}</option>
      {/each}
    </select>
  </div>
  <div class="card-body">
    <div class="stat-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 1rem">
      <div class="stat stat-info">
        <div class="stat-label">Tổng nhân viên</div>
        <div class="stat-val">{stats.n}</div>
        <div class="stat-unit">người</div>
      </div>
      <div class="stat stat-accent">
        <div class="stat-label">Tổng CO₂e đi làm</div>
        <div class="stat-val">{Math.round(stats.total)}</div>
        <div class="stat-unit">kg CO₂e</div>
      </div>
      <div class="stat stat-warn">
        <div class="stat-label">Trung bình / người</div>
        <div class="stat-val">{stats.avg}</div>
        <div class="stat-unit">kg CO₂e</div>
      </div>
    </div>

    <div class="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Họ và tên</th>
            <th>Mã NV</th>
            <th>Phòng ban</th>
            <th>Công ty</th>
            <th>Phương tiện</th>
            <th>Km/ngày (1 chiều)</th>
            <th>Ngày/tháng</th>
            <th>WFH/tháng</th>
            <th>Carpool</th>
            <th>CO₂e (kg)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#if filteredCommute.length === 0}
            <tr>
              <td colspan="12" style="text-align:center;color:var(--text3);padding:2rem">Chưa có dữ liệu</td>
            </tr>
          {:else}
            {#each filteredCommute as c, i (c.id)}
              <tr>
                <td style="font-family:var(--mono);font-size:11px;color:var(--text3)">{i + 1}</td>
                <td><strong>{c.name}</strong></td>
                <td class="num">{c.empId}</td>
                <td>{c.dept || '—'}</td>
                <td>{c.company || '—'}</td>
                <td>{c.vehicle}</td>
                <td class="num">{c.km}</td>
                <td class="num">{c.days}</td>
                <td class="num">{c.wfh || 0}</td>
                <td class="num">{c.carpool > 1 ? `${c.carpool} người` : '—'}</td>
                <td>
                  <span class="badge {c.co2 > 200 ? 'badge-r' : c.co2 > 80 ? 'badge-a' : 'badge-g'}"
                    >{c.co2} kg</span
                  >
                </td>
                <td>
                  <button type="button" class="btn btn-danger btn-sm" onclick={() => deleteRow(c.id)}>✕</button>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>

    <div class="sec-divider" style="margin-top:1.25rem">Phân bổ theo phương tiện</div>
    {#if vehicleChart.vArr.length === 0}
      <div style="color:var(--text3);font-size:12px">Chưa có dữ liệu</div>
    {:else}
      {#each vehicleChart.vArr as [v, val], i}
        <div class="bar-row">
          <span class="bar-lbl">{v}</span>
          <div class="bar-bg">
            <div
              class="bar-fill"
              style="width: {Math.round((val / vehicleChart.maxV) * 100)}%; background: {vehicleChart.colors[
                i % vehicleChart.colors.length
              ]};"
            ></div>
          </div>
          <span class="bar-val">{Math.round(val)} kg</span>
        </div>
      {/each}
    {/if}
  </div>
</div>
