import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSignedSessionToken } from '@/lib/auth-security';
import { GET, POST } from './route';

vi.mock('@/lib/session-manager', () => ({
  validateUserSession: vi.fn(() => ({ valid: true, conflict: false })),
}));

vi.mock('@/lib/data-store', () => ({
  getCourseEnrollments: vi.fn(async () => [{ courseCode: '000 101', studentCode: '6701001' }]),
  getStudentEnrolledCourses: vi.fn(async () => [{ courseCode: '000 101', studentCode: '6701001' }]),
  enrollStudentToCourse: vi.fn(async (input: Record<string, unknown>) => input),
  removeStudentFromCourse: vi.fn(async () => true),
}));

describe('/api/enrollments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns enrollments by studentCode or courseCode on GET', async () => {
    const res = await GET(new Request('http://localhost/api/enrollments?studentCode=6701001'));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.count).toBe(1);
  });

  it('enforces staff/instructor auth and handles enroll/remove actions on POST', async () => {
    const unauth = await POST(
      new Request('http://localhost/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseCode: '000 101', studentCode: '6701001' }),
      })
    );
    expect(unauth.status).toBe(401);

    const teacherToken = createSignedSessionToken({
      id: 'inst-1',
      name: 'อาจารย์',
      email: 'inst@mcu.ac.th',
      role: 'INSTRUCTOR',
      sessionId: 'sess-inst',
    });

    const enrollRes = await POST(
      new Request('http://localhost/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `mcu_session_token=${encodeURIComponent(teacherToken)}`,
        },
        body: JSON.stringify({ courseCode: '000 101', studentCode: '6701001', studentName: 'สมชาย' }),
      })
    );
    const enrollJson = await enrollRes.json();
    expect(enrollRes.status).toBe(200);
    expect(enrollJson.data.studentCode).toBe('6701001');

    const removeRes = await POST(
      new Request('http://localhost/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `mcu_session_token=${encodeURIComponent(teacherToken)}`,
        },
        body: JSON.stringify({ action: 'remove', courseCode: '000 101', studentCode: '6701001' }),
      })
    );
    const removeJson = await removeRes.json();
    expect(removeRes.status).toBe(200);
    expect(removeJson.success).toBe(true);
  });
});
