export interface ParsedMasterItem {
  id?: string;
  name: string;
  nameEn?: string;
  position: string; // ประธาน, รองประธาน, พระวิปัสสนาจารย์, เลขานุการ, ฯลฯ
  ecclesiasticalTitle?: string; // ตำแหน่งทางคณะสงฆ์ เช่น เจ้าอาวาสวัด..., เจ้าคณะตำบล..., พระมหา...
  department?: string; // หน่วยงาน / ภาควิชา
  contactAddress?: string; // ที่อยู่ติดต่อ / สังกัดวัด
  email: string;
  password: string;
  isExisting?: boolean;
  existingMatchName?: string;
}

export const STANDARD_POSITIONS = [
  'ประธานพระวิปัสสนาจารย์',
  'รองประธานพระวิปัสสนาจารย์',
  'พระวิปัสสนาจารย์',
  'เลขานุการพระวิปัสสนาจารย์',
  'ผู้ช่วยเลขานุการพระวิปัสสนาจารย์',
];
