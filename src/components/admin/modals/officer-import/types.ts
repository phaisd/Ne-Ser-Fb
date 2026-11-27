import { UserAccount } from '@/types';

export interface ParsedOfficerItem {
  id?: string;
  name: string;
  nameEn?: string;
  role: 'OFFICER' | 'ACTING_OFFICER' | 'STAFF';
  position: string;
  department: string;
  phone: string;
  email: string;
  password: string;
  isExisting?: boolean;
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
