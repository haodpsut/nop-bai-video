/**
 * Đọc file điểm danh xuất từ phần mềm đào tạo (.xlsx) thành JSON danh sách lớp.
 *
 *   node scripts/doc-danh-sach-xlsx.mjs <file.xlsx> <ma_lop>
 *
 * File gốc có phần đầu 13 dòng thông tin lớp, bảng bắt đầu từ dòng 14 với thứ
 * tự cột: STT | Mã sinh viên | Họ đệm | Tên | Giới tính | Email | SĐT | Ngày sinh.
 * Script chỉ nhận dòng có mã sinh viên toàn chữ số nên các dòng tiêu đề lặp,
 * dòng tổng cộng hay cột điểm danh thừa đều bị bỏ qua.
 */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ExcelJS from 'exceljs'

const [duongDan, maLop] = process.argv.slice(2)
if (!duongDan || !maLop) {
  console.error('Dùng: node scripts/doc-danh-sach-xlsx.mjs <file.xlsx> <ma_lop>')
  process.exit(1)
}

const chuoi = (o) =>
  (o && typeof o === 'object' ? String(o.text ?? o.hyperlink ?? '') : String(o ?? '')).trim()

const wb = new ExcelJS.Workbook()
await wb.xlsx.readFile(duongDan)
const ws = wb.worksheets[0]

const sinhVien = []
ws.eachRow((row, i) => {
  if (i < 14) return
  const v = row.values
  const maSv = chuoi(v[2])
  if (!/^\d{6,}$/.test(maSv)) return
  sinhVien.push({
    ma_sv: maSv,
    ho_dem: chuoi(v[3]),
    ten: chuoi(v[4]),
    gioi_tinh: chuoi(v[5]) || null,
    email: chuoi(v[6]).toLowerCase() || null,
  })
})

if (sinhVien.length === 0) {
  console.error('Không đọc được sinh viên nào. Kiểm tra lại vị trí cột trong file.')
  process.exit(1)
}

const dich = resolve('du-lieu', `danh-sach-${maLop}.json`)
writeFileSync(dich, JSON.stringify({ ma_lop: maLop, sinh_vien: sinhVien }, null, 2) + '\n', 'utf8')
console.log(`${sinhVien.length} sinh viên -> ${dich}`)
