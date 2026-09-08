import 'server-only'
import ExcelJS from 'exceljs'
import type { DongCham, DotNop, LopHocPhan } from './kieu'
import { gioPhutNgay } from './thoi-gian'

/* Màu theo bộ nhận diện của trường: maroon cho tiêu đề, vàng nhạt cho dòng
   nộp trễ, đỏ nhạt cho người chưa nộp. */
const MAROON = 'FF990000'
const RAY = 'FFF4F0ED'
const VIEN = 'FFDED5D1'
const DO_NHAT = 'FFFBE6E4'
const VANG_NHAT = 'FFFDF1DC'

function vien(): Partial<ExcelJS.Borders> {
  const b: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: VIEN } }
  return { top: b, left: b, bottom: b, right: b }
}

const TEN_TRANG_THAI: Record<string, string> = {
  cho_cham: 'Chờ chấm',
  dat: 'Đạt',
  can_sua_lai: 'Cần làm lại',
}

/**
 * Một sheet cho một đợt: đủ danh sách lớp, người chưa nộp nằm luôn trong bảng
 * và được tô đỏ nhạt, để in ra là điểm danh được ngay.
 */
export async function taoWorkbookDot(opts: {
  lop: LopHocPhan
  dot: DotNop
  ds: DongCham[]
}): Promise<ExcelJS.Buffer> {
  const { lop, dot, ds } = opts
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Nộp link video bài tập'

  const ws = wb.addWorksheet(dot.ma.slice(0, 28), {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    views: [{ state: 'frozen', ySplit: 4 }],
  })

  ws.columns = [
    { width: 5 },
    { width: 13 },
    { width: 26 },
    { width: 11 },
    { width: 18 },
    { width: 46 },
    { width: 8 },
    { width: 13 },
    { width: 34 },
  ]

  ws.mergeCells('A1:I1')
  ws.getCell('A1').value =
    `${lop.ten_hoc_phan} (${lop.ma_hoc_phan}) - lớp học phần ${lop.ma}` +
    (lop.lop_sinh_hoat ? ` - lớp ${lop.lop_sinh_hoat}` : '')
  ws.getCell('A1').font = { bold: true, size: 13, color: { argb: MAROON } }

  ws.mergeCells('A2:I2')
  ws.getCell('A2').value = `${dot.ma} - ${dot.ten}`
  ws.getCell('A2').font = { bold: true, size: 11 }

  ws.mergeCells('A3:I3')
  ws.getCell('A3').value =
    `Hạn nộp ${gioPhutNgay(dot.han_nop)}. Xuất lúc ${gioPhutNgay(new Date().toISOString())}. ` +
    `Đã nộp ${ds.filter((d) => d.bai).length}/${ds.length}.`
  ws.getCell('A3').font = { size: 10, color: { argb: 'FF58655F' } }

  const dau = ws.addRow([
    'STT',
    'Mã SV',
    'Họ và tên',
    'Trạng thái',
    'Nộp lúc',
    'Link video',
    'Điểm',
    'Kết quả',
    'Nhận xét',
  ])
  dau.font = { bold: true, size: 10 }
  dau.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  dau.eachCell((o) => {
    o.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RAY } }
    o.border = vien()
  })

  ds.forEach((d, i) => {
    const b = d.bai
    const r = ws.addRow([
      i + 1,
      d.sinh_vien.ma_sv,
      d.sinh_vien.ho_ten,
      b ? (b.tre ? 'Nộp trễ' : 'Đã nộp') : 'Chưa nộp',
      b ? gioPhutNgay(b.nop_luc) : '',
      b ? b.url_chuan : '',
      b?.diem ?? '',
      b ? TEN_TRANG_THAI[b.trang_thai] : '',
      b?.nhan_xet ?? '',
    ])
    r.font = { size: 10 }
    r.alignment = { vertical: 'top', wrapText: true }
    r.eachCell((o) => {
      o.border = vien()
    })
    if (!b) r.eachCell((o) => (o.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DO_NHAT } }))
    else if (b.tre)
      r.eachCell((o) => (o.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VANG_NHAT } }))
    if (b) {
      const o = r.getCell(6)
      o.value = { text: b.url_chuan, hyperlink: b.url_chuan }
      o.font = { size: 10, color: { argb: MAROON }, underline: true }
    }
  })

  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: 9 } }

  return wb.xlsx.writeBuffer()
}
