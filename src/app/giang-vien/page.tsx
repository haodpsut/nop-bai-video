import Link from 'next/link'
import { Khung } from '@/components/khung'
import { Huy, ONumber, The, ThanhTiLe, TieuDeMuc, Trong } from '@/components/co-ban'
import { Nut } from '@/components/dieu-khien'
import { DangNhapGiangVien } from '@/components/dang-nhap-gv'
import { FormDot } from '@/components/form-dot'
import { laGiangVien } from '@/lib/phien-gv'
import { lopHienTai, thongKeCacDot } from '@/lib/truy-van'
import { conLai, gioPhutNgay } from '@/lib/thoi-gian'
import { dangXuatGv, doiTrangThaiDot } from './hanh-dong'

export default async function TrangGiangVien() {
  if (!(await laGiangVien()))
    return (
      <Khung tieu_de="Trang giảng viên" phu="Chấm bài video">
        <div className="flex flex-col gap-4">
          <The>
            <h1 className="text-[17px] font-semibold">Trang giảng viên</h1>
            <p className="mt-1 text-[13.5px] text-muc-nhat">
              Xem toàn bộ bài nộp, chấm điểm và xuất Excel.
            </p>
          </The>
          <DangNhapGiangVien />
          <p className="text-center text-[12px] text-muc-mo">
            <Link href="/" className="text-muc-nhat underline underline-offset-2">
              Về trang nộp bài
            </Link>
          </p>
        </div>
      </Khung>
    )

  const lop = await lopHienTai()
  if (!lop)
    return (
      <Khung tieu_de="Trang giảng viên" rong>
        <Trong>
          Chưa có lớp nào. Chạy <code>npm run db:reset</code> để nạp danh sách.
        </Trong>
      </Khung>
    )

  const ds = await thongKeCacDot(lop.id)
  const tongSv = ds[0]?.tong_sv ?? 0
  const choCham = ds.reduce((t, d) => t + Number(d.cho_cham), 0)
  const treTong = ds.reduce((t, d) => t + Number(d.nop_tre), 0)
  const dangMo = ds.filter((d) => d.dang_mo).length

  return (
    <Khung tieu_de="Trang giảng viên" phu={`${lop.ten_hoc_phan} - ${lop.ma}`} rong>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[19px] font-semibold leading-tight">Bảng điều khiển</h1>
            <p className="text-[13px] text-muc-nhat">
              {lop.ten_hoc_phan} ({lop.ma_hoc_phan}) - lớp {lop.ma}
              {lop.hoc_ky ? `, ${lop.hoc_ky}` : ''}
            </p>
          </div>
          <form action={dangXuatGv}>
            <Nut dang="phu" type="submit">
              Đăng xuất
            </Nut>
          </form>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ONumber nhan="Sinh viên" so={tongSv} />
          <ONumber nhan="Đợt đang mở" so={dangMo} phu={`trên tổng ${ds.length} đợt`} />
          <ONumber
            nhan="Bài chờ chấm"
            so={choCham}
            sac={choCham > 0 ? 'canh_bao' : 'on'}
          />
          <ONumber nhan="Lượt nộp trễ" so={treTong} sac={treTong > 0 ? 'canh_bao' : 'trung_tinh'} />
        </div>

        <section>
          <TieuDeMuc phu="Bấm vào tên đợt để xem danh sách và chấm bài.">Các đợt nộp</TieuDeMuc>

          {ds.length === 0 && <Trong>Chưa có đợt nộp nào.</Trong>}

          <div className="flex flex-col gap-2.5">
            {ds.map((d) => {
              const daNop = Number(d.da_nop)
              const tiLe = d.tong_sv ? (daNop / Number(d.tong_sv)) * 100 : 0
              return (
                <div key={d.dot_id} className="the grid gap-3 p-3.5 lg:grid-cols-[1fr_260px_150px]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="so text-[11.5px] text-muc-mo">{d.ma}</span>
                      {d.dang_mo ? <Huy sac="on">Đang nhận</Huy> : <Huy sac="nghiem_trong">Đã đóng</Huy>}
                      {Number(d.cho_cham) > 0 && (
                        <Huy sac="canh_bao">{d.cho_cham} bài chờ chấm</Huy>
                      )}
                    </div>
                    <Link
                      href={`/giang-vien/dot/${d.dot_id}`}
                      className="text-[14.5px] font-medium leading-tight text-muc no-underline hover:text-nhan"
                    >
                      {d.ten}
                    </Link>
                    <div className="text-[12px] text-muc-nhat">
                      Hạn <span className="so">{gioPhutNgay(d.han_nop)}</span> ({conLai(d.han_nop)})
                      {d.cho_nop_tre ? ' - nhận bài trễ' : ' - không nhận bài trễ'}
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-1">
                    <div className="flex items-baseline justify-between text-[12.5px]">
                      <span className="text-muc-nhat">Đã nộp</span>
                      <span className="so">
                        {daNop}/{d.tong_sv}
                        {Number(d.nop_tre) > 0 && (
                          <span className="text-canh-bao"> ({d.nop_tre} trễ)</span>
                        )}
                      </span>
                    </div>
                    <ThanhTiLe ti_le={tiLe} sac={tiLe === 100 ? 'on' : 'nhan'} />
                    <div className="text-[11.5px] text-muc-mo">
                      Đạt {d.dat} - cần làm lại {d.can_sua_lai}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/giang-vien/dot/${d.dot_id}`}
                      className="rounded-md border border-vien bg-noi px-3 py-1.5 text-[12.5px] text-muc no-underline hover:bg-chim"
                    >
                      Chấm bài
                    </Link>
                    <form action={doiTrangThaiDot}>
                      <input type="hidden" name="id" value={d.dot_id} />
                      <input type="hidden" name="dang_mo" value={d.dang_mo ? '0' : '1'} />
                      <button
                        type="submit"
                        className="rounded-md border border-vien bg-noi px-3 py-1.5 text-[12.5px] text-muc-nhat hover:bg-chim"
                      >
                        {d.dang_mo ? 'Đóng' : 'Mở lại'}
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="the p-4">
          <TieuDeMuc phu="Đợt mới hiện ngay trên trang của sinh viên nếu để trạng thái đang nhận.">
            Thêm đợt nộp
          </TieuDeMuc>
          <FormDot />
        </section>
      </div>
    </Khung>
  )
}
