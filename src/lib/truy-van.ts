import 'server-only'
import { db, lay } from './supabase'
import type {
  BaiNop,
  DongCham,
  DotNop,
  LopCuaSinhVien,
  LopHocPhan,
  SinhVien,
  SinhVienTrongLop,
  ThongKeDot,
  ThongKeLop,
  TrungVideo,
} from './kieu'

/* Mọi truy vấn đọc gom về một chỗ, để trang chỉ việc gọi và hiển thị. */

const COT_SV = 'id, ma_sv, ho_dem, ten, ho_ten, gioi_tinh, email'

/**
 * PostgREST trả bảng nhúng nhiều-một dưới dạng một đối tượng, nhưng kiểu của
 * supabase-js khi chưa sinh kiểu từ cơ sở dữ liệu lại khai là mảng. Hàm này
 * nhận cả hai dạng để không phải ép kiểu mù.
 */
function mot<T>(x: T | T[] | null | undefined): T | null {
  if (Array.isArray(x)) return x[0] ?? null
  return x ?? null
}

export async function dsLopHocPhan(): Promise<LopHocPhan[]> {
  return lay<LopHocPhan[]>(
    'danh sách lớp học phần',
    db()
      .from('lop_hoc_phan')
      .select('*')
      .order('dang_hoat_dong', { ascending: false })
      .order('tao_luc', { ascending: true })
  )
}

export async function lopTheoMa(ma: string): Promise<LopHocPhan | null> {
  const ds = await lay<LopHocPhan[]>(
    'đọc lớp học phần',
    db().from('lop_hoc_phan').select('*').eq('ma', ma).limit(1)
  )
  return ds[0] ?? null
}

export async function lopTheoId(id: string): Promise<LopHocPhan | null> {
  const ds = await lay<LopHocPhan[]>(
    'đọc lớp học phần',
    db().from('lop_hoc_phan').select('*').eq('id', id).limit(1)
  )
  return ds[0] ?? null
}

export async function thongKeCacLop(): Promise<ThongKeLop[]> {
  return lay<ThongKeLop[]>(
    'thống kê lớp học phần',
    db()
      .from('thong_ke_lop')
      .select('*')
      .order('dang_hoat_dong', { ascending: false })
      .order('ma')
  )
}

export async function timSinhVienTheoMa(maSv: string): Promise<SinhVien | null> {
  const ds = await lay<SinhVien[]>(
    'tìm sinh viên',
    db().from('sinh_vien').select(COT_SV).eq('ma_sv', maSv.trim()).limit(1)
  )
  return ds[0] ?? null
}

/** Danh sách lớp của một sinh viên, chỉ lấy lớp em còn đang học. */
export async function lopDangHocCuaSinhVien(
  sinhVienId: string
): Promise<Array<{ lop: LopHocPhan; nhom: string | null }>> {
  const ds = await lay<Array<{ nhom: string | null; lop_hoc_phan: LopHocPhan | LopHocPhan[] }>>(
    'lớp của sinh viên',
    db()
      .from('ghi_danh')
      .select('nhom, lop_hoc_phan!inner(*)')
      .eq('sinh_vien_id', sinhVienId)
      .eq('dang_hoc', true)
  )
  return ds
    .map((g) => ({ lop: mot(g.lop_hoc_phan), nhom: g.nhom }))
    .filter((x): x is { lop: LopHocPhan; nhom: string | null } => x.lop !== null)
    .filter((x) => x.lop.dang_hoat_dong)
    .sort((a, b) => a.lop.ma.localeCompare(b.lop.ma))
}

/** Danh sách sinh viên của một lớp học phần, xếp theo tên như sổ điểm. */
export async function dsSinhVien(lopId: string): Promise<SinhVienTrongLop[]> {
  const ds = await lay<
    Array<{ nhom: string | null; dang_hoc: boolean; sinh_vien: SinhVien | SinhVien[] }>
  >(
    'danh sách sinh viên',
    db()
      .from('ghi_danh')
      .select(`nhom, dang_hoc, sinh_vien!inner(${COT_SV})`)
      .eq('lop_id', lopId)
      .eq('dang_hoc', true)
  )
  return ds
    .map((g) => ({ sv: mot(g.sinh_vien), nhom: g.nhom, dang_hoc: g.dang_hoc }))
    .filter((g) => g.sv !== null)
    .map((g) => ({ ...(g.sv as SinhVien), nhom: g.nhom, dang_hoc: g.dang_hoc }))
    .sort((a, b) => a.ten.localeCompare(b.ten, 'vi') || a.ho_dem.localeCompare(b.ho_dem, 'vi'))
}

/** Em này có đang học lớp này không. Mọi thao tác ghi đều phải hỏi câu này. */
export async function coGhiDanh(sinhVienId: string, lopId: string): Promise<boolean> {
  const ds = await lay<Array<{ id: string }>>(
    'kiểm ghi danh',
    db()
      .from('ghi_danh')
      .select('id')
      .eq('sinh_vien_id', sinhVienId)
      .eq('lop_id', lopId)
      .eq('dang_hoc', true)
      .limit(1)
  )
  return ds.length > 0
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

/**
 * Toàn bộ những gì trang sinh viên cần: từng lớp em đang học, các đợt của lớp
 * đó, và bài em đã nộp. Gom về một hàm để trang không phải tự ghép.
 */
export async function bangCuaSinhVien(sinhVienId: string): Promise<LopCuaSinhVien[]> {
  /*
   * Ba truy vấn chạy song song, không chờ nhau.
   *
   * Bản chạy thật đặt hàm ở một châu lục còn cơ sở dữ liệu ở châu lục khác, nên
   * mỗi vòng hỏi đáp tốn cả trăm mili giây. Trước đây phải biết danh sách lớp
   * rồi mới hỏi được đợt nộp, thành hai vòng nối đuôi. Giờ lấy luôn đợt của mọi
   * lớp đang dạy rồi lọc trong bộ nhớ: một giảng viên chỉ có vài lớp nên số
   * dòng thừa không đáng kể, mà tiết kiệm hẳn một vòng.
   */
  const [dsLop, dot, bai] = await Promise.all([
    lopDangHocCuaSinhVien(sinhVienId),
    lay<Array<DotNop & { lop_hoc_phan?: unknown }>>(
      'đợt nộp của các lớp đang dạy',
      db()
        .from('dot_nop')
        .select('*, lop_hoc_phan!inner(dang_hoat_dong)')
        .eq('lop_hoc_phan.dang_hoat_dong', true)
        .order('thu_tu')
        .order('han_nop')
    ),
    baiNopCuaSinhVien(sinhVienId),
  ])

  if (dsLop.length === 0) return []

  const theoDot = new Map(bai.map((b) => [b.dot_id, b]))
  return dsLop.map(({ lop, nhom }) => {
    const cua = dot.filter((d) => d.lop_id === lop.id)
    return {
      lop,
      nhom,
      dot: cua,
      bai: new Map(cua.filter((d) => theoDot.has(d.id)).map((d) => [d.id, theoDot.get(d.id)!])),
    }
  })
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
 * Bảng chấm của một đợt: đủ mọi sinh viên của lớp kể cả người chưa nộp, vì cái
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
