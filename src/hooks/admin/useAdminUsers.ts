'use client';

import { useState, useMemo } from 'react';
import QRCode from 'qrcode';
import { UserAccount, TimetableItem, Course } from '@/types';
import { matchInstructorStrict } from '@/lib/utils';

interface UseAdminUsersOptions {
  isOfficer: boolean;
  loadData: () => Promise<void> | void;
  setActionSuccess: (msg: string | null) => void;
  timetablesList: TimetableItem[];
  coursesList: Course[];
  studentsList?: any[];
  availableAcademicYears?: string[];
}

export function useAdminUsers({
  isOfficer,
  loadData,
  setActionSuccess,
  timetablesList,
  coursesList,
  studentsList = [],
  availableAcademicYears = ['2569'],
}: UseAdminUsersOptions) {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // Auto-Provision Instructors from Timetables States
  const [isScanningInstructors, setIsScanningInstructors] = useState<boolean>(false);
  const [provisionModal, setProvisionModal] = useState<{
    isOpen: boolean;
    totalTimetableInstructors: number;
    existingCount: number;
    newCount: number;
    alreadyExisting: any[];
    candidates: any[];
  }>({
    isOpen: false,
    totalTimetableInstructors: 0,
    existingCount: 0,
    newCount: 0,
    alreadyExisting: [],
    candidates: [],
  });
  const [isSubmittingProvision, setIsSubmittingProvision] = useState<boolean>(false);
  const [showExistingList, setShowExistingList] = useState<boolean>(false);

  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    nameEn: '',
    email: '',
    gmail: '',
    aliasesText: '',
    instructorType: 'อาจารย์ประจำ',
    department: 'คณะพุทธศาสตร์ มจร',
    role: 'INSTRUCTOR' as 'SUPER_ADMIN' | 'ADMIN' | 'OFFICER' | 'INSTRUCTOR',
  });
  const [editUserSaving, setEditUserSaving] = useState(false);

  // Teaching assignment slip & LINE copy state
  const [teachingSlipUser, setTeachingSlipUser] = useState<any | null>(null);
  const [teachingSlipQr, setTeachingSlipQr] = useState<string | null>(null);
  const [copiedLineUserId, setCopiedLineUserId] = useState<string | null>(null);
  const [isBatchTeachingSlipOpen, setIsBatchTeachingSlipOpen] = useState(false);

  const [newUserForm, setNewUserForm] = useState({
    name: '',
    nameEn: '',
    email: '',
    gmail: '',
    instructorType: 'อาจารย์ประจำ',
    department: 'คณะพุทธศาสตร์ มจร',
    role: 'INSTRUCTOR' as 'SUPER_ADMIN' | 'ADMIN' | 'OFFICER' | 'INSTRUCTOR',
    password: 'mcu123456',
  });

  const handleUpdateRole = async (
    userId: string,
    newRole: 'SUPER_ADMIN' | 'ADMIN' | 'OFFICER' | 'INSTRUCTOR'
  ) => {
    if (isOfficer) {
      alert('เจ้าหน้าที่ (OFFICER) ไม่มีสิทธิ์ในการปรับเปลี่ยนระดับสิทธิ์ของผู้ใช้งาน กรุณาติดต่อ Super Admin');
      return;
    }
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-role', userId, newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`อัปเดตบทบาทผู้ใช้งานเป็น ${newRole} สำเร็จ`);
        loadData();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleScanTimetables = async () => {
    setIsScanningInstructors(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scan-timetables' }),
      });
      const data = await res.json();
      if (data.success) {
        setProvisionModal({
          isOpen: true,
          totalTimetableInstructors: data.totalTimetableInstructors || 0,
          existingCount: data.existingCount || 0,
          newCount: data.newCount || 0,
          alreadyExisting: data.alreadyExisting || [],
          candidates: (data.candidates || []).map((c: any) => ({ ...c, selected: true })),
        });
        setShowExistingList(false);
      } else {
        alert('เกิดข้อผิดพลาดในการสแกน: ' + (data.error || 'ไม่สามารถสแกนได้'));
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message);
    } finally {
      setIsScanningInstructors(false);
    }
  };

  const handleToggleCandidateSelect = (idx: number) => {
    setProvisionModal((prev) => {
      const nextCand = [...prev.candidates];
      nextCand[idx] = { ...nextCand[idx], selected: !nextCand[idx].selected };
      return { ...prev, candidates: nextCand };
    });
  };

  const handleUpdateCandidateField = (idx: number, field: string, val: any) => {
    setProvisionModal((prev) => {
      const nextCand = [...prev.candidates];
      nextCand[idx] = { ...nextCand[idx], [field]: val };
      return { ...prev, candidates: nextCand };
    });
  };

  const handleConfirmBatchProvision = async () => {
    const selected = provisionModal.candidates.filter((c) => c.selected);
    if (selected.length === 0) {
      alert('กรุณาเลือกอาจารย์ใหม่อย่างน้อย 1 ท่านเพื่อสร้างบัญชี');
      return;
    }

    setIsSubmittingProvision(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch-provision-instructors',
          candidates: selected,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || `สร้างบัญชีอาจารย์ใหม่สำเร็จ ${data.createdCount} ท่าน`);
        setProvisionModal((prev) => ({ ...prev, isOpen: false }));
        loadData();
      } else {
        alert('เกิดข้อผิดพลาด: ' + (data.error || 'ไม่สามารถสร้างบัญชีได้'));
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message);
    } finally {
      setIsSubmittingProvision(false);
    }
  };

  const handleStartEditUser = (user: UserAccount) => {
    setEditingUser(user);
    setEditUserForm({
      name: user.name || '',
      nameEn: user.nameEn || '',
      email: user.email || '',
      gmail: user.gmail || '',
      aliasesText: Array.isArray(user.aliases) ? user.aliases.join(', ') : '',
      instructorType: user.instructorType || 'อาจารย์ประจำ',
      department: user.department || 'คณะพุทธศาสตร์ มจร',
      role: user.role || 'INSTRUCTOR',
    });
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const primaryEmail = (editUserForm.email || editUserForm.gmail || '').trim();
    if (!primaryEmail) {
      alert('กรุณากรอกอีเมลสำหรับเข้าสู่ระบบ (Gmail หรือ @mcu.ac.th)');
      return;
    }
    setEditUserSaving(true);
    try {
      const aliases = editUserForm.aliasesText
        ? editUserForm.aliasesText.split(',').map((s) => s.trim()).filter(Boolean)
        : (editingUser.aliases || []);

      const roleToSave = isOfficer ? 'INSTRUCTOR' : editUserForm.role;

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-profile',
          userId: editingUser.id,
          updates: {
            ...editUserForm,
            role: roleToSave,
            email: editUserForm.email?.trim() || primaryEmail,
            gmail: editUserForm.gmail?.trim() || (primaryEmail.endsWith('@gmail.com') ? primaryEmail : ''),
            aliases,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`แก้ไขข้อมูลโปรไฟล์และอีเมลของ ${editUserForm.name} สำเร็จ`);
        setEditingUser(null);
        await loadData();
      } else {
        alert(data.error || 'ไม่สามารถแก้ไขข้อมูลได้');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setEditUserSaving(false);
    }
  };

  const handleToggleSuspend = async (userId: string, isSuspended: boolean, userName: string) => {
    const promptMsg = isSuspended
      ? `ยืนยันการปลดระงับการใช้งานบัญชี "${userName}" หรือไม่?`
      : `ยืนยันการระงับการใช้งานบัญชี "${userName}" หรือไม่?\n(ผู้ใช้รายนี้จะไม่สามารถเข้าสู่ระบบได้จนกว่าจะได้รับการปลดระงับ)`;
    if (!confirm(promptMsg)) return;

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle-suspend',
          userId,
          isSuspended: !isSuspended,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(data.message);
        loadData();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการดำเนินการ');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const getCoursesForInstructor = (user: any, filterYear: string = 'ALL', filterSemester: string = 'ALL') => {
    if (!user) return [];

    const matchedTimetables = timetablesList.filter((t) => {
      if (filterYear !== 'ALL' && t.academicYear && String(t.academicYear) !== String(filterYear)) return false;
      if (filterSemester !== 'ALL' && t.semester && String(t.semester) !== String(filterSemester)) return false;
      return matchInstructorStrict(user, t.instructor);
    });

    const matchedCourses = coursesList.filter((c) => {
      if (filterYear !== 'ALL' && c.academicYear && String(c.academicYear) !== String(filterYear)) return false;
      if (filterSemester !== 'ALL' && c.semester && String(c.semester) !== String(filterSemester)) return false;
      return matchInstructorStrict(user, c.instructor);
    });

    const unique: any[] = [];
    const seen = new Set<string>();

    matchedTimetables.forEach((c) => {
      const key = `${c.courseCode}-${c.academicYear || ''}-${c.semester || ''}-${c.dayOfWeek || ''}-${c.startTime || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(c);
      }
    });

    matchedCourses.forEach((c) => {
      const key = `${c.courseCode}-${c.academicYear || ''}-${c.semester || ''}-${c.dayOfWeek || ''}-${c.startTime || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push({
          academicYear: c.academicYear || '2569',
          semester: c.semester || 1,
          yearLevel: c.yearLevel || 1,
          timetableTitle: c.programType === 'ENGLISH' ? 'หลักสูตรนานาชาติ' : 'ภาคภาษาไทย',
          courseCode: c.courseCode,
          courseName: c.courseName,
          dayOfWeek: c.dayOfWeek || 1,
          startTime: c.startTime || '',
          endTime: c.endTime || '',
          room: c.room || '',
          instructor: c.instructor || user.name,
          periodLabel: '',
        });
      }
    });

    return unique;
  };

  const handleOpenTeachingSlip = async (user: any) => {
    setTeachingSlipUser(user);
    try {
      const qrDataUrl = await QRCode.toDataURL('http://localhost:3020/attendance', {
        width: 160,
        margin: 1,
      });
      setTeachingSlipQr(qrDataUrl);
    } catch {
      setTeachingSlipQr(null);
    }
  };

  const generateInstructorLineMessage = (user: any, selectedYear?: string, selectedSemester?: string) => {
    const yearToUse = selectedYear && selectedYear !== 'ALL' ? selectedYear : (availableAcademicYears[0] || '2569');
    const semToUse = selectedSemester && selectedSemester !== 'ALL' ? `ภาคการศึกษาที่ ${selectedSemester} ` : '';
    const courses = getCoursesForInstructor(user, selectedYear, selectedSemester);
    const coursesText = courses.length > 0
      ? courses
          .map(
            (c, i) =>
              `${i + 1}. [${c.courseCode}] ${c.courseName} (ชั้นปีที่ ${c.yearLevel || 1}, ห้อง ${c.room || '-'}, เวลา ${c.startTime || '-'}-${c.endTime || '-'} น.)`
          )
          .join('\n')
      : '• (ไม่พบรายวิชาที่ระบุในตารางสอน หรืออยู่ระหว่างจัดตารางสอน)';

    return `เรียน ${user.name}
คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย

ฝ่ายทะเบียนและวิชาการ ขอแจ้งข้อมูลภาระงานสอนและบัญชีเข้าสู่ระบบตรวจเช็คชื่อนิสิตเข้าชั้นเรียน ${semToUse}ประจำปีการศึกษา ${yearToUse} ดังนี้ครับ:

📚 รายวิชาที่ท่านรับผิดชอบบรรยาย:
${coursesText}

🔑 ข้อมูลเข้าสู่ระบบตรวจเช็คชื่อนิสิต (Attendance System):
• ลิงก์เข้าใช้งาน: http://localhost:3020/attendance
• อีเมลเข้าสู่ระบบ (Username): ${user.email}
• รหัสผ่านเริ่มต้น (Default Password): ${user.defaultPassword || 'mcu123456'}
(หรือสามารถกดปุ่ม "เข้าสู่ระบบด้วย Google / บัญชี มจร." ได้โดยตรงทันที)

* หมายเหตุ: ระบบจำกัดสิทธิ์ให้อาจารย์ตรวจเช็คชื่อได้เฉพาะรายวิชาที่ท่านรับผิดชอบบรรยายเท่านั้น หากพบว่ารายวิชาคลาดเคลื่อน โปรดติดต่อสำนักงานคณะพุทธศาสตร์ครับ`;
  };

  const handleCopyLineTeachingMessage = (user: any, selectedYear?: string, selectedSemester?: string) => {
    const text = generateInstructorLineMessage(user, selectedYear, selectedSemester);
    navigator.clipboard.writeText(text);
    setCopiedLineUserId(user.id);
    setTimeout(() => setCopiedLineUserId(null), 3000);
    alert(`✅ คัดลอกข้อความภาระงานสอนและรหัสผ่านของ "${user.name}" เรียบร้อยแล้ว!\nสามารถนำไปวาง (Paste) ส่งให้อาจารย์ใน LINE ส่วนตัวหรือ LINE กลุ่มได้ทันทีครับ`);
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    if (!confirm(`ยืนยันการรีเซ็ตรหัสผ่านของ "${userName}" เป็น "mcu123456" ใช่หรือไม่?`)) return;
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-password', userId }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`รีเซ็ตรหัสผ่านของ ${userName} เรียบร้อย (รหัสผ่านใหม่: mcu123456)`);
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const primaryEmail = (newUserForm.email || newUserForm.gmail || '').trim();
    if (!newUserForm.name?.trim() || !primaryEmail) {
      alert('กรุณากรอกชื่อ และระบุอีเมลอย่างน้อย 1 ช่องทาง (Gmail หรือ @mcu.ac.th)');
      return;
    }
    try {
      const emailToSave = newUserForm.email?.trim() || primaryEmail;
      const gmailToSave = newUserForm.gmail?.trim() || (primaryEmail.endsWith('@gmail.com') ? primaryEmail : '');
      const roleToSave = isOfficer ? 'INSTRUCTOR' : (newUserForm.role || 'INSTRUCTOR');
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-user',
          userData: {
            ...newUserForm,
            role: roleToSave,
            email: emailToSave,
            gmail: gmailToSave,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`สร้างบัญชีผู้ใช้ [${newUserForm.name}] สำเร็จเรียบร้อย`);
        setIsAddUserOpen(false);
        setNewUserForm({
          name: '',
          nameEn: '',
          email: '',
          gmail: '',
          instructorType: 'อาจารย์ประจำ',
          department: 'คณะพุทธศาสตร์ มจร',
          role: 'INSTRUCTOR',
          password: 'mcu123456',
        });
        loadData();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filteredUsers = useMemo(() => {
    let baseUsers = users;
    if (isOfficer) {
      baseUsers = users.filter(
        (u) =>
          u.role !== 'SUPER_ADMIN' &&
          u.role !== 'ADMIN' &&
          !u.isSuperAdmin &&
          u.email !== 'phaisal.dis@mcu.ac.th'
      );
    }

    if (userRoleFilter === 'STUDENT') {
      const q = userSearch.trim().toLowerCase();
      return (studentsList || [])
        .filter((s) => {
          if (!q) return true;
          return (
            (s.fullName || '').toLowerCase().includes(q) ||
            (s.studentCode || '').toLowerCase().includes(q) ||
            (s.email || '').toLowerCase().includes(q) ||
            (s.major || '').toLowerCase().includes(q) ||
            (s.degree || '').toLowerCase().includes(q)
          );
        })
        .map((s) => ({
          id: s.studentCode || s.id,
          name: s.fullName || `${s.title || ''}${s.firstName || ''} ${s.lastName || ''}`.trim(),
          email: s.email || `${s.studentCode}@mcu.ac.th`,
          gmail: s.gmail || '',
          department: `${s.major || s.faculty || 'คณะพุทธศาสตร์'}${s.degree ? ` (${s.degree})` : ''}`,
          role: 'STUDENT' as any,
          isSuspended: s.studyStatus === 'พ้นสภาพ' || s.isActive === false,
          isActive: s.isActive !== false,
          isSuperAdmin: false,
          studentData: s,
        }));
    }

    return baseUsers.filter((u) => {
      if (userRoleFilter === 'SUSPENDED') {
        if (!u.isSuspended && u.isActive !== false) return false;
      } else if (userRoleFilter === 'SUPER_ADMIN') {
        if (u.role !== 'SUPER_ADMIN' && !u.isSuperAdmin && u.email !== 'phaisal.dis@mcu.ac.th') return false;
      } else if (userRoleFilter !== 'ALL' && u.role !== userRoleFilter) {
        return false;
      }

      if (userSearch.trim()) {
        const q = userSearch.toLowerCase();
        return (
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.gmail?.toLowerCase().includes(q) ||
          u.department?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, studentsList, userRoleFilter, userSearch, isOfficer]);

  return {
    users,
    setUsers,
    filteredUsers,
    userSearch,
    setUserSearch,
    userRoleFilter,
    setUserRoleFilter,
    isAddUserOpen,
    setIsAddUserOpen,
    isScanningInstructors,
    setIsScanningInstructors,
    provisionModal,
    setProvisionModal,
    isSubmittingProvision,
    showExistingList,
    setShowExistingList,
    editingUser,
    setEditingUser,
    editUserForm,
    setEditUserForm,
    editUserSaving,
    teachingSlipUser,
    setTeachingSlipUser,
    teachingSlipQr,
    setTeachingSlipQr,
    copiedLineUserId,
    setCopiedLineUserId,
    isBatchTeachingSlipOpen,
    setIsBatchTeachingSlipOpen,
    newUserForm,
    setNewUserForm,
    handleUpdateRole,
    handleScanTimetables,
    handleToggleCandidateSelect,
    handleUpdateCandidateField,
    handleConfirmBatchProvision,
    handleStartEditUser,
    handleSaveEditUser,
    handleToggleSuspend,
    getCoursesForInstructor,
    handleOpenTeachingSlip,
    generateInstructorLineMessage,
    handleCopyLineTeachingMessage,
    handleResetPassword,
    handleCreateUser,
  };
}
