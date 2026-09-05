/**
 * Kiểm phần đọc danh sách dán vào. Hỏng ở đây thì hoặc mất sinh viên trong
 * im lặng, hoặc ghi danh nhầm số điện thoại thành tên, nên phải có bài kiểm.
 *
 * Chạy: npm run kiem
 */
import { docDanhSachDan } from '../src/lib/doc-danh-sach.ts'

let dat = 0
let truot = 0

function nhan(ten: string, thuc: unknown, cho: unknown) {
  const a = JSON.stringify(thuc)
  const b = JSON.stringify(cho)
  if (a === b) dat += 1
  else {
    truot += 1
    console.error(`  TRƯỢT  ${ten}: ra ${a}, chờ ${b}`)
  }
}

// Dán từ Excel của phòng đào tạo: có STT, email, số điện thoại, ngày sinh.
{
  const r = docDanhSachDan(
    [
      'STT\tMã sinh viên\tHọ đệm\tTên\tGiới tính\tEmail\tSố điện thoại\tNgày sinh',
      '1\t2451220114\tMai Nguyễn Hồng\tAnh\tNam\tmai@gmail.com\t393061324\t29/12/2006',
      '2\t2451220028\tNgô Quang\tBình\tNam\tngo@gmail.com\t923102276\t14/03/2006',
    ].join('\n')
  )
  nhan('Excel: số dòng đọc được', r.sinh_vien.length, 2)
  nhan('Excel: dòng đầu', r.sinh_vien[0], {
    ma_sv: '2451220114',
    ho_dem: 'Mai Nguyễn Hồng',
    ten: 'Anh',
  })
  nhan('Excel: không nuốt email hay số điện thoại vào tên', r.sinh_vien[1], {
    ma_sv: '2451220028',
    ho_dem: 'Ngô Quang',
    ten: 'Bình',
  })
  nhan('Excel: không có dòng lỗi', r.loi.length, 0)
}

// Gõ tay, mỗi dòng một em
{
  const r = docDanhSachDan('2451220003 Nguyễn Xuân Công\n2451220009  Dương Thiện Da  ')
  nhan('gõ tay: số dòng', r.sinh_vien.length, 2)
  nhan('gõ tay: tách họ tên', r.sinh_vien[0], {
    ma_sv: '2451220003',
    ho_dem: 'Nguyễn Xuân',
    ten: 'Công',
  })
}

// CSV có dấu phẩy
{
  const r = docDanhSachDan('2451220046,Hồ Thị,Buấn,Nữ')
  nhan('CSV', r.sinh_vien[0], { ma_sv: '2451220046', ho_dem: 'Hồ Thị', ten: 'Buấn' })
}

// Những dòng phải bị loại chứ không được nhận bừa
{
  const r = docDanhSachDan(
    ['', 'Danh sách lớp 24CT1', '2451220050', 'Lê Khắc Vũ', '2451220050\tLê Khắc\tVũ'].join('\n')
  )
  nhan('chỉ nhận dòng có đủ mã và tên', r.sinh_vien.length, 1)
  nhan('dòng thiếu bị nêu ra', r.loi.length, 3)
}

// Trùng mã trong cùng lần dán thì chỉ lấy một
{
  const r = docDanhSachDan('2451220050\tLê Khắc\tVũ\n2451220050\tLê Khắc\tVũ')
  nhan('bỏ trùng trong cùng lần dán', r.sinh_vien.length, 1)
}

console.log(`${dat} đạt, ${truot} trượt.`)
if (truot > 0) process.exit(1)
