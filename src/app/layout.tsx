import type { Metadata } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Sans_Condensed, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const than = IBM_Plex_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-sans',
  display: 'swap',
})

const tieuDe = IBM_Plex_Sans_Condensed({
  subsets: ['latin', 'vietnamese'],
  weight: ['500', '600', '700'],
  variable: '--font-plex-condensed',
  display: 'swap',
})

const so = IBM_Plex_Mono({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Nộp link video bài tập | Lập trình Java nâng cao',
  description:
    'Nơi sinh viên nộp link video YouTube hoặc TikTok cho bài tập học phần Lập trình Java nâng cao.',
  icons: { icon: '/favicon.svg' },
}

/** Đặt chủ đề trước khi trang vẽ để không nháy nền. */
const KHOI_TAO_CHU_DE = `
(function(){
  try {
    var l = localStorage.getItem('che-do');
    if (l === 'toi') document.documentElement.dataset.theme = 'dark';
    else if (l === 'sang') document.documentElement.dataset.theme = 'light';
  } catch (e) {}
})();
`

/** Không prerender: mọi trang đều đọc dữ liệu sống. */
export const dynamic = 'force-dynamic'

export default function BoCuc({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: KHOI_TAO_CHU_DE }} />
      </head>
      <body className={`${than.variable} ${tieuDe.variable} ${so.variable}`}>{children}</body>
    </html>
  )
}
