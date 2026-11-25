'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  GitMerge,
  ShieldCheck,
  UserCheck,
  Sparkles,
  RefreshCw,
  Info,
} from 'lucide-react';
import { UserAccount } from '@/types';
import { stripLeadingTitles } from '@/lib/utils/name-matcher';

interface DuplicateAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  onMerge: (primaryId: string, duplicateId: string) => Promise<boolean>;
  onDelete: (user: UserAccount) => Promise<void>;
  onRefresh?: () => void | Promise<void>;
}

export interface DuplicateGroup {
  key: string;
  name: string;
  accounts: UserAccount[];
}

export const DuplicateAccountsModal: React.FC<DuplicateAccountsModalProps> = ({
  isOpen,
  onClose,
  users,
  onMerge,
  onDelete,
  onRefresh,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isMergingAll, setIsMergingAll] = useState(false);

  // Group accounts to find duplicates
  const duplicateGroups = useMemo(() => {
    const map = new Map<string, { name: string; accounts: UserAccount[] }>();

    users.forEach((u) => {
      // Ignore super admin
      if (u.role === 'SUPER_ADMIN' || u.email === 'phaisal.dis@mcu.ac.th') return;

      const rawName = (u.name || '').trim();
      if (!rawName) return;

      const stripped = stripLeadingTitles(rawName)
        .toLowerCase()
        .replace(/[\s,.*\/()\[\]{}:;]/g, '');

      if (!stripped || stripped.length < 2) return;

      if (!map.has(stripped)) {
        map.set(stripped, { name: rawName, accounts: [] });
      }
      map.get(stripped)!.accounts.push(u);
    });

    const groups: DuplicateGroup[] = [];
    for (const [key, val] of map.entries()) {
      if (val.accounts.length > 1) {
        // Sort accounts: prefer stable ID (e.g. inst-35 over inst-17...) as first/primary
        const sorted = [...val.accounts].sort((a, b) => {
          const aAuto = a.id?.startsWith('inst-17') ? 1 : 0;
          const bAuto = b.id?.startsWith('inst-17') ? 1 : 0;
          return aAuto - bAuto;
        });
        groups.push({ key, name: val.name, accounts: sorted });
      }
    }

    return groups;
  }, [users]);

  if (!isOpen) return null;

  const handleMergeGroup = async (primary: UserAccount, duplicate: UserAccount) => {
    setProcessingId(duplicate.id);
    try {
      const ok = await onMerge(primary.id, duplicate.id);
      if (ok && onRefresh) {
        await onRefresh();
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleMergeAll = async () => {
    if (duplicateGroups.length === 0) return;
    const ok = window.confirm(
      `ยืนยันการรวมบัญชีที่ซ้ำซ้อนทั้งหมด ${duplicateGroups.length} กลุ่ม โดยอัตโนมัติหรือไม่?\n\nระบบจะเก็บรักษาบัญชีหลัก รวมชื่อ/อีเมล/นามแฝง (Aliases) ทั้งหมดเข้าด้วยกัน และลบบัญชีซ้ำซ้อนออกจากระบบและ Google Sheets อย่างปลอดภัย`
    );
    if (!ok) return;

    setIsMergingAll(true);
    try {
      for (const group of duplicateGroups) {
        const primary = group.accounts[0];
        for (let i = 1; i < group.accounts.length; i++) {
          const duplicate = group.accounts[i];
          await onMerge(primary.id, duplicate.id);
        }
      }
      if (onRefresh) {
        await onRefresh();
      }
      alert('รวมและลบบัญชีที่ซ้ำซ้อนทั้งหมดเรียบร้อยแล้ว');
    } catch (e: unknown) {
      alert((e instanceof Error ? e.message : String(e)));
    } finally {
      setIsMergingAll(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50 via-sky-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-300 flex items-center justify-center text-amber-600 shadow-xs">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>ตรวจหาและลบบัญชีอาจารย์ซ้ำซ้อน</span>
                {duplicateGroups.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                    พบ {duplicateGroups.length} กลุ่ม
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white">
                    ไม่พบข้อมูลซ้ำ
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ตรวจหารายชื่ออาจารย์ที่มีชื่อ-นามสกุลซ้ำกันในระบบ เพื่อรวมข้อมูล (Merge) หรือลบบัญชีซ้ำ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {duplicateGroups.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  ไม่พบบัญชีผู้สอนที่ซ้ำซ้อนในระบบ
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                  ฐานข้อมูลอาจารย์ทั้งหมด ({users.length} ท่าน) มีบัญชีที่เป็นเอกลักษณ์ถูกต้องแล้ว ไม่มีชื่อ-นามสกุลซ้ำกัน
                </p>
              </div>
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>ตรวจสอบอีกครั้ง (Re-scan)</span>
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>คำแนะนำการจัดการบัญชีซ้ำ:</strong> เมื่อกด <strong>&quot;รวมบัญชี (Merge)&quot;</strong> ระบบจะรวมอีเมลและนามแฝงทั้งหมดเข้าสู่บัญชีหลัก และลบบัญชีซ้ำออกจากระบบและ Google Sheets ให้โดยอัตโนมัติ ทำให้ภาระงานสอนและการเข้าสู่ระบบไม่สูญหาย
                </div>
              </div>

              <div className="space-y-3">
                {duplicateGroups.map((group, gIdx) => {
                  const primary = group.accounts[0];
                  const duplicates = group.accounts.slice(1);

                  return (
                    <div
                      key={group.key || gIdx}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center">
                            {gIdx + 1}
                          </span>
                          <span className="font-bold text-sm text-slate-900">
                            {group.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            ซ้ำ {group.accounts.length} บัญชี
                          </span>
                        </div>
                      </div>

                      {/* Accounts Comparison */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {/* Primary Account Card */}
                        <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1.5 relative">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                              ⭐ บัญชีหลัก (Primary)
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">
                              ID: {primary.id}
                            </span>
                          </div>
                          <div className="font-bold text-slate-900">{primary.name}</div>
                          <div className="text-[11px] text-slate-600 truncate">
                            ✉️ {primary.email || primary.gmail || '-'}
                          </div>
                          {primary.instructorType && (
                            <div className="text-[10px] text-slate-500">
                              ประเภท: {primary.instructorType}
                            </div>
                          )}
                        </div>

                        {/* Duplicates to merge/delete */}
                        <div className="space-y-2">
                          {duplicates.map((dup) => (
                            <div
                              key={dup.id}
                              className="p-3 rounded-xl bg-rose-50/50 border border-rose-200 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                                  ⚠️ บัญชีซ้ำซ้อน
                                </span>
                                <span className="font-mono text-[10px] text-slate-500">
                                  ID: {dup.id}
                                </span>
                              </div>
                              <div className="font-bold text-slate-900">{dup.name}</div>
                              <div className="text-[11px] text-slate-600 truncate">
                                ✉️ {dup.email || dup.gmail || '-'}
                              </div>
                              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-rose-100">
                                <button
                                  type="button"
                                  onClick={() => handleMergeGroup(primary, dup)}
                                  disabled={processingId === dup.id || isMergingAll}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] shadow-xs cursor-pointer transition disabled:opacity-50"
                                  title="รวมอีเมลและนามแฝงทั้งหมดเข้าบัญชีหลัก และลบบัญชีนี้"
                                >
                                  <GitMerge className="w-3 h-3" />
                                  <span>
                                    {processingId === dup.id ? 'กำลังรวม...' : '🔗 รวมเข้าบัญชีหลัก'}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (window.confirm(`ยืนยันการลบบัญชี "${dup.name}" (ID: ${dup.id}) หรือไม่?`)) {
                                      await onDelete(dup);
                                      if (onRefresh) await onRefresh();
                                    }
                                  }}
                                  disabled={processingId === dup.id || isMergingAll}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-xs cursor-pointer transition disabled:opacity-50"
                                  title="ลบบัญชีนี้ออกจากระบบทันที"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>ลบ</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400" />
            <span>ระบบมีการกรองชื่อซ้ำอัตโนมัติในการแสดงผลเพื่อป้องกันความสับสน</span>
          </div>

          <div className="flex items-center gap-2">
            {duplicateGroups.length > 0 && (
              <button
                type="button"
                onClick={handleMergeAll}
                disabled={isMergingAll}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>
                  {isMergingAll ? 'กำลังรวมบัญชีทั้งหมด...' : '⚡ รวมและลบบัญชีซ้ำทั้งหมด'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
