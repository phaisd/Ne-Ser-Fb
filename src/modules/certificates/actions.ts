'use server';

import { revalidatePath } from 'next/cache';
import { universityStore } from '@/shared/lib/store/university-store';
import { CreateCertificateRequestSchema, ApproveRequestSchema, RejectRequestSchema } from '@/shared/lib/validations';

export async function submitCertificateRequestAction(formData: FormData): Promise<void> {
  try {
    const rawData = {
      tenantId: (formData.get('tenantId') as string) || 'default',
      studentId: formData.get('studentId') as string,
      studentName: formData.get('studentName') as string,
      type: formData.get('type') as any,
      purpose: formData.get('purpose') as string,
      copiesCount: formData.get('copiesCount') || 1,
      deliveryMethod: (formData.get('deliveryMethod') as any) || 'DIGITAL',
    };

    const validated = CreateCertificateRequestSchema.parse(rawData);

    await universityStore.createCertificateRequest({
      tenantId: validated.tenantId,
      studentId: validated.studentId,
      studentName: validated.studentName,
      type: validated.type,
      purpose: validated.purpose,
      copiesCount: validated.copiesCount,
      deliveryMethod: validated.deliveryMethod,
    });

    revalidatePath('/certificates');
    revalidatePath('/admin/requests');
  } catch (error: any) {
    console.error('Error submitting certificate request:', error?.message);
  }
}

export async function approveCertificateRequestAction(formData: FormData): Promise<void> {
  try {
    const requestId = formData.get('requestId') as string;
    const officerNotes = formData.get('officerNotes') as string;
    const approvedById = (formData.get('approvedById') as string) || 'staff-01';

    const validated = ApproveRequestSchema.parse({ requestId, officerNotes, approvedById });

    await universityStore.updateRequestStatus(
      validated.requestId,
      'APPROVED',
      validated.officerNotes,
      undefined,
      validated.approvedById
    );

    revalidatePath('/certificates');
    revalidatePath('/admin/requests');
  } catch (error: any) {
    console.error('Error approving request:', error?.message);
  }
}

export async function rejectCertificateRequestAction(formData: FormData): Promise<void> {
  try {
    const requestId = formData.get('requestId') as string;
    const rejectionReason = formData.get('rejectionReason') as string;
    const officerNotes = formData.get('officerNotes') as string;

    const validated = RejectRequestSchema.parse({ requestId, rejectionReason, officerNotes });

    await universityStore.updateRequestStatus(
      validated.requestId,
      'REJECTED',
      validated.officerNotes,
      validated.rejectionReason
    );

    revalidatePath('/certificates');
    revalidatePath('/admin/requests');
  } catch (error: any) {
    console.error('Error rejecting request:', error?.message);
  }
}
