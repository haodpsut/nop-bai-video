import { cookies } from 'next/headers'
import Link from 'next/link'
import { Khung } from '@/components/khung'
import { Huy, The, Trong } from '@/components/co-ban'
import { Nut } from '@/components/dieu-khien'
import { NhapMaSinhVien } from '@/components/nhap-ma-sv'
import { ONopBai } from '@/components/o-nop-bai'
import { doiSinhVien } from './hanh-dong'
import { COOKIE_SV } from '@/lib/hang-so'
import { baiNopCuaSinhVien, dsDotNop, lopHienTai, timSinhVienTheoMa } from '@/lib/truy-van'
import { conLai, daQuaHan, gioPhutNgay } from '@/lib/thoi-gian'
import type { BaiNop, DotNop } from '@/lib/kieu'

const TEN_TRANG_THAI: Record<string, string> = {
  cho_cham: 'Chờ chấm',
  dat: 'Đạt',
  can_sua_lai: 'Cần làm lại',
}

export default async function Trang() {
  const lop = await lopHienTai()
  if (!lop)
    return (
      <Khung tieu_de="Nộp link video bài tập">
        <Trong>
          Chưa có dữ liệu lớp. Chạy <code>npm run db:reset</code> để nạp danh sách lớp và các đợt
          nộp.
        </Trong>
      </Khung>
    )

  const kho = await cookies()
  const maSv = kho.get(COOKIE_SV)?.value
  const sv = maSv ? await timSinhVienTheoMa(maSv) : null

  const tieuDe = `${lop.ten_hoc_phan} - ${lop.ma}`

  if (!sv)
    return (
      <Khung tieu_de="Nộp link video bài tập" phu={tieuDe}>
        <div className="flex flex-col gap-4">
          <The>
            <h1 className="text-[17px] font-semibold">Nộp link video bài tập</h1>
            <p className="mt-1 text-[13.5px] leading-relaxed text-muc-nhat">
              {lop.ten_hoc_phan} ({lop.ma_hoc_phan}) - lớp {lop.ma}
              {lop.hoc_ky ? `, ${lop.hoc_ky}` : ''}. Nhập mã sinh viên để xem các đợt phải nộp và
              dán link video của em.
            </p>
          </The>
          <NhapMaSinhVien />
          <p className="text-center text-[12px] text-muc-mo">
            <Link href="/giang-vien" className="text-muc-nhat underline underline-offset-2">
              Trang giảng viên
            </Link>
          </p>
        </div>
      </Khung>
    )

  const [dsDot, dsBai] = await Promise.all([dsDotNop(sv.lop_id), baiNopCuaSinhVien(sv.id)])
  const theoDot = new Map(dsBai.map((b) => [b.dot_id, b]))
  const conThieu = dsDot.filter((d) => d.dang_mo && !theoDot.has(d.id)).length

  return (
    <Khung tieu_de="Nộp link video bài tập" phu={tieuDe}>
      <div className="flex flex-col gap-4">
        <The>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="nhan-chu">Sinh viên</div>
              <h1 className="text-[17px] font-semibold leading-tight">{sv.ho_ten}</h1>
              <p className="mt-0.5 text-[13px] text-muc-nhat">
                <span className="so">{sv.ma_sv}</span> - lớp {lop.ma}
                {sv.nhom ? ` - nhóm ${sv.nhom}` : ''}
              </p>
            </div>
            <form action={doiSinhVien}>
              <Nut dang="phu" type="submit">
                Không phải em
              </Nut>
            </form>
          </div>
          <p className="mt-3 text-[13px] text-muc-nhat">
            {conThieu === 0
              ? 'Em đã nộp hết các đợt đang mở.'
              : `Còn ${conThieu} đợt đang mở mà em chưa nộp.`}
          </p>
        </The>

        {dsDot.length === 0 && <Trong>Giảng viên chưa mở đợt nộp nào.</Trong>}

        {dsDot.map((dot) => (
          <TheDot key={dot.id} dot={dot} bai={theoDot.get(dot.id) ?? null} />
        ))}
      </div>
    </Khung>
  )
}

