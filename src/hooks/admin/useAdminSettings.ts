'use client';

import { useState, useRef, useMemo } from 'react';
import { SystemSettings, SignatoryItem } from '@/types';

export const SIGNER_PRESETS: SignatoryItem[] = [
  {
    id: 'DEAN',
    label: '1. คณบดีคณะพุทธศาสตร์ (พระครูสุธีกิตติบัณฑิต, รศ.ดร.)',
    name: 'พระครูสุธีกิตติบัณฑิต, รศ.ดร.',
    title: 'คณบดีคณะพุทธศาสตร์',
  },
  {
    id: 'VICE_ACADEMIC',
    label: '2. รองคณบดีฝ่ายวิชาการ (ปฏิบัติหน้าที่แทนคณบดี)',
    name: 'พระมหาหรรษา ธมฺมหาโส, ศ.ดร.',
    title: 'รองคณบดีฝ่ายวิชาการ ปฏิบัติหน้าที่แทนคณบดีคณะพุทธศาสตร์',
  },
  {
    id: 'VICE_STUDENT',
    label: '3. รองคณบดีฝ่ายกิจการนิสิต (รับรองความประพฤติ/กิจกรรม)',
    name: 'พระมหาบุญเลิศ ช่วยธานี, ศ.ดร.',
    title: 'รองคณบดีฝ่ายกิจการนิสิต คณะพุทธศาสตร์',
  },
  {
    id: 'SECRETARY',
    label: '4. เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์',
    name: '',
    title: 'เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์',
  },
  {
    id: 'ACTING_DEAN',
    label: '5. ผู้รักษาราชการแทนคณบดีคณะพุทธศาสตร์',
    name: '',
    title: 'รักษาราชการแทนคณบดีคณะพุทธศาสตร์',
  },
  {
    id: 'REGISTRAR',
    label: '6. ผู้อำนวยการส่วนทะเบียนและวัดผล (นายทะเบียน)',
    name: 'พระมหาสุริยัน ปญฺญาวชิโร, ผศ.ดร.',
    title: 'ผู้อำนวยการส่วนทะเบียนและวัดผล',
  },
  {
    id: 'BLANK',
    label: '7. เว้นว่างไว้สำหรับลงนามสดด้วยลายมือปากกา (Handwritten)',
    name: '',
    title: 'คณบดีคณะพุทธศาสตร์',
  },
  {
    id: 'CUSTOM',
    label: '8. กำหนดเอง (พิมพ์ชื่อและตำแหน่งระบุเอง)',
    name: '',
    title: '',
  },
];

export const INITIAL_SYSTEM_SETTINGS: SystemSettings = {
  universityNameTh: 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย',
  universityNameEn: 'Mahachulalongkornrajavidyalaya University',
  facultyNameTh: 'คณะพุทธศาสตร์',
  facultyNameEn: 'Faculty of Buddhism',
  logoUrl: 'https://www.mcu.ac.th/images/logo-mcu.png',
  logoEmoji: '☸️',
  signerNameTh: 'พระครูสุธีกิตติบัณฑิต, รศ.ดร.',
  signerTitleTh: 'คณบดีคณะพุทธศาสตร์',
  signerNameEn: 'Assoc. Prof. Dr. Phrakhrusutheekittibandhit',
  signerTitleEn: 'Dean of the Faculty of Buddhism',
  contactPhone: '035-248-000 ต่อ 8323',
  contactEmail: 'buddhism@mcu.ac.th',
  addressTh: 'เลขที่ 79 หมู่ 1 ถนนพหลโยธิน ตำบลลำไทร อำเภอวังน้อย จังหวัดพระนครศรีอยุธยา 13170',
  addressEn: '79 Moo 1, Phahonyothin Road, Lamsai, Wangnoi, Phra Nakhon Si Ayutthaya 13170, Thailand',
  announcementText: 'ยินดีต้อนรับสู่งานบริการการศึกษาและทะเบียน คณะพุทธศาสตร์ มจร. วังน้อย',
  signatories: SIGNER_PRESETS,
  visaAlertTitle: 'สำหรับการต่อวีซ่า ให้ดำเนินการก่อนหนังสือเดินทางหมดอายุ 30 วัน',
  visaAlertDesc: '* เพื่อให้มีระยะเวลาเพียงพอต่อการพิจารณาของ ตม. และป้องกันการเสียค่าปรับ',
  visaAlertEnabled: true,
  timelineAlertTitle: 'การดำเนินการ จะเสร็จสิ้น ประมาณ 1-2 วัน ไม่นับวันหยุด หรือ กรุณาตรวจดูเส้นทางการดำเนินการหนังสือว่า "อนุมัติ"',
  timelineAlertDesc: '* สามารถตรวจสอบความคืบหน้าได้ตลอดเวลาที่แท็บ "เช็คสถานะคำร้อง"',
  timelineAlertEnabled: true,
  accuracyAlertTitle: 'กรุณากรอกข้อมูลให้ครบถ้วน มิฉะนั้นเอกสารจะไม่สมบูรณ์และจะยกเลิกการขอหนังสือ',
  accuracyAlertDesc: '* ตรวจสอบตัวสะกดชื่อ-นามสกุลภาษาอังกฤษและเลขพาสปอร์ตให้ตรงกับเล่มจริง',
  accuracyAlertEnabled: true,
};

