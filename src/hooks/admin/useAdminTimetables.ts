'use client';

import { useState, useMemo } from 'react';
import { TimetableItem } from '@/types';

export interface UseAdminTimetablesOptions {
  timetablesList: TimetableItem[];
}

export function useAdminTimetables({ timetablesList }: UseAdminTimetablesOptions) {
  const [timetableSearch, setTimetableSearch] = useState('');
  const [timetableYearFilter, setTimetableYearFilter] = useState<string>('ALL');
  const [timetableSemesterFilter, setTimetableSemesterFilter] = useState<string>('ALL');
  const [timetableDayFilter, setTimetableDayFilter] = useState<string>('ALL');
  const [timetableMajorFilter, setTimetableMajorFilter] = useState<string>('ALL');
  const [timetableProgramFilter, setTimetableProgramFilter] = useState<string>('ALL');

  // Filter Timetables
  const filteredTimetables = useMemo(() => {
    return timetablesList.filter((t) => {
      if (timetableYearFilter !== 'ALL' && String(t.academicYear) !== String(timetableYearFilter)) {
        return false;
      }
      if (timetableSemesterFilter !== 'ALL' && String(t.semester) !== String(timetableSemesterFilter)) {
        return false;
      }
      if (timetableDayFilter !== 'ALL' && String(t.dayOfWeek) !== String(timetableDayFilter)) {
        return false;
      }
      if (timetableMajorFilter !== 'ALL' && t.major !== timetableMajorFilter) {
        return false;
      }
      if (timetableProgramFilter !== 'ALL') {
        const prog = (t.programType || 'THAI').toUpperCase();
        if (timetableProgramFilter === 'ENGLISH' && prog !== 'ENGLISH') return false;
        if (timetableProgramFilter === 'THAI' && prog === 'ENGLISH') return false;
      }
      if (timetableSearch.trim()) {
        const q = timetableSearch.toLowerCase();
        return (
          t.courseCode?.toLowerCase().includes(q) ||
          t.courseName?.toLowerCase().includes(q) ||
          t.instructor?.toLowerCase().includes(q) ||
          t.room?.toLowerCase().includes(q) ||
          t.major?.toLowerCase().includes(q) ||
          t.degreeLevel?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [
    timetablesList,
    timetableYearFilter,
    timetableSemesterFilter,
    timetableDayFilter,
    timetableMajorFilter,
    timetableProgramFilter,
    timetableSearch,
  ]);

  return {
    timetableSearch,
    setTimetableSearch,
    timetableYearFilter,
    setTimetableYearFilter,
    timetableSemesterFilter,
    setTimetableSemesterFilter,
    timetableDayFilter,
    setTimetableDayFilter,
    timetableMajorFilter,
    setTimetableMajorFilter,
    timetableProgramFilter,
    setTimetableProgramFilter,
    filteredTimetables,
  };
}
