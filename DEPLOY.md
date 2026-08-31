# Hướng dẫn deploy

Backend lên **Railway** (Docker), frontend lên **Vercel**, database dùng **Aiven/Neon**, file nộp bài
lưu trên **Cloudinary**.

> Deploy backend trước để có URL cho frontend, rồi quay lại điền `CLIENT_URL` cho backend. Bỏ bước
> cuối là đăng nhập bị CORS chặn.

## Chuẩn bị

Hai repo đã ở trên GitHub:

- Backend — `NguyenThaiDung2003/ELearning-backend-update`
- Frontend — `NguyenThaiDung2003/elearning-web`

Connection string của database phải **thêm `uselibpqcompat=true`**, nếu không `pg` v8 sẽ hiểu
`sslmode=require` thành `verify-full` và báo `self-signed certificate in certificate chain`:

```
postgresql://user:pass@host:5432/db?sslmode=require&uselibpqcompat=true
```

Không cần chạy migration bằng tay — container tự chạy `prisma migrate deploy` khi khởi động.

## Bước 1 — Backend lên Railway

[railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → chọn
`ELearning-backend-update`. Railway tự nhận `Dockerfile`.

Tab **Variables**:

| Biến | Giá trị |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | connection string ở trên |
| `CLIENT_URL` | để trống, điền ở bước 3 |
| `JWT_ACCESS_SECRET` | chuỗi ngẫu nhiên mạnh |
| `JWT_REFRESH_SECRET` | chuỗi ngẫu nhiên **khác** |
| `CLOUDINARY_CLOUD_NAME` · `CLOUDINARY_API_KEY` · `CLOUDINARY_API_SECRET` | từ dashboard Cloudinary |
| `TRUST_PROXY` | `1` — thiếu thì rate limit đếm theo IP của proxy, cả lớp dùng chung hạn mức |
| `RATE_LIMIT_MAX` · `AUTH_RATE_LIMIT_MAX` | `1000` · `50` (mặc định, có thể bỏ qua) |

Sinh secret: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`

Sau đó **Settings → Networking → Generate Domain**, rồi mở `https://<backend>.up.railway.app/health`
để kiểm tra, phải trả `{"status":"ok",...}`.


## Bước 2 — Frontend lên Vercel

[vercel.com](https://vercel.com) → **Add New Project** → import `elearning-web`. Vercel tự nhận Vite,
giữ nguyên Build Command và Output Directory.

Thêm biến môi trường:

```
VITE_API_URL = https://<backend>.up.railway.app/api
```

Nhớ **hậu tố `/api`** 
## Bước 3 — Nối hai đầu

Quay lại Railway, đặt `CLIENT_URL` thành domain Vercel rồi để service khởi động lại:

```
CLIENT_URL = https://<tên>.vercel.app
```

Nhiều domain thì ngăn bằng dấu phẩy (Vercel sinh domain preview riêng cho mỗi lần push).

## Bước 4 — Dữ liệu demo

Chạy seed từ máy bạn, trỏ vào database production:

```powershell
$env:DATABASE_URL="<connection string production>"; npm run seed
```

Đăng nhập `gv.web@elearning.local` / `123456` để kiểm tra. Seed đặt mật khẩu `123456` cho mọi tài
khoản — dùng thật thì phải đổi hoặc xoá tài khoản demo.

## Kiểm tra sau khi deploy

1. `/health` trả `{"status":"ok"}`
2. Đăng nhập được, Console không có lỗi CORS
3. **Để yên 20 phút rồi thao tác tiếp** — không bị đá ra trang đăng nhập
4. Giảng viên mở bài → sinh viên làm bài → nộp có điểm ngay
5. Nộp bài thực hành kèm file, mở lại được
6. Xuất CSV bảng điểm, tiếng Việt không lỗi phông

Mục 3 quan trọng nhất: access token chỉ sống 15 phút, nên lỗi cookie refresh chỉ lộ ra sau khoảng
thời gian đó chứ không phải ngay lúc đăng nhập.

## Lỗi thường gặp

| Triệu chứng | Cách xử lý |
| --- | --- |
| `blocked by CORS policy` khi đăng nhập | `CLIENT_URL` chưa đúng domain Vercel |
| Mọi API trả 404 | `VITE_API_URL` thiếu `/api`; sửa xong phải deploy lại |
| `self-signed certificate in certificate chain` | Thiếu `uselibpqcompat=true` trong `DATABASE_URL` |
| Đăng nhập được nhưng ~15 phút sau bị đá ra | Cookie refresh không lưu được — kiểm tra `NODE_ENV=production` và frontend chạy HTTPS |
| Cả lớp đăng nhập thì bị chặn | Đặt `TRUST_PROXY=1`, nếu vẫn thiếu thì tăng `AUTH_RATE_LIMIT_MAX` |
| Container lỗi ở `migrate deploy` | `DATABASE_URL` sai hoặc DB chưa cho kết nối ngoài — xem log Railway |
| Upload file thất bại | Thiếu ba biến `CLOUDINARY_*` |

## Ghi chú về Dockerfile

Hai tầng: builder generate Prisma Client rồi biên dịch TypeScript, tầng chạy chỉ giữ `dist` và gói
production :

1. **`DATABASE_URL` giả lúc build** — `prisma.config.ts` gọi `env("DATABASE_URL")` và ném lỗi nếu
   biến không resolve được, trong khi lúc build image chưa có biến thật. Giá trị giả truyền inline
   nên không dính vào image.
2. **Copy cả `.prisma` lẫn `@prisma/client`** — `@prisma/client` chỉ là lớp vỏ re-export từ
   `.prisma/client`; thiếu thư mục đó thì container chết ngay với *"did not initialize yet"*.
3. **`prisma.config.ts` phải có trong image** — Prisma 7 đọc `DATABASE_URL` từ đó chứ không phải từ
   `schema.prisma`.