interface UseAdminSettingsOptions {
  onSuccess?: (msg: string) => void;
}

export function useAdminSettings(options?: UseAdminSettingsOptions) {
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SYSTEM_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Signatories Management State
  const [editingSignatoryId, setEditingSignatoryId] = useState<string | null>(null);
  const [editSignatoryForm, setEditSignatoryForm] = useState<SignatoryItem>({
    id: '',
    label: '',
    name: '',
    title: '',
  });
  const [isAddingSignatory, setIsAddingSignatory] = useState(false);
  const [newSignatoryForm, setNewSignatoryForm] = useState<SignatoryItem>({
    id: '',
    label: '',
    name: '',
    title: '',
  });

  const activeSignatoriesList = useMemo(() => {
    return settings.signatories && settings.signatories.length > 0
      ? settings.signatories
      : SIGNER_PRESETS;
  }, [settings.signatories]);

  const handleAddSignatory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSignatoryForm.label.trim()) {
      alert('กรุณาระบุข้อความที่แสดงในเมนู Dropdown');
      return;
    }
    const id = `SIGNER_${Date.now()}`;
    const newSignatory: SignatoryItem = {
      ...newSignatoryForm,
      id,
    };
    const currentList = settings.signatories || SIGNER_PRESETS;
    const updatedList = [...currentList, newSignatory];
    const newSettings = { ...settings, signatories: updatedList };
    setSettings(newSettings);
    setIsAddingSignatory(false);
    setNewSignatoryForm({ id: '', label: '', name: '', title: '' });

    try {
      await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      options?.onSuccess?.('เพิ่มผู้ลงนามใหม่ในเมนู Dropdown เรียบร้อยแล้ว!');
    } catch {}
  };

  const handleSaveEditSignatory = async () => {
    if (!editingSignatoryId) return;
    const currentList = settings.signatories || SIGNER_PRESETS;
    const updatedList = currentList.map((item) =>
      item.id === editingSignatoryId ? { ...editSignatoryForm, id: editingSignatoryId } : item
    );
    const newSettings = { ...settings, signatories: updatedList };
    setSettings(newSettings);
    setEditingSignatoryId(null);

    try {
      await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      options?.onSuccess?.('แก้ไขข้อมูลผู้ลงนามเรียบร้อยแล้ว!');
    } catch {}
  };

  const handleDeleteSignatory = async (id: string, label: string) => {
    if (!confirm(`ยืนยันการลบผู้ลงนาม "${label}" ออกจากเมนู Dropdown?`)) return;
    const currentList = settings.signatories || SIGNER_PRESETS;
    const updatedList = currentList.filter((item) => item.id !== id);
    const newSettings = { ...settings, signatories: updatedList };
    setSettings(newSettings);

    try {
      await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      options?.onSuccess?.('ลบผู้ลงนามออกจากเมนูเรียบร้อยแล้ว');
    } catch {}
  };

  const handleResetSignatories = async () => {
    if (!confirm('ยืนยันการคืนค่ารายชื่อผู้ลงนามทั้งหมดเป็นชุดมาตรฐานเริ่มต้น?')) return;
    const newSettings = { ...settings, signatories: SIGNER_PRESETS };
    setSettings(newSettings);

    try {
      await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      options?.onSuccess?.('คืนค่ารายชื่อผู้ลงนามเริ่มต้นเรียบร้อยแล้ว!');
    } catch {}
  };

  const handleLogoFileUpload = async (file: File) => {
    if (!file) return;
    setUploadingLogo(true);
    try {
      let finalUrl = '';

      // Step 1: Upload via multipart/form-data
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.success && data.url) {
          finalUrl = data.url;
        }
      } catch (uploadErr) {
        console.warn('Multipart upload failed, attempting Base64 fallback', uploadErr);
      }

      // Step 2: Fallback to Base64 data URL if direct upload fails
      if (!finalUrl) {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string) || '');
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        if (base64Data) {
          try {
            const res = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ dataUrl: base64Data }),
            });
            const data = await res.json();
            if (data.success && data.url) {
              finalUrl = data.url;
            } else {
              finalUrl = base64Data;
            }
          } catch {
            finalUrl = base64Data;
          }
        }
      }

      if (finalUrl) {
        const updatedSettings = { ...settings, logoUrl: finalUrl };
        setSettings(updatedSettings);

        // Step 3: Immediate Auto-Save to /api/system-settings
        const saveRes = await fetch('/api/system-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedSettings),
        });
        const saveData = await saveRes.json();

        if (saveData.success) {
          if (saveData.data?.logoUrl) {
            setSettings((prev) => ({ ...prev, logoUrl: saveData.data.logoUrl }));
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('mcu_settings_updated'));
          }
          options?.onSuccess?.('✅ อัปโหลดและบันทึกรูปภาพโลโก้ลงในระบบสำเร็จเรียบร้อยแล้ว!');
        } else {
          options?.onSuccess?.('อัปโหลดรูปภาพสำเร็จแล้ว โปรดคลิกปุ่มบันทึกการตั้งค่าเพื่อยืนยัน');
        }
      }
    } catch (err: any) {
      console.error('Logo upload error:', err);
      alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' + (err.message || 'ไม่สามารถอัปโหลดได้'));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('mcu_settings_updated'));
        }
        options?.onSuccess?.('บันทึกการตั้งค่าระบบและตราสัญลักษณ์เรียบร้อยแล้ว!');
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err: any) {
      alert('การบันทึกล้มเหลว: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleForcePasswordChange = async (enabled: boolean) => {
    try {
      setSettings((prev) => ({ ...prev, forcePasswordChangeOnFirstLogin: enabled }));
      const res = await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, forcePasswordChangeOnFirstLogin: enabled }),
      });
      const data = await res.json();
      if (data.success) {
        options?.onSuccess?.(
          enabled
            ? 'เปิดใช้งานบังคับเปลี่ยนรหัสผ่านเมื่อเข้าใช้งานครั้งแรกเรียบร้อย (เพื่อความปลอดภัยของอาจารย์และนิสิต)'
            : 'ปิดใช้งานการบังคับเปลี่ยนรหัสผ่านเมื่อเข้าใช้งานครั้งแรก'
        );
      }
    } catch {}
  };

  return {
    settings,
    setSettings,
    savingSettings,
    setSavingSettings,
    uploadingLogo,
    logoFileInputRef,
    editingSignatoryId,
    setEditingSignatoryId,
    editSignatoryForm,
    setEditSignatoryForm,
    isAddingSignatory,
    setIsAddingSignatory,
    newSignatoryForm,
    setNewSignatoryForm,
    activeSignatoriesList,
    handleAddSignatory,
    handleSaveEditSignatory,
    handleDeleteSignatory,
    handleResetSignatories,
    handleLogoFileUpload,
    handleSaveSettings,
    handleToggleForcePasswordChange,
  };
}
