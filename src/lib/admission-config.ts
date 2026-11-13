import { AdmissionPortalConfig } from '@/types';

export const DEFAULT_ADMISSION_PORTAL_CONFIG: AdmissionPortalConfig = {
  showProcessSteps: true,
  showQuickTestBar: true,
  showOverviewTab: true,
  showApplyTab: true,
  showStatusTab: true,
  showRegisterTab: true,

  overviewTitle: 'คุณสมบัติผู้สมัครและเอกสารหลักฐานที่ต้องใช้',
  overviewSubtitle:
    'การรับสมัครคัดเลือกบุคคลเข้าศึกษาในคณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย',
  qualifications: [
    {
      id: 'qual-monk',
      badgeText: '☸️ สำหรับบรรพชิต (พระภิกษุ / สามเณร)',
      themeColor: 'orange',
      enabled: true,
      items: [
        'สำเร็จการศึกษาชั้นมัธยมศึกษาปีที่ 6 (ม.6) หรือเทียบเท่า หรือ',
        'สอบได้เปรียญธรรม 3 ประโยค (ป.ธ.3) ขึ้นไป และสำเร็จการศึกษาชั้น ม.ต้น หรือเทียบเท่า',
        'ระดับปริญญาโท/เอก: สำเร็จการศึกษาปริญญาตรี/โท จากสถาบันการศึกษาที่ ก.พ. หรือมหาวิทยาลัยรับรอง',
        'มีศีลาจารวัตรเรียบร้อย ไม่เป็นผู้ต้องอธิกรณ์หรือถูกถอดถอนจากสมณเพศ',
      ],
    },
    {
      id: 'qual-layman',
      badgeText: '👤 สำหรับคฤหัสถ์ (ประชาชนทั่วไป ชาย-หญิง)',
      themeColor: 'sky',
      enabled: true,
      items: [
        'สำเร็จการศึกษาชั้น ม.6, กศน. ม.ปลาย, ปวช. หรือเทียบเท่า (สำหรับระดับปริญญาตรี พธ.บ.)',
        'สำเร็จการศึกษาระดับปริญญาตรี/โท ทุกสาขาวิชา (สำหรับสมัครระดับปริญญาโท พธ.ม. / ปริญญาเอก พธ.ด.)',
        'มีความประพฤติเรียบร้อย สนใจศึกษาค้นคว้าวิชาการทางพระพุทธศาสนาและปรัชญา',
        'สามารถเลือกเรียนได้ทั้ง ภาคปกติ (จันทร์-พฤหัสบดี) หรือ ภาคพิเศษ (เสาร์-อาทิตย์)',
      ],
    },
    {
      id: 'qual-inter',
      badgeText: '🌐 สำหรับนิสิตชาวต่างชาติ (International)',
      themeColor: 'purple',
      enabled: true,
      items: [
        'Completed High School (Grade 12) or equivalent Dhamma/Monastic examination recognized by MCU',
        'Valid Passport for applying to Non-Immigrant ED Visa',
        'Offers B.A., M.A., and Ph.D. in Buddhist Studies (English / International Program)',
        'เมื่อผ่านการคัดเลือก สามารถขอหนังสือรับรองผู้ผ่านการคัดเลือกเพื่อประกอบการขอวีซ่า (Non-ED) ได้ทันที',
      ],
    },
  ],
  requiredDocsTitle:
    'เอกสารหลักฐานที่ต้องเตรียม (สามารถแนบไฟล์ออนไลน์ในขั้นตอนสมัคร หรือนำมายื่นในวันสัมภาษณ์/รายงานตัว)',
  requiredDocuments: [
    {
      id: 'doc-1',
      title: 'สำเนาใบสุทธิ / บัตรประชาชน / หนังสือเดินทาง (Passport)',
      description:
        'บรรพชิตใช้สำเนาใบสุทธิ • คฤหัสถ์ใช้สำเนาบัตรประชาชน • ต่างชาติใช้สำเนา Passport (จำนวน 2 ชุด)',
      enabled: true,
    },
    {
      id: 'doc-2',
      title: 'สำเนาทะเบียนบ้าน หรือ ทะเบียนวัด',
      description: 'พร้อมรับรองสำเนาถูกต้อง จำนวน 2 ชุด',
      enabled: true,
    },
    {
      id: 'doc-3',
      title: 'สำเนาหลักฐานการศึกษา (รบ. / ปพ.1 / ใบประกาศนียบัตร ป.ธ.)',
      description: 'แสดงผลการเรียนฉบับสมบูรณ์ จำนวน 2 ชุด',
      enabled: true,
    },
    {
      id: 'doc-4',
      title: 'รูปถ่ายหน้าตรง ขนาด 1.5 นิ้ว',
      description:
        'ไม่สวมแว่นตาดำ ถ่ายไว้ไม่เกิน 6 เดือน จำนวน 3 รูป (สำหรับติดใบรายงานตัวนิสิตใหม่)',
      enabled: true,
    },
  ],

  applyFormTitle: 'แบบฟอร์มยื่นใบสมัครเข้าศึกษาออนไลน์ คณะพุทธศาสตร์ มจร',
  applyFormSubtitle:
    'กรอกข้อมูลผู้สมัครให้ครบถ้วน ระบบจะออกรหัสใบสมัครเพื่อใช้ตรวจสอบสถานะและขึ้นทะเบียนนิสิตออนไลน์ทันที',
  showDocumentUploadField: true,
  showGpaField: true,
  showEmailField: true,
  showLineIdField: true,
  applicantTypeOptions: [
    {
      id: 'app-type-monk',
      value: 'MONK',
      label: 'พระภิกษุ / สามเณร (บรรพชิต)',
      enabled: true,
    },
    {
      id: 'app-type-layman',
      value: 'LAYMAN',
      label: 'บุคคลทั่วไป (คฤหัสถ์ ชาย-หญิง)',
      enabled: true,
    },
  ],
  nationalityTypeOptions: [
    {
      id: 'nat-type-thai',
      value: 'THAI',
      label: '🇹🇭 สัญชาติไทย (บัตรประชาชน 13 หลัก)',
      enabled: true,
    },
    {
      id: 'nat-type-inter',
      value: 'INTERNATIONAL',
      label: '🌐 ชาวต่างชาติ / International (Passport No.)',
      enabled: true,
    },
  ],
  programLanguageOptions: [
    {
      id: 'lang-thai',
      value: 'THAI',
      label: '🇹🇭 หลักสูตรภาษาไทย (Thai Program)',
      enabled: true,
    },
    {
      id: 'lang-eng',
      value: 'ENGLISH',
      label: '🌐 หลักสูตรภาษาอังกฤษ (International Program)',
      enabled: true,
    },
  ],
  degreeOptions: [
    {
      id: 'deg-ba',
      value: 'ปริญญาตรี',
      label: 'หลักสูตรพุทธศาสตรบัณฑิต (ปริญญาตรี - พธ.บ.)',
      enabled: true,
    },
    {
      id: 'deg-ma',
      value: 'ปริญญาโท',
      label: 'หลักสูตรพุทธศาสตรมหาบัณฑิต (ปริญญาโท - พธ.ม.)',
      enabled: true,
    },
    {
      id: 'deg-phd',
      value: 'ปริญญาเอก',
      label: 'หลักสูตรพุทธศาสตรดุษฎีบัณฑิต (ปริญญาเอก - พธ.ด.)',
      enabled: true,
    },
    {
      id: 'deg-cert',
      value: 'ประกาศนียบัตร',
      label: 'หลักสูตรประกาศนียบัตรบัณฑิต',
      enabled: true,
    },
  ],
  majorOptions: [
    {
      id: 'maj-1',
      value: 'สาขาวิชาพระพุทธศาสนา (Buddhist Studies)',
      label: 'สาขาวิชาพระพุทธศาสนา (Buddhist Studies)',
      enabled: true,
    },
    {
      id: 'maj-2',
      value: 'สาขาวิชาศาสนาและปรัชญา (Religion and Philosophy)',
      label: 'สาขาวิชาศาสนาและปรัชญา (Religion and Philosophy)',
      enabled: true,
    },
    {
      id: 'maj-3',
      value: 'สาขาวิชาพระไตรปิฎกศึกษา (Tipitaka Studies)',
      label: 'สาขาวิชาพระไตรปิฎกศึกษา (Tipitaka Studies)',
      enabled: true,
    },
    {
      id: 'maj-4',
      value: 'สาขาวิชาวิปัสสนาภาวนา (Vipassana Meditation)',
      label: 'สาขาวิชาวิปัสสนาภาวนา (Vipassana Meditation)',
      enabled: true,
    },
    {
      id: 'maj-5',
      value: 'สาขาวิชาบาลีสันสกฤตและพุทธศาสน์ฮินดู (Pali, Sanskrit & Hindu Studies)',
      label: 'สาขาวิชาบาลีสันสกฤตและพุทธศาสน์ฮินดู (Pali, Sanskrit & Hindu Studies)',
      enabled: true,
    },
    {
      id: 'maj-6',
      value: 'Buddhist Studies (International English Program)',
      label: 'Buddhist Studies (International English Program)',
      enabled: true,
    },
  ],
  studyPlanOptions: [
    {
      id: 'plan-1',
      value: 'ภาคปกติ (วันจันทร์ - วันพฤหัสบดี)',
      label: 'ภาคปกติ (วันจันทร์ - วันพฤหัสบดี)',
      enabled: true,
    },
    {
      id: 'plan-2',
      value: 'ภาคพิเศษ (วันเสาร์ - วันอาทิตย์)',
      label: 'ภาคพิเศษ (วันเสาร์ - วันอาทิตย์)',
      enabled: true,
    },
  ],
  previousEducationOptions: [
    {
      id: 'edu-1',
      value: 'มัธยมศึกษาตอนปลาย (ม.6) หรือเทียบเท่า',
      label: 'มัธยมศึกษาตอนปลาย (ม.6) หรือเทียบเท่า',
      enabled: true,
    },
    {
      id: 'edu-2',
      value: 'กศน. มัธยมศึกษาตอนปลาย',
      label: 'กศน. มัธยมศึกษาตอนปลาย',
      enabled: true,
    },
    {
      id: 'edu-3',
      value: 'ประกาศนียบัตรวิชาชีพ (ปวช.)',
      label: 'ประกาศนียบัตรวิชาชีพ (ปวช.)',
      enabled: true,
    },
    {
      id: 'edu-4',
      value: 'ป.ธ.3 - ป.ธ.9 (เปรียญธรรม 3-9 ประโยค)',
      label: 'ป.ธ.3 - ป.ธ.9 (เปรียญธรรม 3-9 ประโยค)',
      enabled: true,
    },
    {
      id: 'edu-5',
      value: 'ปริญญาตรี หรือเทียบเท่า',
      label: 'ปริญญาตรี หรือเทียบเท่า (สำหรับสมัคร ป.โท)',
      enabled: true,
    },
    {
      id: 'edu-6',
      value: 'ปริญญาโท หรือเทียบเท่า',
      label: 'ปริญญาโท หรือเทียบเท่า (สำหรับสมัคร ป.เอก)',
      enabled: true,
    },
    {
      id: 'edu-7',
      value: 'Foreign High School / Equivalent',
      label: 'Foreign High School / Dhamma Exam Equivalent',
      enabled: true,
    },
  ],
  certificationStatement:
    'ข้าพเจ้าขอรับรองว่าข้อความข้างต้นเป็นความจริงทุกประการ หากตรวจสอบภายหลังพบว่ามีคุณสมบัติไม่ตรงตามที่มหาวิทยาลัยกำหนด ข้าพเจ้ายินยอมให้ตัดสิทธิ์การเข้าศึกษาโดยไม่มีเงื่อนไข',

  statusSectionTitle: 'ตรวจสอบสถานะการสมัคร & ตารางนัดสอบสัมภาษณ์',
  statusSectionSubtitle:
    'กรอกเลขประจำตัวประชาชน 13 หลัก, เลขพาสปอร์ต หรือรหัสใบสมัคร (เช่น MCU-FB-2570-0001)',

  registerSectionTitle: 'ยืนยันสิทธิ์และขึ้นทะเบียนนิสิตใหม่ออนไลน์ (Online Student Enrollment)',
  registerSectionSubtitle:
    'สำหรับผู้สมัครที่ผ่านการสอบสัมภาษณ์แล้ว กรอกเลขบัตรประชาชน/พาสปอร์ต หรือรหัสใบสมัคร เพื่อยืนยันสิทธิ์และสั่งพิมพ์ใบรายงานตัวนิสิตใหม่',
  showFirstYearCoursePlan: true,
  firstYearCourseTitleBachelor: 'รายวิชาแผนการเรียนชั้นปีที่ ๑ ภาคเรียนที่ ๑ (ระดับปริญญาตรี)',
  firstYearCourses: [
    {
      id: 'fyc-1',
      code: '000 101',
      nameTh: 'พระไตรปิฎกศึกษา (Tipitaka Studies)',
      type: 'วิชาแกนพระพุทธศาสนา',
      credits: 3,
      enabled: true,
    },
    {
      id: 'fyc-2',
      code: '000 102',
      nameTh: 'สมาธิและวิปัสสนากรรมฐาน ๑ (Meditation & Vipassana I)',
      type: 'วิชาปฏิบัติธรรม',
      credits: 3,
      enabled: true,
    },
    {
      id: 'fyc-3',
      code: '000 103',
      nameTh: 'ภาษาบาลีเบื้องต้น (Fundamental Pali)',
      type: 'วิชาภาษาโบราณ',
      credits: 3,
      enabled: true,
    },
    {
      id: 'fyc-4',
      code: '000 104',
      nameTh: 'การเขียนเชิงวิชาการทางพระพุทธศาสนา (Buddhist Academic Writing)',
      type: 'วิชาทักษะวิชาการ',
      credits: 3,
      enabled: true,
    },
    {
      id: 'fyc-5',
      code: '101 105',
      nameTh: 'เทศนาและปาฐกถาธรรม (Preaching and Dhamma Lecture)',
      type: 'วิชาชีพพระพุทธศาสนา',
      credits: 2,
      enabled: true,
    },
    {
      id: 'fyc-6',
      code: '101 106',
      nameTh: 'พระพุทธศาสนากับวิทยาศาสตร์และปัญญาประดิษฐ์ (Buddhism, Science & AI)',
      type: 'วิชาบูรณาการสมัยใหม่',
      credits: 3,
      enabled: true,
    },
    {
      id: 'fyc-7',
      code: '000 107',
      nameTh: 'ภาษาอังกฤษเพื่อการสื่อสารทางพระพุทธศาสนา (English for Buddhist Communication)',
      type: 'วิชาภาษาต่างประเทศ',
      credits: 2,
      enabled: true,
    },
  ],
  firstYearCourseTitleMaster: 'รายวิชาแผนการเรียนชั้นปีที่ ๑ ภาคเรียนที่ ๑ (ระดับปริญญาโท)',
  firstYearCoursesMaster: [
    {
      id: 'fyc-m-1',
      code: '600 101',
      nameTh: 'วิธีวิทยาการวิจัยทางพระพุทธศาสนา (Research Methodology in Buddhist Studies)',
      type: 'วิชาแกน',
      credits: 3,
      enabled: true,
    },
    {
      id: 'fyc-m-2',
      code: '600 102',
      nameTh: 'สัมมนาพระไตรปิฎกศึกษา (Seminar on Tipitaka Studies)',
      type: 'วิชาแกน',
      credits: 3,
      enabled: true,
    },
    {
      id: 'fyc-m-3',
      code: '600 103',
      nameTh: 'บาลีไวยากรณ์และวรรณกรรมบาลีชั้นสูง (Advanced Pali Grammar and Literature)',
      type: 'วิชาเอกบังคับ',
      credits: 3,
      enabled: true,
    },
    {
      id: 'fyc-m-4',
      code: '600 104',
      nameTh: 'สมาธิและวิปัสสนาชั้นสูง (Advanced Meditation & Vipassana)',
      type: 'วิชาปฏิบัติการ',
      credits: 2,
      enabled: true,
    },
  ],
  firstYearCourseTitleDoctoral: 'รายวิชาแผนการเรียนชั้นปีที่ ๑ ภาคเรียนที่ ๑ (ระดับปริญญาเอก)',
  firstYearCoursesDoctoral: [
    {
      id: 'fyc-d-1',
      code: '700 101',
      nameTh: 'ระเบียบวิธีวิจัยขั้นสูงทางพระพุทธศาสนา (Advanced Research Methodology in Buddhist Studies)',
      type: 'วิชาสัมมนาขั้นสูง',
      credits: 3,
      enabled: true,
    },
    {
      id: 'fyc-d-2',
      code: '700 102',
      nameTh: 'สัมมนาพุทธปรัชญาและพุทธญาณวิทยา (Seminar on Buddhist Philosophy and Epistemology)',
      type: 'วิชาแกนดุษฎีบัณฑิต',
      credits: 3,
      enabled: true,
    },
    {
      id: 'fyc-d-3',
      code: '700 103',
      nameTh: 'พระพุทธศาสนากับสังคมศาสตร์ร่วมสมัย (Buddhism and Contemporary Social Sciences)',
      type: 'วิชาเอกบังคับ',
      credits: 3,
      enabled: true,
    },
    {
      id: 'fyc-d-4',
      code: '700 104',
      nameTh: 'การปฏิบัติวิปัสสนากรรมฐานระดับดุษฎีบัณฑิต (Doctoral Vipassana Practice)',
      type: 'วิชาปฏิบัติการ',
      credits: 2,
      enabled: true,
    },
  ],
  firstYearCourseTitleCertificate: 'รายวิชาแผนการเรียนชั้นปีที่ ๑ ภาคเรียนที่ ๑ (ระดับประกาศนียบัตรบัณฑิต)',
  firstYearCoursesCertificate: [
    {
      id: 'fyc-c-1',
      code: '500 101',
      nameTh: 'พระไตรปิฎกวิเคราะห์ (Tipitaka Analysis)',
      type: 'วิชาบังคับ',
      credits: 3,
      enabled: true,
    },
    {
      id: 'fyc-c-2',
      code: '500 102',
      nameTh: 'เทคนิคการเผยแผ่พระพุทธศาสนา (Buddhist Propagation Techniques)',
      type: 'วิชาชีพ',
      credits: 3,
      enabled: true,
    },
    {
      id: 'fyc-c-3',
      code: '500 103',
      nameTh: 'ปฏิบัติการเจริญสติภาวนา (Mindfulness & Meditation Workshop)',
      type: 'วิชาปฏิบัติการ',
      credits: 2,
      enabled: true,
    },
    {
      id: 'fyc-c-4',
      code: '500 104',
      nameTh: 'ศาสนาเปรียบเทียบเบื้องต้น (Introduction to Comparative Religion)',
      type: 'วิชาเลือก',
      credits: 3,
      enabled: true,
    },
  ],
};

