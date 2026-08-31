import { AssignmentStatus, AssignmentType, PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const DEFAULT_PASSWORD = "123456";
const STUDENT_COUNT = 10;

const atToday = (hours: number, minutes: number) => {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const daysFromToday = (days: number, hours = 8, minutes = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

/**
 * Đề bài thực hành theo cấu trúc chuẩn của môn học:
 * Mục tiêu → Mô tả → Tiêu chí hoàn thành → Đánh giá.
 */
const deBai = (parts: { mucTieu: string; moTa: string; tieuChi: string }) =>
  [
    "Mục tiêu:",
    parts.mucTieu,
    "",
    "Mô tả:",
    parts.moTa,
    "",
    "Tiêu chí hoàn thành:",
    parts.tieuChi,
    "",
    "Đánh giá:",
    "Để hoàn thành bài thực hành, học viên cần:",
    "- Đưa mã nguồn lên GitHub.",
    "- Dán link của repository lên phần nộp bài trên hệ thống.",
  ].join("\n");

const quizQuestions = [
  {
    question: "HTTP status code 201 có ý nghĩa là gì?",
    options: ["OK", "Created", "No Content", "Bad Request"],
    correctAnswer: 1,
  },
  {
    question: "Trong REST, phương thức (method) nào dùng để cập nhật một phần tài nguyên?",
    options: ["GET", "POST", "PATCH", "DELETE"],
    correctAnswer: 2,
  },
  {
    question: "Prisma dùng file nào để định nghĩa model?",
    options: ["prisma.json", "schema.prisma", "models.ts", "database.yml"],
    correctAnswer: 1,
  },
  {
    question: "JWT gồm mấy phần?",
    options: ["2", "3", "4", "5"],
    correctAnswer: 1,
  },
  {
    question: "Middleware trong Express được gọi với các tham số nào?",
    options: ["(req, res)", "(req, res, next)", "(err, req)", "(ctx, next)"],
    correctAnswer: 1,
  },
];

/** Năm bài thực hành của Buổi 1, xếp theo mức độ Khá → Giỏi → Xuất sắc. */
const buoi1Practicals = [
  {
    title: "[Bài 1 - Khá] Khởi tạo Database và Cấu trúc bảng",
    description: deBai({
      mucTieu:
        "Làm quen với cú pháp DDL, tạo Database và bảng có ràng buộc khóa chính, tự tăng.",
      moTa: [
        "Học viên thực hiện tạo một Database tên là LibraryDB.",
        "Tạo bảng Books bên trong cơ sở dữ liệu trên với cấu trúc các cột bao gồm: BookID (kiểu INT, thiết lập Primary Key và Auto Increment), Title (kiểu VARCHAR(255), thiết lập ràng buộc Not Null), Author (kiểu VARCHAR(100)), và PublishedYear (kiểu INT).",
      ].join("\n"),
      tieuChi:
        "Lệnh chạy không lỗi trên MySQL Workbench, bảng được khởi tạo thành công với đúng các ràng buộc cấu trúc cấu hình theo yêu cầu.",
    }),
  },
  {
    title: "[Bài 2 - Khá] Thao tác dữ liệu cơ bản với DML",
    description: deBai({
      mucTieu:
        "Thực hành sử dụng các câu lệnh DML cơ bản trong MySQL để thêm mới, cập nhật và xóa dữ liệu trong bảng.",
      moTa: [
        "Học viên sử dụng bảng Books đã được tạo ở Bài 1 và thực hiện các thao tác dữ liệu sau:",
        "1. Sử dụng lệnh INSERT để thêm cùng lúc 3 dòng dữ liệu mới vào bảng Books.",
        "2. Sử dụng lệnh UPDATE kết hợp với mệnh đề WHERE để cập nhật lại năm xuất bản (PublishedYear) của một cuốn sách cụ thể dựa theo BookID.",
        "3. Sử dụng lệnh DELETE kết hợp với mệnh đề WHERE để xóa một cuốn sách cụ thể khỏi bảng Books.",
        "4. Sử dụng lệnh SELECT để kiểm tra và đối chiếu dữ liệu trước và sau khi thực hiện các thao tác INSERT, UPDATE và DELETE.",
      ].join("\n"),
      tieuChi:
        "Các câu lệnh chạy không lỗi và tác động đúng số dòng dữ liệu mong muốn; kết quả SELECT phản ánh đúng dữ liệu trước và sau mỗi thao tác.",
    }),
  },
  {
    title: "[Bài 3 - Giỏi] Truy vấn dữ liệu với bộ lọc nâng cao",
    description: deBai({
      mucTieu:
        "Sử dụng lệnh SELECT kết hợp mệnh đề WHERE, các toán tử so sánh, logic và từ khóa tìm kiếm tương đối.",
      moTa: [
        "Giả sử bảng Books đã được bổ sung đầy đủ dữ liệu mẫu. Học viên viết các câu lệnh truy vấn để thực hiện các yêu cầu sau:",
        "1. Tìm và hiển thị tất cả các cuốn sách được xuất bản sau năm 2020 (sử dụng toán tử >).",
        "2. Tìm các cuốn sách có tên tác giả là 'Nguyen Van A' HOẶC có tiêu đề sách bắt đầu bằng cụm từ 'Lập trình' (sử dụng toán tử OR và từ khóa LIKE kết hợp ký tự %).",
        "3. Liệt kê danh sách sách và sắp xếp giảm dần theo năm xuất bản, nếu trùng năm thì sắp xếp tăng dần theo tiêu đề, giới hạn chỉ lấy 2 bản ghi đầu tiên (sử dụng ORDER BY và LIMIT).",
      ].join("\n"),
      tieuChi:
        "Câu lệnh truy vấn lọc đúng và đủ các dòng dữ liệu thỏa mãn các điều kiện logic đưa ra.",
    }),
  },
  {
    title: "[Bài 4 - Giỏi] Thay đổi cấu trúc và dọn dẹp Database",
    description: deBai({
      mucTieu:
        "Sử dụng các lệnh DDL nâng cao để can thiệp vào khung cấu trúc bảng và hiểu cách dọn dẹp dữ liệu an toàn.",
      moTa: [
        "Thực hiện các thao tác quản lý cấu trúc trên bảng Books đã có sẵn:",
        "1. Sử dụng lệnh ALTER TABLE với từ khóa ADD COLUMN để bổ sung thêm cột Price (kiểu DECIMAL) vào bảng.",
        "2. Sử dụng lệnh ALTER TABLE với từ khóa MODIFY COLUMN để nâng cấp chiều dài dữ liệu của cột Author từ VARCHAR(100) lên VARCHAR(255).",
        "3. Thực hiện lệnh TRUNCATE TABLE để làm sạch toàn bộ dữ liệu hiện có trong bảng sách, đưa số đếm tự động tăng về ban đầu nhưng vẫn phải giữ lại khung cấu trúc.",
      ].join("\n"),
      tieuChi:
        "Khung bảng được cập nhật chính xác thuộc tính mới sau khi chạy lệnh chỉnh sửa; dữ liệu được xóa trắng hoàn toàn nhưng cấu trúc bảng không bị mất (phân biệt rõ với lệnh DROP).",
    }),
  },
  {
    title: "[Bài 5 - Xuất sắc] Thiết kế mối quan hệ Database hệ thống",
    description: deBai({
      mucTieu:
        "Áp dụng toàn bộ kiến thức tổng hợp để liên kết các bảng thông qua khóa ngoại (Foreign Key) và truy vấn dữ liệu phức hợp.",
      moTa: [
        "Học viên tự thiết kế và xây dựng một database quản lý bán hàng đơn giản gồm 2 bảng có mối quan hệ liên kết với nhau:",
        "1. Bảng Customers: gồm CustomerID (PK, Auto Increment), FullName (Not Null), Email.",
        "2. Bảng Orders: gồm OrderID (PK, Auto Increment), OrderDate (Datetime), và CustomerID đóng vai trò là khóa ngoại (FOREIGN KEY) liên kết chặt chẽ đến cột CustomerID của bảng Customers.",
        "3. Viết lệnh chèn dữ liệu mẫu: thêm 2 khách hàng vào bảng Customers, sau đó thêm 3 đơn hàng vào bảng Orders (trong đó có ít nhất 2 đơn hàng được liên kết với cùng 1 mã khách hàng để kiểm tra tính toàn vẹn).",
        "4. Viết lệnh hiển thị danh sách đơn hàng gồm: Mã đơn hàng, Ngày đặt hàng và Tên khách hàng tương ứng sở hữu đơn hàng đó.",
      ].join("\n"),
      tieuChi:
        "Khóa ngoại được thiết lập chính xác giúp ràng buộc dữ liệu giữa 2 bảng; câu lệnh chèn và truy vấn hiển thị kết quả đồng bộ, logic, không bị lỗi quan hệ.",
    }),
  },
];

const main = async () => {
  const password = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@elearning.local" },
    // Cap nhat lai ten/vai tro de chay lai seed thi du lieu demo hoi tu ve dung khai bao.
    update: { name: "Quản trị viên", role: UserRole.ADMIN },
    create: {
      email: "admin@elearning.local",
      password,
      name: "Quản trị viên",
      role: UserRole.ADMIN,
    },
  });

  const instructor = await prisma.user.upsert({
    where: { email: "gv.web@elearning.local" },
    update: { name: "Nguyễn Văn Giang", role: UserRole.INSTRUCTOR },
    create: {
      email: "gv.web@elearning.local",
      password,
      name: "Nguyễn Văn Giang",
      role: UserRole.INSTRUCTOR,
    },
  });

  const students = [];
  for (let index = 1; index <= STUDENT_COUNT; index += 1) {
    const email = `sv${String(index).padStart(2, "0")}@elearning.local`;
    students.push(
      await prisma.user.upsert({
        where: { email },
        update: { name: `Sinh viên ${String(index).padStart(2, "0")}`, role: UserRole.STUDENT },
        create: {
          email,
          password,
          name: `Sinh viên ${String(index).padStart(2, "0")}`,
          role: UserRole.STUDENT,
        },
      }),
    );
  }

  // Chạy lại seed thì dùng lại lớp cũ để không nhân đôi dữ liệu demo.
  const existingClass = await prisma.class.findFirst({
    where: { title: "Lập trình Web", instructorId: instructor.id },
  });

  const classRoom =
    existingClass ??
    (await prisma.class.create({
      data: {
        title: "Lập trình Web",
        description: "Lớp học lập trình web với Node.js, Express, Prisma và PostgreSQL",
        instructorId: instructor.id,
      },
    }));

  await prisma.classMember.createMany({
    data: students.map((student) => ({ classId: classRoom.id, userId: student.id })),
    skipDuplicates: true,
  });

  await prisma.assignment.deleteMany({ where: { session: { classId: classRoom.id } } });
  await prisma.session.deleteMany({ where: { classId: classRoom.id } });

  const [session1, , session3] = await Promise.all([
    prisma.session.create({
      data: {
        classId: classRoom.id,
        title: "Buổi 1 - SQL & MySQL fundamentals",
        sessionDate: daysFromToday(-14),
        recordLink: "https://example.com/record/buoi-1",
      },
    }),
    prisma.session.create({
      data: {
        classId: classRoom.id,
        title: "Buổi 2 - Node.js fundamentals",
        sessionDate: daysFromToday(-7),
        recordLink: "https://example.com/record/buoi-2",
      },
    }),
    prisma.session.create({
      data: {
        classId: classRoom.id,
        title: "Buổi 3 - Express & Prisma fundamentals",
        sessionDate: daysFromToday(0),
      },
    }),
  ]);

  // Năm bài thực hành của Buổi 1, hạn nộp chung sau 7 ngày.
  for (const [index, practical] of buoi1Practicals.entries()) {
    await prisma.assignment.create({
      data: {
        sessionId: session1.id,
        title: practical.title,
        description: practical.description,
        type: AssignmentType.PRACTICAL,
        openAt: daysFromToday(-14, 8, 0),
        closeAt: daysFromToday(7, 23, 59),
        maxScore: 10,
        status: AssignmentStatus.OPEN,
        createdAt: new Date(Date.now() + index),
      },
    });
  }

  // Bài kiểm tra đầu giờ: giảng viên bấm "Mở bài" trong lúc demo.
  const quiz = await prisma.assignment.create({
    data: {
      sessionId: session3.id,
      title: "Quiz kiểm tra - Buổi 3",
      description: deBai({
        mucTieu:
          "Kiểm tra mức độ nắm kiến thức nền về HTTP, REST, Prisma và Express trước khi vào buổi học.",
        moTa: [
          "Bài gồm 5 câu trắc nghiệm, mỗi câu chỉ có một đáp án đúng.",
          "Thời gian làm bài 10 phút, tính từ lúc học viên bấm nút bắt đầu.",
          "Hệ thống tự lưu bài mỗi 15 giây và tự nộp khi hết giờ.",
        ].join("\n"),
        tieuChi: "Học viên nộp bài trong thời gian quy định và đạt tối thiểu 5/10 điểm.",
      }),
      type: AssignmentType.QUIZ,
      durationMinutes: 10,
      openAt: atToday(8, 0),
      closeAt: atToday(8, 10),
      maxScore: 10,
      status: AssignmentStatus.DRAFT,
      questions: {
        create: quizQuestions.map((question, index) => ({
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          order: index + 1,
        })),
      },
    },
  });

  const practical = await prisma.assignment.create({
    data: {
      sessionId: session3.id,
      title: "[Bài 1 - Khá] Xây dựng REST API CRUD với Prisma",
      description: deBai({
        mucTieu:
          "Vận dụng Express và Prisma để xây dựng một REST API hoàn chỉnh cho một tài nguyên đơn giản.",
        moTa: [
          "Học viên khởi tạo một project Express + Prisma và thực hiện các yêu cầu sau:",
          "1. Định nghĩa model Product trong schema.prisma gồm: id (String, khóa chính, cuid), name (String, bắt buộc), price (Float), createdAt (DateTime, mặc định thời điểm hiện tại). Chạy migration để tạo bảng.",
          "2. Viết đủ 5 endpoint: GET /products (danh sách), GET /products/:id (chi tiết), POST /products (tạo mới), PUT /products/:id (cập nhật), DELETE /products/:id (xóa).",
          "3. Kiểm tra dữ liệu đầu vào bằng Zod: name không được rỗng, price phải lớn hơn 0. Trả về mã lỗi 400 kèm thông báo rõ ràng khi dữ liệu không hợp lệ.",
          "4. Trả về 404 khi không tìm thấy sản phẩm theo id.",
        ].join("\n"),
        tieuChi:
          "Cả 5 endpoint chạy đúng khi kiểm thử bằng Postman; dữ liệu sai bị chặn với mã 400 và id không tồn tại trả về 404 thay vì lỗi 500.",
      }),
      type: AssignmentType.PRACTICAL,
      openAt: atToday(8, 15),
      closeAt: daysFromToday(0, 23, 59),
      maxScore: 10,
      status: AssignmentStatus.OPEN,
    },
  });

  console.log("Seed xong:");
  console.log(`  Admin       : ${admin.email} / ${DEFAULT_PASSWORD}`);
  console.log(`  Giang vien  : ${instructor.email} / ${DEFAULT_PASSWORD}`);
  console.log(`  Sinh vien   : sv01..sv${STUDENT_COUNT} @elearning.local / ${DEFAULT_PASSWORD}`);
  console.log(`  Lop         : ${classRoom.title} (${classRoom.id})`);
  console.log(`  Buoi 1      : ${buoi1Practicals.length} bai thuc hanh (${session1.id})`);
  console.log(`  Quiz (DRAFT): ${quiz.id}`);
  console.log(`  Practical   : ${practical.id}`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
