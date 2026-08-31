# API Reference — Lop hoc / Bai tap dau gio

Base URL: `http://localhost:5000/api`
Auth: `Authorization: Bearer <accessToken>` (tru cac route auth cong khai).
Response: `{ "success": true, "data": ... }` hoac `{ "success": false, "message": "..." }`.

Vai tro: `STUDENT`, `INSTRUCTOR`, `ADMIN`. "GV" duoi day = INSTRUCTOR phu trach lop hoac ADMIN.

## Auth

| Method | Endpoint | Quyen | Ghi chu |
| --- | --- | --- | --- |
| POST | `/auth/register` | public | `{ email, password, name }` |
| POST | `/auth/login` | public | tra `accessToken`, set cookie `refreshToken` |
| POST | `/auth/refresh-token` | cookie | |
| POST | `/auth/logout` | cookie | |
| GET | `/auth/me` | auth | |

## Lop hoc

| Method | Endpoint | Quyen | Ghi chu |
| --- | --- | --- | --- |
| GET | `/classes` | auth | GV thay lop minh day, SV thay lop minh hoc, admin thay tat ca |
| POST | `/classes` | GV | `{ title, description? }` |
| GET | `/classes/:id` | thanh vien lop | kem danh sach buoi hoc + `isManager` |
| PUT | `/classes/:id` | GV | |
| DELETE | `/classes/:id` | GV | xoa cascade buoi hoc / bai tap |
| GET | `/classes/:id/members` | thanh vien lop | |
| POST | `/classes/:id/members` | GV | `{ email }` hoac `{ userId }` |
| DELETE | `/classes/:id/members/:userId` | GV | |
| POST | `/classes/:id/join` | STUDENT | tu tham gia bang id lop |
| DELETE | `/classes/:id/leave` | auth | |

## Buoi hoc

| Method | Endpoint | Quyen | Ghi chu |
| --- | --- | --- | --- |
| GET | `/classes/:id/sessions` | thanh vien lop | SV khong thay bai `DRAFT` |
| POST | `/classes/:id/sessions` | GV | `{ title, sessionDate, recordLink? }` |
| GET | `/sessions/:id` | thanh vien lop | |
| PUT | `/sessions/:id` | GV | gan `recordLink` sau buoi hoc |
| DELETE | `/sessions/:id` | GV | |

## Bai tap

| Method | Endpoint | Quyen | Ghi chu |
| --- | --- | --- | --- |
| GET | `/sessions/:id/assignments` | thanh vien lop | |
| POST | `/sessions/:id/assignments` | GV | xem payload ben duoi |
| GET | `/assignments/open` | STUDENT | bai dang mo / sap mo trong cac lop cua minh |
| GET | `/assignments/:id` | thanh vien lop | GV thay `correctAnswer`, SV thi khong |
| PUT | `/assignments/:id` | GV | |
| DELETE | `/assignments/:id` | GV | |
| POST | `/assignments/:id/open` | GV | chuyen sang `OPEN`, tu set `openAt`/`closeAt` neu con trong |
| POST | `/assignments/:id/close` | GV | dong bai + auto-submit moi bai dang lam |
| GET | `/assignments/:id/questions` | GV | |
| POST | `/assignments/:id/questions` | GV | them 1 cau |
| PUT | `/assignments/:id/questions` | GV | thay toan bo bo cau hoi |
| PUT | `/questions/:id` | GV | |
| DELETE | `/questions/:id` | GV | |
| GET | `/assignments/:id/submissions` | GV | bang diem (gom ca SV chua nop) + `summary` |
| GET | `/assignments/:id/submissions/export` | GV | tra ve file CSV |

Payload tao bai tap:

```json
{
  "title": "[Bai 1 - Kha] Khoi tao Database va Cau truc bang",
  "description": "Muc tieu:\n...\n\nMo ta:\n...\n\nTieu chi hoan thanh:\n...\n\nDanh gia:\n...",
  "type": "QUIZ",
  "durationMinutes": 10,
  "openAt": "2026-08-25T08:00:00.000Z",
  "closeAt": "2026-08-25T08:10:00.000Z",
  "maxScore": 10,
  "status": "DRAFT",
  "questions": [
    { "question": "HTTP 201 la gi?", "options": ["OK", "Created"], "correctAnswer": 1, "order": 1 }
  ]
}
```

