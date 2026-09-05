# Nộp link video bài tập

Nơi sinh viên dán link video YouTube hoặc TikTok cho các bài tập của học phần
**Lập trình Java nâng cao (AJP201)**, và nơi giảng viên xem, chấm, xuất Excel.

Sinh viên không cần tài khoản: nhập mã sinh viên, hệ thống đối chiếu với danh
sách lớp học phần rồi cho nộp. Giảng viên vào bằng một mã đặt trong biến môi
trường.

---

## Hệ thống làm gì

**Phía sinh viên** (`/`)

- Nhập mã sinh viên một lần, máy nhớ trong 120 ngày.
- Thấy toàn bộ đợt nộp: hạn, còn bao lâu, yêu cầu video, mình đã nộp hay chưa.
- Dán link, hệ thống kiểm ngay khi gõ: đúng YouTube hay TikTok chưa, có phải
  link video hay chỉ là link kênh, link danh sách phát.
- Nộp lại được khi đợt còn mở; bài quay về trạng thái chờ chấm và điểm cũ bị xóa.
- Đọc được điểm và nhận xét của giảng viên ngay trên trang.

**Phía giảng viên** (`/giang-vien`)

- Bảng điều khiển: mỗi đợt bao nhiêu bài đã nộp trên tổng số sinh viên, bao
  nhiêu trễ, bao nhiêu chờ chấm; đóng hoặc mở lại nhận bài bằng một nút.
- Trang chấm từng đợt: đủ danh sách lớp kể cả người chưa nộp, lọc theo chưa
  nộp, đã nộp, chờ chấm, nộp trễ, cần làm lại; xem video ngay trong trang, nhập
  điểm và nhận xét.
- Cảnh báo trùng video: hai sinh viên nộp cùng một đường dẫn.
- Xuất Excel một đợt, người chưa nộp tô đỏ, người nộp trễ tô vàng.
- Tạo và sửa đợt nộp ngay trên web, không phải chạy SQL.

**Những chỗ đã tính trước**

| Tình huống | Hệ thống làm gì |
|---|---|
| Dán link kênh, link playlist, link trang cá nhân TikTok | Từ chối, nói rõ sai chỗ nào |
| Dán link Google Drive hoặc Facebook | Từ chối kèm lý do |
| Dán cùng link với bạn cùng lớp | Chặn ngay lúc nộp |
| Dán link kèm `?si=`, `&list=`, `is_from_webapp` | Cắt tham số, quy về một dạng chuẩn |
| Nộp sau hạn | Vẫn nhận nếu đợt cho phép, nhưng đánh dấu trễ |
| Nộp lại nhiều lần | Giữ một dòng mới nhất, lịch sử lưu ở bảng `lich_su_nop` |
| Mã sinh viên không có trong lớp | Không cho vào, báo liên hệ giảng viên |

---

## Chạy tại máy

Cần: Docker Desktop đang chạy, Node.js 20 trở lên.

```bash
npm install
npx supabase start          # dựng Postgres + PostgREST bằng Docker
cp .env.example .env.local  # Windows: copy .env.example .env.local
npm run db:reset            # nạp danh sách lớp và các đợt nộp
npm run dev                 # http://localhost:3000
```

Mở `.env.local` đặt `MA_GIANG_VIEN` và `KHOA_PHIEN` trước khi vào `/giang-vien`.

| Dịch vụ | Địa chỉ |
|---|---|
| Web | http://localhost:3000 |
| API Supabase | http://127.0.0.1:54421 |
| Studio (xem bảng) | http://127.0.0.1:54423 |

Dừng: `npx supabase stop`.

Cổng đã dời khỏi mặc định (54421 thay vì 54321) để chạy song song được với các
project Supabase khác trên cùng máy.

---

## Đưa lên mạng cho sinh viên dùng

### Bước 1. Tạo cơ sở dữ liệu trên Supabase

1. Vào https://supabase.com/dashboard, đăng nhập bằng GitHub.
2. Bấm **New project**. Đặt tên `nop-bai-video`, chọn vùng **Southeast Asia
   (Singapore)**, đặt mật khẩu database và lưu lại mật khẩu đó. Gói Free là đủ.
3. Chờ khoảng hai phút cho project khởi tạo xong.
4. Vào **SQL Editor** ở cột trái, bấm **New query**, dán toàn bộ nội dung file
   `supabase/migrations/20260905000100_khoi_tao.sql` rồi bấm **Run**. Phải thấy
   báo Success.
5. Vẫn ở SQL Editor, mở query mới, dán toàn bộ `supabase/seed.sql` rồi **Run**.
   Đây là lệnh nạp 42 sinh viên lớp 24CT1 và 6 đợt nộp.
6. Vào **Project Settings → API**, chép hai giá trị:
   - **Project URL**, dạng `https://xxxxxxxx.supabase.co`
   - **service_role key** (bấm Reveal). Key này bỏ qua mọi phân quyền nên chỉ
     đặt trong biến môi trường phía máy chủ, không dán vào code hay chat.

### Bước 2. Deploy lên Vercel

