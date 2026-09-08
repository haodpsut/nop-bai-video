import { cookies } from 'next/headers'
import Link from 'next/link'
import { Khung } from '@/components/khung'
import { Huy, The, Trong } from '@/components/co-ban'
import { Nut } from '@/components/dieu-khien'
import { NhapMaSinhVien } from '@/components/nhap-ma-sv'
import { ONopBai } from '@/components/o-nop-bai'
import { doiSinhVien } from './hanh-dong'
import { COOKIE_SV } from '@/lib/hang-so'
import { bangCuaSinhVien, dsLopHocPhan, timSinhVienTheoMa } from '@/lib/truy-van'
import { conLai, daQuaHan, gioPhutNgay } from '@/lib/thoi-gian'
import type { BaiNop, DotNop, LopCuaSinhVien } from '@/lib/kieu'

const TEN_TRANG_THAI: Record<string, string> = {
  cho_cham: 'Chờ chấm',
  dat: 'Đạt',
  can_sua_lai: 'Cần làm lại',
}

export default async function Trang() {
  const kho = await cookies()
  const maSv = kho.get(COOKIE_SV)?.value
  const sv = maSv ? await timSinhVienTheoMa(maSv) : null

  if (!sv) {
    const lop = await dsLopHocPhan()
    const dangMo = lop.filter((l) => l.dang_hoat_dong)
    return (
      <Khung tieu_de="Nộp link video bài tập" phu="Khoa Công nghệ thông tin">
        <div className="flex flex-col gap-4">
          <The>
            <h1 className="text-[17px] font-semibold">Nộp link video bài tập</h1>
            <p className="mt-1 text-[13.5px] leading-relaxed text-muc-nhat">
              Nhập mã sinh viên để xem các đợt phải nộp và dán link video của em. Một mã dùng cho
              mọi học phần có mặt ở đây.
            </p>
            {dangMo.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1 text-[13px] text-muc-nhat">
                {dangMo.map((l) => (
                  <li key={l.id}>
                    <span className="so text-[12px] text-muc-mo">{l.ma}</span> {l.ten_hoc_phan}
                    {l.lop_sinh_hoat ? ` - lớp ${l.lop_sinh_hoat}` : ''}
                  </li>
                ))}
              </ul>
            )}
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
  }

  const bang = await bangCuaSinhVien(sv.id)
  const conThieu = bang.reduce(
    (t, l) => t + l.dot.filter((d) => d.dang_mo && !l.bai.has(d.id)).length,
    0
  )

  return (
    <Khung tieu_de="Nộp link video bài tập" phu={sv.ho_ten}>
      <div className="flex flex-col gap-4">
        <The>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="nhan-chu">Sinh viên</div>
              <h1 className="text-[17px] font-semibold leading-tight">{sv.ho_ten}</h1>
              <p className="mt-0.5 text-[13px] text-muc-nhat">
                <span className="so">{sv.ma_sv}</span>
                {bang.length > 0 && ` - đang học ${bang.length} học phần ở đây`}
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

        {bang.length === 0 && (
          <Trong>
            Mã của em có trong hệ thống nhưng chưa được ghi danh vào học phần nào. Nhắn giảng viên
            để thêm vào lớp.
          </Trong>
        )}

        {bang.map((l) => (
          <MucLop key={l.lop.id} muc={l} />
        ))}
      </div>
    </Khung>
  )
}

function MucLop({ muc }: { muc: LopCuaSinhVien }) {
  const { lop, nhom, dot, bai } = muc
  return (
    <section className="flex flex-col gap-3">
      {/* Tiêu đề học phần, để em học nhiều môn không nộp nhầm đợt của môn khác. */}
      <div className="border-b border-vien pb-1.5">
        <div className="nhan-chu">
          <span className="so">{lop.ma_hoc_phan}</span>
          {lop.lop_sinh_hoat ? ` - lớp ${lop.lop_sinh_hoat}` : ''}
          {nhom ? ` - nhóm ${nhom}` : ''}
        </div>
        <h2 className="text-[16px] font-semibold leading-tight">{lop.ten_hoc_phan}</h2>
      </div>

      {dot.length === 0 && <Trong>Học phần này chưa mở đợt nộp nào.</Trong>}

      {dot.map((d) => (
        <TheDot key={d.id} dot={d} bai={bai.get(d.id) ?? null} />
      ))}
    </section>
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
      <h3 className="mt-1 text-[15.5px] font-semibold leading-tight">{dot.ten}</h3>

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

      {/* Bọc trong một thẻ luôn tồn tại: nếu để khối này xuất hiện rồi biến mất
          thì số phần tử con đổi, React ghép nhầm vị trí và dựng lại ô nộp bài,
          làm mất luôn dòng xác nhận "Đã nhận bài" vừa hiện ra. */}
      <div>
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
      </div>

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
