<script>
  import {
    DEPT_OPTIONS,
    PURPOSE_OPTIONS,
    EMP_GROUND,
    HOTEL_OPTIONS,
    CABIN_OPTIONS,
  } from '../lib/constants.js'
  import { calcEmployeeTrip } from '../lib/calculations.js'
  import { empTrips, addEmpTrip, deleteEmpTripById } from '../lib/ghg.js'
  import { confirmDanger, confirmAction, toastOk, toastErr } from '../lib/notify.js'

  function newLeg() {
    return {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      from: '',
      to: '',
      km: 0,
      legs: 1,
      cabin: 0.133,
      cabinLabel: 'Economy',
    }
  }

  let flightLegs = $state([newLeg()])
  let eName = $state('')
  let eEmpid = $state('')
  let eDept = $state('')
  let eTrip = $state('')
  let ePurpose = $state(PURPOSE_OPTIONS[0])
  let eFrom = $state('')
  let eTo = $state('')
  let eDate = $state('')
  let eDateTo = $state('')
  let eProj = $state('')
  let eNote = $state('')
  let eGroundType = $state(EMP_GROUND[0].value)
  let eGroundKm = $state(0)
  let eFuel = $state(0)
  let eHotelType = $state(HOTEL_OPTIONS[2].value)
  let eNights = $state(0)
  let eRooms = $state(1)
  let empSearch = $state('')
  let empDeptFilter = $state('')

  const empDeptOptions = $derived.by(() => {
    const depts = [...new Set($empTrips.map((t) => t.dept).filter(Boolean))].sort()
    return depts
  })

  const filteredTrips = $derived.by(() => {
    const q = empSearch.toLowerCase()
    let list = [...$empTrips]
    if (q) {
      list = list.filter((t) =>
        `${t.name}${t.trip}${t.from}${t.to}${t.empId}`.toLowerCase().includes(q),
      )
    }
    if (empDeptFilter) list = list.filter((t) => t.dept === empDeptFilter)
    return list
  })

  const live = $derived.by(() =>
    calcEmployeeTrip(
      flightLegs,
      Number(eGroundType),
      Number(eGroundKm) || 0,
      Number(eFuel) || 0,
      Number(eHotelType),
      Number(eNights) || 0,
      Number(eRooms) || 1,
    ),
  )

  function addLeg() {
    flightLegs = [...flightLegs, newLeg()]
  }

  async function removeLeg(id) {
    if (flightLegs.length <= 1) {
      toastErr('Cần ít nhất một chặng bay (có thể để trống)')
      return
    }
    const ok = await confirmDanger('Xóa chặng bay?', '', 'Xóa chặng')
    if (!ok) return
    flightLegs = flightLegs.filter((l) => l.id !== id)
  }

  async function saveTrip() {
    const name = eName.trim()
    const empId = eEmpid.trim()
    const dept = eDept
    const trip = eTrip.trim()
    const dateFrom = eDate
    if (!name || !empId || !dept || !trip || !dateFrom) {
      toastErr('Vui lòng điền đủ các trường bắt buộc (*)')
      return
    }
    const ok = await confirmAction('Xác nhận lưu chuyến công tác?', `Tổng ước tính: ${live.total} kg CO₂e`)
    if (!ok) return

    const groundLabel =
      EMP_GROUND.find((g) => g.value === Number(eGroundType) || g.value == eGroundType)?.label.split(' (')[0] ?? ''
    const hotelLabel =
      HOTEL_OPTIONS.find((h) => h.value === Number(eHotelType) || h.value == eHotelType)?.label.split(' (')[0] ?? ''

    const added = addEmpTrip({
      id: Date.now().toString(),
      name,
      empId,
      dept,
      trip,
      from: eFrom,
      to: eTo,
      dateFrom,
      dateTo: eDateTo,
      purpose: ePurpose,
      proj: eProj,
      note: eNote,
      flightLegs: JSON.parse(JSON.stringify(flightLegs)),
      groundType: groundLabel,
      groundKm: eGroundKm,
      fuel: eFuel,
      hotelLabel,
      nights: eNights,
      rooms: eRooms,
      co2Air: live.airCO2,
      co2Ground: live.groundCO2,
      co2Hotel: live.hotelCO2,
      co2Total: live.total,
      savedAt: new Date().toISOString(),
    })
    if (!added) {
      toastErr('Chuyến công tác trùng dữ liệu đã có, không thêm mới.')
      return
    }
    toastOk(`Đã lưu "${trip}" — ${live.total} kg CO₂e`)
    await resetForm(false)
  }

  /** @param {boolean} [ask] */
  async function resetForm(ask = true) {
    if (ask) {
      const ok = await confirmAction('Xóa nội dung form?', 'Toàn bộ thông tin đang nhập sẽ bị xóa.')
      if (!ok) return
    }
    eName = ''
    eEmpid = ''
    eDept = ''
    eTrip = ''
    ePurpose = PURPOSE_OPTIONS[0]
    eFrom = ''
    eTo = ''
    eDate = ''
    eDateTo = ''
    eProj = ''
    eNote = ''
    eGroundType = EMP_GROUND[0].value
    eGroundKm = 0
    eFuel = 0
    eHotelType = HOTEL_OPTIONS[2].value
    eNights = 0
    eRooms = 1
    flightLegs = [newLeg()]
    if (ask) toastOk('Đã xóa form')
  }

  async function deleteTrip(id) {
    const ok = await confirmDanger('Xóa chuyến công tác?', 'Dữ liệu sẽ bị gỡ khỏi kỳ báo cáo hiện tại.', 'Xóa')
    if (!ok) return
    deleteEmpTripById(id)
    toastOk('Đã xóa chuyến công tác')
  }
