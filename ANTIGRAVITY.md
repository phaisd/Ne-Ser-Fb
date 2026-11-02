# Antigravity Developer Guide: FB-service-sheets

ยินดีต้อนรับสู่โปรเจกต์ **FB-service-sheets (Faculty of Buddhism Academic & Student Services Portal - Google Sheets Edition)**

เอกสารนี้จัดทำขึ้นเพื่อให้ **Antigravity (และนักพัฒนา)** สามารถเข้าใจโครงสร้างระบบ บริบทข้อมูล และทำงานต่อได้อย่างราบรื่นทันทีเมื่อเปิดเวิร์กสเปซนี้

---

## 1. วัตถุประสงค์ของโปรเจกต์ (Project Overview)
โปรเจกต์นี้แยกออกมาจากระบบหลัก (`FB-service / vibe-framework`) เพื่อให้บริการ 4 ระบบหลักแก่นิสิต คณาจารย์ และเจ้าหน้าที่ โดยมี **Google Sheets** ทำหน้าที่เป็นฐานข้อมูลและแผงควบคุมข้อมูลหลัก:
1. **ระบบทะเบียนนิสิต (Student Directory):** ค้นหาและดูข้อมูลนิสิต 527 รูป/คน
2. **ระบบตารางเรียนและรายวิชาสอน (Courses & Timetable):** ตารางสอนรายสัปดาห์ตามชั้นปี และฐานข้อมูลรายวิชา 213 วิชา
3. **ระบบตรวจเข้าเรียน (Class Attendance Tracking):** เช็คชื่อเข้าชั้นเรียนแบบ Real-time บันทึกส่งตรงเข้า Google Sheets
4. **ระบบหนังสือรับรองและคำร้อง (Certificates & Requests):** ยื่นคำร้องขอหนังสือรับรอง (สภาพนิสิต, วีซ่า, ธนาคาร ฯลฯ) พร้อมระบบติดตามสถานะ

---

## 2. โครงสร้างฐานข้อมูลใน Google Sheets (Tabs & Columns)

Google Spreadsheet เชื่อมต่อผ่าน Google Sheets API v4 ประกอบด้วย 5 แท็บ:

| แท็บ (Tab Name) | คอลัมน์หลัก (Columns) | หน้าที่ |
| :--- | :--- | :--- |
| `Students` | `studentCode`, `title`, `firstName`, `lastName`, `fullName`, `yearLevel`, `degree`, `department`, `major`, `studyStatus`, `faculty`, `phoneNumber`, `email` | ทะเบียนประวัตินิสิต |
| `Courses` | `courseCode`, `courseName`, `courseNameEn`, `credits`, `section`, `term`, `academicYear`, `semester`, `room`, `dayOfWeek`, `startTime`, `endTime` | รายวิชาที่เปิดสอน |
| `Timetables` | `academicYear`, `semester`, `yearLevel`, `timetableTitle`, `courseCode`, `courseName`, `dayOfWeek`, `startTime`, `endTime`, `room`, `instructor`, `periodLabel` | ตารางสอนรายสัปดาห์ |
| `CertificateRequests` | `requestId`, `createdAt`, `studentCode`, `fullName`, `certType`, `degreeLevel`, `major`, `requestPurpose`, `status`, `docNo`, `email`, `phone` | ประวัติและรายการคำร้อง |
| `Attendance` | `recordId`, `courseCode`, `date`, `studentCode`, `studentName`, `status`, `recordedBy`, `createdAt` | บันทึกการเข้าเรียนรายคาบ |

> **หมายเหตุ:** ในโฟลเดอร์ `data/` ได้จัดเตรียมไฟล์ CSV (UTF-8 BOM) และ JSON ของทั้ง 5 ส่วนไว้ครบถ้วน สามารถกด Import เข้า Google Sheets ด้วยตนเอง หรือกดปุ่ม "ซิงค์ข้อมูลเริ่มต้นเข้าสู่ Google Sheets" ในหน้า `/settings` ได้ทันที

---

## 3. สถาปัตยกรรมระบบ (Architecture)

