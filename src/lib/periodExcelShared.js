/** Tên sheet & cột — phải khớp export / import / template */

export const EXCEL_SHEET = {
  overview: 'Tổng quan',
  office: 'Văn phòng S1-S2',
  trip: 'Chuyến CT S3.6',
  commute: 'Đi làm S3.7',
}

export const EXCEL_OFFICE_HEADERS = [
  'Thiết bị',
  'Nguồn phát thải',
  'Scope',
  'Đơn vị',
  'Khối lượng',
  'EF (kg CO₂e/đvị)',
  'EF Reference',
  'Tổng GHG (tấn CO₂e)',
]

export const EXCEL_TRIP_HEADERS = [
  'Họ và tên',
  'Mã NV',
  'Phòng ban',
  'Tên chuyến',
  'Mục đích',
  'Điểm xuất phát',
  'Điểm đến',
  'Ngày đi',
  'Ngày về',
  'CO₂ bay (kg)',
  'CO₂ mặt đất (kg)',
  'CO₂ lưu trú (kg)',
  'Tổng (kg CO₂e)',
]

export const EXCEL_COMMUTE_HEADERS = [
  'Họ và tên',
  'Mã NV',
  'Phòng ban',
  'Phương tiện',
  'Km một chiều',
  'Ngày đi làm / tháng',
  'WFH (ngày/tháng)',
  'Carpool (người)',
  'CO₂e (kg)',
]

/** Nhãn cột A trong sheet Tổng quan (hàng 4+) — import công ty / cơ sở */
export const EXCEL_OVERVIEW_COMPANY_LABEL = 'Tên công ty / đơn vị'
export const EXCEL_OVERVIEW_LOCATION_LABEL = 'Địa điểm / cơ sở'
