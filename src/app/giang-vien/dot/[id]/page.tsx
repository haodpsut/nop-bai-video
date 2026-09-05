import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Khung } from '@/components/khung'
import { Huy, ONumber, The, TieuDeMuc, Trong } from '@/components/co-ban'
import { HopBao } from '@/components/dieu-khien'
import { DangNhapGiangVien } from '@/components/dang-nhap-gv'
import { DongChamBai } from '@/components/dong-cham'
import { FormDot } from '@/components/form-dot'
import { laGiangVien } from '@/lib/phien-gv'
import { bangCham, dotNopTheoId, lopTheoId, trungVideoTrongDot } from '@/lib/truy-van'
import { conLai, gioPhutNgay } from '@/lib/thoi-gian'
import type { DongCham } from '@/lib/kieu'

const BO_LOC = [
  { ma: 'tat-ca', nhan: 'Tất cả' },
  { ma: 'chua-nop', nhan: 'Chưa nộp' },
  { ma: 'da-nop', nhan: 'Đã nộp' },
  { ma: 'cho-cham', nhan: 'Chờ chấm' },
  { ma: 'tre', nhan: 'Nộp trễ' },
  { ma: 'can-sua-lai', nhan: 'Cần làm lại' },
] as const

function loc(ds: DongCham[], ma: string): DongCham[] {
  switch (ma) {
    case 'chua-nop':
      return ds.filter((d) => !d.bai)
    case 'da-nop':
      return ds.filter((d) => d.bai)
    case 'cho-cham':
      return ds.filter((d) => d.bai?.trang_thai === 'cho_cham')
    case 'tre':
      return ds.filter((d) => d.bai?.tre)
    case 'can-sua-lai':
      return ds.filter((d) => d.bai?.trang_thai === 'can_sua_lai')
    default:
      return ds
  }
}

export default async function TrangDot({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ loc?: string }>
}) {
  if (!(await laGiangVien()))
    return (
      <Khung tieu_de="Trang giảng viên">
        <DangNhapGiangVien />
      </Khung>
    )

  const { id } = await params
  const { loc: locChon = 'tat-ca' } = await searchParams

  const dot = await dotNopTheoId(id)
  if (!dot) notFound()

  const lop = await lopTheoId(dot.lop_id)
  if (!lop) notFound()

  const [ds, trung] = await Promise.all([bangCham(dot.id, dot.lop_id), trungVideoTrongDot(dot.id)])

  const daNop = ds.filter((d) => d.bai).length
  const choCham = ds.filter((d) => d.bai?.trang_thai === 'cho_cham').length
  const tre = ds.filter((d) => d.bai?.tre).length

  // Mã sinh viên dính vào một video bị nộp trùng, để gắn nhãn ngay trên dòng.
  const maTrung = new Set(trung.flatMap((t) => t.ds_ma_sv))
  const hienThi = loc(ds, locChon)

  return (
    <Khung tieu_de="Chấm bài" phu={`${lop.ten_hoc_phan} - ${dot.ma}`} rong>
      <div className="flex flex-col gap-5">
        <div>
          <Link
            href={`/giang-vien/lop/${encodeURIComponent(lop.ma)}`}
            className="text-[12.5px] text-muc-nhat underline underline-offset-2"
          >
            Về lớp {lop.ten_hoc_phan}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-[19px] font-semibold leading-tight">{dot.ten}</h1>
            {dot.dang_mo ? <Huy sac="on">Đang nhận</Huy> : <Huy sac="nghiem_trong">Đã đóng</Huy>}
          </div>
          <p className="text-[13px] text-muc-nhat">
            Hạn <span className="so">{gioPhutNgay(dot.han_nop)}</span> ({conLai(dot.han_nop)})
            {dot.cho_nop_tre ? ' - có nhận bài trễ' : ' - không nhận bài trễ'}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ONumber nhan="Đã nộp" so={`${daNop}/${ds.length}`} />
          <ONumber nhan="Chưa nộp" so={ds.length - daNop} sac={ds.length - daNop > 0 ? 'canh_bao' : 'on'} />
          <ONumber nhan="Chờ chấm" so={choCham} sac={choCham > 0 ? 'canh_bao' : 'on'} />
          <ONumber nhan="Nộp trễ" so={tre} sac={tre > 0 ? 'canh_bao' : 'trung_tinh'} />
        </div>

        {trung.length > 0 && (
          <HopBao sac="nghiem_trong">
            <strong>Có {trung.length} video được nộp trùng.</strong> Cùng một đường dẫn video xuất
            hiện ở nhiều sinh viên:{' '}
            {trung.map((t) => t.ds_ma_sv.join(' và ')).join('; ')}. Hệ thống chặn trùng lúc nộp nên
            các trường hợp này thường đến từ bài nộp cũ hoặc do giảng viên nhập tay, cần kiểm lại.
          </HopBao>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {BO_LOC.map((b) => (
            <Link
              key={b.ma}
              href={`/giang-vien/dot/${dot.id}?loc=${b.ma}`}
              className={`rounded-full border px-3 py-1 text-[12.5px] no-underline ${
                locChon === b.ma
                  ? 'border-transparent bg-nhan-nen font-medium text-nhan'
                  : 'border-vien bg-noi text-muc-nhat hover:bg-chim'
              }`}
            >
              {b.nhan}
            </Link>
          ))}
          <a
            href={`/api/xuat-excel?dot=${dot.id}`}
            className="ml-auto rounded-md border border-vien bg-noi px-3 py-1.5 text-[12.5px] text-muc no-underline hover:bg-chim"
          >
            Xuất Excel
          </a>
        </div>

        {hienThi.length === 0 ? (
          <Trong>Không có sinh viên nào khớp bộ lọc này.</Trong>
        ) : (
          <div className="flex flex-col gap-2.5">
            {hienThi.map((d, i) => (
              <DongChamBai
                key={d.sinh_vien.id}
                stt={i + 1}
                dong={d}
                trung={maTrung.has(d.sinh_vien.ma_sv)}
              />
            ))}
          </div>
        )}

        <section className="the p-4">
          <TieuDeMuc phu="Đổi hạn nộp, đóng hoặc mở lại đợt, sửa yêu cầu video.">
            Thiết lập đợt
          </TieuDeMuc>
          <FormDot lop_id={lop.id} dot={dot} />
        </section>
      </div>
    </Khung>
  )
}
