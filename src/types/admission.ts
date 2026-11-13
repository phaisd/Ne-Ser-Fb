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

export interface AdmissionSelectOptionItem {
  id: string;
  value: string;
  label: string;
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

  // Section 1: Overview, Qualifications & Required Docs
  overviewTitle?: string;
  overviewSubtitle?: string;
  qualifications: AdmissionQualificationCard[];
  requiredDocsTitle?: string;
  requiredDocuments: AdmissionRequiredDocItem[];

  // Section 2: Application Form Options
  applyFormTitle?: string;
  applyFormSubtitle?: string;
  showDocumentUploadField: boolean;
  degreeOptions: AdmissionSelectOptionItem[];
  majorOptions: AdmissionSelectOptionItem[];
  studyPlanOptions: AdmissionSelectOptionItem[];
  previousEducationOptions: AdmissionSelectOptionItem[];
  certificationStatement?: string;

  // Section 3: Status Check & Interview Schedule
  statusSectionTitle?: string;
  statusSectionSubtitle?: string;

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