`type: "PRACTICAL"` thi bo `questions` va `durationMinutes`, dung `closeAt` lam deadline.

`description` la de bai dang van ban thuan, giu nguyen xuong dong. Quy uoc cua mon hoc:
Muc tieu -> Mo ta -> Tieu chi hoan thanh -> Danh gia. Giao dien tu in dam cac dong tieu de muc.

## Lam bai va nop bai

| Method | Endpoint | Quyen | Ghi chu |
| --- | --- | --- | --- |
| POST | `/assignments/:id/start` | SV trong lop | tra `{ submission, questions, serverTime }`, server chot `expiresAt` |
| PATCH | `/submissions/:id/answers` | chu bai lam | auto-save `{ answers: { "<questionId>": 0 } }` |
| POST | `/submissions/:id/submit` | chu bai lam | co the gui kem `answers`; quiz duoc cham ngay |
| POST | `/assignments/:id/submit-practical` | SV trong lop | `{ fileUrl?, submitLink? }` (can it nhat 1) |
| GET | `/assignments/:id/my-submission` | SV | trang thai bai lam cua minh |
| GET | `/submissions/me` | auth | tat ca bai lam cua minh |
| GET | `/submissions/:id` | chu bai lam hoac GV | sau khi nop co `details` dung/sai tung cau |
| GET | `/submissions/pending-grading` | GV | bai thuc hanh da nop chua cham |
| PATCH | `/submissions/:id/grade` | GV | `{ score, feedback? }` |

Quy tac thoi gian (server la nguon su that):

- `expiresAt = min(startedAt + durationMinutes, closeAt)` — chot khi bam `start`.
- Auto-save / submit sau `expiresAt` bi tu choi, bai duoc chot voi trang thai `AUTO_SUBMITTED`.
- Job nen chay moi 30 giay tu nop nhung bai het gio, ke ca khi SV dong tab.
- `GET /assignments/:id/submissions` cung quet bai het gio truoc khi tra bang diem.

Trang thai bai lam: `IN_PROGRESS` → `SUBMITTED` (tu nop) hoac `AUTO_SUBMITTED` (het gio) → `GRADED` (GV cham tay).
Quiz duoc cham tu dong ngay khi nop nen `score` co gia tri du status van la `SUBMITTED`/`AUTO_SUBMITTED`.

## Upload

| Method | Endpoint | Quyen | Ghi chu |
| --- | --- | --- | --- |
| POST | `/upload/image` | GV | field `image`, toi da 5MB, chi anh |
| POST | `/upload/submission` | auth | field `file`, toi da 10MB, anh/pdf/zip/doc/ppt/txt |

## Admin

| Method | Endpoint | Ghi chu |
| --- | --- | --- |
| GET | `/admin/stats` | so lieu tong quan |
| GET | `/admin/classes` | tat ca lop |
| GET | `/admin/users` | `?page&limit&search&role` |
| POST | `/admin/users` | tao user kem role |
| PUT | `/admin/users/:id/role` | doi role |

## Tai khoan seed

Chay `npm run seed`. Mat khau chung: `123456`.

- `admin@elearning.local` — ADMIN
- `gv.web@elearning.local` — INSTRUCTOR, phu trach lop "Lap trinh Web"
- `sv01@elearning.local` … `sv10@elearning.local` — STUDENT, da o trong lop

Lop co 3 buoi; buoi 3 co san 1 quiz 5 cau (`DRAFT`, 10 phut) va 1 bai thuc hanh (`OPEN`, deadline 23:59).

## Kiem tra nhanh

```bash
npm run dev      # terminal 1
npm run smoke    # terminal 2: seed lai du lieu roi chay 13 buoc end-to-end
```
