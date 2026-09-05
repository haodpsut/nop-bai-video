/**
 * Sinh supabase/seed.sql từ các file JSON trong du-lieu/.
 *
 * Tách rời như vậy để nạp lại danh sách lớp mới chỉ cần thay file JSON rồi
 * chạy `npm run db:reset`, không phải sửa tay câu lệnh SQL.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const LOP = {
  ma: '24CT1',
  ten_hoc_phan: 'Lập trình Java nâng cao',
  ma_hoc_phan: 'AJP201',
  ma_lop_hoc_phan: 'AJP20101',
  hoc_ky: 'HK1 - 2026-2027',
  giang_vien: 'TS. Đỗ Phúc Hảo',
}

const doc = (ten) => JSON.parse(readFileSync(resolve('du-lieu', ten), 'utf8'))
const danhSach = doc('danh-sach-24CT1.json')
const dotNop = doc('dot-nop-AJP201.json')

/** Chuỗi SQL: nhân đôi dấu nháy đơn, null giữ nguyên là NULL. */
const s = (v) => (v === null || v === undefined || v === '' ? 'null' : `'${String(v).replace(/'/g, "''")}'`)

const dong = []
dong.push('-- File này do scripts/sinh-seed.mjs sinh ra. Đừng sửa tay.')
dong.push('-- Sửa dữ liệu trong du-lieu/*.json rồi chạy: npm run seed:gen')
dong.push('')
dong.push('insert into lop (ma, ten_hoc_phan, ma_hoc_phan, ma_lop_hoc_phan, hoc_ky, giang_vien) values')
dong.push(
  `  (${s(LOP.ma)}, ${s(LOP.ten_hoc_phan)}, ${s(LOP.ma_hoc_phan)}, ${s(LOP.ma_lop_hoc_phan)}, ${s(LOP.hoc_ky)}, ${s(LOP.giang_vien)});`
)
dong.push('')
dong.push('insert into sinh_vien (lop_id, ma_sv, ho_dem, ten, gioi_tinh, email) values')
dong.push(
  danhSach.sinh_vien
    .map(
      (sv) =>
        `  ((select id from lop where ma = ${s(LOP.ma)}), ${s(sv.ma_sv)}, ${s(sv.ho_dem)}, ${s(sv.ten)}, ${s(sv.gioi_tinh)}, ${s(sv.email)})`
    )
    .join(',\n') + ';'
)
dong.push('')
dong.push(
  'insert into dot_nop (lop_id, ma, ten, mo_ta, yeu_cau, han_nop, phut_toi_thieu, thu_tu) values'
)
dong.push(
  dotNop.dot_nop
    .map(
      (d) =>
        `  ((select id from lop where ma = ${s(LOP.ma)}), ${s(d.ma)}, ${s(d.ten)}, ${s(d.mo_ta)}, ${s(d.yeu_cau)}, ${s(d.han_nop)}::timestamptz, ${d.phut_toi_thieu ?? 'null'}, ${d.thu_tu})`
    )
    .join(',\n') + ';'
)
dong.push('')

writeFileSync(resolve('supabase', 'seed.sql'), dong.join('\n'), 'utf8')
console.log(
  `seed.sql: 1 lớp, ${danhSach.sinh_vien.length} sinh viên, ${dotNop.dot_nop.length} đợt nộp.`
)
