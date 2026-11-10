'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Search,
  FileText,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Home,
  Award,
  Landmark,
  Smartphone,
  Globe,
  PlaneTakeoff,
  FileCheck,
  BookOpen,
  UserCheck,
  ShieldCheck,
  AlertCircle,
  Check,
  Layers,
  Sparkles,
} from 'lucide-react';

interface CertificateType {
  id: string;
  code: string;
  name: string;
  targetAudience: 'THAI' | 'INTERNATIONAL' | 'STAFF' | 'CANDIDATE' | 'ALL';
  badge: string;
  category: string;
  iconName?: string;
  description: string;
  templateType: string;
  isActive: boolean;
}

interface CertificateTypesRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessMessage?: (msg: string) => void;
}

const AVAILABLE_ICONS = [
  { name: 'GraduationCap', label: 'หมวกบัณฑิต (GraduationCap)' },
  { name: 'FileText', label: 'เอกสาร (FileText)' },
  { name: 'FileCheck', label: 'เอกสารผ่านการตรวจ (FileCheck)' },
  { name: 'Globe', label: 'ลูกโลก / วีซ่า (Globe)' },
  { name: 'PlaneTakeoff', label: 'เครื่องบิน / เดินทาง (PlaneTakeoff)' },
  { name: 'Landmark', label: 'ธนาคาร / อาคาร (Landmark)' },
  { name: 'Smartphone', label: 'สมาร์ทโฟน / แอพ (Smartphone)' },
  { name: 'Home', label: 'หอพัก / บ้าน (Home)' },
  { name: 'Award', label: 'รางวัล / ทุน (Award)' },
  { name: 'BookOpen', label: 'วิชาการ / ตำรา (BookOpen)' },
  { name: 'UserCheck', label: 'อาจารย์ / บุคลากร (UserCheck)' },
  { name: 'ShieldCheck', label: 'ความปลอดภัย / รับรอง (ShieldCheck)' },
];

const AUDIENCE_OPTIONS = [
  { value: 'ALL', label: 'ทั้งหมด (ทุกกลุ่ม)' },
  { value: 'THAI', label: 'นิสิตไทย' },
  { value: 'INTERNATIONAL', label: 'นิสิตต่างชาติ' },
  { value: 'STAFF', label: 'อาจารย์และเจ้าหน้าที่' },
  { value: 'CANDIDATE', label: 'ผู้ผ่านการคัดเลือก' },
];

