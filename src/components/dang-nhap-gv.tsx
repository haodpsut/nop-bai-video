'use client'

import { useActionState } from 'react'
import { dangNhapGv, type KetQuaGv } from '@/app/giang-vien/hanh-dong'
import { HopBao, Nhan, Nut, OChu } from './dieu-khien'

const DAU: KetQuaGv = { ok: false }

export function DangNhapGiangVien() {
  const [ketQua, chay, dangChay] = useActionState(dangNhapGv, DAU)

  return (
    <form action={chay} className="the flex flex-col gap-3 p-4">
      <div>
        <Nhan cho="ma-gv">Mã giảng viên</Nhan>
        <OChu id="ma-gv" name="ma" type="password" autoComplete="current-password" autoFocus />
      </div>
      {ketQua.loi && <HopBao sac="nghiem_trong">{ketQua.loi}</HopBao>}
      <Nut type="submit" disabled={dangChay}>
        {dangChay ? 'Đang kiểm...' : 'Vào trang chấm bài'}
      </Nut>
      <p className="text-[12px] text-muc-mo">
        Mã đặt trong biến môi trường MA_GIANG_VIEN, không lưu trong cơ sở dữ liệu.
      </p>
    </form>
  )
}
