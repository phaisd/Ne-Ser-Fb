'use client';

import React from 'react';
import {
  GraduationCap,
  CheckSquare,
  Search,
  CheckCheck,
  Square,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';

export interface PromotionCandidate {
  studentCode: string;
  fullName: string;
  currentYear: number;
  currentStatus: string;
  programType: 'THAI' | 'ENGLISH';
  major?: string;
  actionType: 'PROMOTE' | 'REPEAT' | 'DROP' | 'GRADUATE' | 'RETIRE' | 'CUSTOM';
  newYear: number;
  newStatus: string;
  note: string;
  selected: boolean;
}

export interface PromotionStats {
  total: number;
  selectedCount: number;
  promoteCount: number;
  gradCount: number;
  repeatCount: number;
  dropCount: number;
  unselectedCount: number;
}

interface BulkPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  showConfirm: boolean;
  setShowConfirm: (show: boolean) => void;
  promotionStats: PromotionStats;
  promotionTargetYear: any;
  setPromotionTargetYear: (yr: any) => void;
  promotionProgramFilter: any;
  setPromotionProgramFilter: (prog: any) => void;
  promotionActionFilter: string;
  setPromotionActionFilter: (act: string) => void;
  promotionSearch: string;
  setPromotionSearch: (q: string) => void;
  filteredPromotionItems: any[];
  setFilteredPromotionSelection: (selected: boolean, items: any[]) => void;
  setFilteredPromotionAction: (action: any, items: any[]) => void;
  onResetRecommendation: () => void;
  onToggleSelect: (studentCode: string) => void;
  onActionChange: (studentCode: string, action: any) => void;
  onCustomFieldChange: (studentCode: string, field: 'newYear' | 'newStatus' | 'note', value: any) => void;
  promotionSubmitting: boolean;
  onExecuteBulkPromotion: () => void;
}

