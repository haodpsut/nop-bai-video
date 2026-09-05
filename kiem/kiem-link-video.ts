/**
 * Kiểm hàm bóc link. Đây là chỗ dễ sai nhất của cả hệ: sinh viên dán đủ kiểu
 * link, và một lỗi ở đây thì hoặc chặn oan bài đúng, hoặc để lọt link kênh.
 *
 * Chạy: npm run kiem
 */
import { bocLink, urlNhung } from '../src/lib/link-video.ts'

let dat = 0
let truot = 0

function nhan(ten: string, dung: boolean, chiTiet = '') {
  if (dung) {
    dat += 1
  } else {
    truot += 1
    console.error(`  TRƯỢT  ${ten}${chiTiet ? ` -- ${chiTiet}` : ''}`)
  }
}

/** Link hợp lệ phải ra đúng nền tảng và đúng mã video. */
function nhanDung(vao: string, nenTang: string, ma: string) {
  const r = bocLink(vao)
  if (!r.ok) return nhan(vao, false, `bị từ chối: ${r.loi}`)
  nhan(
    vao,
    r.nen_tang === nenTang && r.ma_video === ma,
    `ra ${r.nen_tang}/${r.ma_video}, chờ ${nenTang}/${ma}`
  )
}

/** Link sai phải bị từ chối, không được im lặng nhận bừa. */
function nhanTuChoi(vao: string) {
  const r = bocLink(vao)
  nhan(`từ chối: ${vao}`, !r.ok, r.ok ? `lại nhận thành ${r.ma_video}` : '')
}

console.log('YouTube')
nhanDung('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'dQw4w9WgXcQ')
nhanDung('https://youtu.be/dQw4w9WgXcQ', 'youtube', 'dQw4w9WgXcQ')
nhanDung('https://youtu.be/dQw4w9WgXcQ?si=abcd1234', 'youtube', 'dQw4w9WgXcQ')
nhanDung('https://www.youtube.com/shorts/dQw4w9WgXcQ', 'youtube', 'dQw4w9WgXcQ')
nhanDung('https://www.youtube.com/live/dQw4w9WgXcQ', 'youtube', 'dQw4w9WgXcQ')
nhanDung('https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=42s', 'youtube', 'dQw4w9WgXcQ')
nhanDung('www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'dQw4w9WgXcQ')
nhanDung('  https://www.youtube.com/watch?v=dQw4w9WgXcQ  ', 'youtube', 'dQw4w9WgXcQ')
nhanDung('<https://youtu.be/dQw4w9WgXcQ>', 'youtube', 'dQw4w9WgXcQ')

console.log('TikTok')
nhanDung('https://www.tiktok.com/@sinhvien/video/7412345678901234567', 'tiktok', '7412345678901234567')
nhanDung(
  'https://www.tiktok.com/@sinhvien/video/7412345678901234567?is_from_webapp=1&sender_device=pc',
  'tiktok',
  '7412345678901234567'
)
nhanDung('https://m.tiktok.com/v/7412345678901234567.html', 'tiktok', '7412345678901234567')

console.log('Phải bị từ chối')
nhanTuChoi('')
nhanTuChoi('chưa nộp ạ')
nhanTuChoi('https://www.youtube.com/@kenhcuaem')
nhanTuChoi('https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv')
nhanTuChoi('https://www.youtube.com/playlist?list=PLabcdefghijklmnop')
nhanTuChoi('https://www.tiktok.com/@sinhvien')
nhanTuChoi('https://drive.google.com/file/d/1abcdEFGH/view')
nhanTuChoi('https://www.facebook.com/watch/?v=123456')
nhanTuChoi('https://example.com/video.mp4')
nhanTuChoi('https://www.youtube.com/watch?v=quangan')

console.log('Chuẩn hóa và nhúng')
{
  const a = bocLink('https://youtu.be/dQw4w9WgXcQ?si=xyz')
  const b = bocLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL123')
  nhan(
    'hai dạng link của cùng một video cho cùng url_chuan',
    a.ok && b.ok && a.url_chuan === b.url_chuan,
    a.ok && b.ok ? `${a.url_chuan} vs ${b.url_chuan}` : 'một trong hai bị từ chối'
  )
  nhan(
    'link kèm danh sách phát có cảnh báo',
    b.ok && typeof b.canh_bao === 'string',
    'không thấy cảnh báo'
  )
}
{
  const r = bocLink('https://vt.tiktok.com/ZSABCdefg/')
  nhan('link TikTok rút gọn vẫn nhận', r.ok)
  nhan('link rút gọn có cảnh báo', r.ok && typeof r.canh_bao === 'string')
  nhan('link rút gọn không có khung nhúng', r.ok && urlNhung(r.nen_tang, r.ma_video) === null)
}
nhan(
  'khung nhúng YouTube dùng miền no-cookie',
  urlNhung('youtube', 'dQw4w9WgXcQ') === 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
)

console.log(`\n${dat} đạt, ${truot} trượt.`)
if (truot > 0) process.exit(1)
