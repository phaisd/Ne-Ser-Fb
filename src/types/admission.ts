export type AdmissionStatus =
  | 'SUBMITTED'
  | 'DOC_VERIFIED'
  | 'INTERVIEW_PASS'
  | 'ENROLLED'
  | 'REJECTED';

export interface AdmissionApplication {
  id: string;
  applicationCode: string; // เช่น MCU-FB-2570-0001
  academicYear: string; // เช่น 2570
  applicantType: 'MONK' | 'LAYMAN'; // บรรพชิต vs คฤหัสถ์
  nationalityType: 'THAI' | 'INTERNATIONAL'; // ไทย vs ต่างชาติ
  citizenId: string; // เลขบัตรประชาชน 13 หลัก หรือ เลขพาสปอร์ต
  passportNo?: string;
  nationality?: string;
  titleName: string; // พระ, พระมหา, พระครู, สามเณร, นาย, นางสาว
  firstName: string;
  lastName: string; // ฉายา หรือ นามสกุล
  monasticName?: string; // ฉายาเพิ่มเติม (ถ้ามี)
  degreeLevel: 'ปริญญาตรี' | 'ปริญญาโท' | 'ปริญญาเอก' | 'ประกาศนียบัตร' | string;
  curriculumName: string; // หลักสูตรพุทธศาสตรบัณฑิต (พธ.บ.) ฯลฯ
  major: string; // สาขาวิชา
  programType: 'THAI' | 'ENGLISH'; // หลักสูตรภาษาไทย vs หลักสูตรภาษาอังกฤษ
  studyPlan: string; // ภาคปกติ / ภาคพิเศษ
  previousEducation: string; // วุฒิการศึกษาเดิมที่ใช้สมัคร
  gpa?: string;
  phone: string;
  email?: string;
  lineId?: string;
  address: string; // ที่อยู่ปัจจุบัน / วัดที่จำพรรษา
  documentUrl?: string; // ลิงก์หรือไฟล์เอกสารแนบเบื้องต้น
  photoUrl?: string;
  status: AdmissionStatus;
  interviewDate?: string; // วัน-เวลาสอบสัมภาษณ์
  interviewRoom?: string; // ห้องสอบสัมภาษณ์ / ลิงก์ออนไลน์
  interviewNote?: string; // หมายเหตุจากเจ้าหน้าที่
  assignedStudentCode?: string; // รหัสนิสิตใหม่เมื่อผ่านการคัดเลือก/ขึ้นทะเบียน
  transferredToRegistry?: boolean; // โอนเข้าทะเบียนนิสิตปัจจุบัน (Students) แล้วหรือยัง
  enrolledAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdmissionQualificationCard {
  id: string;
  badgeText: string;
  themeColor: 'orange' | 'sky' | 'purple' | 'emerald';
  items: string[];
  enabled: boolean;
}

export interface AdmissionRequiredDocItem {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export interface AdmissionApplicationFeeItem {
  id: string;
  degreeLevel: string; // เช่น 'ปริญญาตรี', 'ปริญญาโท', 'ปริญญาเอก', 'ประกาศนียบัตร'
  amount: number; // เช่น 300, 500, 1000 หรือ 0 (ฟรี/ทุน)
  currency?: string; // เช่น 'บาท'
  note?: string; // เช่น 'ชำระในวันสอบสัมภาษณ์ หรือแนบหลักฐานการโอน'
  enabled: boolean;
}

export interface AdmissionSelectOptionItem {
  id: string;
  value: string;
  label: string;
  enabled: boolean;
}

export type DepartmentBannerColorTheme =
  | 'sage' // เขียวเซจ/ธรรมชาติ สบายตา
  | 'emerald' // เขียวมรกตสุขุม
  | 'forest' // เขียวป่าไม้อบอุ่น
  | 'amber' // ส้มทองอำพันพุทธศาสตร์
  | 'indigo' // กรมท่าสงบ สุขุม
  | 'earth'; // เอิร์ธโทน น้ำตาลอบอุ่น

export interface AdmissionDepartmentBannerItem {
  id: string;
  majorName: string; // เช่น สาขาวิชาพระพุทธศาสนา (Buddhist Studies)
  degreeLevel: string; // เช่น พธ.บ. • ปริญญาตรี, พธ.ม. • ปริญญาโท, พธ.ด. • ปริญญาเอก
  tagline: string; // คำโปรย/จุดเด่น
  highlights?: string[]; // จุดเด่นย่อย (2-3 ข้อ)
  colorTheme: DepartmentBannerColorTheme; // โทนสีสบายตา
  customBgGradient?: string; // Gradient เพิ่มเติม (optional)
  bgImageUrl?: string; // รูปภาพพื้นหลัง (optional)
  actionText?: string; // ข้อความปุ่ม (เช่น "สมัครเรียนสาขานี้ →")
  actionType?: 'APPLY_NOW' | 'EXTERNAL_LINK' | 'VIEW_INFO';
  actionUrl?: string; // ลิงก์ภายนอกถ้ามี
  badgeText?: string; // ป้ายกำกับพิเศษ เช่น "🌟 แนะนำ", "เปิดรับ 2570"
  enabled: boolean;
}

export interface AdmissionFirstYearCourseItem {
  id: string;
  code: string;
  nameTh: string;
  type: string;
  credits: number;
  enabled: boolean;
}

export interface AdmissionPortalConfig {
  // Section Visibility on /enroll
  showProcessSteps: boolean;
  showQuickTestBar: boolean;
  showOverviewTab: boolean;
  showApplyTab: boolean;
  showStatusTab: boolean;
  showRegisterTab: boolean;

