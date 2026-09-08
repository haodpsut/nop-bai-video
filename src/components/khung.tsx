'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'

/* Khung ngoài dùng chung cho cả trang sinh viên lẫn trang giảng viên.

   Nhận diện theo bộ màu của Trường Đại học Kiến trúc Đà Nẵng: dải đầu trang
   maroon với gạch vàng bên dưới, chân trang navy, giống trang sách tương tác
   OOP và TTNT để sinh viên nhìn là biết cùng một nơi.

   Sinh viên phần lớn mở bằng điện thoại nên bố cục là một cột, không có thanh
   điều hướng bên. */

function NutChuDe() {
  const [che_do, dat] = useState<'sang' | 'toi' | null>(null)

  useEffect(() => {
    const luu = localStorage.getItem('che-do')
    if (luu === 'sang' || luu === 'toi') dat(luu)
    else dat(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'toi' : 'sang')
  }, [])

  const doi = () => {
    const moi = che_do === 'toi' ? 'sang' : 'toi'
    dat(moi)
    localStorage.setItem('che-do', moi)
    document.documentElement.dataset.theme = moi === 'toi' ? 'dark' : 'light'
  }

  return (
    <button
      type="button"
      onClick={doi}
      aria-label={che_do === 'toi' ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
      /* Nút nằm trên dải maroon nên dùng token màu chữ dành riêng cho nền đó,
         không dùng biến màu chữ thường vì nền ở đây không đổi theo sáng tối. */
      className="grid size-8 place-items-center rounded-md border border-tren-nhan-phu/50 text-tren-nhan-phu transition-colors hover:border-tren-nhan-phu hover:text-white"
    >
      {che_do === 'toi' ? (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="8" cy="8" r="3" />
          <path d="M8 1.4v1.6M8 13v1.6M1.4 8h1.6M13 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M13.4 9.6A5.8 5.8 0 0 1 6.4 2.6a5.8 5.8 0 1 0 7 7z" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}

export function Khung({
  children,
  tieu_de,
  phu,
  rong,
}: {
  children: ReactNode
  tieu_de: string
  phu?: string
  rong?: boolean
}) {
  const be = rong ? 'max-w-[1280px]' : 'max-w-[760px]'

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="an-khi-in sticky top-0 z-20 border-b-[3px] border-vang bg-nhan-dac">
        <div className={`mx-auto flex items-center gap-3 px-4 py-2.5 ${be}`}>
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <Image
              src="/dau-logo.png"
              alt="Trường Đại học Kiến trúc Đà Nẵng"
              width={34}
              height={34}
              className="rounded-[3px] bg-white/95 p-[3px]"
              priority
            />
            <span className="leading-tight">
              <span className="block font-[family-name:var(--font-tieu-de)] text-[14.5px] font-semibold text-white">
                {tieu_de}
              </span>
              {phu && <span className="block text-[10.5px] tracking-wide text-tren-nhan-phu">{phu}</span>}
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <NutChuDe />
          </div>
        </div>
      </header>

      <main className={`vung-in mx-auto w-full flex-1 px-4 py-5 ${be}`}>{children}</main>

      <footer className="an-khi-in bg-navy px-4 py-5 text-center text-[11.5px] leading-relaxed text-tren-navy-phu">
        <div className={`mx-auto ${be}`}>
          <span className="text-white">Trường Đại học Kiến trúc Đà Nẵng</span>
          <br />
          Khoa Công nghệ thông tin - hệ thống nộp link video bài tập
        </div>
      </footer>
    </div>
  )
}