export function resolveAdmissionPortalConfig(
  raw?: Partial<AdmissionPortalConfig> | null
): AdmissionPortalConfig {
  const c = raw || {};
  return {
    showProcessSteps: c.showProcessSteps !== false,
    showQuickTestBar: c.showQuickTestBar !== false,
    showOverviewTab: c.showOverviewTab !== false,
    showApplyTab: c.showApplyTab !== false,
    showStatusTab: c.showStatusTab !== false,
    showRegisterTab: c.showRegisterTab !== false,
    overviewTitle: c.overviewTitle ?? DEFAULT_ADMISSION_PORTAL_CONFIG.overviewTitle,
    overviewSubtitle: c.overviewSubtitle ?? DEFAULT_ADMISSION_PORTAL_CONFIG.overviewSubtitle,
    qualifications: Array.isArray(c.qualifications)
      ? c.qualifications
      : DEFAULT_ADMISSION_PORTAL_CONFIG.qualifications,
    requiredDocsTitle: c.requiredDocsTitle ?? DEFAULT_ADMISSION_PORTAL_CONFIG.requiredDocsTitle,
    requiredDocuments: Array.isArray(c.requiredDocuments)
      ? c.requiredDocuments
      : DEFAULT_ADMISSION_PORTAL_CONFIG.requiredDocuments,
    applyFormTitle: c.applyFormTitle ?? DEFAULT_ADMISSION_PORTAL_CONFIG.applyFormTitle,
    applyFormSubtitle: c.applyFormSubtitle ?? DEFAULT_ADMISSION_PORTAL_CONFIG.applyFormSubtitle,
    showDocumentUploadField: c.showDocumentUploadField !== false,
    showGpaField: c.showGpaField !== false,
    showEmailField: c.showEmailField !== false,
    showLineIdField: c.showLineIdField !== false,
    applicantTypeOptions: Array.isArray(c.applicantTypeOptions)
      ? c.applicantTypeOptions
      : DEFAULT_ADMISSION_PORTAL_CONFIG.applicantTypeOptions,
    nationalityTypeOptions: Array.isArray(c.nationalityTypeOptions)
      ? c.nationalityTypeOptions
      : DEFAULT_ADMISSION_PORTAL_CONFIG.nationalityTypeOptions,
    programLanguageOptions: Array.isArray(c.programLanguageOptions)
      ? c.programLanguageOptions
      : DEFAULT_ADMISSION_PORTAL_CONFIG.programLanguageOptions,
    degreeOptions: Array.isArray(c.degreeOptions)
      ? c.degreeOptions
      : DEFAULT_ADMISSION_PORTAL_CONFIG.degreeOptions,
    majorOptions: Array.isArray(c.majorOptions)
      ? c.majorOptions
      : DEFAULT_ADMISSION_PORTAL_CONFIG.majorOptions,
    studyPlanOptions: Array.isArray(c.studyPlanOptions)
      ? c.studyPlanOptions
      : DEFAULT_ADMISSION_PORTAL_CONFIG.studyPlanOptions,
    previousEducationOptions: Array.isArray(c.previousEducationOptions)
      ? c.previousEducationOptions
      : DEFAULT_ADMISSION_PORTAL_CONFIG.previousEducationOptions,
    certificationStatement:
      c.certificationStatement ?? DEFAULT_ADMISSION_PORTAL_CONFIG.certificationStatement,
    statusSectionTitle: c.statusSectionTitle ?? DEFAULT_ADMISSION_PORTAL_CONFIG.statusSectionTitle,
    statusSectionSubtitle:
      c.statusSectionSubtitle ?? DEFAULT_ADMISSION_PORTAL_CONFIG.statusSectionSubtitle,
    registerSectionTitle:
      c.registerSectionTitle ?? DEFAULT_ADMISSION_PORTAL_CONFIG.registerSectionTitle,
    registerSectionSubtitle:
      c.registerSectionSubtitle ?? DEFAULT_ADMISSION_PORTAL_CONFIG.registerSectionSubtitle,
    showFirstYearCoursePlan: c.showFirstYearCoursePlan !== false,
    firstYearCourseTitleBachelor:
      c.firstYearCourseTitleBachelor ?? DEFAULT_ADMISSION_PORTAL_CONFIG.firstYearCourseTitleBachelor,
    firstYearCourses: Array.isArray(c.firstYearCourses)
      ? c.firstYearCourses
      : DEFAULT_ADMISSION_PORTAL_CONFIG.firstYearCourses,
    firstYearCourseTitleMaster:
      c.firstYearCourseTitleMaster ?? DEFAULT_ADMISSION_PORTAL_CONFIG.firstYearCourseTitleMaster,
    firstYearCoursesMaster: Array.isArray(c.firstYearCoursesMaster)
      ? c.firstYearCoursesMaster
      : DEFAULT_ADMISSION_PORTAL_CONFIG.firstYearCoursesMaster,
    firstYearCourseTitleDoctoral:
      c.firstYearCourseTitleDoctoral ?? DEFAULT_ADMISSION_PORTAL_CONFIG.firstYearCourseTitleDoctoral,
    firstYearCoursesDoctoral: Array.isArray(c.firstYearCoursesDoctoral)
      ? c.firstYearCoursesDoctoral
      : DEFAULT_ADMISSION_PORTAL_CONFIG.firstYearCoursesDoctoral,
    firstYearCourseTitleCertificate:
      c.firstYearCourseTitleCertificate ??
      DEFAULT_ADMISSION_PORTAL_CONFIG.firstYearCourseTitleCertificate,
    firstYearCoursesCertificate: Array.isArray(c.firstYearCoursesCertificate)
      ? c.firstYearCoursesCertificate
      : DEFAULT_ADMISSION_PORTAL_CONFIG.firstYearCoursesCertificate,
  };
}
