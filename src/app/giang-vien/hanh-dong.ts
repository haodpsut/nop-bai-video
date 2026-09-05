'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/supabase'
import { dongPhien, dungMa, laGiangVien, moPhien } from '@/lib/phien-gv'
import { docDanhSachDan } from '@/lib/doc-danh-sach'
import { lopTheoId } from '@/lib/truy-van'

/* Hành động phía giảng viên. Mọi hàm ghi đều tự kiểm phiên: server action là
   một endpoint công khai, kiểm ở trang thôi thì chưa đủ. */

export type KetQuaGv = { ok: boolean; loi?: string; thong_bao?: string }

async function batBuocGiangVien(): Promise<string | null> {
  return (await laGiangVien()) ? null : 'Phiên đã hết hạn. Đăng nhập lại rồi thử lại.'
}

/** datetime-local không mang múi giờ; ở đây luôn hiểu là giờ Việt Nam. */
function gioVN(chuoi: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(chuoi)) return null
  return `${chuoi}:00+07:00`
}

export async function dangNhapGv(_truoc: KetQuaGv, form: FormData): Promise<KetQuaGv> {
  const ma = String(form.get('ma') ?? '')
  if (!dungMa(ma)) return { ok: false, loi: 'Mã không đúng.' }
  await moPhien()
  revalidatePath('/giang-vien')
  return { ok: true }
}

export async function dangXuatGv(): Promise<void> {
  await dongPhien()
  revalidatePath('/giang-vien')
}

// ---------------------------------------------------------------------------
// Lớp học phần
// ---------------------------------------------------------------------------

export async function luuLop(_truoc: KetQuaGv, form: FormData): Promise<KetQuaGv> {
  const chan = await batBuocGiangVien()
  if (chan) return { ok: false, loi: chan }

  const id = String(form.get('id') ?? '').trim()
  const ma = String(form.get('ma') ?? '').trim().toUpperCase()
  const maHocPhan = String(form.get('ma_hoc_phan') ?? '').trim().toUpperCase()
  const ten = String(form.get('ten_hoc_phan') ?? '').trim()

  if (!ma) return { ok: false, loi: 'Thiếu mã lớp học phần.' }
  if (!maHocPhan) return { ok: false, loi: 'Thiếu mã học phần.' }
  if (!ten) return { ok: false, loi: 'Thiếu tên học phần.' }

  const banGhi = {
    ma,
    ma_hoc_phan: maHocPhan,
    ten_hoc_phan: ten,
    lop_sinh_hoat: String(form.get('lop_sinh_hoat') ?? '').trim() || null,
    hoc_ky: String(form.get('hoc_ky') ?? '').trim() || null,
    giang_vien: String(form.get('giang_vien') ?? '').trim() || null,
    dang_hoat_dong: form.get('dang_hoat_dong') === 'on',
  }

  const { error } = id
    ? await db().from('lop_hoc_phan').update(banGhi).eq('id', id)
    : await db().from('lop_hoc_phan').insert(banGhi)

  if (error)
    return {
      ok: false,
      loi: error.message.includes('duplicate')
        ? `Mã lớp học phần ${ma} đã tồn tại.`
        : `Không lưu được: ${error.message}`,
    }

  revalidatePath('/giang-vien')
  revalidatePath(`/giang-vien/lop/${ma}`)
  revalidatePath('/')
  return { ok: true, thong_bao: id ? `Đã cập nhật lớp ${ma}.` : `Đã tạo lớp ${ma}.` }
}

/**
 * Nạp danh sách sinh viên bằng cách dán từ Excel.
 *
 * Sinh viên đã có trong hệ thống (học môn khác của cùng giảng viên) thì giữ
 * nguyên bản ghi cũ, chỉ thêm dòng ghi danh, nên mã sinh viên không bao giờ
 * bị nhân đôi.
 */
export async function napDanhSach(_truoc: KetQuaGv, form: FormData): Promise<KetQuaGv> {
  const chan = await batBuocGiangVien()
  if (chan) return { ok: false, loi: chan }

  const lopId = String(form.get('lop_id') ?? '')
  const lop = await lopTheoId(lopId)
  if (!lop) return { ok: false, loi: 'Không tìm thấy lớp học phần.' }

  const doc = docDanhSachDan(String(form.get('danh_sach') ?? ''))
  if (doc.sinh_vien.length === 0)
    return {
      ok: false,
      loi: doc.loi[0] ?? 'Không đọc được dòng nào. Mỗi dòng cần có mã sinh viên và họ tên.',
    }

  const { error: loiSv } = await db()
    .from('sinh_vien')
    .upsert(
      doc.sinh_vien.map((s) => ({ ma_sv: s.ma_sv, ho_dem: s.ho_dem, ten: s.ten })),
      { onConflict: 'ma_sv', ignoreDuplicates: false }
    )
  if (loiSv) return { ok: false, loi: `Không lưu được sinh viên: ${loiSv.message}` }

  const { data: dsSv, error: loiDoc } = await db()
    .from('sinh_vien')
    .select('id, ma_sv')
    .in(
      'ma_sv',
      doc.sinh_vien.map((s) => s.ma_sv)
    )
  if (loiDoc) return { ok: false, loi: `Không đọc lại được sinh viên: ${loiDoc.message}` }

  const theoMa = new Map((dsSv ?? []).map((s) => [s.ma_sv as string, s.id as string]))
  const { error: loiGd } = await db()
    .from('ghi_danh')
    .upsert(
      doc.sinh_vien
        .filter((s) => theoMa.has(s.ma_sv))
        .map((s) => ({ lop_id: lopId, sinh_vien_id: theoMa.get(s.ma_sv)!, dang_hoc: true })),
      { onConflict: 'lop_id,sinh_vien_id', ignoreDuplicates: true }
    )
  if (loiGd) return { ok: false, loi: `Không ghi danh được: ${loiGd.message}` }

  revalidatePath(`/giang-vien/lop/${lop.ma}`)
  revalidatePath('/')
  const bo = doc.loi.length ? ` Bỏ qua ${doc.loi.length} dòng không đọc được.` : ''
  return { ok: true, thong_bao: `Đã nạp ${doc.sinh_vien.length} sinh viên vào lớp ${lop.ma}.${bo}` }
}

