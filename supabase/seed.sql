-- File này do scripts/sinh-seed.mjs sinh ra. Đừng sửa tay.
-- Sửa dữ liệu trong du-lieu/*.json rồi chạy: npm run seed:gen

insert into lop (ma, ten_hoc_phan, ma_hoc_phan, ma_lop_hoc_phan, hoc_ky, giang_vien) values
  ('24CT1', 'Lập trình Java nâng cao', 'AJP201', 'AJP20101', 'HK1 - 2026-2027', 'TS. Đỗ Phúc Hảo');

insert into sinh_vien (lop_id, ma_sv, ho_dem, ten, gioi_tinh, email) values
  ((select id from lop where ma = '24CT1'), '2451220114', 'Mai Nguyễn Hồng', 'Anh', 'Nam', 'mainguyenhonganh2912@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220028', 'Ngô Quang', 'Bình', 'Nam', 'ngoquangbinh2912@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220051', 'Trần Thanh', 'Bình', 'Nam', 'binsso0937821350@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220046', 'Hồ Thị', 'Buấn', 'Nữ', 'thibuan18th03@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220003', 'Nguyễn Xuân', 'Công', 'Nam', 'nguyenxuancong2122006@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220025', 'Trần Viết', 'Cường', 'Nam', 'cuongtran33200@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220009', 'Dương Thiện', 'Da', 'Nam', 'thiendaduong4444@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220120', 'Đặng Thành', 'Danh', 'Nam', 'danh0966708759@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220049', 'Huỳnh Tiến', 'Đạt', 'Nam', 'datpro903@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220033', 'Trần Khánh', 'Đông', 'Nam', 'hoannh@dau.edu.vn'),
  ((select id from lop where ma = '24CT1'), '2451220026', 'Nguyễn Bá Hoài', 'Đức', 'Nam', 'duc21042006@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220023', 'Phan Trí', 'Đức', 'Nam', 'biken.aaa111@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220017', 'Trần Hoàng', 'Giáo', 'Nam', 'qtgiao@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220035', 'Nguyễn Duy', 'Hải', 'Nam', 'nguyenduyhai2010.dev@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2251220249', 'Nguyễn Thị Khánh', 'Hằng', 'Nữ', 'hang_2251220249@dau.edu.vn'),
  ((select id from lop where ma = '24CT1'), '2451220056', 'Nguyễn Văn', 'Hào', 'Nam', 'haovipq@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220002', 'Ngô Văn', 'Hiếu', 'Nam', 'tranthichi12333@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220060', 'Nguyễn Trần Đình', 'Hiếu', 'Nam', 'nguyentrandinhhieu2017@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220037', 'Vương Nguyễn Việt', 'Hòa', 'Nam', 'vuongnguyenviethoa1111@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220081', 'Võ Đăng', 'Khoa', 'Nam', 'khoa18673@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220094', 'Nguyễn Ngọc Hoàng', 'Khương', 'Nam', 'khuong206111@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2251220127', 'Chung Văn', 'Long', 'Nam', 'long_2251220127@dau.edu.vn'),
  ((select id from lop where ma = '24CT1'), '2451220077', 'Lê Nhật', 'Nam', 'Nam', 'lnnam28062006@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220030', 'Phan Văn', 'Nam', 'Nam', 'phannam151001@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220012', 'Võ Thị Bích', 'Ngọc', 'Nữ', '1146418_ngoc@tunghia1.edu.vn'),
  ((select id from lop where ma = '24CT1'), '2451220054', 'Phạm Trần Thảo', 'Nguyên', 'Nữ', 'phamtranthaonguyen0022@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2351220103', 'Nguyễn', 'Nhân', 'Nam', 'nguyennhanasdfghjkl2004@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220005', 'Trần Đình', 'Phong', 'Nam', 'phongtrantk123@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220010', 'Nguyễn Đức Hoàng', 'Phúc', 'Nam', 'phucndh686@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220016', 'Phan Quốc', 'Phương', 'Nam', 'phuongphan2077@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220071', 'Lê Anh', 'Quân', 'Nam', 'leq8026@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220104', 'Nguyễn Hữu', 'Quân', 'Nam', 'gmquan2006@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220004', 'Trương Thụy Anh', 'Quân', 'Nam', 'truongthuyanhquan2209@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220055', 'Nguyễn Minh', 'Quốc', 'Nam', 'minquoc10106@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220024', 'Nguyễn Minh', 'Tấn', 'Nam', 'nguyenminhtanqni@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220102', 'Nguyễn Hữu Việt', 'Thắng', 'Nam', 'vietthangpq099@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220014', 'Trần Quang', 'Thành', 'Nam', 'tranquangthanh902@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220001', 'Võ Thị Thu', 'Trinh', 'Nữ', 'truynhzhen@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220053', 'Trương Thị Thanh', 'Trúc', 'Nữ', 'thanhtructruongthi981@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220022', 'Hoàng Nhật', 'Truyền', 'Nam', 'hoangnhattruyen2006@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220080', 'Phan Hoàng', 'Vinh', 'Nam', 'vinhpromixi@gmail.com'),
  ((select id from lop where ma = '24CT1'), '2451220050', 'Lê Khắc', 'Vũ', 'Nam', 'lkvu2006@gmail.com');

insert into dot_nop (lop_id, ma, ten, mo_ta, yeu_cau, han_nop, phut_toi_thieu, thu_tu) values
  ((select id from lop where ma = '24CT1'), 'LAB01', 'Chương 1 - Java OOP, interface, mảng', 'Quay video trình bày bài lab chương 1: lớp và đối tượng, interface, lớp ấn danh, mảng.', 'Video 5 đến 10 phút, quay màn hình có tiếng nói. Mở đầu đọc rõ họ tên và mã sinh viên. Phải chạy chương trình trên máy, không đọc slide.', '2026-09-21 23:59:00+07'::timestamptz, 5, 1),
  ((select id from lop where ma = '24CT1'), 'LAB02', 'Chương 2 - Lambda, generic, stream', 'Video bài lab chương 2: lập trình chức năng, lập trình tổng quát, biểu thức lambda và Stream API.', 'Video 5 đến 10 phút, quay màn hình có tiếng nói. Giải thích được vì sao chọn kiểu tổng quát đó.', '2026-10-05 23:59:00+07'::timestamptz, 5, 2),
  ((select id from lop where ma = '24CT1'), 'LAB03', 'Chương 3 - Cấu trúc dữ liệu tập hợp', 'Video bài lab chương 3: List, Queue, Set, Map và đặc điểm truy xuất.', 'Video 5 đến 10 phút. Phải đo và so sánh được thời gian truy xuất giữa hai cấu trúc.', '2026-10-19 23:59:00+07'::timestamptz, 5, 3),
  ((select id from lop where ma = '24CT1'), 'LAB04', 'Chương 4 - Đa luồng và đồng bộ hóa', 'Video bài lab chương 4: tạo luồng, đồng bộ hóa, java.util.concurrent.', 'Video 5 đến 10 phút. Phải trình diễn được một lỗi tranh chấp dữ liệu rồi sửa nó.', '2026-11-02 23:59:00+07'::timestamptz, 5, 4),
  ((select id from lop where ma = '24CT1'), 'LAB05', 'Chương 5 - Lập trình mạng với Socket', 'Video bài lab chương 5: giao tiếp mạng, Java Socket, tuần tự hóa.', 'Video 5 đến 10 phút. Chạy đồng thời máy chủ và máy khách trên màn hình.', '2026-11-16 23:59:00+07'::timestamptz, 5, 5),
  ((select id from lop where ma = '24CT1'), 'BTL', 'Bài tập lớn - video demo sản phẩm', 'Video demo bài tập lớn theo đề nhóm đã bốc, kèm giải thích kiến trúc và phần mã do chính em viết.', 'Video 10 đến 15 phút. Mở đầu nêu số đề và danh sách nhóm. Mỗi thành viên nói phần mình làm. Có đoạn chạy thật, không cắt ghép che lỗi.', '2026-12-07 23:59:00+07'::timestamptz, 10, 6);
