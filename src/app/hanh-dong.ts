'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/supabase'
import { bocLink } from '@/lib/link-video'
import { daQuaHan } from '@/lib/thoi-gian'
import { dotNopTheoId, timSinhVienTheoMa } from '@/lib/truy-van'
import type { BaiNop } from '@/lib/kieu'
import { COOKIE_SV } from '@/lib/hang-so'

/* Hành động phía sinh viên. Không có mật khẩu: mã sinh viên phải có trong
   danh sách lớp thì mới nộp được, đúng mức xác thực đã thống nhất cho học
   phần này. Cookie chỉ để khỏi gõ lại mã, mọi thao tác ghi đều kiểm lại mã
   với cơ sở dữ liệu. */

export type KetQua = { ok: boolean; loi?: string; thong_bao?: string; canh_bao?: string }

export async function xacNhanSinhVien(_truoc: KetQua, form: FormData): Promise<KetQua> {
  const ma = String(form.get('ma_sv') ?? '').trim()
  if (!ma) return { ok: false, loi: 'Nhập mã sinh viên của em.' }
  if (!/^\d{6,}$/.test(ma))
    return { ok: false, loi: 'Mã sinh viên chỉ gồm chữ số, ví dụ 2451220114.' }

  const sv = await timSinhVienTheoMa(ma)
  if (!sv)
    return {
      ok: false,
      loi: `Mã ${ma} không có trong danh sách lớp. Kiểm tra lại, nếu vẫn không được thì nhắn giảng viên để bổ sung.`,
    }
  if (!sv.dang_hoc) return { ok: false, loi: 'Mã này đã được đánh dấu thôi học ở lớp học phần.' }

  const kho = await cookies()
  kho.set(COOKIE_SV, sv.ma_sv, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 120,
  })
  revalidatePath('/')
  return { ok: true, thong_bao: `Chào ${sv.ho_ten}.` }
}

export async function doiSinhVien(): Promise<void> {
  const kho = await cookies()
  kho.delete(COOKIE_SV)
  revalidatePath('/')
}

export async function nopBai(_truoc: KetQua, form: FormData): Promise<KetQua> {
  const kho = await cookies()
  const maSv = kho.get(COOKIE_SV)?.value
  if (!maSv) return { ok: false, loi: 'Phiên đã hết. Nhập lại mã sinh viên rồi nộp.' }

  const sv = await timSinhVienTheoMa(maSv)
  if (!sv || !sv.dang_hoc)
    return { ok: false, loi: 'Không tìm thấy mã sinh viên này trong danh sách lớp.' }

  const dotId = String(form.get('dot_id') ?? '')
  const dot = await dotNopTheoId(dotId)
  if (!dot || dot.lop_id !== sv.lop_id) return { ok: false, loi: 'Đợt nộp không tồn tại.' }
  if (!dot.dang_mo) return { ok: false, loi: `Đợt ${dot.ma} đã đóng, không nhận thêm bài.` }

  const quaHan = daQuaHan(dot.han_nop)
  if (quaHan && !dot.cho_nop_tre)
    return { ok: false, loi: `Đợt ${dot.ma} đã quá hạn và không nhận bài trễ.` }

  const boc = bocLink(String(form.get('url') ?? ''))
  if (!boc.ok) return { ok: false, loi: boc.loi }

  // Cùng một video mà hai người nộp thì nhiều khả năng là nộp hộ. Chặn ngay
  // lúc nộp, kèm tên đợt, để sinh viên tự thấy mình dán nhầm link của bạn.
  const { data: trung, error: loiTrung } = await db()
    .from('bai_nop')
    .select('sinh_vien_id')
    .eq('dot_id', dot.id)
    .eq('nen_tang', boc.nen_tang)
    .eq('ma_video', boc.ma_video)
    .neq('sinh_vien_id', sv.id)
    .limit(1)
  if (loiTrung) return { ok: false, loi: `Lỗi kiểm trùng: ${loiTrung.message}` }
  if (trung && trung.length > 0)
    return {
      ok: false,
      loi: 'Video này đã có sinh viên khác trong lớp nộp cho đợt này. Mỗi người nộp video của chính mình.',
    }

  const ghiChu = String(form.get('ghi_chu') ?? '').trim() || null

  const { data: dangCo, error: loiDoc } = await db()
    .from('bai_nop')
    .select('*')
    .eq('dot_id', dot.id)
    .eq('sinh_vien_id', sv.id)
    .limit(1)
  if (loiDoc) return { ok: false, loi: `Lỗi đọc bài nộp: ${loiDoc.message}` }

  const cu = (dangCo?.[0] ?? null) as BaiNop | null

  const banGhi = {
    dot_id: dot.id,
    sinh_vien_id: sv.id,
    url: String(form.get('url') ?? '').trim(),
    url_chuan: boc.url_chuan,
    nen_tang: boc.nen_tang,
    ma_video: boc.ma_video,
    ghi_chu: ghiChu,
    nop_luc: new Date().toISOString(),
    tre: quaHan,
  }

  if (cu) {
    // Nộp lại thì điểm cũ không còn ý nghĩa, trả bài về trạng thái chờ chấm.
    const { error } = await db()
      .from('bai_nop')
      .update({
        ...banGhi,
        so_lan_nop: cu.so_lan_nop + 1,
        trang_thai: 'cho_cham',
        diem: null,
        nhan_xet: null,
        cham_luc: null,
      })
      .eq('id', cu.id)
    if (error) return { ok: false, loi: `Không lưu được: ${error.message}` }
  } else {
    const { error } = await db().from('bai_nop').insert(banGhi)
    if (error) return { ok: false, loi: `Không lưu được: ${error.message}` }
  }

  await db().from('lich_su_nop').insert({
    dot_id: dot.id,
    sinh_vien_id: sv.id,
    hanh_dong: cu ? 'nop_lai' : 'nop',
    url: banGhi.url_chuan,
    ghi_chu: ghiChu,
  })

  revalidatePath('/')
  return {
    ok: true,
    thong_bao: cu
      ? `Đã thay link cho đợt ${dot.ma}. Bài quay lại trạng thái chờ chấm.`
      : `Đã nhận bài đợt ${dot.ma}${quaHan ? ' (ghi nhận nộp trễ)' : ''}.`,
    canh_bao: boc.canh_bao,
  }
}
