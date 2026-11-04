import { SignatoryItem } from './certificate';

export interface SystemSettings {
  universityNameTh: string;
  universityNameEn: string;
  facultyNameTh: string;
  facultyNameEn: string;
  logoUrl: string;
  logoEmoji?: string;
  signerNameTh: string;
  signerTitleTh: string;
  signerNameEn: string;
  signerTitleEn: string;
  contactPhone: string;
  contactEmail: string;
  websiteUrl?: string;
  systemServiceUrl?: string;
  addressTh: string;
  addressEn: string;
  announcementText: string;
  signatories?: SignatoryItem[];
  visaAlertTitle?: string;
  visaAlertDesc?: string;
  visaAlertEnabled?: boolean;
  timelineAlertTitle?: string;
  timelineAlertDesc?: string;
  timelineAlertEnabled?: boolean;
  accuracyAlertTitle?: string;
  accuracyAlertDesc?: string;
  accuracyAlertEnabled?: boolean;
}

export interface SheetStatus {
  sheetName: string;
  title: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  rowCount: number;
  lastSyncedAt?: string;
  error?: string;
}
