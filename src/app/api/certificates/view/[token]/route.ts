import { universityStore } from '@/shared/lib/store/university-store';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const req = universityStore.getRequestById(token);

  if (!req) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
  }

  // Redirect to print view if valid
  const url = new URL(`/certificates/${req.id}`, request.url);
  return NextResponse.redirect(url);
}
