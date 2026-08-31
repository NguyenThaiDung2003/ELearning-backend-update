# Hướng dẫn deploy

Kiến trúc triển khai: **Vercel** (frontend tĩnh) → **Railway/Render** (backend Docker) → **Aiven/Neon**
(PostgreSQL) + **Cloudinary** (file nộp bài).

> **Thứ tự quan trọng.** Frontend cần biết URL backend, backend cần biết URL frontend (cho CORS và
> cookie). Nên phải deploy backend trước, rồi frontend, rồi **quay lại sửa `CLIENT_URL` của backend**.
> Bỏ bước cuối là đăng nhập sẽ bị CORS chặn.

---

## Bước 0 — Chuẩn bị mã nguồn

Hai repo hiện chưa sẵn sàng để deploy:

**Backend** — toàn bộ code mới đang ở trạng thái chưa commit (commit gần nhất `init` vẫn là bản
e-learning cũ):

```bash
cd d:/GITHUB/ELearning-backend-update
git add -A
git commit -m "Chuyen sang he thong lop hoc va kiem tra dau gio"
git push origin main
```

**Frontend** — chưa phải repo git, phải khởi tạo và đẩy lên GitHub:

```bash
cd d:/GITHUB/Elearning-web
git init
git add -A
git commit -m "Frontend lop hoc truc tuyen"
git branch -M main
git remote add origin https://github.com/<tài-khoản>/elearning-web.git
git push -u origin main
```

Kiểm tra `.gitignore` của cả hai repo đã loại `.env*` và `node_modules` — file `.env` chứa mật khẩu
database thật, tuyệt đối không đẩy lên GitHub. Giá trị cho production đặt trong dashboard của
Railway và Vercel, không đặt trong file.

---

## Bước 1 — Cơ sở dữ liệu