function TheDot({ dot, bai }: { dot: DotNop; bai: BaiNop | null }) {
  const quaHan = daQuaHan(dot.han_nop)
  const dong = !dot.dang_mo || (quaHan && !dot.cho_nop_tre)

  return (
    <The>
      {/* Mã đợt và nhãn trạng thái nằm chung một dòng phía trên tên đợt: tên đợt
          dài nên nếu để nhãn cùng dòng với tên thì nó rớt xuống lung tung. */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="nhan-chu so">{dot.ma}</span>
        {bai ? (
          <Huy sac={bai.trang_thai === 'can_sua_lai' ? 'canh_bao' : bai.tre ? 'canh_bao' : 'on'}>
            {bai.tre ? 'Đã nộp, trễ hạn' : 'Đã nộp'}
          </Huy>
        ) : dong ? (
          <Huy sac="nghiem_trong">Đã đóng</Huy>
        ) : (
          <Huy sac={quaHan ? 'canh_bao' : 'trung_tinh'}>{quaHan ? 'Quá hạn' : 'Chưa nộp'}</Huy>
        )}
        {bai && bai.trang_thai === 'dat' && <Huy sac="on">Đạt {bai.diem ?? ''}</Huy>}
        {bai && bai.trang_thai === 'can_sua_lai' && <Huy sac="nghiem_trong">Cần làm lại</Huy>}
      </div>
      <h2 className="mt-1 text-[15.5px] font-semibold leading-tight">{dot.ten}</h2>

      {dot.mo_ta && <p className="mt-2 text-[13.5px] leading-relaxed text-muc-nhat">{dot.mo_ta}</p>}
      {dot.yeu_cau && (
        <p className="mt-2 rounded-md bg-chim px-3 py-2 text-[12.5px] leading-relaxed text-muc-nhat">
          <span className="nhan-chu block">Yêu cầu video</span>
          {dot.yeu_cau}
        </p>
      )}

      <p className="mt-2 text-[12.5px] text-muc-nhat">
        Hạn nộp <span className="so">{gioPhutNgay(dot.han_nop)}</span>{' '}
        <span className={quaHan ? 'text-nghiem-trong' : 'text-muc-mo'}>({conLai(dot.han_nop)})</span>
        {quaHan && dot.cho_nop_tre && !dong && ' - vẫn nhận bài nhưng ghi nhận là trễ.'}
      </p>

      {bai && (
        <div className="mt-3 rounded-md border border-vien bg-ray px-3 py-2.5">
          <div className="nhan-chu">Bài đã nộp</div>
          <a
            href={bai.url_chuan}
            target="_blank"
            rel="noreferrer"
            className="break-all text-[13px] text-nhan underline underline-offset-2"
          >
            {bai.url_chuan}
          </a>
          <p className="mt-1 text-[12.5px] text-muc-nhat">
            Nộp lúc <span className="so">{gioPhutNgay(bai.nop_luc)}</span>
            {bai.so_lan_nop > 1 ? ` - đã nộp lại ${bai.so_lan_nop - 1} lần` : ''} - trạng thái{' '}
            {TEN_TRANG_THAI[bai.trang_thai]}
            {bai.diem !== null ? `, điểm ${bai.diem}` : ''}.
          </p>
          {bai.nhan_xet && (
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muc">
              <span className="nhan-chu block">Nhận xét của giảng viên</span>
              {bai.nhan_xet}
            </p>
          )}
        </div>
      )}

      <div className="mt-3">
        {dong ? (
          <p className="text-[12.5px] text-muc-mo">
            Đợt này đã đóng. Muốn nộp bù thì liên hệ trực tiếp giảng viên.
          </p>
        ) : (
          <ONopBai dot={dot} bai={bai} />
        )}
      </div>
    </The>
  )
}
