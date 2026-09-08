/**
 * QA toàn bộ giao diện web bằng Chrome không giao diện.
 *
 * Chạy đúng luồng của sinh viên rồi của giảng viên trên bản đang chạy thật,
 * kiểm cả những chỗ chỉ máy chủ mới chặn được, và chụp ảnh từng bước để người
 * đọc tự nhìn chứ không phải tin lời script.
 *
 *   npm run db:reset      # đưa dữ liệu về trạng thái gốc
 *   npm run dev           # ở một cửa sổ khác
 *   npm run qa
 *
 * Ba bẫy đã gặp khi viết bộ kiểm này, ghi lại để đừng lặp:
 *   - document.body.innerText áp text-transform của CSS nên nhãn viết hoa hết.
 *   - document.body.textContent lại nuốt cả nội dung thẻ <script> mà Next nhúng
 *     dữ liệu vào, nên tìm chuỗi gì cũng thấy. Phải bỏ script ra trước khi đọc.
 *   - Đọc trang ngay sau khi bấm nút thì đọc trúng trang cũ. Phải chờ một dấu
 *     hiệu chỉ có ở trang mới.
 */
const fs = require('node:fs')
const path = require('node:path')
const puppeteer = require('puppeteer-core')

const GOC = process.env.QA_URL || 'http://localhost:3000'

/**
 * Ảnh chụp phải nằm NGOÀI thư mục dự án.
 *
 * Ghi ảnh vào trong dự án thì Next dev tưởng mã nguồn vừa đổi và biên dịch lại
 * ngay giữa chừng, giết luôn request server action đang bay: nút nộp bài kẹt ở
 * "Đang gửi" mà máy chủ không hề nhận được POST nào. Triệu chứng trông y hệt
 * lỗi ứng dụng, mất khá lâu mới lần ra, nên đừng đổi chỗ này về trong repo.
 */
