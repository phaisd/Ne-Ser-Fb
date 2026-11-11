import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSignedSessionToken } from '@/lib/auth-security';
import { GET, POST, DELETE } from './route';

vi.mock('@/lib/session-manager', () => ({
  validateUserSession: vi.fn(() => ({ valid: true, conflict: false })),
}));

vi.mock('@/lib/data-store', () => ({
  getCourses: vi.fn(async () => [
    {
      id: 'c-1',
      courseCode: '000101',
      courseName: 'พระพุทธศาสนาเบื้องต้น',
      programType: 'THAI',
      degreeLevel: 'ปริญญาตรี',
      yearLevel: 1,
      semester: 1,
      academicYear: '2569',
      instructor: 'อ.ทดสอบ',
    },
  ]),
  createCourse: vi.fn(async (d: Record<string, unknown>) => ({ id: 'c-new', ...d })),
  updateCourse: vi.fn(async () => null),
  deleteCourse: vi.fn(async () => true),
  importCoursesBatch: vi.fn(async () => ({ added: 1, updated: 0 })),
  cloneCoursesTerm: vi.fn(async () => ({ cloned: 2, skipped: 0 })),
}));

describe('/api/courses route & RBAC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filters courses via GET query parameters', async () => {
    const res = await GET(new Request('http://localhost/api/courses?q=000101'));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.count).toBe(1);
    expect(data.data[0].courseCode).toBe('000101');
  });

  it('rejects non-admin mutations on POST and DELETE, allows ADMIN', async () => {
    const unauth = await POST(
      new Request('http://localhost/api/courses', {
        method: 'POST',
        body: JSON.stringify({ courseCode: '000999', courseName: 'วิชาใหม่' }),
      })
    );
    expect(unauth.status).toBe(401);

    const instToken = createSignedSessionToken({
      id: 'inst-1',
      name: 'อ.ทั่วไป',
      email: 'inst@mcu.ac.th',
      role: 'INSTRUCTOR',
      sessionId: 'sess-1',
    });
    const instPost = await POST(
      new Request('http://localhost/api/courses', {
        method: 'POST',
        headers: { cookie: `mcu_session_token=${encodeURIComponent(instToken)}` },
        body: JSON.stringify({ courseCode: '000999', courseName: 'วิชาใหม่' }),
      })
    );
    expect(instPost.status).toBe(403);

    const adminToken = createSignedSessionToken({
      id: 'admin-1',
      name: 'แอดมิน',
      email: 'admin@mcu.ac.th',
      role: 'ADMIN',
      sessionId: 'sess-2',
    });
    const adminDel = await DELETE(
      new Request('http://localhost/api/courses?id=c-1', {
        method: 'DELETE',
        headers: { cookie: `mcu_session_token=${encodeURIComponent(adminToken)}` },
      })
    );
    expect(adminDel.status).toBe(200);
  });
});