export function BulkPromotionModal({
  isOpen,
  onClose,
  showConfirm,
  setShowConfirm,
  promotionStats,
  promotionTargetYear,
  setPromotionTargetYear,
  promotionProgramFilter,
  setPromotionProgramFilter,
  promotionActionFilter,
  setPromotionActionFilter,
  promotionSearch,
  setPromotionSearch,
  filteredPromotionItems,
  setFilteredPromotionSelection,
  setFilteredPromotionAction,
  onResetRecommendation,
  onToggleSelect,
  onActionChange,
  onCustomFieldChange,
  promotionSubmitting,
  onExecuteBulkPromotion,
}: BulkPromotionModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-white rounded-3xl max-w-6xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[94vh] flex flex-col space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                  <span>เลื่อนชั้นปีการศึกษาและปรับสถานะนิสิตแบบยกชุด</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                    Bulk Academic Promotion
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ระบบช่วยคำนวณการเลื่อนชั้นปีอัตโนมัติล่วงหน้า (+1 ปี หรือ สำเร็จการศึกษาสำหรับปี 4) โดยเจ้าหน้าที่สามารถตรวจสอบข้อยกเว้น (ซ้ำชั้น / ดรอป / รักษาสภาพ) แล้วกดปุ่มยืนยันยกชุด
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Statistics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-slate-400 font-semibold text-[11px]">ทั้งหมดในระบบ</div>
              <div className="text-lg font-black text-slate-800">{promotionStats.total}</div>
              <div className="text-[10px] text-slate-500">รูป/คน</div>
            </div>
            <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-200/80">
              <div className="text-indigo-600 font-bold text-[11px] flex items-center justify-center gap-1">
                <CheckSquare className="w-3 h-3" /> เลือกทำรายการ
              </div>
              <div className="text-lg font-black text-indigo-700">{promotionStats.selectedCount}</div>
              <div className="text-[10px] text-indigo-500">รูป/คน</div>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200/80">
              <div className="text-emerald-700 font-bold text-[11px]">เลื่อนชั้นปกติ (+1)</div>
              <div className="text-lg font-black text-emerald-700">{promotionStats.promoteCount}</div>
              <div className="text-[10px] text-emerald-600">รูป/คน</div>
            </div>
            <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-200/80">
              <div className="text-purple-700 font-bold text-[11px]">🎓 สำเร็จการศึกษา</div>
              <div className="text-lg font-black text-purple-700">{promotionStats.gradCount}</div>
              <div className="text-[10px] text-purple-600">รูป/คน</div>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/80">
              <div className="text-amber-800 font-bold text-[11px]">⚠️ ซ้ำชั้น (คงปีเดิม)</div>
              <div className="text-lg font-black text-amber-800">{promotionStats.repeatCount}</div>
              <div className="text-[10px] text-amber-600">รูป/คน</div>
            </div>
            <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-200/80">
              <div className="text-sky-800 font-bold text-[11px]">⏸️ รักษาสภาพ/ดรอป</div>
              <div className="text-lg font-black text-sky-800">{promotionStats.dropCount}</div>
              <div className="text-[10px] text-sky-600">รูป/คน</div>
            </div>
            <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200">
              <div className="text-slate-500 font-semibold text-[11px]">ข้ามไม่ทำรายการ</div>
              <div className="text-lg font-black text-slate-600">{promotionStats.unselectedCount}</div>
              <div className="text-[10px] text-slate-400">รูป/คน</div>
            </div>
          </div>

          {/* Filter Toolbar & Quick Batch Controls */}
          <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Year Level Pills */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 font-bold">
                <span className="text-[11px] text-slate-400 px-2 font-medium">ชั้นปีปัจจุบัน:</span>
                {(['ALL', '1', '2', '3', '4'] as const).map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setPromotionTargetYear(yr)}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-xs ${
                      promotionTargetYear === yr
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {yr === 'ALL' ? 'ทั้งหมด' : `ปี ${yr}`}
                  </button>
                ))}
              </div>

              {/* Program Pills */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 font-bold">
                {(['ALL', 'THAI', 'ENGLISH'] as const).map((prog) => (
                  <button
                    key={prog}
                    type="button"
                    onClick={() => setPromotionProgramFilter(prog)}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-xs ${
                      promotionProgramFilter === prog
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {prog === 'ALL' ? 'ทุกหลักสูตร' : prog === 'THAI' ? '🇹🇭 ภาคไทย' : '🌐 ภาคอังกฤษ'}
                  </button>
                ))}
              </div>

              {/* Action Filter */}
              <select
                value={promotionActionFilter}
                onChange={(e) => setPromotionActionFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium cursor-pointer"
              >
                <option value="ALL">ตัวกรองการดำเนินการ: ทั้งหมด</option>
                <option value="SELECTED_ONLY">เฉพาะที่เลือกทำรายการ (✓)</option>
                <option value="UNSELECTED_ONLY">เฉพาะที่ไม่ได้เลือก</option>
                <option value="PROMOTE">🟢 เฉพาะเลื่อนชั้นปกติ (+1)</option>
                <option value="GRADUATE">🎓 เฉพาะสำเร็จการศึกษา</option>
                <option value="REPEAT">⚠️ เฉพาะซ้ำชั้น</option>
                <option value="DROP">⏸️ เฉพาะรักษาสภาพ/ดรอป</option>
              </select>
            </div>

            {/* Search & Batch Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาด้วยรหัสนิสิต, ชื่อ-สกุล หรือสาขาวิชา..."
                  value={promotionSearch}
                  onChange={(e) => setPromotionSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto shrink-0 justify-end">
                <button
                  type="button"
                  onClick={() => setFilteredPromotionSelection(true, filteredPromotionItems)}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 flex items-center gap-1 transition cursor-pointer text-xs"
                  title="เลือกทุกรายการที่แสดงในตารางขณะนี้"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>เลือกที่แสดง ({filteredPromotionItems.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilteredPromotionSelection(false, filteredPromotionItems)}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 flex items-center gap-1 transition cursor-pointer text-xs"
                  title="ยกเลิกการเลือกทุกรายการที่แสดง"
                >
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                  <span>ยกเลิกที่แสดง</span>
                </button>

                {/* Bulk Set Action Dropdown */}
                <select
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const val = e.target.value as any;
                    setFilteredPromotionAction(val, filteredPromotionItems);
                    e.target.value = '';
                  }}
                  defaultValue=""
                  className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl font-bold text-indigo-700 cursor-pointer text-xs"
                >
                  <option value="" disabled>
                    ⚡ ปรับกลุ่มที่แสดงเป็น...
                  </option>
                  <option value="PROMOTE">🟢 เลื่อนชั้นปกติ (+1 ปี)</option>
                  <option value="REPEAT">⚠️ ซ้ำชั้น (คงชั้นปีเดิม)</option>
                  <option value="DROP">⏸️ รักษาสภาพ / ดรอป</option>
                  <option value="GRADUATE">🎓 สำเร็จการศึกษา</option>
                </select>

                <button
                  type="button"
                  onClick={onResetRecommendation}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-600 flex items-center gap-1 transition cursor-pointer text-xs"
                  title="คืนค่าการตั้งค่าทั้งหมดกลับเป็นค่าที่ระบบคำนวณให้อัตโนมัติ"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>คืนค่าแนะนำ</span>
                </button>
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl bg-white shadow-inner max-h-[46vh]">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 sticky top-0 border-b border-slate-200 z-10">
                <tr>
                  <th className="px-3.5 py-2.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredPromotionItems.length > 0 &&
                        filteredPromotionItems.every((item) => item.selected)
                      }
                      onChange={(e) =>
                        setFilteredPromotionSelection(e.target.checked, filteredPromotionItems)
                      }
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-2.5">รหัสนิสิต / ข้อมูลนิสิต</th>
                  <th className="px-3 py-2.5 text-center">ปัจจุบัน</th>
                  <th className="px-2 py-2.5 text-center w-8"></th>
                  <th className="px-3 py-2.5">การดำเนินการ / ข้อยกเว้น</th>
                  <th className="px-3 py-2.5 text-center">ผลลัพธ์ที่จะบันทึก</th>
                  <th className="px-3 py-2.5">บันทึกเหตุผล / หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPromotionItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      ไม่พบข้อมูลนิสิตตามเงื่อนไขที่เลือก
                    </td>
                  </tr>
                ) : (
                  filteredPromotionItems.map((item) => {
                    const isEnglish = item.programType === 'ENGLISH';
                    return (
                      <tr
                        key={item.studentCode}
                        className={`hover:bg-slate-50/80 transition ${
                          item.selected ? 'bg-indigo-50/20' : 'opacity-60 bg-slate-50/40'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-3.5 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => onToggleSelect(item.studentCode)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>

                        {/* Student Info */}
                        <td className="px-3 py-2">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{item.studentCode}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold ${
                                isEnglish
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {isEnglish ? 'EN' : 'TH'}
                            </span>
                          </div>
                          <div className="text-slate-700 font-medium truncate max-w-[200px]">
                            {item.fullName}
                          </div>
                          {item.major && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                              {item.major}
                            </div>
                          )}
                        </td>

                        {/* Current Status */}
                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-bold text-slate-800">ชั้นปีที่ {item.currentYear}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              {item.currentStatus}
                            </span>
                          </div>
                        </td>

                        {/* Arrow */}
                        <td className="px-2 py-2 text-center text-slate-400">
                          <ArrowRight className="w-4 h-4 mx-auto text-indigo-500" />
                        </td>

                        {/* Action Selector */}
                        <td className="px-3 py-2">
                          <select
                            value={item.actionType}
                            onChange={(e) =>
                              onActionChange(item.studentCode, e.target.value as any)
                            }
                            className={`w-full px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition ${
                              item.actionType === 'PROMOTE'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : item.actionType === 'GRADUATE'
                                ? 'bg-purple-50 border-purple-300 text-purple-800'
                                : item.actionType === 'REPEAT'
                                ? 'bg-amber-50 border-amber-300 text-amber-900'
                                : item.actionType === 'DROP'
                                ? 'bg-sky-50 border-sky-300 text-sky-900'
                                : item.actionType === 'RETIRE'
                                ? 'bg-rose-50 border-rose-300 text-rose-900'
                                : 'bg-slate-50 border-slate-300 text-slate-800'
                            }`}
                          >
                            <option value="PROMOTE">🟢 เลื่อนชั้นปกติ (+1 ปี)</option>
                            <option value="REPEAT">⚠️ ซ้ำชั้น (คงชั้นปีเดิม)</option>
                            <option value="DROP">⏸️ รักษาสภาพ / ดรอป (คงปีเดิม)</option>
                            <option value="GRADUATE">🎓 สำเร็จการศึกษา</option>
                            <option value="RETIRE">❌ พ้นสภาพนิสิต</option>
                            <option value="CUSTOM">⚙️ กำหนดชั้นปีและสถานะเอง (Custom)</option>
                          </select>

                          {/* Custom Controls if selected */}
                          {item.actionType === 'CUSTOM' && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <select
                                value={item.newYear}
                                onChange={(e) =>
                                  onCustomFieldChange(
                                    item.studentCode,
                                    'newYear',
                                    Number(e.target.value)
                                  )
                                }
                                className="px-2 py-1 rounded-lg border border-slate-200 text-[11px] bg-white font-bold"
                              >
                                <option value={1}>ปี 1</option>
                                <option value={2}>ปี 2</option>
                                <option value={3}>ปี 3</option>
                                <option value={4}>ปี 4</option>
                              </select>
                              <select
                                value={item.newStatus}
                                onChange={(e) =>
                                  onCustomFieldChange(
                                    item.studentCode,
                                    'newStatus',
                                    e.target.value
                                  )
                                }
                                className="px-2 py-1 rounded-lg border border-slate-200 text-[11px] bg-white font-bold"
                              >
                                <option value="ปกติ">ปกติ</option>
                                <option value="ซ้ำชั้น">ซ้ำชั้น</option>
                                <option value="รักษาสภาพ">รักษาสภาพ</option>
                                <option value="สำเร็จการศึกษา">สำเร็จการศึกษา</option>
                                <option value="เทียบโอน">เทียบโอน</option>
                                <option value="พ้นสภาพ">พ้นสภาพ</option>
                              </select>
                            </div>
                          )}
                        </td>

                        {/* Proposed Result Preview */}
                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-extrabold text-indigo-700">
                              ชั้นปีที่ {item.newYear}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                item.newStatus === 'สำเร็จการศึกษา'
                                  ? 'bg-purple-100 text-purple-700 border-purple-200'
                                  : item.newStatus === 'ซ้ำชั้น'
                                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                                  : item.newStatus === 'รักษาสภาพ'
                                  ? 'bg-sky-100 text-sky-800 border-sky-200'
                                  : item.newStatus === 'พ้นสภาพ'
                                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                                  : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {item.newStatus}
                            </span>
                          </div>
                        </td>

                        {/* Note / Exemption Remarks */}
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.note}
                            onChange={(e) =>
                              onCustomFieldChange(
                                item.studentCode,
                                'note',
                                e.target.value
                              )
                            }
                            placeholder="เช่น ติดแก้ I, ขอดรอป 1 เทอม"
                            className="w-full px-2.5 py-1 rounded-xl border border-slate-200 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="text-slate-500 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              <span>
                กำลังเลือกดำเนินการ <strong className="text-slate-900">{promotionStats.selectedCount}</strong> จาก{' '}
                {promotionStats.total} คน
              </span>
              {promotionStats.repeatCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                  ⚠️ ซ้ำชั้น {promotionStats.repeatCount} คน
                </span>
              )}
              {promotionStats.dropCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold text-[10px]">
                  ⏸️ รักษาสภาพ {promotionStats.dropCount} คน
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={promotionStats.selectedCount === 0 || promotionSubmitting}
                onClick={() => setShowConfirm(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <GraduationCap className="w-4 h-4" />
                <span>
                  🚀 ตรวจสอบและยืนยันเลื่อนชั้นปี ({promotionStats.selectedCount} คน)
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-700">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  ยืนยันการเลื่อนชั้นปี
                </h3>
                <p className="text-xs text-slate-500">
                  โปรดตรวจสอบข้อมูลก่อนยืนยัน
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
              <div className="font-bold text-slate-800 border-b pb-1.5 flex justify-between">
                <span>จำนวนที่เลือกดำเนินการ:</span>
                <span className="text-indigo-700 font-extrabold text-sm">
                  {promotionStats.selectedCount} รูป/คน
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex justify-between bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-emerald-700 font-semibold">🟢 เลื่อนชั้นปกติ (+1 ปี):</span>
                  <span className="font-bold">{promotionStats.promoteCount}</span>
                </div>
                <div className="flex justify-between bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-purple-700 font-semibold">🎓 สำเร็จการศึกษา:</span>
                  <span className="font-bold">{promotionStats.gradCount}</span>
                </div>
                <div className="flex justify-between bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-amber-700 font-semibold">⚠️ ซ้ำชั้น (คงปีเดิม):</span>
                  <span className="font-bold">{promotionStats.repeatCount}</span>
                </div>
                <div className="flex justify-between bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-sky-700 font-semibold">⏸️ ดรอป / รักษาสภาพ:</span>
                  <span className="font-bold">{promotionStats.dropCount}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong>ข้อควรระวัง:</strong> ข้อมูลจะถูกอัปเดตทั้งในระบบฐานข้อมูล และบันทึกลง Google Sheets ทันที
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={promotionSubmitting}
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                ย้อนกลับไปแก้ไข
              </button>
              <button
                type="button"
                disabled={promotionSubmitting}
                onClick={onExecuteBulkPromotion}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {promotionSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังดำเนินการ...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>ยืนยันและดำเนินการ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
