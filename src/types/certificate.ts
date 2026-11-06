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
  docNoPrefix?: string; // เช่น '8002' (คณบดี) หรือ '8002.1' (เลขานุการ)
  email?: string;
  phone?: string;
  note?: string;
  rejectReason?: string;
  enrollmentSlipUrl?: string;
  passportCopyUrl?: string;
  photoUrl?: string;
  attachmentUrl?: string;
  targetAudience?: 'THAI' | 'INTERNATIONAL' | 'STAFF' | 'CANDIDATE' | 'ALL';
  applicantType?: 'STUDENT' | 'STAFF' | 'CANDIDATE';
  position?: string;
  department?: string;
  candidateAppNo?: string;
  age?: number | string;
  vassa?: number | string; // พรรษา (สำหรับบรรพชิต พระภิกษุ-สามเณร)
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
  customBodyText?: string;
}

export interface CertTypeItem {
  id: string;
  titleTh: string;
  titleEn: string;
  descriptionTh: string;
  descriptionEn: string;
  targetAudience: 'THAI' | 'INTERNATIONAL' | 'STAFF' | 'CANDIDATE' | 'ALL';
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
