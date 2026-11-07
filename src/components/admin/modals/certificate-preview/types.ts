import React from 'react';
import { CertificateRequest, SystemSettings, SignatoryItem } from '@/types';

export type CertTemplateType = 'THAI_STANDARD' | 'BANK_LETTER' | 'ENG_CERT' | 'INTERNAL_MEMO';
export type InspectionDocTab = 'ENROLLMENT' | 'PASSPORT' | 'SIDE_BY_SIDE';
export type CustomTextMode = 'HIGHLIGHT' | 'RAW';

export interface AdminCertificatePreviewModalProps {
  previewRequest: CertificateRequest | null;
  setPreviewRequest: React.Dispatch<React.SetStateAction<CertificateRequest | null>>;
  previewTab: 'DOCUMENT' | 'ATTACHMENTS';
  setPreviewTab: React.Dispatch<React.SetStateAction<'DOCUMENT' | 'ATTACHMENTS'>>;
  requests: CertificateRequest[];
  settings: SystemSettings;
  activeSignatoriesList: SignatoryItem[];
  currentUser: any;
  handleApprove: (id: string, defaultDocNo?: string, prefix?: '8002' | '8002.1') => Promise<void>;
  handleOpenRejectModal: (request: CertificateRequest) => void;
  setRejectReasonInput: React.Dispatch<React.SetStateAction<string>>;
  loadData: () => void;
  setActionSuccess: React.Dispatch<React.SetStateAction<string | null>>;
}

export interface DocCustomizerSettings {
  previewTemplate: CertTemplateType;
  setPreviewTemplate: (val: CertTemplateType) => void;
  docFontSize: number;
  setDocFontSize: (val: number) => void;
  signerFontSize: number;
  setSignerFontSize: (val: number) => void;
  studentSignFontSize: number;
  setStudentSignFontSize: (val: number) => void;
  docLineSpacing: number;
  setDocLineSpacing: (val: number) => void;
  docSignerOffset: number;
  setDocSignerOffset: (val: number) => void;
  photoBoxOffsetX: number;
  setPhotoBoxOffsetX: (val: number) => void;
  dotsCount: number;
  setDotsCount: (val: number) => void;
  headerTitleSpacing: number;
  setHeaderTitleSpacing: (val: number) => void;
  headerTopSpacing: number;
  setHeaderTopSpacing: (val: number) => void;
  docFontFamily: string;
  setDocFontFamily: (val: string) => void;
  studentSignAlign: 'left' | 'center' | 'right';
  setStudentSignAlign: (val: 'left' | 'center' | 'right') => void;
  studentSignOffsetX: number;
  setStudentSignOffsetX: (val: number) => void;
  showPhotoBox: boolean;
  setShowPhotoBox: (val: boolean) => void;
  showStudentSign: boolean;
  setShowStudentSign: (val: boolean) => void;
  customStudentSignName: string;
  setCustomStudentSignName: (val: string) => void;
  customStudentDots: string;
  setCustomStudentDots: (val: string) => void;
  showQrCode: boolean;
  setShowQrCode: (val: boolean) => void;
  docTitleFontSize: number;
  setDocTitleFontSize: (val: number) => void;
  docTitleFontWeight: 'font-normal' | 'font-semibold' | 'font-bold' | 'font-black';
  setDocTitleFontWeight: (val: 'font-normal' | 'font-semibold' | 'font-bold' | 'font-black') => void;
  showSignerOrg: boolean;
  setShowSignerOrg: (val: boolean) => void;
  signerOrgCustomText: string;
  setSignerOrgCustomText: (val: string) => void;
  useThaiNumerals: boolean;
  setUseThaiNumerals: (val: boolean) => void;
  selectedSignerPreset: string;
  setSelectedSignerPreset: (val: string) => void;
  customSigner: { name: string; title: string };
  setCustomSigner: React.Dispatch<React.SetStateAction<{ name: string; title: string }>>;
}
