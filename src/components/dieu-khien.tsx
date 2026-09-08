import clsx from 'clsx'
import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ButtonHTMLAttributes } from 'react'

/* Nút, ô nhập và hộp thông báo. Không có chỉ thị 'use client' nên dùng được ở
   cả trang máy chủ lẫn thành phần trình duyệt. */

const O_CHUNG =
  'w-full rounded-md border border-vien bg-noi px-3 py-2 text-[13.5px] text-muc placeholder:text-muc-mo focus:border-nhan-sang'

export function OChu({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={clsx(O_CHUNG, className)} />
}

export function VungChu({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={clsx(O_CHUNG, 'min-h-[68px] resize-y', className)} />
}

export function Chon({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...p} className={clsx(O_CHUNG, 'cursor-pointer', className)}>
      {children}
    </select>
  )
}

export function Nhan({ children, cho }: { children: ReactNode; cho: string }) {
  return (
    <label htmlFor={cho} className="nhan-chu mb-1 block">
      {children}
    </label>
  )
}

type Dang = 'chinh' | 'phu' | 'nguy'

const DANG: Record<Dang, string> = {
  // Nút chính dùng biến NỀN (--nhan-dac) chứ không dùng biến CHỮ (--nhan):
  // ở chế độ tối, biến chữ là maroon sáng, lấy làm nền thì chữ trắng đọc không nổi.
  chinh: 'bg-nhan-dac text-white border-transparent hover:bg-nhan-dac-day',
  phu: 'bg-noi text-muc border-vien hover:bg-chim',
  nguy: 'bg-noi text-nghiem-trong border-vien hover:bg-nghiem-trong-nen',
}

export function Nut({
  children,
  dang = 'chinh',
  className,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { dang?: Dang }) {
  return (
    <button
      {...p}
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-md border px-3.5 py-2 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        DANG[dang],
        className
      )}
    >
      {children}
    </button>
  )
}

type SacBao = 'on' | 'nghiem_trong' | 'canh_bao' | 'nhan'

const BAO: Record<SacBao, string> = {
  on: 'bg-on-nen text-on',
  nghiem_trong: 'bg-nghiem-trong-nen text-nghiem-trong',
  canh_bao: 'bg-canh-bao-nen text-canh-bao',
  nhan: 'bg-nhan-nen text-nhan',
}

export function HopBao({ sac, children }: { sac: SacBao; children: ReactNode }) {
  return (
    <div
      role="status"
      className={clsx('rounded-md px-3 py-2 text-[13px] leading-relaxed', BAO[sac])}
    >
      {children}
    </div>
  )
}
