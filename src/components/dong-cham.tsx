'use client'

import { useActionState } from 'react'
import { chamBai, xoaBaiNop, type KetQuaGv } from '@/app/giang-vien/hanh-dong'
import type { DongCham } from '@/lib/kieu'
import { gioPhutNgay } from '@/lib/thoi-gian'
import { Huy } from './co-ban'
import { Chon, HopBao, Nut, OChu, VungChu } from './dieu-khien'
import { XemVideo } from './xem-video'

const DAU: KetQuaGv = { ok: false }

export function DongChamBai({ stt, dong, trung }: { stt: number; dong: DongCham; trung: boolean }) {
  const [ketQua, chay, dangChay] = useActionState(chamBai, DAU)
  const { sinh_vien: sv, bai } = dong

  return (
    <div className="the grid gap-3 p-3.5 lg:grid-cols-[210px_1fr_260px]">
      {/* Sinh viên */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="so text-[11.5px] text-muc-mo">{String(stt).padStart(2, '0')}</span>
          <span className="so text-[12.5px] text-muc-nhat">{sv.ma_sv}</span>
        </div>
        <div className="text-[14px] font-medium leading-tight">{sv.ho_ten}</div>
        <div className="mt-1 flex flex-wrap gap-1">
          {!bai && <Huy sac="nghiem_trong">Chưa nộp</Huy>}
          {bai?.tre && <Huy sac="canh_bao">Trễ hạn</Huy>}
          {bai && bai.so_lan_nop > 1 && <Huy>Nộp lại {bai.so_lan_nop - 1} lần</Huy>}
          {trung && <Huy sac="nghiem_trong">Trùng video</Huy>}
        </div>
      </div>

      {/* Bài nộp */}
      <div className="min-w-0">
        {bai ? (
          <div className="flex flex-col gap-1.5">
            <a
              href={bai.url_chuan}
              target="_blank"
              rel="noreferrer"
              className="break-all text-[12.5px] text-nhan underline underline-offset-2"
            >
              {bai.url_chuan}
            </a>
            <div className="text-[12px] text-muc-mo">
              {bai.nen_tang === 'youtube' ? 'YouTube' : 'TikTok'} - nộp lúc{' '}
              <span className="so">{gioPhutNgay(bai.nop_luc)}</span>
            </div>
            {bai.ghi_chu && (
              <div className="rounded-md bg-chim px-2.5 py-1.5 text-[12.5px] text-muc-nhat">
                {bai.ghi_chu}
              </div>
            )}
            <XemVideo nen_tang={bai.nen_tang} ma_video={bai.ma_video} />
          </div>
        ) : (
          <div className="text-[12.5px] text-muc-mo">Chưa có bài nộp.</div>
        )}
      </div>

      {/* Chấm */}
      {bai ? (
        <form
          action={chay}
          /* Dựng lại form theo dữ liệu vừa lưu. Không có key này thì các ô
             giữ giá trị cũ trong khi cơ sở dữ liệu đã đổi, nhìn vào tưởng
             lưu hỏng. */
          key={`${bai.id}|${bai.trang_thai}|${bai.diem ?? ''}|${bai.cham_luc ?? ''}`}
          className="flex flex-col gap-2"
        >
          <input type="hidden" name="bai_id" value={bai.id} />
          <div className="flex gap-2">
            <OChu
              name="diem"
              inputMode="decimal"
              defaultValue={bai.diem ?? ''}
              placeholder="Điểm"
              aria-label={`Điểm của ${sv.ho_ten}`}
              className="so w-[86px]"
            />
            <Chon
              name="trang_thai"
              defaultValue={bai.trang_thai}
              aria-label={`Trạng thái bài của ${sv.ho_ten}`}
            >
              <option value="cho_cham">Chờ chấm</option>
              <option value="dat">Đạt</option>
              <option value="can_sua_lai">Cần làm lại</option>
            </Chon>
          </div>
          <VungChu
            name="nhan_xet"
            defaultValue={bai.nhan_xet ?? ''}
            placeholder="Nhận xét sinh viên đọc được"
            className="min-h-[54px] text-[12.5px]"
            aria-label={`Nhận xét cho ${sv.ho_ten}`}
          />
          {ketQua.loi && <HopBao sac="nghiem_trong">{ketQua.loi}</HopBao>}
          <div className="flex items-center gap-2">
            <Nut type="submit" disabled={dangChay} className="px-3 py-1.5">
              {dangChay ? 'Đang lưu' : 'Lưu'}
            </Nut>
            {ketQua.thong_bao && <span className="text-[12px] text-on">{ketQua.thong_bao}</span>}
            {bai.cham_luc && !ketQua.thong_bao && (
              <span className="text-[11.5px] text-muc-mo">
                chấm {gioPhutNgay(bai.cham_luc)}
              </span>
            )}
          </div>
        </form>
      ) : (
        <div className="text-[12px] text-muc-mo">Chưa chấm được vì chưa có bài.</div>
      )}

      {bai && (
        <form action={xoaBaiNop} className="lg:col-span-3">
          <input type="hidden" name="bai_id" value={bai.id} />
          <input type="hidden" name="dot_id" value={bai.dot_id} />
          <button
            type="submit"
            className="text-[11.5px] text-muc-mo underline underline-offset-2 hover:text-nghiem-trong"
          >
            Xóa bài nộp này để sinh viên nộp lại từ đầu
          </button>
        </form>
      )}
    </div>
  )
}