// ---------------------------------------------------------------------------
// Đợt nộp
// ---------------------------------------------------------------------------

export async function luuDot(_truoc: KetQuaGv, form: FormData): Promise<KetQuaGv> {
  const chan = await batBuocGiangVien()
  if (chan) return { ok: false, loi: chan }

  const lopId = String(form.get('lop_id') ?? '')
  const lop = await lopTheoId(lopId)
  if (!lop) return { ok: false, loi: 'Không tìm thấy lớp học phần của đợt này.' }

  const id = String(form.get('id') ?? '').trim()
  const ma = String(form.get('ma') ?? '').trim().toUpperCase()
  const ten = String(form.get('ten') ?? '').trim()
  const han = gioVN(String(form.get('han_nop') ?? ''))

  if (!ma) return { ok: false, loi: 'Thiếu mã đợt.' }
  if (!ten) return { ok: false, loi: 'Thiếu tên đợt.' }
  if (!han) return { ok: false, loi: 'Hạn nộp không hợp lệ.' }

  const phut = String(form.get('phut_toi_thieu') ?? '').trim()

  const banGhi = {
    lop_id: lopId,
    ma,
    ten,
    mo_ta: String(form.get('mo_ta') ?? '').trim() || null,
    yeu_cau: String(form.get('yeu_cau') ?? '').trim() || null,
    han_nop: han,
    cho_nop_tre: form.get('cho_nop_tre') === 'on',
    dang_mo: form.get('dang_mo') === 'on',
    thu_tu: Number(form.get('thu_tu') ?? 0) || 0,
    phut_toi_thieu: phut ? Number(phut) : null,
  }

  const { error } = id
    ? await db().from('dot_nop').update(banGhi).eq('id', id)
    : await db().from('dot_nop').insert(banGhi)

  if (error)
    return {
      ok: false,
      loi: error.message.includes('duplicate')
        ? `Lớp này đã có đợt mã ${ma}.`
        : `Không lưu được: ${error.message}`,
    }

  revalidatePath(`/giang-vien/lop/${lop.ma}`)
  if (id) revalidatePath(`/giang-vien/dot/${id}`)
  revalidatePath('/')
  return { ok: true, thong_bao: id ? `Đã cập nhật đợt ${ma}.` : `Đã tạo đợt ${ma}.` }
}

/** Bật hoặc tắt nhận bài, dùng cho nút trên bảng danh sách đợt. */
export async function doiTrangThaiDot(form: FormData): Promise<void> {
  if (await batBuocGiangVien()) return
  const id = String(form.get('id') ?? '')
  const mo = form.get('dang_mo') === '1'
  await db().from('dot_nop').update({ dang_mo: mo }).eq('id', id)
  revalidatePath('/giang-vien', 'layout')
  revalidatePath('/')
}

// ---------------------------------------------------------------------------
// Chấm bài
// ---------------------------------------------------------------------------

export async function chamBai(_truoc: KetQuaGv, form: FormData): Promise<KetQuaGv> {
  const chan = await batBuocGiangVien()
  if (chan) return { ok: false, loi: chan }

  const baiId = String(form.get('bai_id') ?? '')
  if (!baiId) return { ok: false, loi: 'Thiếu bài nộp.' }

  const diemTho = String(form.get('diem') ?? '').trim()
  const diem = diemTho === '' ? null : Number(diemTho.replace(',', '.'))
  if (diem !== null && (!Number.isFinite(diem) || diem < 0 || diem > 10))
    return { ok: false, loi: 'Điểm phải nằm trong khoảng 0 đến 10.' }

  const trangThai = String(form.get('trang_thai') ?? 'cho_cham')
  if (!['cho_cham', 'dat', 'can_sua_lai'].includes(trangThai))
    return { ok: false, loi: 'Trạng thái không hợp lệ.' }

  const { data, error } = await db()
    .from('bai_nop')
    .update({
      diem,
      trang_thai: trangThai,
      nhan_xet: String(form.get('nhan_xet') ?? '').trim() || null,
      cham_luc: new Date().toISOString(),
    })
    .eq('id', baiId)
    .select('dot_id, sinh_vien_id')
    .limit(1)

  if (error) return { ok: false, loi: `Không lưu được: ${error.message}` }

  const b = data?.[0]
  if (b)
    await db().from('lich_su_nop').insert({
      dot_id: b.dot_id,
      sinh_vien_id: b.sinh_vien_id,
      hanh_dong: 'cham',
      ghi_chu: `${trangThai}${diem === null ? '' : ` - ${diem} điểm`}`,
    })

  revalidatePath('/giang-vien', 'layout')
  revalidatePath('/')
  return { ok: true, thong_bao: 'Đã lưu.' }
}

/** Xóa bài nộp để sinh viên nộp lại từ đầu, ví dụ khi dán nhầm link của bạn. */
export async function xoaBaiNop(form: FormData): Promise<void> {
  if (await batBuocGiangVien()) return
  const baiId = String(form.get('bai_id') ?? '')
  const dotId = String(form.get('dot_id') ?? '')
  await db().from('bai_nop').delete().eq('id', baiId)
  revalidatePath(`/giang-vien/dot/${dotId}`)
  revalidatePath('/')
}
