/**
 * Kiểm phần định dạng thời gian. Máy chủ trên Vercel chạy giờ UTC còn hạn nộp
 * là 23:59 giờ Việt Nam, nên sai một tiếng ở đây là lệch hẳn một ngày.
 *
 * Chạy: npm run kiem
 */
import { chuoiNhapNgayGio, conLai, daQuaHan, gioPhutNgay, ngay } from '../src/lib/thoi-gian.ts'

let dat = 0
let truot = 0

function nhan(ten: string, thuc: unknown, cho: unknown) {
  if (thuc === cho) dat += 1
  else {
    truot += 1
    console.error(`  TRƯỢT  ${ten}: ra ${JSON.stringify(thuc)}, chờ ${JSON.stringify(cho)}`)
  }
}

// 16:59 UTC = 23:59 giờ Việt Nam cùng ngày.
nhan('hạn 23:59 giờ VN', gioPhutNgay('2026-09-21T16:59:00.000Z'), '23:59 ngày 21/09/2026')
// 17:30 UTC ngày 21 = 00:30 ngày 22 giờ Việt Nam: phải sang ngày mới.
nhan('qua nửa đêm giờ VN', gioPhutNgay('2026-09-21T17:30:00.000Z'), '00:30 ngày 22/09/2026')
nhan('chỉ ngày', ngay('2026-09-21T16:59:00.000Z'), '21/09/2026')
nhan('rỗng', gioPhutNgay(null), '--')

nhan('ô datetime-local', chuoiNhapNgayGio('2026-09-21T16:59:00.000Z'), '2026-09-21T23:59')
nhan('ô datetime-local qua nửa đêm', chuoiNhapNgayGio('2026-09-21T17:30:00.000Z'), '2026-09-22T00:30')

const moc = new Date('2026-09-20T10:00:00+07:00')
nhan('còn hơn một ngày', conLai('2026-09-23T10:00:00+07:00', moc), 'còn 3 ngày')
nhan('còn vài giờ', conLai('2026-09-20T15:00:00+07:00', moc), 'còn 5 giờ')
nhan('trễ', conLai('2026-09-19T10:00:00+07:00', moc), 'trễ 1 ngày')
nhan('chưa quá hạn', daQuaHan('2026-09-21T00:00:00+07:00', moc), false)
nhan('đã quá hạn', daQuaHan('2026-09-19T00:00:00+07:00', moc), true)

console.log(`${dat} đạt, ${truot} trượt.`)
if (truot > 0) process.exit(1)
