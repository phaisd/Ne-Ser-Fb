export type Language = 'th' | 'en';

export const translations = {
  th: {
    // Navbar
    portalTitle: 'ระบบบริการการศึกษา',
    adminTitle: 'Admin Console หลังบ้าน',
    facultyTitle: 'คณะพุทธศาสตร์',
    universityTitle: 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย',
    navHome: 'หน้าแรกบริการ',
    navCertificates: 'ยื่นคำร้องขอหนังสือรับรอง',
    navCourses: 'ตารางเรียนและรายวิชา',
    navStudents: 'ค้นหาทะเบียนนิสิต',
    navAdmin: 'ภาพรวม & อนุมัติคำร้อง',
    navAttendance: 'ตรวจเข้าเรียน',
    navSettings: 'ตั้งค่าระบบ',
    loginBtn: 'เข้าสู่ระบบ',
    logoutBtn: 'ออกจากระบบ',
    backToHome: 'หน้าแรก',
    backToAdmin: 'หลังบ้าน',

    // Status
    statusPending: 'รอดำเนินการ',
    statusApproved: 'อนุมัติแล้ว',
    statusRejected: 'ไม่อนุมัติ',

    // Certificate Actions
    printDoc: 'สั่งพิมพ์เอกสาร (Print)',
    downloadPdf: 'ดาวน์โหลด PDF (Download)',
    previewDoc: 'ตรวจดูตัวอย่างเอกสาร',
    selectTemplate: 'เลือกรูปแบบเอกสาร',
    fontSmall: 'ลดขนาด',
    fontLarge: 'เพิ่มขนาด',
    lineSpacing: 'ระยะบรรทัด',
    signaturePosition: 'ตำแหน่งลายเซ็น',
    togglePhoto: 'กรอบรูปถ่าย',
    toggleStudentSign: 'ช่องเซ็นชื่อนิสิต',
    editableNotice: '💡 สามารถคลิกบนข้อความในเอกสารเพื่อพิมพ์แก้ไขคำได้โดยตรงก่อนพิมพ์หรือโหลด PDF',

    // Templates
    tplThaiStandard: 'หนังสือรับรองนิสิต (ภาษาไทย มีรูปถ่าย)',
    tplBankLetter: 'หนังสือขอความอนุเคราะห์ธนาคาร (เปิดบัญชี / Mobile Banking)',
    tplEnglishCert: 'หนังสือรับรองภาษาอังกฤษ (TO WHOM IT MAY CONCERN)',
    tplInternalMemo: 'บันทึกข้อความราชการ (มีตราครุฑ)',

    // Archiving
    academicYear: 'ปีการศึกษา',
    allYears: 'ปีการศึกษาทั้งหมด',
    archiveYearBtn: 'ปิดยอดปีการศึกษา',
    archiveModalTitle: 'สรุปปิดยอดและจัดเก็บประวัติปีการศึกษา',

    // Notification
    notifySent: 'ส่งการแจ้งเตือนสำเร็จ',
  },
  en: {
    // Navbar
    portalTitle: 'Academic Services Portal',
    adminTitle: 'Admin Console',
    facultyTitle: 'Faculty of Buddhism',
    universityTitle: 'Mahachulalongkornrajavidyalaya University',
    navHome: 'Home',
    navCertificates: 'Request Certificate',
    navCourses: 'Course Schedule',
    navStudents: 'Student Directory',
    navAdmin: 'Overview & Approval',
    navAttendance: 'Attendance Check',
    navSettings: 'System Settings',
    loginBtn: 'Sign In',
    logoutBtn: 'Sign Out',
    backToHome: 'Public Portal',
    backToAdmin: 'Admin Portal',

    // Status
    statusPending: 'Pending',
    statusApproved: 'Approved',
    statusRejected: 'Rejected',

    // Certificate Actions
    printDoc: 'Print Document',
    downloadPdf: 'Download PDF',
    previewDoc: 'Preview Document',
    selectTemplate: 'Select Template',
    fontSmall: 'Smaller',
    fontLarge: 'Larger',
    lineSpacing: 'Line Spacing',
    signaturePosition: 'Signature Offset',
    togglePhoto: 'Photo Box',
    toggleStudentSign: 'Student Signature',
    editableNotice: '💡 You can click directly on any text below to edit before printing or downloading PDF',

    // Templates
    tplThaiStandard: 'Standard Student Certificate (Thai with Photo)',
    tplBankLetter: 'Bank Facilitation Letter (Account / Mobile Banking)',
    tplEnglishCert: 'English Certificate (TO WHOM IT MAY CONCERN)',
    tplInternalMemo: 'Internal Official Memorandum',

    // Archiving
    academicYear: 'Academic Year',
    allYears: 'All Academic Years',
    archiveYearBtn: 'Archive Academic Year',
    archiveModalTitle: 'Academic Year Summary & Archiving',

    // Notification
    notifySent: 'Notification sent successfully',
  }
};
