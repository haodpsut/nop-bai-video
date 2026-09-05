/* Định dạng thời gian theo giờ Việt Nam, không phụ thuộc múi giờ của máy chủ
   (Vercel chạy UTC nên nếu để mặc định thì hạn nộp 23:59 sẽ hiển thị sai ngày). */

const MUI_GIO = 'Asia/Ho_Chi_Minh'

/** Bóc phần tử ngày giờ theo giờ Việt Nam, không phụ thuộc cách sắp xếp của
    từng môi trường (thứ tự trong vi-VN của Node và của trình duyệt không giống
    nhau, mà hàm này chạy ở cả hai nơi). */
function manh(iso: string): Record<string, string> {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: MUI_GIO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .formatToParts(new Date(iso))
    .reduce<Record<string, string>>((g, x) => ((g[x.type] = x.value), g), {})
}

export function gioPhutNgay(iso: string | null | undefined): string {
  if (!iso) return '--'
  const p = manh(iso)
  return `${p.hour}:${p.minute} ngày ${p.day}/${p.month}/${p.year}`
}

export function ngay(iso: string | null | undefined): string {
  if (!iso) return '--'
  const p = manh(iso)
  return `${p.day}/${p.month}/${p.year}`
}

/** Khoảng cách tới hạn, diễn đạt như người nói: "còn 3 ngày", "trễ 5 giờ". */
export function conLai(han: string, moc: Date = new Date()): string {
  const ms = new Date(han).getTime() - moc.getTime()
  const tre = ms < 0
  const phut = Math.floor(Math.abs(ms) / 60000)
  const gio = Math.floor(phut / 60)
  const ngayLe = Math.floor(gio / 24)

  const so =
    ngayLe >= 1 ? `${ngayLe} ngày` : gio >= 1 ? `${gio} giờ` : `${Math.max(phut, 1)} phút`
  return tre ? `trễ ${so}` : `còn ${so}`
}

export function daQuaHan(han: string, moc: Date = new Date()): boolean {
  return new Date(han).getTime() < moc.getTime()
}

/**
 * Chuỗi cho ô <input type="datetime-local"> theo giờ Việt Nam
 * (dạng YYYY-MM-DDTHH:mm). Trình duyệt của giảng viên có thể ở múi giờ khác,
 * nên không dùng toISOString cắt chuỗi.
 */
export function chuoiNhapNgayGio(iso: string | null | undefined): string {
  if (!iso) return ''
  const p = manh(iso)
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}
