import clsx from 'clsx'
import type { ReactNode } from 'react'

/* Các mảnh giao diện dùng lại: thẻ, nhãn, ô số liệu, bảng, thanh tỉ lệ. */

export function The({
  children, className, khong_dem,
}: { children: ReactNode; className?: string; khong_dem?: boolean }) {
  return (
    <section className={clsx('the', khong_dem ? '' : 'p-4', className)}>{children}</section>
  )
}

export function TieuDeMuc({
  children, phu, hanh_dong,
}: { children: ReactNode; phu?: ReactNode; hanh_dong?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-[15px] font-semibold leading-tight">{children}</h2>
        {phu && <p className="mt-0.5 text-[12.5px] text-muc-nhat">{phu}</p>}
      </div>
      {hanh_dong}
    </div>
  )
}

export function NhanChu({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('nhan-chu', className)}>{children}</div>
}

type Sac = 'trung_tinh' | 'nhan' | 'on' | 'canh_bao' | 'nghiem_trong'

const SAC: Record<Sac, string> = {
  trung_tinh: 'bg-chim text-muc-nhat border-vien',
  nhan: 'bg-nhan-nen text-nhan border-transparent',
  on: 'bg-on-nen text-on border-transparent',
  canh_bao: 'bg-canh-bao-nen text-canh-bao border-transparent',
  nghiem_trong: 'bg-nghiem-trong-nen text-nghiem-trong border-transparent',
}

export function Huy({
  children, sac = 'trung_tinh', className,
}: { children: ReactNode; sac?: Sac; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2 py-[1px] text-[11px] font-medium whitespace-nowrap',
        SAC[sac], className
      )}
    >
      {children}
    </span>
  )
}

export function ONumber({
  nhan, so, don_vi, phu, sac = 'trung_tinh', ghi_chu,
}: {
  nhan: string; so: ReactNode; don_vi?: string; phu?: ReactNode
  sac?: Sac; ghi_chu?: string
}) {
  const mau =
    sac === 'nghiem_trong' ? 'text-nghiem-trong'
      : sac === 'canh_bao' ? 'text-canh-bao'
      : sac === 'on' ? 'text-on'
      : sac === 'nhan' ? 'text-nhan'
      : 'text-muc'
  return (
    <div className="the flex flex-col gap-1 p-3.5">
      <NhanChu>{nhan}</NhanChu>
      <div className="flex items-baseline gap-1.5">
        <span className={clsx('so text-[26px] font-semibold leading-none', mau)}>{so}</span>
        {don_vi && <span className="text-[12px] text-muc-mo">{don_vi}</span>}
      </div>
      {phu && <div className="text-[12px] text-muc-nhat">{phu}</div>}
      {ghi_chu && <div className="text-[11.5px] text-muc-mo">{ghi_chu}</div>}
    </div>
  )
}

export function ThanhTiLe({
  ti_le, sac = 'nhan', cao = 6,
}: { ti_le: number; sac?: Sac; cao?: number }) {
  const mau = {
    trung_tinh: 'var(--muc-mo)', nhan: 'var(--nhan)', on: 'var(--on)',
    canh_bao: 'var(--canh-bao)', nghiem_trong: 'var(--nghiem-trong)',
  }[sac]
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-chim"
      style={{ height: cao }}
      role="presentation"
    >
      <div
        style={{ width: `${Math.min(100, Math.max(0, ti_le))}%`, background: mau, height: '100%' }}
      />
    </div>
  )
}

export function Bang({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="cuon-ngang the" >
      <table className={clsx('w-full border-collapse text-[13px]', className)}>{children}</table>
    </div>
  )
}

export function Dau({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={clsx(
        'nhan-chu border-b border-vien bg-ray px-3 py-2 text-left align-bottom',
        className
      )}
    >
      {children}
    </th>
  )
}

export function O({
  children, className, so, colSpan,
}: { children: ReactNode; className?: string; so?: boolean; colSpan?: number }) {
  return (
    <td
      colSpan={colSpan}
      className={clsx('border-b border-vien px-3 py-[7px] align-middle', so && 'so', className)}
    >
      {children}
    </td>
  )
}

export function Trong({ children }: { children: ReactNode }) {
  return (
    <div className="the flex flex-col items-center gap-1 px-4 py-10 text-center">
      <div className="text-[13px] text-muc-nhat">{children}</div>
    </div>
  )
}

export function ChamMau({ mau }: { mau: string }) {
  return (
    <span
      className="inline-block size-2 shrink-0 rounded-[2px]"
      style={{ background: mau }}
      aria-hidden
    />
  )
}
