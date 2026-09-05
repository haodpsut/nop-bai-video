import Link from 'next/link'
import { Khung } from '@/components/khung'
import { Huy, ONumber, The, TieuDeMuc, Trong } from '@/components/co-ban'
import { Nut } from '@/components/dieu-khien'
import { DangNhapGiangVien } from '@/components/dang-nhap-gv'
import { FormLop } from '@/components/form-lop'
import { laGiangVien } from '@/lib/phien-gv'
import { thongKeCacLop } from '@/lib/truy-van'
import { dangXuatGv } from './hanh-dong'

export default async function TrangGiangVien() {
  if (!(await laGiangVien()))
    return (
      <Khung tieu_de="Trang giảng viên" phu="Chấm bài nộp">
        <div className="flex flex-col gap-4">
          <The>
            <h1 className="text-[17px] font-semibold">Trang giảng viên</h1>
            <p className="mt-1 text-[13.5px] text-muc-nhat">
              Mở lớp học phần, nạp danh sách sinh viên, ra đợt nộp, chấm bài và xuất Excel.
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

  const ds = await thongKeCacLop()
  const dangDay = ds.filter((l) => l.dang_hoat_dong)
  const choCham = ds.reduce((t, l) => t + Number(l.cho_cham), 0)
  const tongSv = ds.reduce((t, l) => t + Number(l.tong_sv), 0)

  return (
    <Khung tieu_de="Trang giảng viên" phu="Tất cả học phần" rong>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[19px] font-semibold leading-tight">Các học phần</h1>
            <p className="text-[13px] text-muc-nhat">
              Mỗi học phần một lớp riêng, danh sách sinh viên riêng, đợt nộp riêng.
            </p>
          </div>
          <form action={dangXuatGv}>
            <Nut dang="phu" type="submit">
              Đăng xuất
            </Nut>
          </form>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <ONumber nhan="Lớp học phần đang dạy" so={dangDay.length} phu={`trên tổng ${ds.length} lớp`} />
          <ONumber nhan="Lượt ghi danh" so={tongSv} />
          <ONumber nhan="Bài chờ chấm" so={choCham} sac={choCham > 0 ? 'canh_bao' : 'on'} />
        </div>

        {ds.length === 0 && (
          <Trong>Chưa có lớp học phần nào. Mở lớp đầu tiên ở khung bên dưới.</Trong>
        )}

        <div className="flex flex-col gap-2.5">
          {ds.map((l) => (
            <div key={l.lop_id} className="the grid gap-3 p-3.5 lg:grid-cols-[1fr_320px_120px]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="so text-[11.5px] text-muc-mo">{l.ma}</span>
                  {l.dang_hoat_dong ? (
                    <Huy sac="on">Đang dạy</Huy>
                  ) : (
                    <Huy sac="trung_tinh">Đã kết thúc</Huy>
                  )}
                  {Number(l.cho_cham) > 0 && <Huy sac="canh_bao">{l.cho_cham} bài chờ chấm</Huy>}
                </div>
                <Link
                  href={`/giang-vien/lop/${encodeURIComponent(l.ma)}`}
                  className="text-[15px] font-medium leading-tight text-muc no-underline hover:text-nhan"
                >
                  {l.ten_hoc_phan}
                </Link>
                <div className="text-[12px] text-muc-nhat">
                  <span className="so">{l.ma_hoc_phan}</span>
                  {l.lop_sinh_hoat ? ` - lớp ${l.lop_sinh_hoat}` : ''}
                  {l.hoc_ky ? ` - ${l.hoc_ky}` : ''}
                </div>
              </div>

              <div className="flex items-center gap-5 text-[12.5px] text-muc-nhat">
                <span>
                  <span className="so text-[15px] text-muc">{l.tong_sv}</span> sinh viên
                </span>
                <span>
                  <span className="so text-[15px] text-muc">{l.tong_dot}</span> đợt nộp
                </span>
                <span>
                  <span className="so text-[15px] text-muc">{l.dot_dang_mo}</span> đang mở
                </span>
              </div>

              <div className="flex items-center">
                <Link
                  href={`/giang-vien/lop/${encodeURIComponent(l.ma)}`}
                  className="rounded-md border border-vien bg-noi px-3 py-1.5 text-[12.5px] text-muc no-underline hover:bg-chim"
                >
                  Vào lớp
                </Link>
              </div>
            </div>
          ))}
        </div>

        <section className="the p-4">
          <TieuDeMuc phu="Mở xong thì vào lớp để nạp danh sách sinh viên và ra đợt nộp.">
            Thêm học phần
          </TieuDeMuc>
          <FormLop mo_san={ds.length === 0} />
        </section>
      </div>
    </Khung>
  )
}