</script>

<div class="page-title">Phát thải chuyến công tác — Nhân viên</div>
<div class="page-sub">
  Scope 3.6 · Business travel · Ghi nhận từng chuyến công tác của từng nhân viên
</div>

<div class="card">
  <div class="card-head">
    <div class="card-head-left">
      <div class="card-title">Thêm chuyến công tác mới</div>
      <span class="card-scope scope-s3">SCOPE 3</span>
    </div>
  </div>
  <div class="card-body">
    <div class="sec-divider">Thông tin nhân viên</div>
    <div class="g3">
      <div class="field">
        <label>Họ và tên <span class="required">*</span></label>
        <input type="text" placeholder="Nguyễn Văn A" bind:value={eName} />
      </div>
      <div class="field">
        <label>Mã nhân viên <span class="required">*</span></label>
        <input type="text" placeholder="NV-00123" bind:value={eEmpid} />
      </div>
      <div class="field">
        <label>Phòng ban <span class="required">*</span></label>
        <select bind:value={eDept}>
          <option value="">-- Chọn --</option>
          {#each DEPT_OPTIONS as d}
            <option value={d}>{d}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="sec-divider">Thông tin chuyến đi</div>
    <div class="g3">
      <div class="field span2">
        <label>Tên chuyến công tác <span class="required">*</span></label>
        <input type="text" placeholder="Hội nghị khách hàng Q2/2026" bind:value={eTrip} />
      </div>
      <div class="field">
        <label>Mục đích</label>
        <select bind:value={ePurpose}>
          {#each PURPOSE_OPTIONS as p}
            <option value={p}>{p}</option>
          {/each}
        </select>
      </div>
      <div class="field">
        <label>Điểm xuất phát</label>
        <input type="text" placeholder="TP. Hồ Chí Minh" bind:value={eFrom} />
      </div>
      <div class="field">
        <label>Điểm đến</label>
        <input type="text" placeholder="Hà Nội" bind:value={eTo} />
      </div>
      <div class="field">
        <label>Ngày đi</label>
        <input type="date" bind:value={eDate} />
      </div>
      <div class="field">
        <label>Ngày về</label>
        <input type="date" bind:value={eDateTo} />
      </div>
      <div class="field">
        <label>Mã dự án</label>
        <input type="text" placeholder="PRJ-2026-04" bind:value={eProj} />
      </div>
    </div>

    <div class="sec-divider">Máy bay — bao gồm nối chuyến</div>
    <p class="flight-legs-intro">
      Mỗi khối là một chặng bay (ví dụ SGN → HAN). Nối chuyến thì nhấn <strong>+ Thêm chặng bay</strong>. Ước tính phát thải
      dùng công thức: khoảng cách × số lượt × hệ số theo hạng ghế.
    </p>
    <div class="flight-legs-list">
      {#each flightLegs as leg, idx (leg.id)}
        <div class="flight-leg-card">
          <div class="flight-leg-card-toolbar">
            <span class="flight-leg-badge">Chặng {idx + 1}</span>
            <button
              type="button"
              class="btn btn-danger btn-sm flight-leg-remove"
              aria-label="Xóa chặng bay này"
              onclick={() => removeLeg(leg.id)}
            >
              Xóa chặng
            </button>
          </div>
          <div class="g3 flight-leg-card-grid">
            <div class="field">
              <label>Điểm khởi hành</label>
              <input type="text" placeholder="VD: SGN, Tân Sơn Nhất" bind:value={leg.from} />
            </div>
            <div class="field">
              <label>Điểm đến</label>
              <input type="text" placeholder="VD: HAN, Nội Bài" bind:value={leg.to} />
            </div>
            <div class="field">
              <label>Hạng ghế</label>
              <select bind:value={leg.cabin}>
                {#each CABIN_OPTIONS as c}
                  <option value={c.value}>{c.label}</option>
                {/each}
              </select>
            </div>
            <div class="g2 flight-leg-dist-row">
              <div class="field field-unit">
                <label>Khoảng cách ước tính</label>
                <input type="number" placeholder="0" min="0" step="any" bind:value={leg.km} />
                <span class="unit">km</span>
              </div>
              <div class="field field-unit">
                <label>Số lượt bay</label>
                <input type="number" placeholder="1" min="1" step="1" bind:value={leg.legs} />
                <span class="unit">lượt</span>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
    <button type="button" class="btn btn-add flight-legs-add" onclick={addLeg}>+ Thêm chặng bay</button>

    <div class="sec-divider">Phương tiện mặt đất</div>
    <div class="g3">
      <div class="field">
        <label>Loại phương tiện</label>
        <select bind:value={eGroundType}>
          {#each EMP_GROUND as g}
            <option value={g.value}>{g.label}</option>
          {/each}
        </select>
      </div>
      <div class="field field-unit">
        <label>Quãng đường</label>
        <input type="number" placeholder="0" min="0" bind:value={eGroundKm} />
        <span class="unit">km</span>
      </div>
      <div class="field field-unit">
        <label>Nhiên liệu thực tế (nếu có)</label>
        <input type="number" placeholder="0" min="0" bind:value={eFuel} />
        <span class="unit">lít</span>
        <div class="ef-hint">Nhập lít xăng sẽ dùng 2.31 kgCO₂/lít</div>
      </div>
    </div>

    <div class="sec-divider">Lưu trú</div>
    <div class="g3">
      <div class="field">
        <label>Loại khách sạn</label>
        <select bind:value={eHotelType}>
          {#each HOTEL_OPTIONS as h}
            <option value={h.value}>{h.label}</option>
          {/each}
        </select>
      </div>
      <div class="field">
        <label>Số đêm</label>
        <input type="number" placeholder="0" min="0" bind:value={eNights} />
      </div>
      <div class="field">
        <label>Số phòng</label>
        <input type="number" min="1" bind:value={eRooms} />
      </div>
    </div>

    <div class="field">
      <label>Ghi chú</label>
      <textarea placeholder="Xe ôm, xe buýt sân bay, v.v..." bind:value={eNote}></textarea>
    </div>

    <div class="live-box">
      <span style="font-size:12px;color:var(--text2)">CO₂ ước tính:</span>
      <span class="live-mono">{live.total > 0 ? live.total : '—'}</span>
      <span style="font-size:12px;color:var(--text2)">kg CO₂e</span>
      <span style="font-size:11px;color:var(--text3);margin-left:auto;font-family:var(--mono)">
        {live.total > 0
          ? `Bay: ${live.airCO2} · Xe/tàu: ${live.groundCO2} · KS: ${live.hotelCO2} kg`
          : ''}
      </span>
    </div>

    <div class="actions-bar">
      <button type="button" class="btn btn-primary" onclick={saveTrip}>Lưu chuyến công tác</button>
      <button type="button" class="btn" onclick={() => resetForm(true)}>Xóa form</button>
    </div>
  </div>
</div>

<div class="card">
  <div class="card-head">
    <div class="card-head-left"><div class="card-title">Lịch sử chuyến công tác</div></div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <input
        type="text"
        placeholder="Tìm tên, chuyến đi..."
        style="padding:6px 10px;font-size:12px;border:1px solid var(--border);border-radius:var(--radius);width:min(220px,100%)"
        bind:value={empSearch}
      />
      <select
        style="padding:6px 10px;font-size:12px;border:1px solid var(--border);border-radius:var(--radius)"
        bind:value={empDeptFilter}
      >
        <option value="">Tất cả phòng ban</option>
        {#each empDeptOptions as d}
          <option value={d}>{d}</option>
        {/each}
      </select>
    </div>
  </div>
  <div class="card-body">
    <div class="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>Nhân viên</th>
            <th>Phòng ban</th>
            <th>Chuyến đi</th>
            <th>Hành trình</th>
            <th>Ngày</th>
            <th>Bay</th>
            <th>Xe/Tàu</th>
            <th>KS</th>
            <th>Tổng (kg)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#if filteredTrips.length === 0}
            <tr>
              <td colspan="10" style="text-align:center;color:var(--text3);padding:2rem">Chưa có dữ liệu</td>
            </tr>
          {:else}
            {#each filteredTrips as t}
              {@const legSummary =
                t.flightLegs && t.flightLegs.length
                  ? t.flightLegs.map((/** @type {{from?:string,to?:string}} */ l) => `${l.from}→${l.to}`).join(' / ')
                  : '—'}
              <tr>
                <td>
                  <strong>{t.name}</strong><br />
                  <span style="font-size:11px;color:var(--text3);font-family:var(--mono)">{t.empId}</span>
                </td>
                <td>{t.dept}</td>
                <td>
                  {t.trip}<br />
                  <span style="font-size:11px;color:var(--text3)">{t.purpose || ''}</span>
                </td>
                <td style="font-size:11px">{t.from || '—'} → {t.to || '—'}</td>
                <td style="font-size:11px">{t.dateFrom || '—'}</td>
                <td style="font-size:11px;font-family:var(--mono)">{legSummary}</td>
                <td class="num">{t.co2Air || 0}</td>
                <td class="num">{t.co2Ground || 0}</td>
                <td class="num">{t.co2Hotel || 0}</td>
                <td>
                  <span
                    class="badge {t.co2Total > 500 ? 'badge-r' : t.co2Total > 100 ? 'badge-a' : 'badge-g'}"
                    >{t.co2Total} kg</span
                  >
                </td>
                <td>
                  <button type="button" class="btn btn-danger btn-sm" onclick={() => deleteTrip(t.id)}>✕</button>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>
