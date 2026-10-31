export type RequestStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type RequestType = 
  | 'STUDENT_STATUS_CERTIFICATE' 
  | 'OFFICIAL_TRANSCRIPT' 
  | 'STUDENT_LOAN_CERTIFICATE' 
  | 'MILITARY_DEFERMENT' 
  | 'LEAVE_REQUEST' 
  | 'OTHER';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED';
export type AttendanceStatus = 'PRESENT' | 'LATE' | 'LEAVE' | 'ABSENT';
export type StudentStatus = 'ACTIVE' | 'PROBATION' | 'SUSPENDED' | 'GRADUATED' | 'RESIGNED';
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export type DataSourceMode = 'HYBRID' | 'POSTGRES' | 'SHEETS';
