import { NextRequest } from 'next/server'
import { taoWorkbookDot } from '@/lib/excel'
import { laGiangVien } from '@/lib/phien-gv'
import { bangCham, dotNopTheoId, lopTheoId } from '@/lib/truy-van'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Xuất bảng chấm của một đợt ra Excel. Chỉ giảng viên đã đăng nhập mới gọi được. */
export async function GET(req: NextRequest) {
  if (!(await laGiangVien())) return new Response('Chưa đăng nhập.', { status: 401 })

  const dotId = req.nextUrl.searchParams.get('dot') ?? ''
  const dot = await dotNopTheoId(dotId)
  if (!dot) return new Response('Không tìm thấy đợt nộp.', { status: 404 })

  const lop = await lopTheoId(dot.lop_id)
  if (!lop) return new Response('Không tìm thấy lớp học phần của đợt.', { status: 404 })

  const ds = await bangCham(dot.id, dot.lop_id)
  const buffer = await taoWorkbookDot({ lop, dot, ds })

  const tenFile = `${dot.ma}-${lop.ma}-bai-nop.xlsx`
  return new Response(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(tenFile)}"`,
      'Cache-Control': 'no-store',
    },
  })
}
