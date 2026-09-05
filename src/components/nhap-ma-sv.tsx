'use client'

import { useActionState } from 'react'
import { xacNhanSinhVien, type KetQua } from '@/app/hanh-dong'
import { HopBao, Nhan, Nut, OChu } from './dieu-khien'

const DAU: KetQua = { ok: false }

export function NhapMaSinhVien() {
  const [ketQua, chay, dangChay] = useActionState(xacNhanSinhVien, DAU)

  return (
    <form action={chay} className="the flex flex-col gap-3 p-4">
      <div>
        <Nhan cho="ma_sv">Mã sinh viên</Nhan>
        <OChu
          id="ma_sv"
          name="ma_sv"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          placeholder="ví dụ 2451220114"
          className="so"
        />
      </div>

      {ketQua.loi && <HopBao sac="nghiem_trong">{ketQua.loi}</HopBao>}

      <Nut type="submit" disabled={dangChay}>
        {dangChay ? 'Đang kiểm...' : 'Vào nộp bài'}
      </Nut>

      <p className="text-[12.5px] leading-relaxed text-muc-nhat">
        Không cần mật khẩu. Hệ thống chỉ đối chiếu mã sinh viên với danh sách lớp học phần, rồi
        nhớ máy này để lần sau em khỏi gõ lại.
      </p>
    </form>
  )
}