1. Đưa thư mục này thành một repo GitHub riêng (xem bước 3).
2. Vào https://vercel.com/new, chọn repo đó, để nguyên mọi thiết lập build.
3. Ở mục **Environment Variables**, thêm bốn biến:

   | Tên | Giá trị |
   |---|---|
   | `SUPABASE_URL` | Project URL ở bước 1 |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key ở bước 1 |
   | `MA_GIANG_VIEN` | mật khẩu bạn tự đặt để vào `/giang-vien` |
   | `KHOA_PHIEN` | chuỗi ngẫu nhiên, sinh bằng lệnh dưới |

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. Bấm **Deploy**. Xong thì gửi sinh viên đường dẫn trang chủ, còn bạn vào
   `/giang-vien`.

### Bước 3. Repo GitHub

```bash
git init
git add .
git commit -m "feat: hệ thống nộp link video bài tập"
gh repo create nop-bai-video --private --source=. --push
```

Không dùng `gh` thì tạo repo trống trên GitHub rồi:

```bash
git remote add origin https://github.com/<tài-khoản>/nop-bai-video.git
git branch -M main
git push -u origin main
```

`.env.local` đã nằm trong `.gitignore`, key không lên GitHub.

---

## Việc thường làm trong học kỳ

**Mở đợt nộp mới.** `/giang-vien`, mục Thêm đợt nộp. Mã đợt viết hoa không dấu
(`LAB06`), hạn nộp nhập theo giờ Việt Nam. Bỏ dấu Nhận bài trễ nếu muốn quá hạn
là hết nhận.

**Khóa sổ một đợt.** Bấm Đóng ở dòng đợt đó. Sinh viên vẫn thấy đợt và bài mình
đã nộp, nhưng không nộp hay sửa link được nữa.

**Chấm.** `/giang-vien`, bấm Chấm bài, lọc Chờ chấm, xem video ngay trong
trang, nhập điểm 0 đến 10, chọn Đạt hoặc Cần làm lại, viết nhận xét. Nhận xét
hiện trên trang của chính sinh viên đó.

**Bắt nộp hộ.** Trang chấm hiện ô đỏ nếu hai sinh viên nộp cùng một video. Muốn
buộc một em nộp lại từ đầu thì bấm Xóa bài nộp này.

**Sang lớp khác hoặc học kỳ sau.** Xuất file điểm danh `.xlsx` từ phần mềm đào
tạo rồi chạy:

```bash
npm run doc:danh-sach -- "duong/dan/danh-sach-25CT1.xlsx" 25CT1
```

Script sinh `du-lieu/danh-sach-25CT1.json`. Sửa hằng `LOP` trong
`scripts/sinh-seed.mjs` cho khớp lớp mới, chạy `npm run seed:gen`, rồi chạy
`supabase/seed.sql` mới trên SQL Editor.

---

## Kiểm

```bash
npm run kiem   # bóc link video và định dạng giờ Việt Nam
npx tsc --noEmit
npm run build
```

`npm run kiem` là cổng thật, không phải để trang trí: cố tình làm hỏng biểu
thức nhận mã video thì nó trượt và thoát mã 1, đã thử rồi khôi phục. Hai chỗ
được kiểm là hai chỗ dễ sai nhất mà hỏng thì im lặng:

- **Bóc link.** Nhận đúng mọi dạng link YouTube và TikTok mà sinh viên hay dán,
  từ chối link kênh và link playlist, quy hai dạng link của cùng một video về
  một chuỗi chuẩn.
- **Giờ Việt Nam.** Máy chủ Vercel chạy giờ UTC còn hạn nộp là 23:59 giờ Việt
  Nam, lệch một tiếng là lệch hẳn một ngày, nên phần này có bài kiểm riêng cho
  mốc qua nửa đêm.

---

## Cấu trúc

```
du-lieu/              danh sách lớp và định nghĩa các đợt nộp, dạng JSON
scripts/              đọc xlsx của phòng đào tạo, sinh seed.sql
supabase/migrations/  lược đồ cơ sở dữ liệu
kiem/                 bài kiểm chạy bằng node, không cần framework
src/lib/              truy vấn, bóc link, giờ giấc, phiên giảng viên, Excel
src/app/              trang sinh viên, trang giảng viên, API xuất Excel
src/components/       mảnh giao diện dùng lại
```

Toàn bộ truy cập cơ sở dữ liệu nằm phía máy chủ qua `service_role`; trình duyệt
không bao giờ giữ key. Các bảng đều bật RLS mà không khai policy nào, nên kể cả
key `anon` lọt ra ngoài cũng không đọc được gì.

## Giới hạn đã biết

- Xác thực bằng mã sinh viên: ai biết mã của bạn mình thì nộp thay được. Đủ để
  chặn người ngoài lớp, không phải là chống gian lận. Cần chặt hơn thì thêm mã
  lớp bí mật hoặc đăng nhập Google.
- Không kiểm được video có thật do sinh viên quay hay không, cũng không đọc
  được độ dài video: hệ thống chỉ kiểm link, phần nội dung vẫn do giảng viên xem.
- Link TikTok rút gọn (`vm.tiktok.com`) không xem trước được trong trang chấm,
  hệ thống nhận nhưng có cảnh báo nhắc sinh viên dán link đầy đủ.
- Một lớp học phần cho mỗi lần triển khai. Nhiều lớp thì nạp thêm bản ghi vào
  bảng `lop` và sửa `lopHienTai()` cho chọn theo mã lớp.
