/**
 * Đọc danh sách sinh viên dán vào ô văn bản.
 *
 * Giảng viên thường bôi đen mấy cột trong file Excel của phòng đào tạo rồi dán
 * thẳng vào, nên hàm này phải chịu được cả ba dạng: dán từ Excel (ngăn bằng
 * tab, kèm cột email và số điện thoại), dán từ file CSV, và gõ tay mỗi dòng
 * một em. Nguyên tắc: tìm mã sinh viên trước, phần chữ đi ngay sau nó là họ
 * tên, mọi cột còn lại bỏ qua.
 */

export type DongDanhSach = { ma_sv: string; ho_dem: string; ten: string }

export type KetQuaDoc = {
  sinh_vien: DongDanhSach[]
  /** Các dòng không đọc được, giữ nguyên văn để báo lại cho người dán. */
  loi: string[]
}

const MA_SV = /^\d{6,}$/
const CO_CHU = /\p{L}/u
const CO_SO = /\d/
const GIOI_TINH = /^(nam|nữ|nu|male|female)$/i

/** Tách một dòng thành các cột theo dấu ngăn thật sự có trong dòng đó. */
function tachCot(dong: string): string[] {
  if (dong.includes('\t')) return dong.split('\t')
  if (dong.includes(';')) return dong.split(';')
  if (dong.includes(',')) return dong.split(',')
  return dong.split(/\s{2,}/)
}

/** Họ đệm là mọi chữ trừ chữ cuối; chữ cuối là tên, đúng cách gọi ở trường. */
function tachHoTen(hoTen: string): { ho_dem: string; ten: string } {
  const tu = hoTen.split(/\s+/).filter(Boolean)
  if (tu.length === 0) return { ho_dem: '', ten: '' }
  if (tu.length === 1) return { ho_dem: '', ten: tu[0] }
  return { ho_dem: tu.slice(0, -1).join(' '), ten: tu[tu.length - 1] }
}

/**
 * Cột họ tên: có chữ, không có số và không phải email. Loại theo hình dạng chứ
 * không theo nội dung, nên mã lớp (24CT1), ngày sinh, số điện thoại đều rớt.
 */
function laCotTen(o: string): boolean {
  return CO_CHU.test(o) && !CO_SO.test(o) && !o.includes('@')
}

/**
 * Bỏ cột giới tính đứng cuối phần tên.
 *
 * Chỉ bỏ đúng cột cuối cùng, vì "Nam" cũng là tên người: bảng
 * [Lê Nhật][Nam][Nam] là em Lê Nhật Nam giới tính nam, bỏ hết chữ "Nam" thì
 * mất luôn tên em.
 */
function boGioiTinhCuoi(cot: string[]): string[] {
  if (cot.length >= 2 && GIOI_TINH.test(cot[cot.length - 1])) return cot.slice(0, -1)
  return cot
}

export function docDanhSachDan(vanBan: string): KetQuaDoc {
  const sinhVien: DongDanhSach[] = []
  const loi: string[] = []
  const daCo = new Set<string>()

  for (const tho of (vanBan ?? '').split(/\r?\n/)) {
    const dong = tho.trim()
    if (!dong) continue
    // Dòng tiêu đề của bảng Excel
    if (/^stt\b/i.test(dong) || /mã\s*sinh\s*viên/i.test(dong)) continue

    let cot = tachCot(dong).map((o) => o.trim())
    // Dòng gõ tay kiểu "2451220114 Nguyễn Văn A" chỉ có một cột.
    if (cot.length === 1) {
      const tu = dong.split(/\s+/)
      const i = tu.findIndex((t) => MA_SV.test(t))
      cot = i < 0 ? [dong] : [tu[i], tu.slice(i + 1).join(' ')]
    }

    const viTri = cot.findIndex((o) => MA_SV.test(o))
    if (viTri < 0) {
      loi.push(dong)
      continue
    }

    const maSv = cot[viTri]
    const phanTen = boGioiTinhCuoi(cot.slice(viTri + 1).filter(laCotTen)).slice(0, 3)
    const hoTen = phanTen.join(' ').replace(/\s+/g, ' ').trim()
    if (!hoTen) {
      loi.push(dong)
      continue
    }

    if (daCo.has(maSv)) continue
    daCo.add(maSv)
    sinhVien.push({ ma_sv: maSv, ...tachHoTen(hoTen) })
  }

  return { sinh_vien: sinhVien, loi }
}
