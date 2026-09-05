import 'server-only'
import { db, lay } from './supabase'
import type {
  BaiNop,
  DongCham,
  DotNop,
  Lop,
  SinhVien,
  ThongKeDot,
  TrungVideo,
} from './kieu'

/* Mọi truy vấn đọc gom về một chỗ, để trang chỉ việc gọi và hiển thị. */

const COT_SV = 'id, lop_id, ma_sv, ho_dem, ten, ho_ten, gioi_tinh, email, nhom, dang_hoc'

/** Lớp đang dùng. Bản này phục vụ một lớp; thêm lớp thì lọc theo mã. */
export async function lopHienTai(): Promise<Lop | null> {
  const ds = await lay<Lop[]>(
    'đọc lớp',
    db().from('lop').select('*').order('tao_luc', { ascending: true }).limit(1)
  )
  return ds[0] ?? null
}

export async function timSinhVienTheoMa(maSv: string): Promise<SinhVien | null> {
  const ds = await lay<SinhVien[]>(
    'tìm sinh viên',
    db().from('sinh_vien').select(COT_SV).eq('ma_sv', maSv.trim()).limit(1)
  )
  return ds[0] ?? null
}

export async function sinhVienTheoId(id: string): Promise<SinhVien | null> {
  const ds = await lay<SinhVien[]>(
    'đọc sinh viên',
    db().from('sinh_vien').select(COT_SV).eq('id', id).limit(1)
  )
  return ds[0] ?? null
}

export async function dsSinhVien(lopId: string): Promise<SinhVien[]> {
  return lay<SinhVien[]>(
    'danh sách sinh viên',
    db().from('sinh_vien').select(COT_SV).eq('lop_id', lopId).order('ten').order('ho_dem')
  )
}

export async function dsDotNop(lopId: string): Promise<DotNop[]> {
  return lay<DotNop[]>(
    'danh sách đợt nộp',
    db().from('dot_nop').select('*').eq('lop_id', lopId).order('thu_tu').order('han_nop')
  )
}

export async function dotNopTheoId(id: string): Promise<DotNop | null> {
  const ds = await lay<DotNop[]>(
    'đọc đợt nộp',
    db().from('dot_nop').select('*').eq('id', id).limit(1)
  )
  return ds[0] ?? null
}

export async function baiNopCuaSinhVien(sinhVienId: string): Promise<BaiNop[]> {
  return lay<BaiNop[]>(
    'bài nộp của sinh viên',
    db().from('bai_nop').select('*').eq('sinh_vien_id', sinhVienId)
  )
}

export async function thongKeCacDot(lopId: string): Promise<ThongKeDot[]> {
  return lay<ThongKeDot[]>(
    'thống kê đợt nộp',
    db().from('thong_ke_dot').select('*').eq('lop_id', lopId).order('thu_tu').order('han_nop')
  )
}

export async function trungVideoTrongDot(dotId: string): Promise<TrungVideo[]> {
  return lay<TrungVideo[]>(
    'kiểm trùng video',
    db().from('trung_video').select('*').eq('dot_id', dotId)
  )
}

/**
 * Bảng chấm của một đợt: đủ 42 dòng sinh viên kể cả người chưa nộp, vì cái
 * giảng viên cần thấy trước tiên là ai còn thiếu.
 */
export async function bangCham(dotId: string, lopId: string): Promise<DongCham[]> {
  const [sv, bai] = await Promise.all([
    dsSinhVien(lopId),
    lay<BaiNop[]>('bài nộp của đợt', db().from('bai_nop').select('*').eq('dot_id', dotId)),
  ])
  const theoSv = new Map(bai.map((b) => [b.sinh_vien_id, b]))
  return sv.map((s) => ({ sinh_vien: s, bai: theoSv.get(s.id) ?? null }))
}