  // Department Banner Slider (สไลด์แบนเนอร์สาขาวิชาโทนสีสบายตา)
  showDepartmentBannerSlider?: boolean;
  bannerAutoSlideInterval?: number; // วินาที (เช่น 5 วินาที)
  departmentBanners?: AdmissionDepartmentBannerItem[];

  // Section 1: Overview, Qualifications & Required Docs
  overviewTitle?: string;
  overviewSubtitle?: string;
  qualifications: AdmissionQualificationCard[];
  requiredDocsTitle?: string;
  requiredDocuments: AdmissionRequiredDocItem[];

  // Application Fees Configuration
  showApplicationFee?: boolean;
  applicationFeeTitle?: string;
  applicationFeeSubtitle?: string;
  applicationFeeBankInfo?: string;
  applicationFees?: AdmissionApplicationFeeItem[];

  // Section 2: Application Form Options
  applyFormTitle?: string;
  applyFormSubtitle?: string;
  showDocumentUploadField: boolean;
  showGpaField?: boolean;
  showEmailField?: boolean;
  showLineIdField?: boolean;
  applicantTypeOptions?: AdmissionSelectOptionItem[];
  nationalityTypeOptions?: AdmissionSelectOptionItem[];
  programLanguageOptions?: AdmissionSelectOptionItem[];
  degreeOptions: AdmissionSelectOptionItem[];
  majorOptions: AdmissionSelectOptionItem[];
  studyPlanOptions: AdmissionSelectOptionItem[];
  previousEducationOptions: AdmissionSelectOptionItem[];
  certificationStatement?: string;

  // Section 3: Status Check & Interview Schedule
  statusSectionTitle?: string;
  statusSectionSubtitle?: string;
  showPassedInterviewRoster?: boolean; // เปิด/ปิด การแสดงประกาศรายชื่อผู้ผ่านการสอบสัมภาษณ์
  passedInterviewNoticeTitle?: string; // เช่น "ประกาศรายชื่อผู้ผ่านการสอบสัมภาษณ์ และขั้นตอนการขึ้นทะเบียนนิสิต"
  passedInterviewNoticeText?: string; // คำแนะนำขั้นตอนสำหรับผู้ผ่านสัมภาษณ์
  registrarOfficeName?: string; // เช่น "สำนักทะเบียนและวัดผล มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย"
  registrarOfficeContact?: string; // เช่น "อาคารสำนักงานอธิการบดี / อาคารเรียนรวม โทร. 035-248-000 ต่อ 8100"
  registrarWebsiteUrl?: string; // ลิงก์ระบบสำนักทะเบียน เช่น "https://reg.mcu.ac.th"

  // Section 4: Registration & First-Year Plan
  registerSectionTitle?: string;
  registerSectionSubtitle?: string;
  showFirstYearCoursePlan: boolean;
  firstYearCourseTitleBachelor?: string;
  firstYearCourses: AdmissionFirstYearCourseItem[];
  firstYearCourseTitleMaster?: string;
  firstYearCoursesMaster?: AdmissionFirstYearCourseItem[];
  firstYearCourseTitleDoctoral?: string;
  firstYearCoursesDoctoral?: AdmissionFirstYearCourseItem[];
  firstYearCourseTitleCertificate?: string;
  firstYearCoursesCertificate?: AdmissionFirstYearCourseItem[];
}
