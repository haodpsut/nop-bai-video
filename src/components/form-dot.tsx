'use client'

import { useActionState, useState } from 'react'
import { luuDot, type KetQuaGv } from '@/app/giang-vien/hanh-dong'
import type { DotNop } from '@/lib/kieu'
import { chuoiNhapNgayGio } from '@/lib/thoi-gian'
import { HopBao, Nhan, Nut, OChu, VungChu } from './dieu-khien'

const DAU: KetQuaGv = { ok: false }

/** Dùng chung cho tạo đợt mới và sửa đợt đang có. */
export function FormDot({ dot, mo_san }: { dot?: DotNop; mo_san?: boolean }) {
  const [ketQua, chay, dangChay] = useActionState(luuDot, DAU)
  const [mo, datMo] = useState(Boolean(mo_san))

  if (!mo)
    return (
      <Nut dang="phu" type="button" onClick={() => datMo(true)}>
        {dot ? 'Sửa đợt này' : 'Tạo đợt nộp mới'}
      </Nut>
    )

  return (
    <form action={chay} className="flex flex-col gap-3">
      {dot && <input type="hidden" name="id" value={dot.id} />}

      <div className="grid gap-3 sm:grid-cols-[120px_1fr_110px]">
        <div>
          <Nhan cho="ma-dot">Mã đợt</Nhan>
          <OChu id="ma-dot" name="ma" defaultValue={dot?.ma ?? ''} placeholder="LAB06" required />
        </div>
        <div>
          <Nhan cho="ten-dot">Tên đợt</Nhan>
          <OChu id="ten-dot" name="ten" defaultValue={dot?.ten ?? ''} required />
        </div>
        <div>
          <Nhan cho="thu-tu">Thứ tự</Nhan>
          <OChu
            id="thu-tu"
            name="thu_tu"
            type="number"
            min={0}
            defaultValue={dot?.thu_tu ?? 0}
            className="so"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
        <div>
          <Nhan cho="han-nop">Hạn nộp (giờ Việt Nam)</Nhan>
          <OChu
            id="han-nop"
            name="han_nop"
            type="datetime-local"
            defaultValue={chuoiNhapNgayGio(dot?.han_nop) || ''}
            required
          />
        </div>
        <div>
          <Nhan cho="phut">Phút tối thiểu</Nhan>
          <OChu
            id="phut"
            name="phut_toi_thieu"
            type="number"
            min={0}
            defaultValue={dot?.phut_toi_thieu ?? ''}
            className="so"
          />
        </div>
      </div>

      <div>
        <Nhan cho="mo-ta">Mô tả</Nhan>
        <VungChu id="mo-ta" name="mo_ta" defaultValue={dot?.mo_ta ?? ''} />
      </div>

      <div>
        <Nhan cho="yeu-cau">Yêu cầu video</Nhan>
        <VungChu id="yeu-cau" name="yeu_cau" defaultValue={dot?.yeu_cau ?? ''} />
      </div>

      <div className="flex flex-wrap gap-4 text-[13px]">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="dang_mo" defaultChecked={dot?.dang_mo ?? true} />
          Đang nhận bài
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="cho_nop_tre" defaultChecked={dot?.cho_nop_tre ?? true} />
          Nhận bài trễ (có đánh dấu trễ)
        </label>
      </div>

      {ketQua.loi && <HopBao sac="nghiem_trong">{ketQua.loi}</HopBao>}
      {ketQua.thong_bao && <HopBao sac="on">{ketQua.thong_bao}</HopBao>}

      <div className="flex gap-2">
        <Nut type="submit" disabled={dangChay}>
          {dangChay ? 'Đang lưu...' : 'Lưu'}
        </Nut>
        <Nut dang="phu" type="button" onClick={() => datMo(false)}>
          Đóng
        </Nut>
      </div>
    </form>
  )
}
