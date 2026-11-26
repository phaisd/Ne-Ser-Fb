'use client';

import { useState, useMemo } from 'react';
import { AttendanceRecord } from '@/types';

export interface UseAdminAttendanceOptions {
  attendanceList: AttendanceRecord[];
}

export function useAdminAttendance({ attendanceList }: UseAdminAttendanceOptions) {
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState<string>('ALL');

  // Filter Attendance
  const filteredAttendance = useMemo(() => {
    return attendanceList.filter((a) => {
      if (attendanceStatusFilter !== 'ALL' && a.status !== attendanceStatusFilter) return false;
      if (attendanceSearch.trim()) {
        const q = attendanceSearch.toLowerCase();
        return (
          a.courseCode?.toLowerCase().includes(q) ||
          a.studentCode?.toLowerCase().includes(q) ||
          a.studentName?.toLowerCase().includes(q) ||
          a.recordedBy?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [attendanceList, attendanceStatusFilter, attendanceSearch]);

  return {
    attendanceSearch,
    setAttendanceSearch,
    attendanceStatusFilter,
    setAttendanceStatusFilter,
    filteredAttendance,
  };
}
