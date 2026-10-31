'use server';

import { revalidatePath } from 'next/cache';
import { universityStore } from '@/shared/lib/store/university-store';
import { googleSheetsService } from '@/shared/lib/google-sheets/service';

export async function importStudentsCsvAction(formData: FormData): Promise<void> {
  try {
    const csvContent = formData.get('csvContent') as string;
    if (!csvContent) return;

    const lines = csvContent
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const rows = lines.map((l) => l.split(',').map((c) => c.trim().replace(/^"|"$/g, '')));
    await universityStore.importStudentsFromRows(rows);

    revalidatePath('/students');
    revalidatePath('/admin/sync');
  } catch (error: any) {
    console.error('Error importing students CSV:', error?.message);
  }
}

export async function importCoursesCsvAction(formData: FormData): Promise<void> {
  try {
    const csvContent = formData.get('csvContent') as string;
    if (!csvContent) return;

    const lines = csvContent
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const rows = lines.map((l) => l.split(',').map((c) => c.trim().replace(/^"|"$/g, '')));

    for (const r of rows) {
      if (!r[0] || r[0].toLowerCase().includes('course') || r[0].toLowerCase().includes('รหัส')) {
        continue;
      }
      try {
        await universityStore.addCourse({
          tenantId: 'a0000000-0000-0000-0000-000000000001',
          courseCode: r[0],
          courseName: r[1] || 'ชื่อวิชา',
          courseNameEn: null,
          credits: parseInt(r[2], 10) || 3,
          section: r[3] || '1',
          term: r[4] || '1/2569',
          academicYear: '2569',
          semester: 1,
          room: r[5] || 'ห้องบรรยาย',
          dayOfWeek: parseInt(r[6], 10) || 1,
          startTime: r[7] || '09:00',
          endTime: r[8] || '12:00',
          targetSessions: 16,
          calculationRules: { lateCountsAsFull: true, minPercent: 80.0 },
        });
      } catch {
        // ignore duplicate
      }
    }

    revalidatePath('/curriculum');
    revalidatePath('/timetable');
    revalidatePath('/admin/sync');
  } catch (error: any) {
    console.error('Error importing courses CSV:', error?.message);
  }
}

export async function exportExamEligibilityToSheetsAction(): Promise<void> {
  try {
    const enrollments = universityStore.getEnrollments();
    const headers = [
      'EnrollmentID',
      'StudentCode',
      'StudentName',
      'CourseCode',
      'CourseName',
      'TargetSessions',
      'PresentCount',
      'LateCount',
      'LeaveCount',
      'AbsentCount',
      'AttendanceScorePercent',
      'ExamEligibilityStatus',
      'ExportedAt',
    ];

    const dataRows = enrollments.map((enr) => [
      enr.id,
      enr.studentCode || '',
      enr.studentName || '',
      enr.courseCode || '',
      enr.courseName || '',
      16,
      enr.presentCount || 0,
      enr.lateCount || 0,
      enr.leaveCount || 0,
      enr.absentCount || 0,
      `${enr.attendancePercent || 0}%`,
      enr.isEligible ? 'ELIGIBLE (มีสิทธิ์สอบ)' : 'INELIGIBLE (หมดสิทธิ์สอบ)',
      new Date().toISOString(),
    ]);

    await googleSheetsService.batchSync(undefined, 'Exam_Eligibility_Report', [headers, ...dataRows], true);
    revalidatePath('/attendance');
    revalidatePath('/admin/sync');
  } catch (error: any) {
    console.error('Error exporting exam eligibility to sheets:', error?.message);
  }
}

export async function exportEventParticipantsToSheetsAction(): Promise<void> {
  try {
    const regs = universityStore.getEventRegistrations();
    const headers = [
      'RegistrationID',
      'EventTitle',
      'ParticipantName',
      'GroupNumber',
      'GroupName',
      'AttendedStatus',
      'CertificateCode',
      'ExportedAt',
    ];

    const dataRows = regs.map((r) => [
      r.id,
      r.eventTitle || '',
      r.participantName,
      r.groupNumber || 1,
      r.groupName || '',
      r.attendedAt ? 'COMPLETED (สำเร็จการอบรม)' : 'REGISTERED (ลงทะเบียนแล้ว)',
      r.certCode || '',
      new Date().toISOString(),
    ]);

    await googleSheetsService.batchSync(undefined, 'Event_Participants_Report', [headers, ...dataRows], true);
    revalidatePath('/events');
    revalidatePath('/admin/sync');
  } catch (error: any) {
    console.error('Error exporting event participants to sheets:', error?.message);
  }
}
