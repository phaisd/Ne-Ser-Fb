import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import { getTimetables, getInstructors } from '@/lib/data-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'instructors') {
      const instructors = await getInstructors();
      return NextResponse.json({ success: true, count: instructors.length, data: instructors });
    }

    const yearLevel = searchParams.get('yearLevel');
    const day = searchParams.get('day');
    const instructor = searchParams.get('instructor')?.toLowerCase();

    let list = await getTimetables();

    if (yearLevel) {
      const y = parseInt(yearLevel, 10);
      list = list.filter((t) => t.yearLevel === y);
    }

    if (day) {
      const d = parseInt(day, 10);
      list = list.filter((t) => t.dayOfWeek === d);
    }

    if (instructor) {
      list = list.filter((t) => t.instructor?.toLowerCase().includes(instructor));
    }

    return NextResponse.json({ success: true, count: list.length, data: list });
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}
