/**
 * Bóc và chuẩn hóa link video sinh viên dán vào.
 *
 * Mục tiêu không phải chặn cho bằng được, mà là bắt sớm ba lỗi hay gặp nhất:
 * dán nhầm link kênh hoặc playlist, dán link video của người khác đã có bạn
 * trong lớp nộp, và dán link kèm tham số theo dõi làm hai bản ghi cùng một
 * video trông như hai video khác nhau.
 */

export type NenTang = 'youtube' | 'tiktok'

export type KetQuaBoc =
  | { ok: true; nen_tang: NenTang; ma_video: string; url_chuan: string; canh_bao?: string }
  | { ok: false; loi: string }

const YOUTUBE = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
])

const TIKTOK = new Set([
  'tiktok.com',
  'www.tiktok.com',
  'm.tiktok.com',
  'vm.tiktok.com',
  'vt.tiktok.com',
])

const MA_YOUTUBE = /^[A-Za-z0-9_-]{11}$/
const MA_TIKTOK = /^\d{9,25}$/

/** Link rút gọn của TikTok chỉ mở được bằng cách gọi mạng, ở đây không gọi. */
const RUT_GON = new Set(['vm.tiktok.com', 'vt.tiktok.com'])

export function bocLink(dauVao: string): KetQuaBoc {
  const tho = (dauVao ?? '').trim()
  if (!tho) return { ok: false, loi: 'Chưa dán link video.' }

  // Sinh viên hay dán thiếu giao thức, hoặc dán kèm dấu ngoặc khi chép từ chat.
  const sach = tho.replace(/^[<("']+|[>)"']+$/g, '')
  const coGiaoThuc = /^https?:\/\//i.test(sach) ? sach : `https://${sach}`

  let u: URL
  try {
    u = new URL(coGiaoThuc)
  } catch {
    return { ok: false, loi: 'Chuỗi này không phải một địa chỉ web hợp lệ.' }
  }

  const host = u.hostname.toLowerCase()

  if (YOUTUBE.has(host)) return bocYouTube(u, host)
  if (TIKTOK.has(host)) return bocTikTok(u, host)

  if (/drive\.google|docs\.google/.test(host))
    return {
      ok: false,
      loi: 'Học phần này chỉ nhận link YouTube hoặc TikTok. Link Google Drive hay bị khóa quyền xem nên không nhận.',
    }
  if (/facebook|fb\.watch/.test(host))
    return { ok: false, loi: 'Chưa nhận link Facebook. Hãy đăng lên YouTube hoặc TikTok.' }

  return {
    ok: false,
    loi: `Tên miền ${host} không được chấp nhận. Chỉ nhận youtube.com, youtu.be hoặc tiktok.com.`,
  }
}

function bocYouTube(u: URL, host: string): KetQuaBoc {
  const doan = u.pathname.split('/').filter(Boolean)
  let ma = ''

  if (host.endsWith('youtu.be')) {
    ma = doan[0] ?? ''
  } else if (doan[0] === 'watch') {
    ma = u.searchParams.get('v') ?? ''
  } else if (doan[0] === 'shorts' || doan[0] === 'live' || doan[0] === 'embed' || doan[0] === 'v') {
    ma = doan[1] ?? ''
  } else if (doan[0]?.startsWith('@') || doan[0] === 'channel' || doan[0] === 'c' || doan[0] === 'user') {
    return {
      ok: false,
      loi: 'Đây là link kênh, không phải link một video. Mở đúng video rồi bấm Chia sẻ để lấy link.',
    }
  } else if (doan[0] === 'playlist') {
    return { ok: false, loi: 'Đây là link danh sách phát. Hãy nộp link của một video cụ thể.' }
  }

  if (!MA_YOUTUBE.test(ma))
    return { ok: false, loi: 'Không tìm thấy mã video YouTube trong link này.' }

  const canhBao = u.searchParams.get('list')
    ? 'Link có kèm danh sách phát, hệ thống đã cắt bỏ phần đó và chỉ giữ video.'
    : undefined

  return {
    ok: true,
    nen_tang: 'youtube',
    ma_video: ma,
    url_chuan: `https://www.youtube.com/watch?v=${ma}`,
    canh_bao: canhBao,
  }
}

function bocTikTok(u: URL, host: string): KetQuaBoc {
  const doan = u.pathname.split('/').filter(Boolean)

  if (RUT_GON.has(host)) {
    const ma = doan[0] ?? ''
    if (!ma) return { ok: false, loi: 'Link TikTok rút gọn thiếu phần mã.' }
    return {
      ok: true,
      nen_tang: 'tiktok',
      ma_video: `rutgon:${ma}`,
      url_chuan: `https://${host}/${ma}`,
      canh_bao:
        'Đây là link rút gọn nên hệ thống không xem trước được video. Nên mở video trên web rồi chép link dạng tiktok.com/@tai-khoan/video/... để chắc chắn.',
    }
  }

  let ma = ''
  const viTri = doan.indexOf('video')
  if (viTri >= 0) ma = doan[viTri + 1] ?? ''
  else if (doan[0] === 'v') ma = (doan[1] ?? '').replace(/\.html$/, '')

  if (doan[0]?.startsWith('@') && viTri < 0)
    return {
      ok: false,
      loi: 'Đây là link trang cá nhân TikTok, không phải một video. Mở video rồi bấm Chia sẻ để lấy link.',
    }

  ma = ma.split('?')[0]
  if (!MA_TIKTOK.test(ma))
    return { ok: false, loi: 'Không tìm thấy mã video TikTok trong link này.' }

  const taiKhoan = doan[0]?.startsWith('@') ? doan[0] : '@user'
  return {
    ok: true,
    nen_tang: 'tiktok',
    ma_video: ma,
    url_chuan: `https://www.tiktok.com/${taiKhoan}/video/${ma}`,
  }
}

/** Ảnh đại diện video, dùng cho bảng của giảng viên. Rỗng nghĩa là không có. */
export function anhDaiDien(nen_tang: NenTang, ma_video: string): string {
  if (nen_tang === 'youtube') return `https://i.ytimg.com/vi/${ma_video}/mqdefault.jpg`
  return ''
}

/** Địa chỉ nhúng để xem ngay trong trang chấm bài. */
export function urlNhung(nen_tang: NenTang, ma_video: string): string | null {
  if (nen_tang === 'youtube') return `https://www.youtube-nocookie.com/embed/${ma_video}`
  if (ma_video.startsWith('rutgon:')) return null
  return `https://www.tiktok.com/embed/v2/${ma_video}`
}
