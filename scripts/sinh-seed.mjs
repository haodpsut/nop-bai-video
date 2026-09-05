/**
 * Sinh supabase/seed.sql từ các file JSON trong du-lieu/.
 *
 * Tách rời như vậy để thêm một học phần chỉ cần thêm một mục trong
 * du-lieu/lop-hoc-phan.json rồi chạy lại script, không phải sửa tay câu lệnh
 * SQL. Sinh viên học nhiều môn thì chỉ có một bản ghi, nhiều dòng ghi danh.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const doc = (ten) => JSON.parse(readFileSync(resolve('du-lieu', ten), 'utf8'))

/** Chuỗi SQL: nhân đôi dấu nháy đơn, rỗng thành NULL. */
const s = (v) =>
  v === null || v === undefined || v === '' ? 'null' : `'${String(v).replace(/'/g, "''")}'`

const cauHinh = doc('lop-hoc-phan.json')
const dong = []
const moiSinhVien = new Map()

dong.push('-- File này do scripts/sinh-seed.mjs sinh ra. Đừng sửa tay.')
dong.push('-- Sửa dữ liệu trong du-lieu/*.json rồi chạy: npm run seed:gen')
dong.push('')

// --- Lớp học phần ---------------------------------------------------------
dong.push(
  'insert into lop_hoc_phan (ma, ma_hoc_phan, ten_hoc_phan, lop_sinh_hoat, hoc_ky, giang_vien) values'
)
dong.push(
  cauHinh.lop
    .map(
      (l) =>
        `  (${s(l.ma)}, ${s(l.ma_hoc_phan)}, ${s(l.ten_hoc_phan)}, ${s(l.lop_sinh_hoat)}, ${s(l.hoc_ky)}, ${s(l.giang_vien)})`
    )
    .join(',\n') + ';'
)
dong.push('')

// --- Sinh viên ------------------------------------------------------------
// Gom danh sách của mọi lớp lại trước, để một em học hai môn chỉ sinh một dòng.
for (const l of cauHinh.lop) {
  for (const sv of doc(l.danh_sach).sinh_vien) {
    if (!moiSinhVien.has(sv.ma_sv)) moiSinhVien.set(sv.ma_sv, sv)
  }
}

dong.push('insert into sinh_vien (ma_sv, ho_dem, ten, gioi_tinh, email) values')
dong.push(
  [...moiSinhVien.values()]
    .map(
      (sv) =>
        `  (${s(sv.ma_sv)}, ${s(sv.ho_dem)}, ${s(sv.ten)}, ${s(sv.gioi_tinh)}, ${s(sv.email)})`
    )
    .join(',\n') + '\non conflict (ma_sv) do nothing;'
)
dong.push('')

// --- Ghi danh và đợt nộp của từng lớp ------------------------------------
for (const l of cauHinh.lop) {
  const dsSv = doc(l.danh_sach).sinh_vien
  dong.push(`-- ${l.ma}: ${l.ten_hoc_phan}`)
  dong.push('insert into ghi_danh (lop_id, sinh_vien_id) values')
  dong.push(
    dsSv
      .map(
        (sv) =>
          `  ((select id from lop_hoc_phan where ma = ${s(l.ma)}), (select id from sinh_vien where ma_sv = ${s(sv.ma_sv)}))`
      )
      .join(',\n') + '\non conflict (lop_id, sinh_vien_id) do nothing;'
  )
  dong.push('')

  const dsDot = doc(l.dot_nop).dot_nop
  dong.push(
    'insert into dot_nop (lop_id, ma, ten, mo_ta, yeu_cau, han_nop, phut_toi_thieu, thu_tu) values'
  )
  dong.push(
    dsDot
      .map(
        (d) =>
          `  ((select id from lop_hoc_phan where ma = ${s(l.ma)}), ${s(d.ma)}, ${s(d.ten)}, ${s(d.mo_ta)}, ${s(d.yeu_cau)}, ${s(d.han_nop)}::timestamptz, ${d.phut_toi_thieu ?? 'null'}, ${d.thu_tu})`
      )
      .join(',\n') + ';'
  )
  dong.push('')
}

writeFileSync(resolve('supabase', 'seed.sql'), dong.join('\n'), 'utf8')
console.log(
  `seed.sql: ${cauHinh.lop.length} lớp học phần, ${moiSinhVien.size} sinh viên.` +
    cauHinh.lop.map((l) => `\n  ${l.ma}: ${doc(l.danh_sach).sinh_vien.length} sinh viên, ${doc(l.dot_nop).dot_nop.length} đợt nộp.`).join('')
)