export function CertificateTypesRepoModal({
  isOpen,
  onClose,
  onSuccessMessage,
}: CertificateTypesRepoModalProps) {
  const [types, setTypes] = useState<CertificateType[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState<'ALL' | 'THAI' | 'INTERNATIONAL' | 'STAFF' | 'CANDIDATE'>('ALL');

  // Form State for Add / Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CertificateType>>({
    code: '',
    name: '',
    targetAudience: 'THAI',
    badge: 'นิสิตไทย',
    category: 'ACADEMIC',
    iconName: 'GraduationCap',
    description: '',
    templateType: 'THAI_BONAFIDE',
    isActive: true,
  });

  // Delete State
  const [deletingType, setDeletingType] = useState<CertificateType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch certificate types
  const fetchTypes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/certificates?action=types');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTypes(data.data);
      }
    } catch (err) {
      console.error('Error loading cert types:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTypes();
      setIsEditing(false);
      setEditingId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filtered list
  const filteredTypes = types.filter((t) => {
    const matchAudience = audienceFilter === 'ALL' || t.targetAudience === audienceFilter;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      (t.code && t.code.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.badge && t.badge.toLowerCase().includes(q));
    return matchAudience && matchSearch;
  });

  const handleOpenAddForm = () => {
    setEditingId(null);
    setFormData({
      code: `CERT-${types.length + 1}`,
      name: '',
      targetAudience: 'THAI',
      badge: 'นิสิตไทย',
      category: 'ACADEMIC',
      iconName: 'GraduationCap',
      description: '',
      templateType: 'THAI_BONAFIDE',
      isActive: true,
    });
    setIsEditing(true);
  };

  const handleOpenEditForm = (item: CertificateType) => {
    setEditingId(item.id);
    setFormData({
      code: item.code,
      name: item.name,
      targetAudience: item.targetAudience,
      badge: item.badge,
      category: item.category,
      iconName: item.iconName || 'FileText',
      description: item.description,
      templateType: item.templateType,
      isActive: item.isActive !== false,
    });
    setIsEditing(true);
  };

  const handleAudienceChange = (aud: 'THAI' | 'INTERNATIONAL' | 'STAFF' | 'CANDIDATE' | 'ALL') => {
    let defaultBadge = 'นิสิตไทย';
    let defaultTemplate = 'THAI_BONAFIDE';
    let defaultIcon = 'GraduationCap';

    if (aud === 'INTERNATIONAL') {
      defaultBadge = 'นิสิตต่างชาติ';
      defaultTemplate = 'INTER_BONAFIDE';
      defaultIcon = 'Globe';
    } else if (aud === 'STAFF') {
      defaultBadge = 'อาจารย์/เจ้าหน้าที่';
      defaultTemplate = 'STAFF_WORK';
      defaultIcon = 'UserCheck';
    } else if (aud === 'CANDIDATE') {
      defaultBadge = 'ผู้ผ่านคัดเลือก';
      defaultTemplate = 'CANDIDATE_OFFER';
      defaultIcon = 'FileCheck';
    }

    setFormData((prev) => ({
      ...prev,
      targetAudience: aud,
      badge: defaultBadge,
      templateType: defaultTemplate,
      iconName: defaultIcon,
    }));
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('กรุณากรอกชื่อหนังสือรับรอง');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        // Update
        const res = await fetch('/api/certificates?action=types', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            ...formData,
          }),
        });
        const resData = await res.json();
        if (resData.success) {
          if (onSuccessMessage) {
            onSuccessMessage(`บันทึกการแก้ไข "${formData.name}" สำเร็จ`);
          }
          setIsEditing(false);
          setEditingId(null);
          await fetchTypes();
        } else {
          alert('ไม่สามารถบันทึกได้: ' + (resData.error || 'Unknown error'));
        }
      } else {
        // Create
        const res = await fetch('/api/certificates?action=types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const resData = await res.json();
        if (resData.success) {
          if (onSuccessMessage) {
            onSuccessMessage(`เพิ่มประเภทหนังสือรับรอง "${formData.name}" สำเร็จ`);
          }
          setIsEditing(false);
          await fetchTypes();
        } else {
          alert('ไม่สามารถเพิ่มได้: ' + (resData.error || 'Unknown error'));
        }
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (item: CertificateType) => {
    try {
      const updatedStatus = !item.isActive;
      const res = await fetch('/api/certificates?action=types', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          isActive: updatedStatus,
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        setTypes((prev) =>
          prev.map((t) => (t.id === item.id ? { ...t, isActive: updatedStatus } : t))
        );
      }
    } catch (err) {
      console.error('Failed to toggle active status:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingType) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/certificates?action=types&id=${deletingType.id}`, {
        method: 'DELETE',
      });
      const resData = await res.json();
      if (resData.success) {
        if (onSuccessMessage) {
          onSuccessMessage(`ลบประเภทหนังสือรับรอง "${deletingType.name}" เรียบร้อยแล้ว`);
        }
        setDeletingType(null);
        await fetchTypes();
      } else {
        alert('ลบไม่สำเร็จ: ' + (resData.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการลบ: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderIconBadge = (iconName?: string) => {
    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5 text-purple-600" />;
      case 'Home':
        return <Home className="w-5 h-5 text-amber-600" />;
      case 'Award':
        return <Award className="w-5 h-5 text-blue-600" />;
      case 'Landmark':
        return <Landmark className="w-5 h-5 text-emerald-600" />;
      case 'Smartphone':
        return <Smartphone className="w-5 h-5 text-indigo-600" />;
      case 'Globe':
        return <Globe className="w-5 h-5 text-cyan-600" />;
      case 'PlaneTakeoff':
        return <PlaneTakeoff className="w-5 h-5 text-sky-600" />;
      case 'FileCheck':
        return <FileCheck className="w-5 h-5 text-emerald-600" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5 text-amber-600" />;
      case 'UserCheck':
        return <UserCheck className="w-5 h-5 text-indigo-600" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-teal-600" />;
      default:
        return <FileText className="w-5 h-5 text-purple-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                คลังประเภทหนังสือรับรอง (Certificate Types Repository)
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold">
                  {types.length} ประเภท
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                จัดการ เพิ่มเติม แก้ไข และเปิด/ปิด การแสดงประเภทหนังสือรับรองในหน้านิสิตและอาจารย์
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                type="button"
                onClick={handleOpenAddForm}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มหนังสือรับรอง</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Drawer (Add / Edit) */}
        {isEditing && (
          <form
            onSubmit={handleSaveForm}
            className="p-5 border-b border-purple-200 bg-purple-50/40 shrink-0 space-y-4 max-h-[45vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-purple-100 pb-2">
              <h3 className="text-sm font-bold text-purple-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                {editingId ? 'แก้ไขข้อมูลประเภทหนังสือรับรอง' : 'เพิ่มประเภทหนังสือรับรองใหม่'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1 rounded-lg hover:bg-slate-200/50"
              >
                ยกเลิก
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  รหัสเอกสาร (Code) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น TH-05, INT-04"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  ชื่อหนังสือรับรอง (Name) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น หนังสือรับรองความประพฤติและวินัยนิสิต"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">กลุ่มเป้าหมาย (Audience)</label>
                <select
                  value={formData.targetAudience || 'THAI'}
                  onChange={(e) => handleAudienceChange(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium"
                >
                  <option value="THAI">นิสิตไทย (THAI)</option>
                  <option value="INTERNATIONAL">นิสิตต่างชาติ (INTERNATIONAL)</option>
                  <option value="STAFF">อาจารย์/บุคลากร (STAFF)</option>
                  <option value="CANDIDATE">ผู้ผ่านคัดเลือก (CANDIDATE)</option>
                  <option value="ALL">ทุกคน (ALL)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ป้ายกำกับ (Badge)</label>
                <input
                  type="text"
                  placeholder="เช่น นิสิตไทย, ตรวจคนเข้าเมือง"
                  value={formData.badge || ''}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">หมวดหมู่ (Category)</label>
                <input
                  type="text"
                  placeholder="ACADEMIC, VISA, BANK, DORM"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ไอคอน (Icon)</label>
                <select
                  value={formData.iconName || 'FileText'}
                  onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                >
                  {AVAILABLE_ICONS.map((ic) => (
                    <option key={ic.name} value={ic.name}>
                      {ic.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">รหัสเทมเพลต (Template Type)</label>
                <input
                  type="text"
                  placeholder="THAI_BONAFIDE, INTER_VISA, GENERAL"
                  value={formData.templateType || ''}
                  onChange={(e) => setFormData({ ...formData, templateType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">
                  คำอธิบายหรือข้อกำหนดการใช้งาน (Description)
                </label>
                <textarea
                  rows={2}
                  placeholder="คำอธิบายสั้นๆ สำหรับแสดงบนการ์ดในหน้านิสิต..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition mb-1">
                  <input
                    type="checkbox"
                    checked={formData.isActive !== false}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="font-semibold text-slate-800">เปิดให้นิสิตยื่นคำร้อง</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-purple-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium transition cursor-pointer text-xs"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition cursor-pointer text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกประเภทหนังสือรับรอง'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Filter and Search Bar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0 text-xs">
          {/* Audience Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            {AUDIENCE_OPTIONS.map((aud) => (
              <button
                key={aud.value}
                type="button"
                onClick={() => setAudienceFilter(aud.value as any)}
                className={`px-3 py-1.5 rounded-lg transition font-medium cursor-pointer ${
                  audienceFilter === aud.value
                    ? 'bg-purple-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {aud.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อหนังสือ, รหัส หรือคำอธิบาย..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>

        {/* Types List Table / Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              กำลังโหลดรายการประเภทหนังสือรับรอง...
            </div>
          ) : filteredTypes.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
              <p className="text-sm font-medium">ไม่พบประเภทหนังสือรับรองตามเงื่อนไขที่เลือก</p>
              <button
                type="button"
                onClick={handleOpenAddForm}
                className="inline-flex items-center gap-1.5 text-xs text-purple-600 font-bold hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่มประเภทหนังสือรับรองใหม่
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredTypes.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    item.isActive !== false
                      ? 'bg-white border-slate-200/90 hover:border-purple-300 hover:shadow-sm'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                        {renderIconBadge(item.iconName)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[11px] font-mono">
                            {item.code || 'NO-CODE'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              item.targetAudience === 'INTERNATIONAL'
                                ? 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                                : item.targetAudience === 'STAFF'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : item.targetAudience === 'CANDIDATE'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-purple-50 text-purple-800 border border-purple-200'
                            }`}
                          >
                            {item.badge || item.targetAudience}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono">
                            {item.templateType || 'GENERAL'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">
                          {item.name}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {item.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                          item.isActive !== false
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
                        }`}
                        title={item.isActive !== false ? 'เปิดใช้งานอยู่ (คลิกเพื่อปิด)' : 'ปิดใช้งานอยู่ (คลิกเพื่อเปิด)'}
                      >
                        {item.isActive !== false ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditForm(item)}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-purple-50 hover:border-purple-300 text-slate-600 hover:text-purple-700 transition cursor-pointer"
                        title="แก้ไขข้อมูลหนังสือรับรองนี้"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingType(item)}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:border-red-300 text-slate-500 hover:text-red-600 transition cursor-pointer"
                        title="ลบหนังสือรับรองนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200/80 bg-slate-50/70 flex items-center justify-between shrink-0 text-xs">
          <div className="text-slate-500">
            แสดง {filteredTypes.length} จากทั้งหมด {types.length} รายการ
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingType && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">ยืนยันการลบประเภทหนังสือรับรอง</h3>
                <p className="text-xs text-slate-500">การลบนี้จะนำประเภทหนังสือนี้ออกจากระบบ</p>
              </div>
            </div>

            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs space-y-1">
              <div className="font-bold text-red-900">{deletingType.name}</div>
              <div className="text-red-700 font-mono text-[11px]">รหัส: {deletingType.code}</div>
              <p className="text-red-600 text-[11px] pt-1">
                คำร้องเดิมที่ออกไปแล้วจะไม่ได้รับผลกระทบ แต่ผู้ใช้จะไม่สามารถเลือกประเภทนี้ได้อีก
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingType(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-100 text-xs cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'กำลังลบ...' : 'ยืนยันลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
