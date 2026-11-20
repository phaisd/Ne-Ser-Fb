import { UserAccount, Student } from '@/types';
import type { AdminTab } from '../../AdminSidebar';
import type { AdminUserFilterItem } from '@/hooks/admin/useAdminUsers';

export interface AdminUsersTabProps {
  users: UserAccount[];
  filteredUsers: AdminUserFilterItem[];
  studentsList: Student[];
  userSearch: string;
  setUserSearch: (val: string) => void;
  userRoleFilter: string;
  setUserRoleFilter: (val: string) => void;
  isScanningInstructors: boolean;
  handleScanTimetables: () => void;
  setIsAddUserOpen: (val: boolean) => void;
  setActiveTab: React.Dispatch<React.SetStateAction<AdminTab>> | ((tab: AdminTab) => void);
  setStudentSearch: (val: string) => void;
  handleStartEditUser: (u: UserAccount | AdminUserFilterItem) => void;
  handleOpenTeachingSlip: (u: UserAccount | AdminUserFilterItem) => void;
  handleCopyLineTeachingMessage: (u: UserAccount | AdminUserFilterItem) => void;
  copiedLineUserId: string | null;
  handleToggleSuspend: (id: string, isSuspended: boolean, name: string) => void;
  handleUpdateRole: (id: string, newRole: any) => void;
  handleToggleActingOfficer?: (
    id: string,
    isActingOfficer: boolean,
    name: string,
    userType?: 'STUDENT' | 'INSTRUCTOR'
  ) => void;
  handleResetPassword: (id: string, name: string) => void;
  forcePasswordChangeOnFirstLogin?: boolean;
  onToggleForcePasswordChange?: (enabled: boolean) => void;
  onOpenNewYearWorkflow?: () => void;
  onOpenBatchTeachingSlips?: () => void;
  isOfficer?: boolean;
  isSuperAdmin?: boolean;
  onRefresh?: () => void;
}
