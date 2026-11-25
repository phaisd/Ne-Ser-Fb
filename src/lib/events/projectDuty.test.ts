import { describe, it, expect } from 'vitest';
import { hasProjectDuty } from './projectDuty';
import type { AuthUser } from '@/types';

describe('hasProjectDuty', () => {
  const dummyEvents = [
    {
      id: 'evt-1',
      title: 'โครงการปฏิบัติวิปัสสนากัมมัฏฐาน',
      coordinatorName: 'พระมหาชาญชัย ชวนปญฺโญ',
      coordinatorEmail: 'chanchai.cha@mcu.ac.th',
      meditationConfig: {
        groups: [
          {
            groupNumber: 1,
            nameTh: 'กลุ่มที่ 1',
            advisorName: 'พระมหาอาทิตย์ อภิธมฺโม',
          },
        ],
        groupAssignments: {
          '2': {
            groupNumber: 2,
            advisors: ['พระครูสมุห์รัชกฤช ภทฺทปญฺโญ'],
            vipassanaMasters: ['พระอาจารย์มหาเอกสิทธิ์'],
          },
        },
      },
    },
  ];

  it('returns true for ADMIN, SUPER_ADMIN, and OFFICER', () => {
    const admin: AuthUser = { name: 'Admin', email: 'admin@mcu.ac.th', role: 'ADMIN' };
    const superAdmin: AuthUser = { name: 'Super', email: 'super@mcu.ac.th', role: 'SUPER_ADMIN' };
    const officer: AuthUser = { name: 'Officer', email: 'officer@mcu.ac.th', role: 'OFFICER' };
    const acting: AuthUser = { name: 'Teacher Acting', email: 'teacher@mcu.ac.th', role: 'INSTRUCTOR', isActingOfficer: true };

    expect(hasProjectDuty(admin, dummyEvents)).toBe(true);
    expect(hasProjectDuty(superAdmin, dummyEvents)).toBe(true);
    expect(hasProjectDuty(officer, dummyEvents)).toBe(true);
    expect(hasProjectDuty(acting, dummyEvents)).toBe(true);
  });

  it('returns false for regular instructor who does not have project assignment', () => {
    const regularTeacher: AuthUser = {
      name: 'ผศ.พิเศษ ดร.สุภาพรรณ เพิ่มพูน',
      email: 'supapan.per@mcu.ac.th',
      role: 'INSTRUCTOR',
    };
    expect(hasProjectDuty(regularTeacher, dummyEvents)).toBe(false);
  });

  it('returns true if instructor is explicitly assigned as coordinator by email or name', () => {
    const coordinator: AuthUser = {
      name: 'พระมหาชาญชัย ชวนปญฺโญ',
      email: 'chanchai.cha@mcu.ac.th',
      role: 'INSTRUCTOR',
    };
    expect(hasProjectDuty(coordinator, dummyEvents)).toBe(true);
  });

  it('returns true if instructor is assigned as group advisor in meditationConfig.groups', () => {
    const advisorTeacher: AuthUser = {
      name: 'พระมหาอาทิตย์ อภิธมฺโม',
      email: 'arthit.abh@mcu.ac.th',
      role: 'INSTRUCTOR',
    };
    expect(hasProjectDuty(advisorTeacher, dummyEvents)).toBe(true);
  });

  it('returns true if instructor is assigned in groupAssignments advisors or vipassanaMasters', () => {
    const group2Advisor: AuthUser = {
      name: 'พระครูสมุห์รัชกฤช ภทฺทปญฺโญ',
      email: 'ratchakrit.pat@mcu.ac.th',
      role: 'INSTRUCTOR',
    };
    expect(hasProjectDuty(group2Advisor, dummyEvents)).toBe(true);
  });

  it('returns true if instructor has explicit isProjectCoordinator flag', () => {
    const flaggedTeacher = {
      name: 'อาจารย์ผู้ดูแลโครงการ',
      email: 'special.inst@mcu.ac.th',
      role: 'INSTRUCTOR',
      isProjectCoordinator: true,
    } as any;
    expect(hasProjectDuty(flaggedTeacher, [])).toBe(true);
  });

  it('returns true if instructor is registered as COMMITTEE or STAFF in registrationsList', () => {
    const committeeTeacher: AuthUser = {
      name: 'พระอาจารย์ผู้ช่วยงาน',
      email: 'helper@mcu.ac.th',
      role: 'INSTRUCTOR',
    };
    const registrations = [
      {
        id: 'reg-1',
        studentName: 'พระอาจารย์ผู้ช่วยงาน',
        studentCode: 'helper@mcu.ac.th',
        role: 'COMMITTEE',
      },
    ];
    expect(hasProjectDuty(committeeTeacher, dummyEvents, registrations)).toBe(true);
  });
});
