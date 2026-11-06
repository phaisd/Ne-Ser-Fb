import { NextResponse } from 'next/server';
import { readLocalJson, writeLocalJson } from '@/services/storageHelper';
import { getAttendanceRecords, saveAttendanceBatch } from '@/services/attendanceService';
import { getStudents, getCourses } from '@/lib/data-store';

export interface QrClassroomSession {
  key: string; // `${courseCode}__${date}`
  courseCode: string;
  courseName: string;
  date: string;
  sessionNumber: number;
  pin: string;
  checkInStatus: 'PRESENT' | 'LATE';
  isOpen: boolean;
  instructorName: string;
  room: string;
  updatedAt: string;
}

const QR_SESSIONS_FILE = 'qr_sessions.json';

function makeSessionKey(courseCode: string, date: string): string {
  return `${courseCode.trim()}__${date.trim()}`;
}

function getDefaultPin(courseCode: string, date: string): string {
  const cleanCode = courseCode.replace(/\D/g, '') || '101';
  const dayPart = (date.split('-')[2] || '01').slice(-2);
  return `${cleanCode.slice(-3)}${dayPart}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseCode = (searchParams.get('courseCode') || '').trim();
    const date = (searchParams.get('date') || new Date().toISOString().split('T')[0]).trim();
    const studentCode = (searchParams.get('studentCode') || '').trim();

    if (!courseCode) {
      return NextResponse.json({ success: false, error: 'กรุณาระบุรหัสวิชา (courseCode)' }, { status: 400 });
    }

    const sessions = readLocalJson<Record<string, QrClassroomSession>>(QR_SESSIONS_FILE, {});
    const key = makeSessionKey(courseCode, date);
    let session = sessions[key];

    if (!session) {
      const courses = await getCourses();
      const matchedCourse = courses.find((c) => c.courseCode === courseCode);
      session = {
        key,
        courseCode,
        courseName: matchedCourse?.courseName || courseCode,
        date,
        sessionNumber: 1,
        pin: getDefaultPin(courseCode, date),
        checkInStatus: 'PRESENT',
        isOpen: true,
        instructorName: matchedCourse?.instructor || 'อาจารย์ประจำวิชา',
        room: matchedCourse?.room || '-',
        updatedAt: new Date().toISOString(),
      };
      sessions[key] = session;
      writeLocalJson(QR_SESSIONS_FILE, sessions);
    }

    // Fetch live attendance records for this course & date
    const records = await getAttendanceRecords(courseCode, date);

    // Optional: if studentCode is passed, look up student info for mobile preview
    let studentInfo: any = null;
    if (studentCode) {
      const allStudents = await getStudents();
      const found = allStudents.find(
        (s) => s.studentCode.trim().toLowerCase() === studentCode.toLowerCase()
      );
      if (found) {
        studentInfo = {
          studentCode: found.studentCode,
          fullName: found.fullName || `${found.title || ''} ${found.firstName} ${found.lastName}`.trim(),
          major: found.major || found.department || 'คณะพุทธศาสตร์',
          yearLevel: found.yearLevel,
        };
      }
    }

    return NextResponse.json({
      success: true,
      session,
      checkedInRecords: records,
      studentInfo,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action || 'STUDENT_CHECKIN';

    const sessions = readLocalJson<Record<string, QrClassroomSession>>(QR_SESSIONS_FILE, {});

    // 1. Instructor updates or opens/closes QR session settings
    if (action === 'UPSERT_SESSION') {
      const courseCode = String(body.courseCode || '').trim();
      const date = String(body.date || new Date().toISOString().split('T')[0]).trim();
      if (!courseCode) {
        return NextResponse.json({ success: false, error: 'กรุณาระบุรหัสวิชา' }, { status: 400 });
      }

      const key = makeSessionKey(courseCode, date);
      const existing = sessions[key];

      const updated: QrClassroomSession = {
        key,
        courseCode,
        courseName: body.courseName || existing?.courseName || courseCode,
        date,
        sessionNumber: Number(body.sessionNumber || existing?.sessionNumber || 1),
        pin: String(body.pin || existing?.pin || getDefaultPin(courseCode, date)).trim().toUpperCase(),
        checkInStatus: body.checkInStatus === 'LATE' ? 'LATE' : 'PRESENT',
        isOpen: body.isOpen !== undefined ? Boolean(body.isOpen) : existing?.isOpen ?? true,
        instructorName: body.instructorName || existing?.instructorName || 'อาจารย์ผู้สอน',
        room: body.room || existing?.room || '-',
        updatedAt: new Date().toISOString(),
      };

      sessions[key] = updated;
      writeLocalJson(QR_SESSIONS_FILE, sessions);

      return NextResponse.json({
        success: true,
        session: updated,
      });
    }

    // 2. Student submits QR check-in from smartphone
    if (action === 'STUDENT_CHECKIN') {
      const courseCode = String(body.courseCode || '').trim();
      const date = String(body.date || new Date().toISOString().split('T')[0]).trim();
      const studentCode = String(body.studentCode || '').trim();
      const inputPin = String(body.pin || '').trim().toUpperCase();
      const customStudentName = String(body.studentName || '').trim();

      if (!courseCode || !studentCode) {
        return NextResponse.json(
          { success: false, error: 'กรุณากรอกรหัสนิสิตให้ครบถ้วน' },
          { status: 400 }
        );
      }

      const key = makeSessionKey(courseCode, date);
      let session = sessions[key];
      if (!session) {
        const courses = await getCourses();
        const matchedCourse = courses.find((c) => c.courseCode === courseCode);
        const defaultPin = getDefaultPin(courseCode, date);
        // On Vercel Serverless, if a student's scan hits a fresh cold instance that hasn't seen
        // the instructor's in-memory/tmp session yet, adopt a valid 4-6 digit PIN from the QR scan
        const resolvedColdPin =
          /^[A-Z0-9]{4,8}$/.test(inputPin) ? inputPin : defaultPin;
        session = {
          key,
          courseCode,
          courseName: matchedCourse?.courseName || courseCode,
          date,
          sessionNumber: 1,
          pin: resolvedColdPin,
          checkInStatus: 'PRESENT',
          isOpen: true,
          instructorName: matchedCourse?.instructor || 'อาจารย์ประจำวิชา',
          room: matchedCourse?.room || '-',
          updatedAt: new Date().toISOString(),
        };
        sessions[key] = session;
        writeLocalJson(QR_SESSIONS_FILE, sessions);
      }

      if (!session.isOpen) {
        return NextResponse.json(
          {
            success: false,
            error: 'อาจารย์ผู้สอนได้ปิดรับการสแกนเช็คชื่อสำหรับคาบเรียนนี้แล้ว',
          },
          { status: 403 }
        );
      }

      if (inputPin !== session.pin.toUpperCase()) {
        return NextResponse.json(
          {
            success: false,
            error: 'รหัสเข้าเรียนประจำคาบ (PIN) ไม่ถูกต้อง กรุณาดูรหัส PIN บนจอโปรเจกเตอร์หน้าห้องเรียน',
          },
          { status: 401 }
        );
      }

      // Check if student already checked in for this course + date
      const existingRecords = await getAttendanceRecords(courseCode, date);
      const alreadyRecord = existingRecords.find(
        (r) => r.studentCode.trim().toLowerCase() === studentCode.toLowerCase()
      );

      if (alreadyRecord) {
        return NextResponse.json({
          success: true,
          alreadyCheckedIn: true,
          record: alreadyRecord,
          message: `รหัสนิสิต ${studentCode} (${alreadyRecord.studentName}) ได้เช็คชื่อในคาบเรียนนี้เรียบร้อยแล้ว`,
        });
      }

      // Look up student full name from database
      const allStudents = await getStudents();
      const matchedStudent = allStudents.find(
        (s) => s.studentCode.trim().toLowerCase() === studentCode.toLowerCase()
      );

      const resolvedName = matchedStudent
        ? matchedStudent.fullName ||
          `${matchedStudent.title || ''} ${matchedStudent.firstName} ${matchedStudent.lastName}`.trim()
        : customStudentName;

      if (!resolvedName) {
        return NextResponse.json(
          {
            success: false,
            requireStudentName: true,
            error: `ไม่พบรหัสนิสิต ${studentCode} ในฐานข้อมูล กรุณาตรวจสอบรหัสนิสิต หรือระบุชื่อ-ฉายา-นามสกุลเพิ่มเติม`,
          },
          { status: 404 }
        );
      }

      const statusToRecord = session.checkInStatus || 'PRESENT';
      const timeStr = new Date().toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const newRecordPayload = {
        courseCode: session.courseCode,
        courseName: session.courseName,
        date: session.date,
        studentCode: matchedStudent ? matchedStudent.studentCode : studentCode,
        studentName: resolvedName,
        status: statusToRecord,
        recordedBy: `สแกน QR ห้องเรียน (${timeStr} น. | คาบที่ ${session.sessionNumber})`,
      };

      await saveAttendanceBatch([newRecordPayload]);

      return NextResponse.json({
        success: true,
        alreadyCheckedIn: false,
        record: {
          ...newRecordPayload,
          createdAt: new Date().toISOString(),
        },
        message: `เช็คชื่อสำเร็จ! บันทึกสถานะ "${
          statusToRecord === 'LATE' ? 'มาสาย (Late)' : 'มาเรียน (Present)'
        }" เรียบร้อยแล้ว`,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
