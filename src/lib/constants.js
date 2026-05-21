export const EMISSION_SOURCES = [
  { label: 'Diesel (máy phát)', scope: 1, unit: 'lít', ef: 2.68, ref: 'DEFRA 2023' },
  { label: 'Xăng (xe cơ giới)', scope: 1, unit: 'lít', ef: 2.31, ref: 'DEFRA 2023' },
  { label: 'Gas LPG (bếp/nồi hơi)', scope: 1, unit: 'kg', ef: 2.98, ref: 'IPCC AR6' },
  { label: 'Gas CNG', scope: 1, unit: 'm³', ef: 2.02, ref: 'IPCC AR6' },
  { label: 'Than đá', scope: 1, unit: 'kg', ef: 2.42, ref: 'IPCC AR6' },
  { label: 'Điện lưới (Việt Nam)', scope: 2, unit: 'kWh', ef: 0.4937, ref: 'MONRE VN 2022' },
  { label: 'Hơi nước mua ngoài', scope: 2, unit: 'GJ', ef: 66.3, ref: 'GHG Protocol' },
  { label: 'R-22 (gas lạnh rò rỉ)', scope: 1, unit: 'kg', ef: 1810, ref: 'IPCC AR6 GWP100' },
  { label: 'R-410A (gas lạnh rò rỉ)', scope: 1, unit: 'kg', ef: 2088, ref: 'IPCC AR6 GWP100' },
  { label: 'Tự nhập', scope: 1, unit: '—', ef: 0, ref: '' },
]

export const DEPT_OPTIONS = [
  'Kinh doanh & Bán hàng',
  'Vận hành & Sản xuất',
  'Tài chính & Kế toán',
  'Nhân sự',
  'Công nghệ thông tin',
  'Marketing',
  'Ban giám đốc',
  'Khác',
]

export const PURPOSE_OPTIONS = [
  'Gặp gỡ / đàm phán khách hàng',
  'Hội nghị / hội thảo',
  'Đào tạo nội bộ',
  'Kiểm tra dự án',
  'Khác',
]

/** kg CO₂e per km for ground travel on business trip */
export const EMP_GROUND = [
  { value: 0.041, label: 'Tàu hỏa (EF 0.041)' },
  { value: 0.027, label: 'Xe khách (EF 0.027)' },
  { value: 0.192, label: 'Ô tô xăng sedan (EF 0.192)' },
  { value: 0.245, label: 'SUV / 7 chỗ (EF 0.245)' },
  { value: 0.05, label: 'Xe điện (EF 0.050)' },
  { value: 0.074, label: 'Xe máy (EF 0.074)' },
  { value: 0, label: 'Không có' },
]

export const HOTEL_OPTIONS = [
  { value: 10, label: 'Nhà khách công ty (10 kg/đêm)' },
  { value: 12, label: 'Nhà nghỉ / hostel (12 kg/đêm)' },
  { value: 20, label: 'Khách sạn 3 sao (20 kg/đêm)' },
  { value: 28, label: 'Khách sạn 4 sao (28 kg/đêm)' },
  { value: 38, label: 'Khách sạn 5 sao (38 kg/đêm)' },
]

export const CABIN_OPTIONS = [
  { value: 0.133, label: 'Economy' },
  { value: 0.2, label: 'Prem. Economy' },
  { value: 0.266, label: 'Business' },
  { value: 0.532, label: 'First' },
]

export const COMMUTE_VEHICLES = [
  { value: 0.0, label: 'Đi bộ / xe đạp (0)' },
  { value: 0.074, label: 'Xe máy xăng (0.074)' },
  { value: 0.05, label: 'Xe máy điện (0.050)' },
  { value: 0.192, label: 'Ô tô cá nhân xăng (0.192)' },
  { value: 0.05, label: 'Ô tô điện (0.050)' },
  { value: 0.027, label: 'Xe buýt (0.027)' },
  { value: 0.041, label: 'Tàu điện / metro (0.041)' },
  { value: 0.192, label: 'Taxi / Grab car (0.192)' },
]

export const UNIT_OPTIONS = ['lít', 'kg', 'm³', 'kWh', 'GJ', 'tấn', '—']

/** Phương tiện / chi phí trong một chuyến công tác (ngoài máy bay) */
export const TRIP_TRANSPORT_TYPES = [
  { value: 'fuel', label: 'Đổ xăng (theo lít × số lần)' },
  { value: 'car', label: 'Ô tô / xe (km × EF)' },
  { value: 'grab', label: 'Grab / Taxi' },
  { value: 'train', label: 'Tàu / xe khách' },
  { value: 'ground', label: 'Khác (km × EF)' },
]
