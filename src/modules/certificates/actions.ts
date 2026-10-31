'use server';

import { revalidatePath } from 'next/cache';
import { universityStore } from '@/shared/lib/store/university-store';
import { CreateCertificateRequestSchema, UpdateCertificateStatusSchema } from '@/shared/lib/validations';

export async function submitCertificateRequestAction(formData: FormData): Promise<void> {
  try {
    const raw = {
      tenantId: (formData.get('tenantId') as string) || undefined,
      userId: (formData.get('userId') as string) || undefined,
      certificateTypeId: formData.get('certificateTypeId') as string,
      studentCode: formData.get('studentCode') as string,
      requesterName: formData.get('requesterName') as string,
      note: formData.get('note') as string,
    };

    const validated = CreateCertificateRequestSchema.parse(raw);

    // Process file attachment (Local / Vercel Serverless Base64 / Cloud)
    let attachmentName: string | undefined;
    let attachmentBase64: string | undefined;

    const file = formData.get('attachmentFile') as File | null;
    if (file && file.size > 0) {
      attachmentName = file.name;
      // Convert to Base64 (Vercel Serverless compatible)
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      attachmentBase64 = `data:${file.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`;
    }

    await universityStore.createCertificateRequest({
      tenantId: validated.tenantId,
      userId: validated.userId,
      certificateTypeId: validated.certificateTypeId,
      studentCode: validated.studentCode,
      requesterName: validated.requesterName,
      note: validated.note,
      attachmentName,
      attachmentBase64,
      attachmentUrl: attachmentBase64 ? `/api/files/download` : undefined,
    });

    revalidatePath('/certificates');
    revalidatePath('/admin/requests');
  } catch (error: any) {
    console.error('Error submitting certificate request:', error?.message);
  }
}

export async function updateCertificateStatusAction(formData: FormData): Promise<void> {
  try {
    const raw = {
      requestId: formData.get('requestId') as string,
      status: formData.get('status') as any,
      reason: (formData.get('reason') as string) || undefined,
    };

    const validated = UpdateCertificateStatusSchema.parse(raw);

    await universityStore.updateCertificateRequestStatus(
      validated.requestId,
      validated.status,
      validated.reason
    );

    revalidatePath('/certificates');
    revalidatePath('/admin/requests');
  } catch (error: any) {
    console.error('Error updating certificate status:', error?.message);
  }
}
