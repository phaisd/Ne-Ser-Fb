export type CertRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface CertificateRequest {
  id: string;
  createdAt: string;
  studentCode: string;
  fullName: string;
  certType: string;
  degreeLevel?: string;
  major?: string;
  requestPurpose?: string;
  status: CertRequestStatus;
  docNo?: string;
  email?: string;
  phone?: string;
  note?: string;
  rejectReason?: string;
  enrollmentSlipUrl?: string;
  passportCopyUrl?: string;
  photoUrl?: string;
  attachmentUrl?: string;
  targetAudience?: 'THAI' | 'INTERNATIONAL' | 'ALL';
  age?: number | string;
  gender?: string;
  nationality?: string;
  country?: string;
  passportNo?: string;
  passportExpireDate?: string;
  visaType?: string;
  visaExpireDate?: string;
  gpa?: number | string;
  address?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  bankName?: string;
  bankBranch?: string;
  bankTargetTh?: string;
  bankActionTh?: string;
  issueDateTh?: string;
  issueDateEn?: string;
  docTemplate?: string;
  signerNameTh?: string;
  signerTitleTh?: string;
  signerNameEn?: string;
  signerTitleEn?: string;
  coordinatorNameTh?: string;
  coordinatorPhoneTh?: string;
}

export interface CertTypeItem {
  id: string;
  titleTh: string;
  titleEn: string;
  descriptionTh: string;
  descriptionEn: string;
  targetAudience: 'THAI' | 'INTERNATIONAL' | 'ALL';
  fee: number;
  processingDays: number;
}

export interface SignatoryItem {
  id: string;
  label: string;
  name: string;
  title: string;
  isDefault?: boolean;
}
