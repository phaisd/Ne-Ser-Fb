import { UserAccount } from '@/types';

export interface ParsedOfficerItem {
  id?: string;
  name: string;
  nameEn?: string;
  position: string; // 'เจ้าหน้าที่หลักสูตร' | 'ผู้ช่วยเจ้าหน้าที่' | 'เจ้าหน้าที่ฝ่ายวิชาการ' | 'เจ้าหน้าที่ดูแลระบบ'
  department?: string; // สาขาวิชา / ภาควิชา / หน่วยงาน
  phoneNumber?: string;
  email: string;
  password: string;
  role: 'OFFICER' | 'INSTRUCTOR' | 'STAFF';
  isActingOfficer: boolean;
  isExisting?: boolean;
  existingMatchName?: string;
  statusText?: string;
}

export interface OfficerExportTabProps {
  filteredOfficers: UserAccount[];
  exportSearch: string;
  setExportSearch: (val: string) => void;
  exportRoleFilter: string;
  setExportRoleFilter: (val: string) => void;
  copiedLineId: string | null;
  copiedAllTable: boolean;
  onCopySingleLine: (officer: UserAccount) => void;
  onCopyAllTable: () => void;
  onExportXlsx: () => void;
  onExportCsv: () => void;
}
