import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

/**
 * Phiên đăng nhập của giảng viên.
 *
 * Chỉ có một người dùng nên không dựng bảng tài khoản: mật khẩu nằm trong biến
 * môi trường, cookie giữ chữ ký HMAC của mật khẩu đó. Đổi MA_GIANG_VIEN hoặc
 * KHOA_PHIEN là mọi phiên cũ hết hiệu lực ngay.
 */

const TEN_COOKIE = 'phien-gv'
const HAN_GIAY = 60 * 60 * 12

function chuKy(): string {
  const ma = process.env.MA_GIANG_VIEN
  const khoa = process.env.KHOA_PHIEN
  if (!ma || !khoa)
    throw new Error(
      'Thiếu MA_GIANG_VIEN hoặc KHOA_PHIEN. Sao chép .env.example thành .env.local rồi đặt giá trị.'
    )
  return createHmac('sha256', khoa).update(ma).digest('hex')
}

/** So sánh theo thời gian hằng để không lộ dần mật khẩu qua thời gian phản hồi. */
function bangNhau(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export function dungMa(maNhap: string): boolean {
  const ma = process.env.MA_GIANG_VIEN
  if (!ma) return false
  return bangNhau(maNhap.trim(), ma)
}

export async function moPhien(): Promise<void> {
  const kho = await cookies()
  kho.set(TEN_COOKIE, chuKy(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: HAN_GIAY,
  })
}

export async function dongPhien(): Promise<void> {
  const kho = await cookies()
  kho.delete(TEN_COOKIE)
}

export async function laGiangVien(): Promise<boolean> {
  const kho = await cookies()
  const v = kho.get(TEN_COOKIE)?.value
  if (!v) return false
  try {
    return bangNhau(v, chuKy())
  } catch {
    return false
  }
}
