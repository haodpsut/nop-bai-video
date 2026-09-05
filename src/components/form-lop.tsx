'use client'

import { useActionState, useState } from 'react'
import { luuLop, type KetQuaGv } from '@/app/giang-vien/hanh-dong'
import type { LopHocPhan } from '@/lib/kieu'
import { HopBao, Nhan, Nut, OChu } from './dieu-khien'

const DAU: KetQuaGv = { ok: false }

/** Dùng chung cho mở lớp học phần mới và sửa lớp đang có. */
export function FormLop({ lop, mo_san }: { lop?: LopHocPhan; mo_san?: boolean }) {
  const [ketQua, chay, dangChay] = useActionState(luuLop, DAU)
  const [mo, datMo] = useState(Boolean(mo_san))

  if (!mo)
    return (
      <Nut dang="phu" type="button" onClick={() => datMo(true)}>
        {lop ? 'Sửa thông tin lớp' : 'Mở lớp học phần mới'}
      </Nut>
    )

  return (
    <form action={chay} className="flex flex-col gap-3">
      {lop && <input type="hidden" name="id" value={lop.id} />}

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Nhan cho="ma-lop">Mã lớp học phần</Nhan>
          <OChu id="ma-lop" name="ma" defaultValue={lop?.ma ?? ''} placeholder="AJP20101" required />
        </div>
        <div>
          <Nhan cho="ma-hp">Mã học phần</Nhan>
          <OChu
            id="ma-hp"
            name="ma_hoc_phan"
            defaultValue={lop?.ma_hoc_phan ?? ''}
            placeholder="AJP201"
            required
          />
        </div>
        <div>
          <Nhan cho="lop-sh">Lớp sinh hoạt</Nhan>
          <OChu
            id="lop-sh"
            name="lop_sinh_hoat"
            defaultValue={lop?.lop_sinh_hoat ?? ''}
            placeholder="24CT1"
          />
        </div>
      </div>

      <div>
        <Nhan cho="ten-hp">Tên học phần</Nhan>
        <OChu
          id="ten-hp"
          name="ten_hoc_phan"
          defaultValue={lop?.ten_hoc_phan ?? ''}
          placeholder="Lập trình Java nâng cao"
          required
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Nhan cho="hoc-ky">Học kỳ</Nhan>
          <OChu id="hoc-ky" name="hoc_ky" defaultValue={lop?.hoc_ky ?? ''} placeholder="HK1 - 2026-2027" />
        </div>
        <div>
          <Nhan cho="gv">Giảng viên</Nhan>
          <OChu id="gv" name="giang_vien" defaultValue={lop?.giang_vien ?? ''} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-[13px]">
        <input type="checkbox" name="dang_hoat_dong" defaultChecked={lop?.dang_hoat_dong ?? true} />
        Đang dạy (bỏ dấu này thì lớp biến khỏi trang sinh viên)
      </label>

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
