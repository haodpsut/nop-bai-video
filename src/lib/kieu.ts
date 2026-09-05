import type { NenTang } from './link-video'

/* Kiểu dữ liệu dùng chung giữa truy vấn và giao diện. Tên trường giữ nguyên
   tên cột trong cơ sở dữ liệu để không phải ánh xạ qua lại. */

export type Lop = {
  id: string
  ma: string
  ten_hoc_phan: string
  ma_hoc_phan: string
  ma_lop_hoc_phan: string | null
  hoc_ky: string | null
  giang_vien: string | null
}

export type SinhVien = {
  id: string
  lop_id: string
  ma_sv: string
  ho_dem: string
  ten: string
  ho_ten: string
  gioi_tinh: string | null
  email: string | null
  nhom: string | null
  dang_hoc: boolean
}

export type DotNop = {
  id: string
  lop_id: string
  ma: string
  ten: string
  mo_ta: string | null
  yeu_cau: string | null
  han_nop: string
  cho_nop_tre: boolean
  dang_mo: boolean
  thu_tu: number
  phut_toi_thieu: number | null
}

export type TrangThaiCham = 'cho_cham' | 'dat' | 'can_sua_lai'

export type BaiNop = {
  id: string
  dot_id: string
  sinh_vien_id: string
  url: string
  url_chuan: string
  nen_tang: NenTang
  ma_video: string
  ghi_chu: string | null
  nop_luc: string
  tre: boolean
  so_lan_nop: number
  diem: number | null
  nhan_xet: string | null
  trang_thai: TrangThaiCham
  cham_luc: string | null
}

export type ThongKeDot = {
  dot_id: string
  lop_id: string
  ma: string
  ten: string
  han_nop: string
  dang_mo: boolean
  cho_nop_tre: boolean
  thu_tu: number
  tong_sv: number
  da_nop: number
  nop_tre: number
  cho_cham: number
  dat: number
  can_sua_lai: number
}

export type TrungVideo = {
  dot_id: string
  nen_tang: NenTang
  ma_video: string
  so_bai: number
  ds_ma_sv: string[]
}

/** Một dòng trên bảng chấm: sinh viên kèm bài nộp nếu có. */
export type DongCham = {
  sinh_vien: SinhVien
  bai: BaiNop | null
}
