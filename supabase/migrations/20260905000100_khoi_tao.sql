-- ============================================================================
-- Nộp link video bài tập - lược đồ khởi tạo
--
-- Quy ước: mọi truy cập đều đi qua service_role phía server, nên bật RLS mà
-- không khai báo policy nào; nếu sau này có key anon lọt ra ngoài thì cũng
-- không đọc được gì.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Lớp học phần
-- ---------------------------------------------------------------------------
create table lop (
  id              uuid primary key default gen_random_uuid(),
  ma              text not null unique,
  ten_hoc_phan    text not null,
  ma_hoc_phan     text not null,
  ma_lop_hoc_phan text,
  hoc_ky          text,
  giang_vien      text,
  tao_luc         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Sinh viên. Danh sách nạp từ file điểm danh của phòng đào tạo.
-- ---------------------------------------------------------------------------
create table sinh_vien (
  id         uuid primary key default gen_random_uuid(),
  lop_id     uuid not null references lop (id) on delete cascade,
  ma_sv      text not null unique,
  ho_dem     text not null default '',
  ten        text not null,
  ho_ten     text generated always as (btrim(ho_dem || ' ' || ten)) stored,
  gioi_tinh  text,
  email      text,
  nhom       text,
  dang_hoc   boolean not null default true
);

create index sinh_vien_lop on sinh_vien (lop_id);

-- ---------------------------------------------------------------------------
-- Đợt nộp: một bài tập cần quay video (lab từng chương, bài tập lớn...).
-- ---------------------------------------------------------------------------
create table dot_nop (
  id           uuid primary key default gen_random_uuid(),
  lop_id       uuid not null references lop (id) on delete cascade,
  ma           text not null,
  ten          text not null,
  mo_ta        text,
  yeu_cau      text,
  han_nop      timestamptz not null,
  cho_nop_tre  boolean not null default true,
  dang_mo      boolean not null default true,
  thu_tu       integer not null default 0,
  phut_toi_thieu integer,
  tao_luc      timestamptz not null default now(),
  unique (lop_id, ma)
);

create index dot_nop_lop on dot_nop (lop_id, thu_tu);

-- ---------------------------------------------------------------------------
-- Bài nộp: mỗi sinh viên giữ đúng một dòng cho mỗi đợt. Nộp lại thì ghi đè
-- dòng này và cộng so_lan_nop; toàn bộ lần nộp cũ nằm ở lich_su_nop.
-- ---------------------------------------------------------------------------
create table bai_nop (
  id           uuid primary key default gen_random_uuid(),
  dot_id       uuid not null references dot_nop (id) on delete cascade,
  sinh_vien_id uuid not null references sinh_vien (id) on delete cascade,
  url          text not null,
  url_chuan    text not null,
  nen_tang     text not null check (nen_tang in ('youtube', 'tiktok')),
  ma_video     text not null,
  ghi_chu      text,
  nop_luc      timestamptz not null default now(),
  tre          boolean not null default false,
  so_lan_nop   integer not null default 1,
  diem         numeric(4, 2) check (diem >= 0 and diem <= 10),
  nhan_xet     text,
  trang_thai   text not null default 'cho_cham'
                 check (trang_thai in ('cho_cham', 'dat', 'can_sua_lai')),
  cham_luc     timestamptz,
  unique (dot_id, sinh_vien_id)
);

create index bai_nop_dot on bai_nop (dot_id);
create index bai_nop_video on bai_nop (dot_id, nen_tang, ma_video);

-- ---------------------------------------------------------------------------
-- Lịch sử: append-only, để tra khi sinh viên nói "em nộp rồi mà".
-- ---------------------------------------------------------------------------
create table lich_su_nop (
  id           bigint generated always as identity primary key,
  dot_id       uuid not null references dot_nop (id) on delete cascade,
  sinh_vien_id uuid not null references sinh_vien (id) on delete cascade,
  hanh_dong    text not null check (hanh_dong in ('nop', 'nop_lai', 'cham')),
  url          text,
  ghi_chu      text,
  luc          timestamptz not null default now()
);

create index lich_su_dot_sv on lich_su_nop (dot_id, sinh_vien_id, luc desc);

-- ---------------------------------------------------------------------------
-- Thống kê từng đợt. Tính trong cơ sở dữ liệu để trang giảng viên chỉ đọc
-- một lần, không phải đếm lại trong JavaScript.
-- ---------------------------------------------------------------------------
create view thong_ke_dot as
select
  d.id                                                              as dot_id,
  d.lop_id,
  d.ma,
  d.ten,
  d.han_nop,
  d.dang_mo,
  d.cho_nop_tre,
  d.thu_tu,
  (select count(*) from sinh_vien s where s.lop_id = d.lop_id and s.dang_hoc) as tong_sv,
  count(b.id)                                                       as da_nop,
  count(*) filter (where b.tre)                                     as nop_tre,
  count(*) filter (where b.trang_thai = 'cho_cham')                 as cho_cham,
  count(*) filter (where b.trang_thai = 'dat')                      as dat,
  count(*) filter (where b.trang_thai = 'can_sua_lai')              as can_sua_lai
from dot_nop d
left join bai_nop b on b.dot_id = d.id
group by d.id;

-- ---------------------------------------------------------------------------
-- Cùng một video được nhiều sinh viên nộp trong cùng một đợt: dấu hiệu nộp hộ
-- hoặc chép link. Không kết luận thay giảng viên, chỉ nêu ra để kiểm.
-- ---------------------------------------------------------------------------
create view trung_video as
select
  b.dot_id,
  b.nen_tang,
  b.ma_video,
  count(*)                        as so_bai,
  array_agg(s.ma_sv order by s.ma_sv) as ds_ma_sv
from bai_nop b
join sinh_vien s on s.id = b.sinh_vien_id
group by b.dot_id, b.nen_tang, b.ma_video
having count(*) > 1;

alter table lop        enable row level security;
alter table sinh_vien  enable row level security;
alter table dot_nop    enable row level security;
alter table bai_nop    enable row level security;
alter table lich_su_nop enable row level security;
