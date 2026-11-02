# FB Academic & Student Services Portal (Google Sheets Edition)

ระบบบริการนิสิตและวิชาการ คณะพุทธศาสตร์ (เชื่อมต่อข้อมูลกับ Google Sheets)

---

## ฟังก์ชันการทำงานหลัก (Features)

1. **ระบบทะเบียนนิสิต (Student Directory):**
   - ฐานข้อมูลนิสิต 527 รูป/คน ค้นหาด้วยรหัสนิสิต หรือชื่อ-สกุล
   - กรองตามชั้นปี (ปี 1–4) สาขาวิชา และดูข้อมูลรายละเอียด
2. **ระบบตารางเรียนและรายวิชาสอน (Courses & Timetable):**
   - ตารางเรียนรายสัปดาห์ตามชั้นปี ห้องเรียน เวลาเรียน และอาจารย์ผู้สอน
   - ฐานข้อมูล 213 รายวิชา ค้นหารหัสวิชาและหน่วยกิต
3. **ระบบตรวจเข้าเรียน (Class Attendance Tracking):**
   - เช็คชื่อเข้าชั้นเรียนแบบเรียลไทม์ (มา / สาย / ขาด / ลา)
   - สรุปสถิติเวลาเรียน และบันทึกลง Google Sheets ทันที
4. **ระบบหนังสือรับรองและคำร้อง (Certificates & Requests):**
   - แบบฟอร์มยื่นขอหนังสือรับรอง (รับรองสภาพนิสิต, ขอวีซ่า, ทรานสคริปต์ ฯลฯ)
   - ค้นหาและตรวจสอบสถานะคำร้อง (รอตรวจสอบ / อนุมัติ / ปฏิเสธ)
   - แผงจัดการคำร้องสำหรับเจ้าหน้าที่
5. **ระบบเชื่อมต่อ Google Sheets:**
   - ตรวจสอบสถานะการเชื่อมต่อ API สด
   - ปุ่มซิงค์ข้อมูลเริ่มต้น (1-Click Initial Sync) ส่งข้อมูลขึ้น Google Sheets ทั้ง 5 แท็บ

---

## วิธีเริ่มต้นใช้งาน (Quick Start)

### 1. ติดตั้งและเริ่มรันโปรเจกต์
```bash
cd F:\FB-service-sheets
npm run dev
```
เปิดบราวเซอร์ไปที่: [http://localhost:3020](http://localhost:3020)

*(โปรเจกต์นี้ตั้งค่าเริ่มต้นรันที่ Port 3020 เพื่อไม่ให้ชนกับระบบเดิม Port 3010)*

### 2. การเชื่อมต่อกับ Google Sheets
1. สร้าง Google Spreadsheet ใหม่ใน Google Drive และสร้าง 5 แท็บ:
   - `Students`
   - `Courses`
   - `Timetables`
   - `CertificateRequests`
   - `Attendance`
2. สร้าง Service Account ใน Google Cloud Console พร้อมเปิดใช้ **Google Sheets API**
3. กดแชร์ (Share) Spreadsheet ให้สิทธิ์ Editor กับอีเมล Service Account
4. ใส่ค่าในไฟล์ `.env.local`:
```env
GOOGLE_SHEET_ID="รหัส_Spreadsheet_ID"
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@xxx.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```
5. เข้าไปที่เมนู **Google Sheets** (`/settings`) ในเว็บไซต์ แล้วกดปุ่ม **"ซิงค์ข้อมูลเริ่มต้นเข้าสู่ Google Sheets ตอนนี้"**

---

## ข้อมูลตั้งต้นที่เตรียมไว้ในโฟลเดอร์ `data/`
- `students.csv` / `students.json` (ข้อมูลนิสิต 527 รูป/คน)
- `courses.csv` / `courses.json` (ข้อมูล 213 รายวิชา)
- `timetables.csv` / `timetables.json` (ข้อมูลตารางสอน 60 ตาราง)
- `certificate_requests.csv` / `certificate_requests.json` (ประวัติคำร้อง 25 รายการ)
- `attendance_records.csv` / `attendance_records.json` (ประวัติการเช็คชื่อ 31 รายการ)
