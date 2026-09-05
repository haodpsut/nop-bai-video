'use client'

import { useActionState, useState } from 'react'
import { napDanhSach, type KetQuaGv } from '@/app/giang-vien/hanh-dong'
import { docDanhSachDan } from '@/lib/doc-danh-sach'
import { HopBao, Nhan, Nut, VungChu } from './dieu-khien'

const DAU: KetQuaGv = { ok: false }

/**
 * Nạp danh sách sinh viên bằng cách dán từ Excel. Đếm trước ngay trong trình
 * duyệt bằng đúng hàm mà máy chủ dùng, để giảng viên thấy hệ thống đọc ra bao
 * nhiêu em trước khi bấm nạp.
 */
export function FormDanhSach({ lop_id }: { lop_id: string }) {
  const [ketQua, chay, dangChay] = useActionState(napDanhSach, DAU)
  const [mo, datMo] = useState(false)
  const [nhap, datNhap] = useState('')

  const doc = nhap.trim() ? docDanhSachDan(nhap) : null

  if (!mo)
    return (
      <Nut dang="phu" type="button" onClick={() => datMo(true)}>
        Nạp danh sách sinh viên
      </Nut>
    )

  return (
    <form action={chay} className="flex flex-col gap-3">
      <input type="hidden" name="lop_id" value={lop_id} />

      <div>
        <Nhan cho="danh-sach">Dán từ Excel hoặc gõ tay, mỗi dòng một sinh viên</Nhan>
        <VungChu
          id="danh-sach"
          name="danh_sach"
          value={nhap}
          onChange={(e) => datNhap(e.target.value)}
          className="min-h-[180px] font-[family-name:var(--font-so)] text-[12.5px]"
          placeholder={'2451220114\tMai Nguyễn Hồng\tAnh\n2451220028\tNgô Quang\tBình'}
        />
        <p className="mt-1 text-[12px] leading-relaxed text-muc-mo">
          Bôi đen các cột trong file điểm danh rồi dán thẳng vào đây cũng được: hệ thống tự bỏ cột
          số thứ tự, giới tính, email, số điện thoại và ngày sinh. Em nào đã có trong hệ thống vì
          học môn khác thì chỉ được thêm vào lớp này, không tạo bản ghi mới.
        </p>
      </div>

      {doc && (
        <div className="text-[12.5px]" aria-live="polite">
          <span className="text-on">Đọc được {doc.sinh_vien.length} sinh viên</span>
          {doc.loi.length > 0 && (
            <span className="text-canh-bao">
              {' '}
              - {doc.loi.length} dòng không đọc được: {doc.loi.slice(0, 3).join(' | ')}
              {doc.loi.length > 3 ? '...' : ''}
            </span>
          )}
        </div>
      )}

      {ketQua.loi && <HopBao sac="nghiem_trong">{ketQua.loi}</HopBao>}
      {ketQua.thong_bao && <HopBao sac="on">{ketQua.thong_bao}</HopBao>}

      <div className="flex gap-2">
        <Nut type="submit" disabled={dangChay || !doc || doc.sinh_vien.length === 0}>
          {dangChay ? 'Đang nạp...' : 'Nạp vào lớp'}
        </Nut>
        <Nut dang="phu" type="button" onClick={() => datMo(false)}>
          Đóng
        </Nut>
      </div>
    </form>
  )
}
