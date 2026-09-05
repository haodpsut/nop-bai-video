'use client'

import { useState } from 'react'
import type { NenTang } from '@/lib/link-video'
import { urlNhung } from '@/lib/link-video'

/**
 * Khung xem video, chỉ nạp khi bấm. Nạp sẵn cả 42 khung nhúng thì trang chấm
 * bài sẽ nặng và TikTok cũng chặn khi có quá nhiều khung cùng lúc.
 */
export function XemVideo({ nen_tang, ma_video }: { nen_tang: NenTang; ma_video: string }) {
  const [mo, datMo] = useState(false)
  const nhung = urlNhung(nen_tang, ma_video)

  if (!nhung)
    return <span className="text-[12px] text-muc-mo">Link rút gọn, mở bằng liên kết bên trên.</span>

  if (!mo)
    return (
      <button
        type="button"
        onClick={() => datMo(true)}
        className="self-start rounded-md border border-vien bg-noi px-2.5 py-1 text-[12.5px] text-muc-nhat transition-colors hover:text-muc"
      >
        Xem tại đây
      </button>
    )

  return (
    <div className="flex flex-col gap-1">
      <div
        className="overflow-hidden rounded-md border border-vien bg-black"
        style={{
          width: nen_tang === 'youtube' ? 400 : 325,
          maxWidth: '100%',
          aspectRatio: nen_tang === 'youtube' ? '16 / 9' : '9 / 16',
        }}
      >
        <iframe
          src={nhung}
          title={`Video ${ma_video}`}
          allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="size-full"
        />
      </div>
      <button
        type="button"
        onClick={() => datMo(false)}
        className="self-start text-[12px] text-muc-mo underline underline-offset-2"
      >
        Thu gọn
      </button>
    </div>
  )
}