const RA = process.env.QA_ANH || path.join(require('node:os').tmpdir(), 'qa-nop-bai-video')
const CHROME =
  process.env.CHROME_PATH ||
  ['C:/Program Files/Google/Chrome/Application/chrome.exe',
   'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
   '/usr/bin/google-chrome',
   '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => fs.existsSync(p))

const LINK_YT = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
const LINK_YT_2 = 'https://youtu.be/aBcDeFgHiJk'
const LINK_TT = 'https://www.tiktok.com/@sinhvien/video/7412345678901234567'

let dat = 0
const truot = []
let muc = ''

function phan(ten) {
  muc = ten
  console.log(`\n${ten}`)
}

function nhan(ten, dung, chiTiet = '') {
  if (dung) {
    dat += 1
    console.log(`  ĐẠT    ${ten}`)
  } else {
    truot.push(`${muc} / ${ten}${chiTiet ? ` -- ${chiTiet}` : ''}`)
    console.log(`  TRƯỢT  ${ten}${chiTiet ? ` -- ${chiTiet}` : ''}`)
  }
}

// --- đọc biến môi trường để nói chuyện thẳng với cơ sở dữ liệu khi cần ------
function docEnv() {
  const p = fs.existsSync('.env.local') ? '.env.local' : '.env.example'
  const o = {}
  for (const d of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = d.match(/^([A-Z_]+)=(.*)$/)
    if (m) o[m[1]] = m[2]
  }
  return o
}
const ENV = docEnv()
const API = ENV.SUPABASE_URL
const KEY = ENV.SUPABASE_SERVICE_ROLE_KEY
const HDR = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

async function db(duong, tuyChon = {}) {
  const r = await fetch(`${API}/rest/v1/${duong}`, { ...tuyChon, headers: { ...HDR, ...(tuyChon.headers || {}) } })
  const chu = await r.text()
  return chu ? JSON.parse(chu) : null
}

// --- tiện ích trình duyệt --------------------------------------------------
/** Chữ người dùng thật sự nhìn thấy: bỏ script, style, template. */
const CHU_THAT = () => {
  const b = document.body.cloneNode(true)
  b.querySelectorAll('script, style, template, noscript').forEach((e) => e.remove())
  return b.textContent.replace(/\s+/g, ' ')
}

async function chu(p) {
  return p.evaluate(CHU_THAT)
}

async function cho(p, mau, ms = 25000) {
  try {
    await p.waitForFunction(
      (m) => {
        const b = document.body.cloneNode(true)
        b.querySelectorAll('script, style, template, noscript').forEach((e) => e.remove())
        return new RegExp(m).test(b.textContent.replace(/\s+/g, ' '))
      },
      { timeout: ms },
      mau
    )
  } catch (e) {
    // Hết giờ chờ mà chỉ báo "timeout" thì không biết trang đang nói gì. In ra
    // đúng chỗ đang đứng để lần sau khỏi phải dựng lại kịch bản gỡ lỗi.
    const chuHienTai = await p.evaluate(CHU_THAT).catch(() => '(không đọc được trang)')
    throw new Error(
      `Chờ "${mau}" quá ${ms}ms. Trang đang hiện:
    ...${chuHienTai.slice(0, 900)}`
    )
  }
}

async function datGiaTri(p, sel, giaTri, la = 'input') {
  await p.evaluate(
    (s, v, l) => {
      const o = document.querySelector(s)
      const proto = l === 'textarea' ? window.HTMLTextAreaElement : window.HTMLInputElement
      Object.getOwnPropertyDescriptor(proto.prototype, 'value').set.call(o, v)
      o.dispatchEvent(new Event('input', { bubbles: true }))
      o.dispatchEvent(new Event('change', { bubbles: true }))
    },
    sel,
    giaTri,
    la
  )
}

/** Chờ nút gửi hết bị khóa rồi mới bấm. */
async function guiForm(p, sel, ms = 15000) {
  await p.waitForFunction(
    (s) => {
      const o = document.querySelector(s)
      if (!o) return false
      const b = o.closest('form').querySelector('button[type=submit]')
      return b && !b.disabled
    },
    { timeout: ms },
    sel
  )
  await p.evaluate((s) => {
    document.querySelector(s).closest('form').querySelector('button[type=submit]').click()
  }, sel)
}

/** Chờ nút hiện ra rồi mới bấm: sau mỗi hành động máy chủ vẽ lại trang, bấm
    ngay khi thấy dòng thông báo thì nút của trang mới chưa kịp có. */
async function bamNut(p, chuTrenNut, ms = 15000) {
  await p.waitForFunction(
    (c) => [...document.querySelectorAll('button')].some((b) => b.innerText.includes(c) && !b.disabled),
    { timeout: ms },
    chuTrenNut
  )
  await p.evaluate((c) => {
    const n = [...document.querySelectorAll('button')].find((b) => b.innerText.includes(c))
    n.click()
  }, chuTrenNut)
}

async function chup(p, ten) {
  await p.screenshot({ path: path.join(RA, ten + '.png'), fullPage: true })
}

/** Bắt lỗi JavaScript của trang: kẹt ở "Đang gửi" mà không có lỗi in ra thì
    không thể biết trình duyệt hay máy chủ mới là chỗ hỏng. */
function ngheLoi(p, ten) {
  p.on('pageerror', (e) => console.log(`  [lỗi JS ${ten}] ${e.message.slice(0, 200)}`))
  p.on('console', (m) => {
    if (m.type() === 'error') console.log(`  [console ${ten}] ${m.text().slice(0, 200)}`)
  })
  p.on('requestfailed', (r) => {
    // ERR_ABORTED xuất hiện cả khi hành động thành công vì trình duyệt đóng
    // luồng RSC sau khi đọc xong, nên chỉ báo những lỗi khác.
    const loi = r.failure()?.errorText || ''
    if (r.method() === 'POST' && !/ERR_ABORTED/.test(loi))
      console.log(`  [POST hỏng ${ten}] ${loi}`)
  })
}

async function trangSinhVien(browser, maSv, { sang = true } = {}) {
  const ct = await browser.createBrowserContext()
  const p = await ct.newPage()
  ngheLoi(p, maSv)
  if (sang) await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }])
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
  await p.goto(GOC, { waitUntil: 'networkidle0' })
  await p.type('#ma_sv', maSv)
  await p.click('button[type=submit]')
  await cho(p, 'Không phải em')
  return p
}

