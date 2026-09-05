'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/supabase'
import { dongPhien, dungMa, laGiangVien, moPhien } from '@/lib/phien-gv'
import { lopHienTai } from '@/lib/truy-van'

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

export async function luuDot(_truoc: KetQuaGv, form: FormData): Promise<KetQuaGv> {
  const chan = await batBuocGiangVien()
  if (chan) return { ok: false, loi: chan }

  const lop = await lopHienTai()
  if (!lop) return { ok: false, loi: 'Chưa có lớp trong cơ sở dữ liệu.' }

  const id = String(form.get('id') ?? '').trim()
  const ma = String(form.get('ma') ?? '').trim().toUpperCase()
  const ten = String(form.get('ten') ?? '').trim()
  const han = gioVN(String(form.get('han_nop') ?? ''))

  if (!ma) return { ok: false, loi: 'Thiếu mã đợt.' }
  if (!ten) return { ok: false, loi: 'Thiếu tên đợt.' }
  if (!han) return { ok: false, loi: 'Hạn nộp không hợp lệ.' }

  const phut = String(form.get('phut_toi_thieu') ?? '').trim()

  const banGhi = {
    lop_id: lop.id,
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

  if (error) return { ok: false, loi: `Không lưu được: ${error.message}` }

  revalidatePath('/giang-vien')
  revalidatePath('/')
  return { ok: true, thong_bao: id ? `Đã cập nhật đợt ${ma}.` : `Đã tạo đợt ${ma}.` }
}

/** Bật hoặc tắt nhận bài, dùng cho nút trên bảng danh sách đợt. */
export async function doiTrangThaiDot(form: FormData): Promise<void> {
  if (await batBuocGiangVien()) return
  const id = String(form.get('id') ?? '')
  const mo = form.get('dang_mo') === '1'
  await db().from('dot_nop').update({ dang_mo: mo }).eq('id', id)
  revalidatePath('/giang-vien')
  revalidatePath(`/giang-vien/dot/${id}`)
  revalidatePath('/')
}

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

  revalidatePath('/giang-vien')
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
