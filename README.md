# ระบบบริการมหาวิทยาลัยดิจิทัล (Digital University Hub)
### Full-Stack Next.js 16 + Vercel + Tri-Mode Google Sheets (PostgreSQL + Cloud Sheets)

ระบบบริการการศึกษาและบริหารมหาวิทยาลัยดิจิทัลแบบ **Modular Monolith** ที่ออกแบบมาสำหรับ **Vercel Hobby Free Tier** โดยเฉพาะ รองรับ **Multi-Tenancy (`tenantId`)**, สองภาษา **(TH/EN พร้อมวันที่ พ.ศ./ค.ศ.)**, และมีสถาปัตยกรรมข้อมูลยืดหยุ่นสูง **Tri-Mode Google Sheets Data Engine**

---

## 🚀 สถาปัตยกรรม Tri-Mode Data Engine (3 แนวทาง)

1. **[แนวทางที่ 1] Hybrid Auto-Sync (โหมดหลักสำหรับ Vercel + Cloud PostgreSQL):**
   - ใช้ PostgreSQL (Prisma ORM) ทำงานรวดเร็วระดับ Milliseconds และป้องกันความผิดพลาดด้วย ACID Transactions
   - เมื่อเกิด Event สำคัญ (เช่น ยื่นคำร้องใหม่, อนุมัติคำร้อง, จองห้องสำเร็จ) ระบบจะส่งแถวข้อมูล (Append Row) สำเนาไปยัง Google Sheets อัตโนมัติทันที
2. **[แนวทางที่ 2] Import & Export Synchronization:**
   - หน้าจอ Import/Export Center ให้เจ้าหน้าที่ดึงข้อมูลเข้า (Pull/Import) จาก Google Sheets หรือส่งออกข้อมูล (Push/Export) กลับไปยัง Google Sheets ได้ตลอดเวลา (ทะเบียนนิสิต, รายวิชาที่เปิดสอน)
3. **[แนวทางที่ 3] Direct Google Sheets Mode (Standalone Sheets Storage):**
   - สลับระบบมาอ่าน/เขียนตรงกับ Google Sheets API v4 100% ได้ผ่านการตั้งค่า `DATA_SOURCE_MODE=SHEETS` ใน Environment Variables โดยไม่ต้องมี PostgreSQL

---

## 🏛️ 7 โมดูลระบบหลัก (Core Modules)

| โมดูล | คำอธิบายและความสามารถ | เส้นทาง (Route) |
| :--- | :--- | :--- |
| **1. คำร้องและใบรับรอง** | ยื่นขอใบรับรองสถานภาพ, ทรานสคริปต์, หนังสือรับรอง กยศ. อนุมัติ/ปฏิเสธ พิมพ์ฟอร์ม A4 มาตรฐาน พร้อม Verification QR Code | `/certificates`, `/certificates/[id]`, `/admin/requests` |
| **2. จองห้องประชุมออนไลน์** | แคตตาล็อกห้องประชุม ตรวจสอบอุปกรณ์ ปฏิทินตรวจจับและป้องกันการจองเวลาซ้อนทับ (Anti-Double Booking 100%) | `/rooms` |
| **3. เวลาเรียนและสิทธิ์สอบ** | อาจารย์เช็คชื่อรายคาบ, Dynamic Countdown QR Code เช็คชื่อ, คำนวณเกณฑ์สิทธิ์สอบอัตโนมัติ (เกณฑ์ 80%) พร้อมป้ายเตือน | `/attendance` |
| **4. ทะเบียนรายวิชา & หลักสูตร** | จัดการโครงสร้างหลักสูตร TH/EN, รหัสวิชา, หน่วยกิต, และนำเข้าวิชาจาก Google Sheets (แนวทางที่ 2) | `/curriculum` |
| **5. ทะเบียนนิสิต & Sheets Center** | แฟ้มประวัตินิสิต, Import นิสิตใหม่จาก Sheets (Pull) และ Export รายชื่อกลับไปยัง Google Sheets (Push) | `/students` |
| **6. ตารางเรียน-ตารางสอน** | Matrix Grid สองภาษา (TH/EN), ตรวจสอบห้องและคาบชน (Clash Detection), รองรับการสั่งพิมพ์ตาราง | `/timetable` |
| **7. กิจกรรม & E-Certificate** | ลงทะเบียนสัมมนา/จิตอาสา เช็คชื่อสะสมชั่วโมง และออกใบประกาศอิเล็กทรอนิกส์พร้อม Verification Code | `/events` |

---

## 🛠️ โครงสร้างเทคโนโลยี (Tech Stack)

- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI & Components:** React 19, Tailwind CSS v4, Lucide React
- **ORM & Database:** Prisma ORM, PostgreSQL (Neon / Supabase / Vercel Postgres)
- **Google Sheets API:** `googleapis` v4 (Service Account JWT Auth)
- **Validation & QR:** Zod v4, QRCode Generator
- **Localization:** Thai Buddhist Era (พ.ศ. = ค.ศ. + 543) & Western Gregorian (C.E.)

---

## 📦 การติดตั้งและการรันในเครื่อง (Local Setup)

1. **ติดตั้ง Dependencies:**
   ```bash
   npm install
   ```

2. **คัดลอกไฟล์ Environment Variables:**
   ```bash
   cp .env.example .env
   ```

3. **ตั้งค่า Google Sheets API (เมื่อต้องการเชื่อมต่อ Google Sheets จริง):**
   - นำ Service Account Email และ Private Key มาใส่ใน `.env`
   - กำหนด `GOOGLE_SPREADSHEET_ID` ที่สร้างขึ้น
   - แชร์สิทธิ์เข้าถึงชีตให้กับอีเมล Service Account เป็น **Editor**

4. **สร้าง Prisma Client:**
   ```bash
   npx prisma generate
   ```

5. **รันโปรเจกต์:**
   ```bash
   npm run dev
   ```
   เปิดบราวเซอร์ที่: [http://localhost:3000](http://localhost:3000)

6. **ทดสอบ Build สำหรับ Production (Vercel Ready):**
   ```bash
   npm run build
   ```

---

## ☁️ การ Deploy ขึ้น Vercel (Hobby Tier Free)

1. เชื่อมต่อ Git Repository เข้ากับ **Vercel**
2. ในส่วน **Settings > Environment Variables** กำหนดค่าดังนี้:
   - `DATA_SOURCE_MODE` = `HYBRID` (หรือ `SHEETS`)
   - `DATABASE_URL` = `postgresql://...` (จาก Neon.tech ฟรี หรือ Supabase ฟรี)
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` = `your-sa@project.iam.gserviceaccount.com`
   - `GOOGLE_PRIVATE_KEY` = `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n`
   - `GOOGLE_SPREADSHEET_ID` = `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`
   - `NEXT_PUBLIC_APP_URL` = `https://your-app.vercel.app`
3. กด **Deploy** ระบบจะ Build และพร้อมใช้งานได้ทันที 100%
