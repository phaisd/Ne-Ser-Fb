'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
  ListOrdered,
  FileSpreadsheet,
  Layers,
  GraduationCap,
  Eye,
  Sliders,
} from 'lucide-react';
import {
  AdmissionPortalConfig,
  SystemSettings,
  AdmissionQualificationCard,
  AdmissionRequiredDocItem,
  AdmissionSelectOptionItem,
  AdmissionFirstYearCourseItem,
  AdmissionDepartmentBannerItem,
} from '@/types';
import {
  DEFAULT_ADMISSION_PORTAL_CONFIG,
  resolveAdmissionPortalConfig,
} from '@/lib/admission-config';
import {
  CustomizerSection,
  SelectOptionKey,
  EditModalState,
  CustomizerVisibilitySection,
  CustomizerBannerSliderSection,
  CustomizerQualificationsSection,
  CustomizerFormOptionsSection,
  CustomizerStatusCheckSection,
  CustomizerCoursePlanSection,
  CustomizerEditModal,
} from './sections';

interface AdmissionPortalCustomizerProps {
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  onSaveSettings: (nextSettings: SystemSettings) => Promise<void>;
  savingConfig: boolean;
}

export function AdmissionPortalCustomizer({
  settings,
  setSettings,
  onSaveSettings,
  savingConfig,
}: AdmissionPortalCustomizerProps) {
  const [activeSubSection, setActiveSubSection] = useState<CustomizerSection>('VISIBILITY');
  const [editingItem, setEditingItem] = useState<EditModalState>(null);

  const config: AdmissionPortalConfig = resolveAdmissionPortalConfig(settings.admissionPortalConfig);

  const updateConfig = (updater: (prev: AdmissionPortalConfig) => AdmissionPortalConfig) => {
    const nextConfig = updater(resolveAdmissionPortalConfig(settings.admissionPortalConfig));
    setSettings((prev) => ({
      ...prev,
      admissionPortalConfig: nextConfig,
    }));
  };

  const handleSave = async () => {
    await onSaveSettings({
      ...settings,
      admissionPortalConfig: config,
    });
  };

  const handleResetDefaults = async () => {
    if (
      !window.confirm(
        'ต้องการรีเซ็ตการตั้งค่าเนื้อหาและตัวเลือกหน้า /enroll ทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่?'
      )
    ) {
      return;
    }
    const nextSettings = {
      ...settings,
      admissionPortalConfig: DEFAULT_ADMISSION_PORTAL_CONFIG,
    };
    setSettings(nextSettings);
    await onSaveSettings(nextSettings);
  };

  const handleToggleVisibility = async (key: keyof AdmissionPortalConfig, val: boolean) => {
    const nextConfig = {
      ...config,
      [key]: val,
    };
    updateConfig(() => nextConfig);
    await onSaveSettings({
      ...settings,
      admissionPortalConfig: nextConfig,
    });
  };

  const addDepartmentBanner = () => {
    const newBanner: AdmissionDepartmentBannerItem = {
      id: `banner-${Date.now().toString(36)}`,
      majorName: 'สาขาวิชาใหม่ (New Major Program)',
      degreeLevel: 'พธ.บ. • พธ.ม. (ตรี - โท)',
      tagline: 'ศึกษาวิจัยและเรียนรู้หลักธรรมเพื่อการพัฒนาตนและสังคม',
      highlights: ['เปิดรับสมัครทั้งบรรพชิตและคฤหัสถ์', 'มีทุนการศึกษา'],
      colorTheme: 'sage',
      badgeText: '✨ เปิดรับสมัคร',
      actionText: 'สมัครเรียนสาขานี้ →',
      actionType: 'APPLY_NOW',
      enabled: true,
    };
    updateConfig((prev) => ({
      ...prev,
      departmentBanners: [...(prev.departmentBanners || []), newBanner],
    }));
  };

  const addQualificationCard = () => {
    const newCard: AdmissionQualificationCard = {
      id: `qual-${Date.now().toString(36)}`,
      badgeText: '✨ คุณสมบัติกลุ่มผู้สมัครใหม่',
      themeColor: 'emerald',
      enabled: true,
      items: ['สำเร็จการศึกษาตามเกณฑ์ที่คณะพุทธศาสตร์กำหนด'],
    };
    updateConfig((prev) => ({ ...prev, qualifications: [...prev.qualifications, newCard] }));
  };

  const addRequiredDoc = () => {
    const newDoc: AdmissionRequiredDocItem = {
      id: `doc-${Date.now().toString(36)}`,
      title: 'เอกสารประกอบการสมัครเพิ่มเติม',
      description: 'ระบุรายละเอียดและจำนวนชุดที่ต้องเตรียม',
      enabled: true,
    };
    updateConfig((prev) => ({ ...prev, requiredDocuments: [...prev.requiredDocuments, newDoc] }));
  };

  const addSelectOption = (
    key: SelectOptionKey,
    defaultLabel: string,
    defaultValue?: string
  ) => {
    const newItem: AdmissionSelectOptionItem = {
      id: `opt-${Date.now().toString(36)}`,
      value: defaultValue || defaultLabel,
      label: defaultLabel,
      enabled: true,
    };
    updateConfig((prev) => ({ ...prev, [key]: [...(prev[key] || []), newItem] }));
  };

  const addCourseForDegree = (
    degreeKey: 'bachelor' | 'master' | 'doctoral' | 'certificate',
    defaultCode: string,
    defaultType: string
  ) => {
    const newCourse: AdmissionFirstYearCourseItem = {
      id: `fyc-${degreeKey}-${Date.now().toString(36)}`,
      code: defaultCode,
      nameTh: 'รายวิชาใหม่ (New Course)',
      type: defaultType,
      credits: 3,
      enabled: true,
    };
    const configKey =
      degreeKey === 'bachelor'
        ? 'firstYearCourses'
        : degreeKey === 'master'
        ? 'firstYearCoursesMaster'
        : degreeKey === 'doctoral'
        ? 'firstYearCoursesDoctoral'
        : 'firstYearCoursesCertificate';

    updateConfig((prev) => ({
      ...prev,
      [configKey]: [...(prev[configKey] || []), newCourse],
    }));
  };

  const handleSaveEditingItem = () => {
    if (!editingItem) return;

    if (editingItem.type === 'banner') {
      const lines = editingItem.highlightsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      updateConfig((prev) => ({
        ...prev,
        departmentBanners: (prev.departmentBanners || []).map((b) =>
          b.id === editingItem.id
            ? {
                ...b,
                majorName: editingItem.majorName,
                degreeLevel: editingItem.degreeLevel,
                tagline: editingItem.tagline,
                highlights: lines,
                colorTheme: editingItem.colorTheme,
                badgeText: editingItem.badgeText,
                actionText: editingItem.actionText,
                enabled: editingItem.enabled,
              }
            : b
        ),
      }));
    } else if (editingItem.type === 'qualification') {
      const lines = editingItem.itemsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      updateConfig((prev) => ({
        ...prev,
        qualifications: prev.qualifications.map((q) =>
          q.id === editingItem.id
            ? {
                ...q,
                badgeText: editingItem.badgeText,
                themeColor: editingItem.themeColor,
                items: lines.length > 0 ? lines : ['-'],
                enabled: editingItem.enabled,
              }
            : q
        ),
      }));
    } else if (editingItem.type === 'document') {
      updateConfig((prev) => ({
        ...prev,
        requiredDocuments: prev.requiredDocuments.map((d) =>
          d.id === editingItem.id
            ? {
                ...d,
                title: editingItem.title,
                description: editingItem.description,
                enabled: editingItem.enabled,
              }
            : d
        ),
      }));
    } else if (editingItem.type === 'selectOption') {
      updateConfig((prev) => ({
        ...prev,
        [editingItem.key]: (prev[editingItem.key] || []).map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                label: editingItem.label,
                value: editingItem.value,
                enabled: editingItem.enabled,
              }
            : item
        ),
      }));
    } else if (editingItem.type === 'course') {
      const configKey =
        editingItem.degreeKey === 'bachelor'
          ? 'firstYearCourses'
          : editingItem.degreeKey === 'master'
          ? 'firstYearCoursesMaster'
          : editingItem.degreeKey === 'doctoral'
          ? 'firstYearCoursesDoctoral'
          : 'firstYearCoursesCertificate';

      updateConfig((prev) => ({
        ...prev,
        [configKey]: (prev[configKey] || []).map((c) =>
          c.id === editingItem.id
            ? {
                ...c,
                code: editingItem.code,
                nameTh: editingItem.nameTh,
                type: editingItem.courseType,
                credits: editingItem.credits,
                enabled: editingItem.enabled,
              }
            : c
        ),
      }));
    }

    setEditingItem(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-700">
              <Sparkles className="w-5 h-5" />
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              ปรับแต่งเนื้อหาและตัวเลือกแบบฟอร์มหน้า /enroll
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-50 text-orange-700 border border-orange-200">
              Live Customizer
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
            แก้ไขข้อความ, หัวข้อ, ตัวเลือก Dropdown 7 หมวด, คุณสมบัติผู้สมัคร, เอกสารที่ต้องเตรียม
            รวมถึงตารางแผนการลงทะเบียนเรียนปี 1 แยก 4 ระดับการศึกษา (ตรี/โท/เอก/ป.บัณฑิต)
            ที่แสดงในใบรายงานตัวนิสิตใหม่
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>คืนค่าเริ่มต้น</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={savingConfig}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-extrabold shadow-sm hover:shadow transition disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{savingConfig ? 'กำลังบันทึก...' : 'บันทึกการปรับแต่งทั้งหมด'}</span>
          </button>
        </div>
      </div>

      {/* Sub-navigation Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubSection('VISIBILITY')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubSection === 'VISIBILITY'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>การแสดงผลแท็บ &amp; องค์ประกอบ</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubSection('BANNERS')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubSection === 'BANNERS'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>สไลด์แบนเนอร์สาขาวิชา ({config.departmentBanners?.length || 0})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubSection('SECTION1')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubSection === 'SECTION1'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>ส่วนที่ ๑: คุณสมบัติ &amp; เอกสาร</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubSection('SECTION2')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubSection === 'SECTION2'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>ส่วนที่ ๒: ตัวเลือกแบบฟอร์ม 7 หมวด</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubSection('SECTION3')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubSection === 'SECTION3'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>ส่วนที่ ๓: ตรวจสถานะ &amp; สัมภาษณ์</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubSection('SECTION4')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubSection === 'SECTION4'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>ส่วนที่ ๔: ขึ้นทะเบียน &amp; แผนการเรียน 4 ระดับ</span>
        </button>
      </div>

      {/* Render Subsections */}
      {activeSubSection === 'VISIBILITY' && (
        <CustomizerVisibilitySection
          config={config}
          updateConfig={updateConfig}
          onToggleVisibility={handleToggleVisibility}
        />
      )}

      {activeSubSection === 'BANNERS' && (
        <CustomizerBannerSliderSection
          config={config}
          updateConfig={updateConfig}
          setEditingItem={setEditingItem}
          onAddNewBanner={addDepartmentBanner}
        />
      )}

      {activeSubSection === 'SECTION1' && (
        <CustomizerQualificationsSection
          config={config}
          updateConfig={updateConfig}
          addQualificationCard={addQualificationCard}
          addRequiredDoc={addRequiredDoc}
          setEditingItem={setEditingItem}
        />
      )}

      {activeSubSection === 'SECTION2' && (
        <CustomizerFormOptionsSection
          config={config}
          updateConfig={updateConfig}
          addSelectOption={addSelectOption}
          setEditingItem={setEditingItem}
        />
      )}

      {activeSubSection === 'SECTION3' && (
        <CustomizerStatusCheckSection config={config} updateConfig={updateConfig} />
      )}

      {activeSubSection === 'SECTION4' && (
        <CustomizerCoursePlanSection
          config={config}
          updateConfig={updateConfig}
          addCourseForDegree={addCourseForDegree}
          setEditingItem={setEditingItem}
        />
      )}

      {/* Universal Edit Modal */}
      {editingItem && (
        <CustomizerEditModal
          editingItem={editingItem}
          setEditingItem={setEditingItem}
          onSave={handleSaveEditingItem}
        />
      )}
    </div>
  );
}