- **Framework:** Next.js 16 (App Router) + Webpack
- **Styling:** Tailwind CSS v4 + Lucide React Icons
- **Data Layer (`src/lib/data-store.ts`):** 
  - มีระบบ **Dual-Mode**: หากมีการกำหนดค่า Google Sheets API ใน `.env.local` ระบบจะเชื่อมต่อ Google Sheets โดยตรงแบบ Real-time
  - หากยังไม่ได้กำหนดค่า ระบบจะทำงานใน **Autonomous Local Mode** โดยอ่าน/เขียนข้อมูลจากไฟล์ในโฟลเดอร์ `data/` ทันที ทำให้เปิดรันและทดสอบระบบได้โดยไม่มี Error
- **Google Sheets Client (`src/lib/google-sheets.ts`):**
  - ใช้ Native Node.js `node:crypto` สร้าง Service Account JWT (RS256) และเรียก Google Sheets REST API v4 โดยตรง ไม่ต้องพึ่งพาแพ็กเกจภายนอกขนาดใหญ่

---

## 4. แผนผังโฟลเดอร์ (Directory Structure)

```
FB-service-sheets/
├── data/                       # ไฟล์ฐานข้อมูลตั้งต้น (JSON & CSV สำหรับ 527 นิสิต, 213 วิชา, ตารางสอน)
│   ├── students.csv / .json
│   ├── courses.csv / .json
│   ├── timetables.csv / .json
│   ├── certificate_requests.csv / .json
│   ├── certificate_types.json
│   └── attendance_records.csv / .json
├── src/
│   ├── app/
│   │   ├── page.tsx            # Dashboard หน้าแรก สรุปสถิติและทางลัดเข้า 4 ระบบ
│   │   ├── layout.tsx          # Root Layout พร้อม Google Fonts Sarabun และ Navbar
│   │   ├── globals.css         # Tailwind CSS v4 setup
│   │   ├── students/page.tsx   # ระบบทะเบียนนิสิต (ค้นหา, กรองชั้นปี, ดู Modal ประวัติ)
│   │   ├── courses/page.tsx    # ระบบตารางเรียนและค้นหารายวิชา
│   │   ├── attendance/page.tsx # ระบบเช็คชื่อเข้าเรียน (มา/สาย/ขาด/ลา, ปุ่มลัด, สถิติสด)
│   │   ├── certificates/page.tsx # ยื่นคำร้องขอหนังสือรับรอง, เช็คสถานะ, แผงจัดการ
│   │   ├── settings/page.tsx   # หน้าตั้งค่า Google Sheets, ตรวจสอบ API, ปุ่ม 1-Click Sync
│   │   └── api/                # API Endpoints (CRUD)
│   ├── components/
│   │   └── Navbar.tsx          # Navigation Bar หลัก
│   └── lib/
│       ├── google-sheets.ts    # REST Client เชื่อมต่อ Google Sheets API v4
│       └── data-store.ts       # Unified Storage Layer (Google Sheets + Local Fallback)
├── .env.example
├── .env.local
├── package.json
└── ANTIGRAVITY.md              # คู่มือสำหรับ Antigravity
```

---

## 5. วิธีการรันโปรเจกต์ (Development & Startup)

โปรเจกต์นี้ตั้งค่าเริ่มต้นรันที่พอร์ต `3020` (เพื่อไม่ให้ชนกับระบบเดิม `FB-service` ที่พอร์ต `3010`):

```bash
# รันโปรเจกต์ในโหมดพัฒนา
npm run dev

# เข้าชมเว็บไซต์ที่
http://localhost:3020
```

---

## 6. คำแนะนำสำหรับ Antigravity เมื่อเข้ามาพัฒนาต่อ
- หากต้องการเพิ่มฟีเจอร์ใหม่ ให้ตรวจสอบโมเดลข้อมูลใน `src/lib/data-store.ts` เป็นหลัก
- API Endpoints ทั้งหมดอยู่ใน `src/app/api/` สามารถเพิ่ม Route Handler ใหม่ได้ตามมาตรฐาน Next.js App Router
- หากผู้ใช้ต้องการให้แก้ไขคอลัมน์ใน Google Sheets ให้ปรับควบคู่กันที่ `src/lib/google-sheets.ts` และ `src/lib/data-store.ts`