Có thể dùng lại database Aiven đang chạy, hoặc tạo mới trên [Neon](https://neon.tech) /
[Railway](https://railway.app) (đều có gói miễn phí).

Lấy connection string và **thêm `uselibpqcompat=true`**:

```
postgresql://user:pass@host:5432/db?sslmode=require&uselibpqcompat=true
```

Thiếu tham số này thì thư viện `pg` v8 sẽ hiểu `sslmode=require` thành `verify-full` và báo lỗi
`self-signed certificate in certificate chain`.

Không cần chạy migration bằng tay: container tự chạy `prisma migrate deploy` khi khởi động.

---

## Bước 2 — Backend lên Railway

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → chọn
   `ELearning-backend-update`.
2. Railway tự nhận `Dockerfile` ở thư mục gốc và build theo đó.
3. Vào tab **Variables**, thêm các biến (mẫu đầy đủ trong `.env.production.example`):

   | Biến | Giá trị |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `DATABASE_URL` | connection string ở bước 1 |
   | `CLIENT_URL` | tạm để trống, điền ở bước 4 |
   | `JWT_ACCESS_SECRET` | chuỗi ngẫu nhiên mạnh |
   | `JWT_REFRESH_SECRET` | chuỗi ngẫu nhiên **khác** |
   | `CLOUDINARY_CLOUD_NAME` | từ dashboard Cloudinary |
   | `CLOUDINARY_API_KEY` | |
   | `CLOUDINARY_API_SECRET` | |
   | `RATE_LIMIT_MAX` | `1000` |
   | `AUTH_RATE_LIMIT_MAX` | `50` |

   Sinh secret:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```

4. Tab **Settings** → **Networking** → **Generate Domain** để lấy domain public.
5. Kiểm tra: mở `https://<backend>.up.railway.app/health`, phải thấy `{"status":"ok",...}`.

**Nếu dùng Render thay Railway**: New → Web Service → Runtime **Docker**, Health Check Path `/health`,
phần biến môi trường làm y hệt. Lưu ý gói miễn phí của Render **ngủ sau 15 phút không có request** —
request đầu tiên mất 30–60 giây, rất bất tiện khi demo mở bài đầu giờ. Railway không có vấn đề này.

---

## Bước 3 — Frontend lên Vercel

1. [vercel.com](https://vercel.com) → **Add New Project** → import repo `elearning-web`.
2. Vercel tự nhận Vite. Giữ nguyên: Build Command `npm run build`, Output Directory `dist`.
3. **Environment Variables** → thêm:

   ```
   VITE_API_URL = https://<backend>.up.railway.app/api
   ```

   Nhớ **hậu tố `/api`** — thiếu là mọi lời gọi API đều 404.

4. Deploy, lấy domain dạng `https://<tên>.vercel.app`.

File `vercel.json` đã có sẵn rewrite mọi đường dẫn về `index.html`, nên tải thẳng `/classes/abc` hay
F5 giữa chừng không bị 404.

---

## Bước 4 — Nối hai đầu lại

Quay lại Railway, sửa biến `CLIENT_URL` thành domain Vercel rồi để service khởi động lại:

```
CLIENT_URL = https://<tên>.vercel.app
```

Nhiều domain thì ngăn bằng dấu phẩy:

```
CLIENT_URL = https://elearning.vercel.app,https://elearning-git-main.vercel.app
```

Vercel sinh domain preview riêng cho mỗi lần push; nếu cần demo trên bản preview thì thêm domain đó
vào danh sách.

---

## Bước 5 — Tạo dữ liệu demo trên production

Seed chạy từ máy bạn, trỏ vào database production:

```bash
cd d:/GITHUB/ELearning-backend-update
DATABASE_URL="<connection string production>" npm run seed
```

Trên PowerShell:

```powershell
$env:DATABASE_URL="<connection string production>"; npm run seed
```

Sau đó đăng nhập `gv.web@elearning.local` / `123456` để kiểm tra.

> Seed tạo tài khoản mật khẩu `123456`. Nếu hệ thống dùng thật thì phải đổi mật khẩu hoặc xoá các
> tài khoản demo trước.

---

## Kiểm tra sau khi deploy

| # | Việc kiểm | Đạt khi |
| --- | --- | --- |
| 1 | Mở `/health` của backend | trả `{"status":"ok"}` |
| 2 | Đăng nhập trên web production | vào được bảng điều khiển, không lỗi CORS ở Console |
| 3 | Để yên 20 phút rồi thao tác tiếp | không bị đá ra trang đăng nhập (refresh token chạy) |
| 4 | Giảng viên mở bài, sinh viên làm bài | đồng hồ chạy, nộp được, có điểm ngay |
| 5 | Nộp bài thực hành kèm file | file tải lên Cloudinary, mở lại được |
| 6 | Xuất CSV bảng điểm | tải về đúng file, tiếng Việt không lỗi phông |

Mục 3 là phép thử quan trọng nhất: nó xác nhận cookie refresh token đi được giữa hai tên miền khác
nhau (`SameSite=None; Secure`, mã nguồn tự bật khi `NODE_ENV=production`).

---

## Lỗi thường gặp

| Triệu chứng | Nguyên nhân | Cách xử lý |
| --- | --- | --- |
| `blocked by CORS policy` khi đăng nhập | `CLIENT_URL` chưa đúng domain Vercel | Sửa biến ở bước 4, chờ service restart |
| Mọi API trả 404 | `VITE_API_URL` thiếu `/api` | Sửa biến trên Vercel rồi **redeploy** (biến build-time) |
| `self-signed certificate in certificate chain` | Connection string thiếu `uselibpqcompat=true` | Thêm tham số vào `DATABASE_URL` |
| Đăng nhập được nhưng ~15 phút sau bị đá ra | Cookie refresh không qua được cross-site | Kiểm tra `NODE_ENV=production` đã đặt trên Railway |
| Cả lớp đăng nhập thì bị chặn | Rate limit quá chặt cho IP dùng chung | Tăng `AUTH_RATE_LIMIT_MAX` |
| Container khởi động lỗi ở `migrate deploy` | `DATABASE_URL` sai hoặc DB chưa cho kết nối ngoài | Xem log Railway, kiểm tra whitelist IP của DB |
| Upload file thất bại | Thiếu biến Cloudinary | Điền đủ ba biến `CLOUDINARY_*` |

---

## Ghi chú về Dockerfile

```dockerfile
FROM node:20-alpine AS builder      # cài đủ gói, generate Prisma Client, biên dịch TypeScript
FROM node:20-alpine                 # chỉ giữ dist + gói production
CMD prisma migrate deploy && node dist/index.js
```

Ba điểm đã xử lý sẵn, nêu ra để khi sửa không phá nhầm:

1. **`prisma.config.ts` bắt buộc có trong image** — Prisma 7 đọc `DATABASE_URL` từ file này chứ
   không phải từ `schema.prisma` (v7 từ chối khai báo `url` trong khối `datasource`).
2. **Prisma Client được copy từ tầng builder** thay vì generate lại ở tầng runtime, nên lúc build
   image không cần `DATABASE_URL`.
3. **`.dockerignore` loại `node_modules` và `.env`** — vừa tránh lỗi do gói biên dịch cho Windows,
   vừa tránh đóng gói nhầm khoá bí mật vào image.

Dockerfile này **chưa được build thử** vì máy phát triển không cài Docker. Đã kiểm tra được phần suy
luận: mọi package dùng lúc chạy đều nằm ở `dependencies`, và `prisma` CLI cũng vậy nên
`npx prisma migrate deploy` chạy được sau `npm ci --omit=dev`. Muốn chắc chắn:

```bash
docker build -t elearning-api .
docker run -p 5000:5000 --env-file .env elearning-api
```