// ---------------------------------------------------------------------------
;(async () => {
  if (!CHROME) {
    console.error('Không tìm thấy Chrome. Đặt biến môi trường CHROME_PATH.')
    process.exit(1)
  }
  fs.mkdirSync(RA, { recursive: true })

  // Dựng sẵn hai tình huống không có trong dữ liệu gốc: một đợt đã quá hạn
  // nhưng còn nhận bài, và một đợt đã đóng.
  const homQua = new Date(Date.now() - 36 * 3600 * 1000).toISOString()
  await db('dot_nop?ma=eq.LAB05', { method: 'PATCH', body: JSON.stringify({ han_nop: homQua }) })
  await db('dot_nop?ma=eq.BTL', { method: 'PATCH', body: JSON.stringify({ dang_mo: false }) })

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })

  // =========================================================================
  phan('A. Trang sinh viên khi chưa nhập mã')
  // =========================================================================
  const cong = await browser.newPage()
  await cong.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }])
  await cong.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
  const hong = []
  cong.on('response', (r) => {
    if (r.status() >= 400) hong.push(`${r.status()} ${r.url()}`)
  })
  await cong.goto(GOC, { waitUntil: 'networkidle0' })
  const nen = await cong.evaluate(() => getComputedStyle(document.body).backgroundColor)
  nhan('trang chủ tải được, không request nào hỏng', hong.length === 0, hong.join(', '))
  nhan('CSS có tác dụng (nền không phải trắng mặc định)', nen !== 'rgba(0, 0, 0, 0)' && nen !== 'rgb(255, 255, 255)', 'nền = ' + nen)
  const chuCong = await chu(cong)
  nhan('nêu học phần đang mở', /Lập trình Java nâng cao/.test(chuCong))
  nhan('chưa nhập mã thì không lộ tên sinh viên nào', !/Mai Nguyễn Hồng Anh/.test(chuCong))
  await chup(cong, '01-cong-vao')

  await cong.type('#ma_sv', '9999999999')
  await cong.click('button[type=submit]')
  await cho(cong, 'không có trong danh sách')
  nhan('mã không có trong hệ thống bị chặn', true)
  await chup(cong, '02-ma-sai')

  // =========================================================================
  phan('B. Sinh viên nộp bài')
  // =========================================================================
  const sv1 = await trangSinhVien(browser, '2451220114')
  const chuSv1 = await chu(sv1)
  nhan('vào được, hiện đúng họ tên', /Mai Nguyễn Hồng Anh/.test(chuSv1))
  nhan('thấy đủ 6 đợt của học phần', ['LAB01', 'LAB02', 'LAB03', 'LAB04', 'LAB05', 'BTL'].every((m) => chuSv1.includes(m)))
  nhan('đợt quá hạn được nêu rõ', /Quá hạn/.test(chuSv1))
  nhan('đợt đã đóng được nêu rõ', /Đã đóng/.test(chuSv1))
  await chup(sv1, '03-danh-sach-dot')

  // Ô nhập của LAB01 là ô đầu tiên
  const oLab01 = await sv1.evaluate(() => document.querySelector('input[name=url]').id)

  await datGiaTri(sv1, '#' + oLab01, 'https://www.youtube.com/@kenhcuaem')
  await cho(sv1, 'link kênh', 8000)
  const khoaNut = await sv1.evaluate(
    (id) => document.getElementById(id).closest('form').querySelector('button[type=submit]').disabled
  , oLab01)
  nhan('link kênh bị bắt ngay khi gõ', true)
  nhan('nút nộp bị khóa khi link sai', khoaNut === true)
  await chup(sv1, '04-link-kenh-bi-chan')

  await datGiaTri(sv1, '#' + oLab01, 'https://drive.google.com/file/d/1abc/view')
  await cho(sv1, 'Google Drive', 8000)
  nhan('link Google Drive bị từ chối kèm lý do', true)

  await datGiaTri(sv1, '#' + oLab01, LINK_YT)
  await cho(sv1, 'Nhận dạng được', 8000)
  await guiForm(sv1, '#' + oLab01)
  await cho(sv1, 'Đã nhận bài')
  nhan('nộp link YouTube hợp lệ', true)
  await chup(sv1, '05-da-nop')

  const bai1 = (await db('bai_nop?select=url_chuan,so_lan_nop,tre,trang_thai'))[0]
  nhan('link được chuẩn hóa trước khi lưu', bai1.url_chuan === LINK_YT, bai1.url_chuan)
  nhan('nộp đúng hạn không bị đánh dấu trễ', bai1.tre === false)

  // Nộp lại
  await bamNut(sv1, 'Đổi link khác')
  await sv1.waitForSelector('input[name=url]', { timeout: 10000 })
  const oLai = await sv1.evaluate(() => document.querySelector('input[name=url]').id)
  await datGiaTri(sv1, '#' + oLai, LINK_YT_2)
  await guiForm(sv1, '#' + oLai)
  await cho(sv1, 'Đã thay link')
  const bai2 = (await db('bai_nop?select=url_chuan,so_lan_nop,trang_thai'))[0]
  nhan('nộp lại ghi đè đúng link mới', /aBcDeFgHiJk/.test(bai2.url_chuan), bai2.url_chuan)
  nhan('nộp lại đếm đúng số lần', bai2.so_lan_nop === 2, 'so_lan_nop = ' + bai2.so_lan_nop)
  const lichSu = await db('lich_su_nop?select=hanh_dong&order=luc')
  nhan('lịch sử giữ đủ hai lần nộp', lichSu.length === 2 && lichSu[1].hanh_dong === 'nop_lai', JSON.stringify(lichSu))

  // Nộp trễ vào LAB05.
  // Thẻ của một đợt nhận ra bằng nhãn mã đợt (span.nhan-chu.so) chứ không phải
  // bằng "section nào có chữ LAB05": khối học phần cũng chứa chữ đó, và ô nhập
  // đầu tiên trong khối lại là của đợt khác.
  const oLab05 = await sv1.evaluate(() => {
    const the = [...document.querySelectorAll('section')].find(
      (s) => s.querySelector('span.nhan-chu.so')?.textContent.trim() === 'LAB05'
    )
    return the.querySelector('input[name=url]').id
  })
  await datGiaTri(sv1, '#' + oLab05, LINK_TT)
  await guiForm(sv1, '#' + oLab05)
  await cho(sv1, 'ghi nhận nộp trễ')
  const baiTre = (await db('bai_nop?select=tre&nen_tang=eq.tiktok'))[0]
  nhan('nộp sau hạn được đánh dấu trễ trong cơ sở dữ liệu', baiTre.tre === true)
  await chup(sv1, '06-nop-tre')

  const btlCoO = await sv1.evaluate(() => {
    const the = [...document.querySelectorAll('section')].find(
      (s) => s.querySelector('span.nhan-chu.so')?.textContent.trim() === 'BTL'
    )
    return !!the.querySelector('input[name=url]')
  })
  nhan('đợt đã đóng không còn ô nhập link', btlCoO === false)

  // Sinh viên khác nộp trùng video
  const sv2 = await trangSinhVien(browser, '2451220028')
  const oB = await sv2.evaluate(() => document.querySelector('input[name=url]').id)
  await datGiaTri(sv2, '#' + oB, LINK_YT_2)
  await guiForm(sv2, '#' + oB)
  await cho(sv2, 'đã có sinh viên khác')
  nhan('hai người nộp cùng một video bị chặn', true)
  await chup(sv2, '07-chan-trung-video')

  await datGiaTri(sv2, '#' + oB, LINK_TT)
  await guiForm(sv2, '#' + oB)
  await cho(sv2, 'Đã nhận bài')
  nhan('cùng video nhưng khác đợt thì vẫn nộp được', true)

  // =========================================================================
  phan('C. Trang giảng viên')
  // =========================================================================
  const la = await browser.createBrowserContext()
  const nguoiLa = await la.newPage()
  await nguoiLa.setViewport({ width: 1280, height: 900 })
  await nguoiLa.goto(GOC + '/giang-vien', { waitUntil: 'networkidle0' })
  const chuLa = await chu(nguoiLa)
  nhan('người chưa đăng nhập không thấy dữ liệu lớp', !/Mai Nguyễn Hồng Anh/.test(chuLa) && !/42/.test(chuLa))
  await nguoiLa.type('#ma-gv', 'ma-sai-hoan-toan')
  await nguoiLa.click('button[type=submit]')
  await cho(nguoiLa, 'Mã không đúng')
  nhan('sai mã giảng viên bị chặn', true)

  const gv = await browser.newPage()
  await gv.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }])
  await gv.setViewport({ width: 1280, height: 900 })
  await gv.goto(GOC + '/giang-vien', { waitUntil: 'networkidle0' })
  await gv.type('#ma-gv', ENV.MA_GIANG_VIEN)
  await gv.click('button[type=submit]')
  await cho(gv, 'Các học phần')
  nhan('đăng nhập giảng viên vào được', true)
  await chup(gv, '08-gv-danh-sach-hoc-phan')

  await gv.goto(GOC + '/giang-vien/lop/AJP20101', { waitUntil: 'networkidle0' })
  const chuLop = await chu(gv)
  nhan('trang lớp hiện đủ 42 sinh viên', /Sinh viên\s*42/.test(chuLop), chuLop.slice(0, 120))
  nhan('trang lớp hiện đủ 6 đợt', /trên tổng 6 đợt/.test(chuLop))
  await chup(gv, '09-gv-trang-lop')

  const idLab01 = (await db('dot_nop?select=id&ma=eq.LAB01'))[0].id
  await gv.goto(`${GOC}/giang-vien/dot/${idLab01}?loc=tat-ca`, { waitUntil: 'networkidle0' })
  const soDong = await gv.evaluate(
    () => document.querySelectorAll('form input[name=bai_id], .the').length
  )
  const chuCham = await chu(gv)
  nhan('bảng chấm liệt kê cả người chưa nộp', /Chưa nộp/.test(chuCham) && soDong > 40, 'so the = ' + soDong)
  nhan('thống kê đã nộp đúng 2/42', /Đã nộp\s*2\/42/.test(chuCham))
  await chup(gv, '10-gv-bang-cham')

  await gv.goto(`${GOC}/giang-vien/dot/${idLab01}?loc=chua-nop`, { waitUntil: 'networkidle0' })
  const chuaNop = await gv.evaluate(() => document.querySelectorAll('a[href*="youtube"], a[href*="tiktok"]').length)
  nhan('lọc chưa nộp không lẫn bài đã nộp', chuaNop === 0, 'con ' + chuaNop + ' link')

  await gv.goto(`${GOC}/giang-vien/dot/${idLab01}?loc=da-nop`, { waitUntil: 'networkidle0' })
  await gv.type('input[name=diem]', '8.5')
  await gv.select('select[name=trang_thai]', 'dat')
  await gv.type('textarea[name=nhan_xet]', 'Chay duoc, giai thich ro phan interface.')
  await guiForm(gv, 'input[name=diem]')
  await cho(gv, 'Đã lưu')
  const daCham = (await db(`bai_nop?select=diem,trang_thai,nhan_xet&dot_id=eq.${idLab01}&trang_thai=eq.dat`))[0]
  nhan('điểm lưu đúng vào cơ sở dữ liệu', daCham && Number(daCham.diem) === 8.5, JSON.stringify(daCham))
  const oTrangThai = await gv.evaluate(() => document.querySelector('select[name=trang_thai]').value)
  nhan('ô trạng thái hiện đúng cái vừa lưu', oTrangThai === 'dat', 'dang hien: ' + oTrangThai)
  await chup(gv, '11-gv-da-cham')

  await bamNut(gv, 'Xem tại đây')
  await new Promise((r) => setTimeout(r, 3000))
  const khung = await gv.evaluate(() => {
    const f = document.querySelector('iframe')
    return f ? { src: f.getAttribute('src'), cao: f.clientHeight } : null
  })
  nhan('xem được video ngay trong trang chấm', !!khung && /youtube-nocookie/.test(khung.src) && khung.cao > 100, JSON.stringify(khung))
  await chup(gv, '12-gv-khung-video')

  // Excel
  const excel = await gv.evaluate(async (u) => {
    const r = await fetch(u)
    return { status: r.status, bytes: (await r.arrayBuffer()).byteLength }
  }, `${GOC}/api/xuat-excel?dot=${idLab01}`)
  nhan('xuất Excel chạy được', excel.status === 200 && excel.bytes > 5000, JSON.stringify(excel))
  const excelLa = await nguoiLa.evaluate(async (u) => {
    const r = await fetch(u)
    return { status: r.status, chu: (await r.text()).slice(0, 40) }
  }, `${GOC}/api/xuat-excel?dot=${idLab01}`)
  nhan('người chưa đăng nhập không tải được Excel', excelLa.status === 401, JSON.stringify(excelLa))

  // Sinh viên đọc được nhận xét
  const sv1b = await trangSinhVien(browser, '2451220114')
  const chuSv1b = await chu(sv1b)
  nhan('sinh viên đọc được điểm và nhận xét', /8\.5/.test(chuSv1b) && /Nhận xét của giảng viên/i.test(chuSv1b))
  await chup(sv1b, '13-sv-thay-diem')

  // =========================================================================
  phan('D. Nhiều học phần')
  // =========================================================================
  await gv.goto(GOC + '/giang-vien', { waitUntil: 'networkidle0' })
  await bamNut(gv, 'Mở lớp học phần mới')
  await gv.waitForSelector('#ma-lop', { timeout: 10000 })
  await gv.type('#ma-lop', 'AIT30102')
  await gv.type('#ma-hp', 'AIT301')
  await gv.type('#lop-sh', '24CT2')
  await gv.type('#ten-hp', 'Trí tuệ nhân tạo')
  await gv.type('#hoc-ky', 'HK1 - 2026-2027')
  await guiForm(gv, '#ma-lop')
  await cho(gv, 'Đã tạo lớp AIT30102')
  nhan('mở thêm học phần ngay trên web', true)

  await gv.goto(GOC + '/giang-vien/lop/AIT30102', { waitUntil: 'networkidle0' })
  await bamNut(gv, 'Nạp danh sách sinh viên')
  await gv.waitForSelector('#danh-sach', { timeout: 10000 })
  const DAN = [
    'STT\tMã sinh viên\tHọ đệm\tTên\tGiới tính\tEmail\tSố điện thoại\tNgày sinh',
    '1\t2451220114\tMai Nguyễn Hồng\tAnh\tNam\tmai@gmail.com\t393061324\t29/12/2006',
    '2\t2451990001\tTrần Thị Mỹ\tDuyên\tNữ\tduyen@gmail.com\t905111222\t02/02/2006',
    '3\t2451990002\tLê Nhật\tNam\tNam\tnam@gmail.com\t905333444\t11/07/2006',
  ].join('\n')
  await datGiaTri(gv, '#danh-sach', DAN, 'textarea')
  await cho(gv, 'Đọc được 3 sinh viên', 10000)
  nhan('dán từ Excel: đếm trước đúng 3 sinh viên', true)
  await chup(gv, '14-gv-dan-danh-sach')
  await guiForm(gv, '#danh-sach')
  await cho(gv, 'Đã nạp 3 sinh viên')
  const svMoi = await db('sinh_vien?select=ma_sv,ho_ten&ma_sv=eq.2451990002')
  nhan('cột giới tính không nuốt mất tên "Lê Nhật Nam"', svMoi[0].ho_ten === 'Lê Nhật Nam', JSON.stringify(svMoi))
  const gdCu = await db('ghi_danh?select=id&sinh_vien_id=in.(select)')
  const svChung = await db('sinh_vien?select=id&ma_sv=eq.2451220114')
  const gdChung = await db(`ghi_danh?select=lop_id&sinh_vien_id=eq.${svChung[0].id}`)
  nhan('em học hai môn chỉ có một bản ghi sinh viên, hai dòng ghi danh', gdChung.length === 2, JSON.stringify(gdChung))

  await bamNut(gv, 'Tạo đợt nộp mới')
  await gv.waitForSelector('#ma-dot', { timeout: 10000 })
  await gv.type('#ma-dot', 'TTNT01')
  await gv.type('#ten-dot', 'Buổi 1 - Tìm kiếm trên không gian trạng thái')
  await datGiaTri(gv, '#han-nop', '2026-12-12T23:59')
  await guiForm(gv, '#ma-dot')
  await cho(gv, 'Đã tạo đợt TTNT01')
  nhan('ra đợt nộp cho học phần mới', true)
  await gv.goto(GOC + '/giang-vien/lop/AIT30102', { waitUntil: 'networkidle0' })
  await chup(gv, '15-gv-lop-moi')

  await gv.goto(GOC + '/giang-vien/lop/AJP20101', { waitUntil: 'networkidle0' })
  const chuJava = await chu(gv)
  nhan('lớp cũ không bị ảnh hưởng', /Sinh viên\s*42/.test(chuJava) && !/TTNT01/.test(chuJava))

  const svHai = await trangSinhVien(browser, '2451220114')
  const chuHai = await chu(svHai)
  nhan('em học hai môn thấy cả hai môn', /Lập trình Java nâng cao/.test(chuHai) && /Trí tuệ nhân tạo/.test(chuHai))
  nhan('thấy đợt của cả hai môn', /LAB01/.test(chuHai) && /TTNT01/.test(chuHai))
  await chup(svHai, '16-sv-hai-hoc-phan')

  const svMot = await trangSinhVien(browser, '2451990002')
  const chuMot = await chu(svMot)
  nhan('em chỉ học một môn không thấy môn kia', !/Lập trình Java nâng cao/.test(chuMot) && !/LAB01/.test(chuMot))
  await chup(svMot, '17-sv-mot-hoc-phan')

  // =========================================================================
  phan('E. Chặn ở máy chủ, không chỉ ở giao diện')
  // =========================================================================
  // Sinh viên đang mở form thì bị rút khỏi lớp; lần bấm nộp sau đó chỉ còn
  // phép kiểm phía máy chủ đứng chắn.
  await svMot.waitForSelector('input[name=url]', { timeout: 10000 })
  const svId = (await db('sinh_vien?select=id&ma_sv=eq.2451990002'))[0].id
  const idTtnt = (await db('dot_nop?select=id&ma=eq.TTNT01'))[0].id
  await db(`ghi_danh?sinh_vien_id=eq.${svId}`, { method: 'PATCH', body: JSON.stringify({ dang_hoc: false }) })
  const oMot = await svMot.evaluate(() => document.querySelector('input[name=url]').id)
  await datGiaTri(svMot, '#' + oMot, LINK_YT)
  await guiForm(svMot, '#' + oMot)
  // Khẳng định vào thẳng cơ sở dữ liệu chứ không chỉ đọc câu thông báo: gỡ mất
  // phép kiểm ở máy chủ thì bài vẫn lọt vào bảng dù màn hình nói gì đi nữa.
  await new Promise((r) => setTimeout(r, 5000))
  const lot = await db(`bai_nop?select=id&dot_id=eq.${idTtnt}&sinh_vien_id=eq.${svId}`)
  const chuChan = await chu(svMot)
  nhan(
    'rút tên khỏi lớp thì bài không vào được cơ sở dữ liệu',
    Array.isArray(lot) && lot.length === 0,
    'so bai lot vao: ' + (lot ? lot.length : '?')
  )
  nhan(
    'và sinh viên được báo đúng lý do',
    /Em không có tên trong lớp học phần của đợt này/.test(chuChan),
    chuChan.slice(0, 160)
  )
  await chup(svMot, '18-chan-nop-cheo')
  await db(`ghi_danh?sinh_vien_id=eq.${svId}`, { method: 'PATCH', body: JSON.stringify({ dang_hoc: true }) })

  // =========================================================================
  phan('F. Giao diện ở nền tối')
  // =========================================================================
  const toi = await browser.newPage()
  await toi.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }])
  await toi.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
  await toi.goto(GOC, { waitUntil: 'networkidle0' })
  const nenToi = await toi.evaluate(() => getComputedStyle(document.body).backgroundColor)
  const so = (m) => m.slice(0, 3).reduce((t, x) => t + Number(x), 0)
  const rgbToi = nenToi.match(/\d+/g)
  nhan('nền tối thật sự tối', rgbToi && so(rgbToi) < 200, 'nền = ' + nenToi)
  await chup(toi, '19-nen-toi')

  await browser.close()

  // =========================================================================
  console.log('\n' + '='.repeat(60))
  console.log(`${dat} đạt, ${truot.length} trượt.`)
  if (truot.length) {
    console.log('\nCác mục trượt:')
    truot.forEach((t) => console.log('  - ' + t))
  }
  console.log(`Ảnh chụp: ${path.resolve(RA)}`)
  process.exit(truot.length ? 1 : 0)
})().catch((e) => {
  console.error('\nLỖI: ' + e.message)
  process.exit(1)
})
