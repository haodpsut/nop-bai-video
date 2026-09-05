'use client'

import { useActionState, useEffect, useState } from 'react'
import { nopBai, type KetQua } from '@/app/hanh-dong'
import { bocLink } from '@/lib/link-video'
import type { BaiNop, DotNop } from '@/lib/kieu'
import { HopBao, Nhan, Nut, OChu, VungChu } from './dieu-khien'

const DAU: KetQua = { ok: false }

/**
 * Ô nộp của một đợt. Link được kiểm ngay khi gõ bằng đúng hàm mà máy chủ dùng,
 * nên sinh viên thấy sai ở đâu trước khi bấm nộp; máy chủ vẫn kiểm lại lần nữa.
 */
export function ONopBai({ dot, bai }: { dot: DotNop; bai: BaiNop | null }) {
  const [ketQua, chay, dangChay] = useActionState(nopBai, DAU)
  const [nhap, datNhap] = useState(bai?.url ?? '')
  const [moSua, datMoSua] = useState(!bai)

  // Nộp xong thì thu ô nhập lại, để trang không còn giống như chưa nộp.
  useEffect(() => {
    if (ketQua.ok) datMoSua(false)
  }, [ketQua])

  const boc = nhap.trim() ? bocLink(nhap) : null

  if (bai && !moSua)
    return (
      <div className="flex flex-col gap-2">
        {ketQua.thong_bao && <HopBao sac="on">{ketQua.thong_bao}</HopBao>}
        <Nut dang="phu" type="button" onClick={() => datMoSua(true)} className="self-start">
          Đổi link khác
        </Nut>
      </div>
    )

  return (
    <form action={chay} className="flex flex-col gap-3">
      <input type="hidden" name="dot_id" value={dot.id} />

      <div>
        <Nhan cho={`url-${dot.id}`}>Link video YouTube hoặc TikTok</Nhan>
        <OChu
          id={`url-${dot.id}`}
          name="url"
          value={nhap}
          onChange={(e) => datNhap(e.target.value)}
          inputMode="url"
          autoComplete="off"
          placeholder="https://www.youtube.com/watch?v=..."
        />
        {boc && (
          <p
            className={`mt-1 text-[12.5px] ${boc.ok ? 'text-on' : 'text-nghiem-trong'}`}
            aria-live="polite"
          >
            {boc.ok
              ? `Nhận dạng được: ${boc.nen_tang === 'youtube' ? 'YouTube' : 'TikTok'}, mã ${boc.ma_video}.`
              : boc.loi}
          </p>
        )}
      </div>

      <div>
        <Nhan cho={`ghi-chu-${dot.id}`}>Ghi chú cho giảng viên (không bắt buộc)</Nhan>
        <VungChu
          id={`ghi-chu-${dot.id}`}
          name="ghi_chu"
          defaultValue={bai?.ghi_chu ?? ''}
          maxLength={500}
          placeholder="ví dụ: phần đồng bộ hóa em làm ở phút 4:20"
        />
      </div>

      {ketQua.loi && <HopBao sac="nghiem_trong">{ketQua.loi}</HopBao>}
      {ketQua.thong_bao && <HopBao sac="on">{ketQua.thong_bao}</HopBao>}
      {ketQua.canh_bao && <HopBao sac="canh_bao">{ketQua.canh_bao}</HopBao>}

      <div className="flex gap-2">
        <Nut type="submit" disabled={dangChay || (boc !== null && !boc.ok) || !nhap.trim()}>
          {dangChay ? 'Đang gửi...' : bai ? 'Lưu link mới' : 'Nộp bài'}
        </Nut>
        {bai && (
          <Nut dang="phu" type="button" onClick={() => datMoSua(false)}>
            Thôi
          </Nut>
        )}
      </div>
    </form>
  )
}
