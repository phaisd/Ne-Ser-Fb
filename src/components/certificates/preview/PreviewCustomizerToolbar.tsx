'use client';

import React from 'react';
import { UserCog, Type, MoveVertical, Sparkles } from 'lucide-react';

export type PreviewTemplateType =
  | 'THAI_STANDARD'
  | 'BANK_LETTER'
  | 'ENG_CERT'
  | 'INTERNAL_MEMO'
  | 'STAFF_CERT';

export interface PreviewCustomizerToolbarProps {
  previewTemplate: PreviewTemplateType;
  setPreviewTemplate: (val: PreviewTemplateType) => void;
  customSigner: { name: string; title: string };
  setCustomSigner: React.Dispatch<React.SetStateAction<{ name: string; title: string }>>;
  docFontFamily: string;
  setDocFontFamily: (val: string) => void;
  docFontSize: number;
  setDocFontSize: React.Dispatch<React.SetStateAction<number>>;
  signerFontSize: number;
  setSignerFontSize: React.Dispatch<React.SetStateAction<number>>;
  docLineSpacing: number;
  setDocLineSpacing: React.Dispatch<React.SetStateAction<number>>;
  docSignerOffset: number;
  setDocSignerOffset: React.Dispatch<React.SetStateAction<number>>;
  headerTitleSpacing: number;
  setHeaderTitleSpacing: React.Dispatch<React.SetStateAction<number>>;
  headerTopSpacing: number;
  setHeaderTopSpacing: React.Dispatch<React.SetStateAction<number>>;
  photoBoxOffsetX: number;
  setPhotoBoxOffsetX: React.Dispatch<React.SetStateAction<number>>;
  dotsCount: number;
  setDotsCount: React.Dispatch<React.SetStateAction<number>>;
  studentSignFontSize: number;
  setStudentSignFontSize: React.Dispatch<React.SetStateAction<number>>;
  studentSignAlign: 'left' | 'center' | 'right';
  setStudentSignAlign: (val: 'left' | 'center' | 'right') => void;
  studentSignOffsetX: number;
  setStudentSignOffsetX: React.Dispatch<React.SetStateAction<number>>;
  showPhotoBox: boolean;
  setShowPhotoBox: (val: boolean) => void;
  showStudentSign: boolean;
  setShowStudentSign: (val: boolean) => void;
}

export function PreviewCustomizerToolbar({
  previewTemplate,
  setPreviewTemplate,
  customSigner,
  setCustomSigner,
  docFontFamily,
  setDocFontFamily,
  docFontSize,
  setDocFontSize,
  signerFontSize,
  setSignerFontSize,
  docLineSpacing,
  setDocLineSpacing,
  docSignerOffset,
  setDocSignerOffset,
  headerTitleSpacing,
  setHeaderTitleSpacing,
  headerTopSpacing,
  setHeaderTopSpacing,
  photoBoxOffsetX,
  setPhotoBoxOffsetX,
  dotsCount,
  setDotsCount,
  studentSignFontSize,
  setStudentSignFontSize,
  studentSignAlign,
  setStudentSignAlign,
  studentSignOffsetX,
  setStudentSignOffsetX,
  showPhotoBox,
  setShowPhotoBox,
  showStudentSign,
  setShowStudentSign,
}: PreviewCustomizerToolbarProps) {
  return (
<div className="p-4 bg-purple-50/80 border-b border-purple-200/80 space-y-3 print:hidden text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="font-bold text-purple-900 flex items-center gap-1.5">
                  <UserCog className="w-4 h-4 text-purple-600" />
                  <span>ปรับแต่งรูปแบบเอกสาร (Document Controls)</span>
                </label>
                <span className="text-[11px] text-purple-700 bg-purple-100/90 px-2.5 py-0.5 rounded-full font-semibold">
                  ✍️ คลิกบนข้อความเพื่อพิมพ์แก้ไขสดได้ทันที
                </span>
              </div>

              {/* Template Selector & Signer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ชนิดแบบฟอร์มเอกสาร:
                  </label>
                  <select
                    value={previewTemplate}
                    onChange={(e) => setPreviewTemplate(e.target.value as PreviewTemplateType)}
                    className="w-full px-2.5 py-2 rounded-xl border border-purple-300 bg-white font-bold text-xs text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm cursor-pointer"
                  >
                    <option value="THAI_STANDARD">📜 รับรองนิสิต (ไทย) + รูปถ่าย (หน้า 2-9)</option>
                    <option value="STAFF_CERT">👔 หนังสือรับรองอาจารย์และบุคลากร</option>
                    <option value="BANK_LETTER">🏦 ขอความอนุเคราะห์ธนาคาร (หน้า 1)</option>
                    <option value="ENG_CERT">🌐 รับรองภาษาอังกฤษ (TO WHOM) (PDF 2)</option>
                    <option value="INTERNAL_MEMO">📑 บันทึกข้อความราชการ (หน้า 10)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ชื่อผู้ลงนาม:
                  </label>
                  <input
                    type="text"
                    value={customSigner.name}
                    onChange={(e) => setCustomSigner({ ...customSigner, name: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl border border-purple-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ตำแหน่งผู้ลงนาม:
                  </label>
                  <input
                    type="text"
                    value={customSigner.title}
                    onChange={(e) => setCustomSigner({ ...customSigner, title: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl border border-purple-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm"
                  />
                </div>
              </div>

              {/* Typography & Layout Spacing Toolbar */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-purple-200/60">
                {/* Font Family Selector (Official Government Fonts) */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-sm">
                  <Type className="w-3.5 h-3.5 text-purple-600" />
                  <span className="font-semibold text-slate-600">ฟอนต์:</span>
                  <select
                    value={docFontFamily}
                    onChange={(e) => setDocFontFamily(e.target.value)}
                    className="bg-transparent font-bold text-purple-900 focus:outline-none cursor-pointer text-xs"
                    title="เลือกฟอนต์หนังสือราชการไทยหรืออังกฤษ"
                  >
                    <optgroup label="🇹🇭 ฟอนต์ราชการไทย">
                      <option value="'Sarabun', 'TH Sarabun New', 'TH Sarabun PSK', sans-serif">
                        TH Sarabun (มาตรฐานหนังสือราชการ)
                      </option>
                      <option value="'Krub', sans-serif">Krub (ราชการทางการ)</option>
                      <option value="'Bai Jamjuree', sans-serif">Bai Jamjuree (ทางการ)</option>
                    </optgroup>
                    <optgroup label="🌐 ฟอนต์สากล / ภาษาอังกฤษ (Official EN)">
                      <option value="'Times New Roman', Times, serif">
                        Times New Roman (มาตรฐานสากล)
                      </option>
                      <option value="'Georgia', serif">Georgia (ทางการ)</option>
                      <option value="'Garamond', serif">Garamond (ทางการคลาสสิก)</option>
                      <option value="'Arial', sans-serif">Arial (สากล Clean)</option>
                    </optgroup>
                  </select>
                </div>

                {/* Font Size (Content & ที่ อว) */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-sm" title="ขนาดตัวอักษรเนื้อหา และ ที่ อว (ปรับเท่ากัน)">
                  <span className="font-semibold text-slate-600">ขนาดเนื้อหา & ที่ อว:</span>
                  <button
                    type="button"
                    onClick={() => setDocFontSize((s) => Math.max(11, s - 1))}
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-7 text-center font-bold text-purple-800">{docFontSize}pt</span>
                  <button
                    type="button"
                    onClick={() => setDocFontSize((s) => Math.min(24, s + 1))}
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Signer Font Size */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-blue-200 shadow-sm" title="ขนาดตัวอักษรผู้ลงนามและตำแหน่ง (สีน้ำเงิน)">
                  <span className="font-semibold text-blue-700">ขนาดผู้ลงนาม:</span>
                  <button
                    type="button"
                    onClick={() => setSignerFontSize((s) => Math.max(9, s - 1))}
                    className="w-5 h-5 rounded bg-blue-50 hover:bg-blue-100 font-bold text-blue-800 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-7 text-center font-bold text-blue-900">{signerFontSize}pt</span>
                  <button
                    type="button"
                    onClick={() => setSignerFontSize((s) => Math.min(22, s + 1))}
                    className="w-5 h-5 rounded bg-blue-50 hover:bg-blue-100 font-bold text-blue-800 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Line Spacing */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-sm">
                  <MoveVertical className="w-3.5 h-3.5 text-purple-600" />
                  <span className="font-semibold text-slate-600">ระยะบรรทัด:</span>
                  <select
                    value={docLineSpacing}
                    onChange={(e) => setDocLineSpacing(parseFloat(e.target.value))}
                    className="bg-transparent font-bold text-purple-800 focus:outline-none cursor-pointer"
                  >
                    <option value={1.3}>1.3</option>
                    <option value={1.5}>1.5</option>
                    <option value={1.7}>1.7</option>
                    <option value={2.0}>2.0</option>
                  </select>
                </div>

                {/* Signature Offset */}
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-sm">
                  <span className="font-semibold text-slate-600">ขยับลายเซ็น:</span>
                  <button
                    type="button"
                    onClick={() => setDocSignerOffset((o) => Math.max(0, o - 10))}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-semibold cursor-pointer"
                  >
                    ⬆
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocSignerOffset((o) => Math.min(120, o + 10))}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-semibold cursor-pointer"
                  >
                    ⬇
                  </button>
                </div>

                {/* Header & Title Spacing (เว้นช่องใส่ตรา 1-2 นิ้ว หรือแบบฟอร์มกระดาษราชการ) */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-sky-200 shadow-sm text-xs" title="ปรับระยะห่างความสูงระหว่าง ที่ อว กับ หนังสือรับรอง เพื่อเว้นช่องใส่ตรา 1-2 นิ้ว หรือแบบฟอร์มสำเร็จรูปของหน่วยงาน">
                  <span className="font-semibold text-sky-800">เว้นช่องตรา (ที่ อว ↔ ชื่อเรื่อง):</span>
                  <button
                    type="button"
                    onClick={() => setHeaderTitleSpacing((s) => Math.max(0, s - 10))}
                    className="w-5 h-5 rounded bg-sky-50 hover:bg-sky-100 font-bold text-sky-800 flex items-center justify-center cursor-pointer"
                    title="ลดระยะห่าง (-10px)"
                  >
                    -
                  </button>
                  <span className="font-mono text-xs font-bold text-sky-900 min-w-16 text-center">
                    {headerTitleSpacing}px {headerTitleSpacing >= 180 ? '(~2 นิ้ว)' : headerTitleSpacing >= 135 ? '(~1.5 นิ้ว)' : headerTitleSpacing >= 90 ? '(~1 นิ้ว)' : headerTitleSpacing === 24 ? '(ปกติ)' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHeaderTitleSpacing((s) => Math.min(260, s + 10))}
                    className="w-5 h-5 rounded bg-sky-50 hover:bg-sky-100 font-bold text-sky-800 flex items-center justify-center cursor-pointer"
                    title="เพิ่มระยะห่าง (+10px)"
                  >
                    +
                  </button>
                  
                  {/* Preset shortcut chips */}
                  <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-slate-200">
                    <button
                      type="button"
                      onClick={() => setHeaderTitleSpacing(24)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                        headerTitleSpacing === 24 ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="ระยะมาตรฐาน (24px)"
                    >
                      ปกติ
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeaderTitleSpacing(96)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                        headerTitleSpacing === 96 ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="เว้นช่องตรา 1 นิ้ว (96px)"
                    >
                      1 นิ้ว
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeaderTitleSpacing(144)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                        headerTitleSpacing === 144 ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="เว้นช่องตรา 1.5 นิ้ว (144px)"
                    >
                      1.5 นิ้ว
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeaderTitleSpacing(192)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                        headerTitleSpacing === 192 ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="เว้นช่องตรา 2 นิ้ว (192px)"
                    >
                      2 นิ้ว
                    </button>
                  </div>
                </div>

                {/* Top Margin (เว้นหัวกระดาษแบบฟอร์มหน่วยงาน) */}
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-sky-200 shadow-sm text-xs" title="ขยับ ที่ อว ลงเพื่อเว้นหัวกระดาษที่มีข้อความแบบฟอร์มพิมพ์ไว้แล้ว">
                  <span className="font-semibold text-slate-600">ขยับ ที่ อว ลง:</span>
                  <button
                    type="button"
                    onClick={() => setHeaderTopSpacing((t) => Math.max(0, t - 10))}
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                    title="ลดระยะหัวกระดาษ (-10px)"
                  >
                    -
                  </button>
                  <span className="font-mono text-xs font-bold text-slate-800 w-8 text-center">
                    {headerTopSpacing}px
                  </span>
                  <button
                    type="button"
                    onClick={() => setHeaderTopSpacing((t) => Math.min(150, t + 10))}
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                    title="เพิ่มระยะหัวกระดาษ (+10px)"
                  >
                    +
                  </button>
                </div>

                {/* Photo Box Shift */}
                {showPhotoBox && (
                  <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-rose-200 shadow-sm" title="ขยับกรอบรูป">
                    <span className="font-semibold text-rose-700">กรอบรูป:</span>
                    <button
                      type="button"
                      onClick={() => setPhotoBoxOffsetX((x) => Math.max(0, x - 20))}
                      className="px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 font-bold text-xs text-rose-800 cursor-pointer"
                    >
                      ◀ ซ้าย
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoBoxOffsetX(0)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                        photoBoxOffsetX === 0 ? 'bg-rose-100 text-rose-900' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      ชิดซ้าย
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoBoxOffsetX(100)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                        photoBoxOffsetX === 100 ? 'bg-rose-100 text-rose-900' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      กลาง
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoBoxOffsetX((x) => Math.min(300, x + 20))}
                      className="px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 font-bold text-xs text-rose-800 cursor-pointer"
                    >
                      ขวา ▶
                    </button>
                  </div>
                )}

                {/* Dots Length */}
                {showStudentSign && (
                  <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-amber-200 shadow-sm" title="ปรับความยาวจุดไข่ปลา">
                    <span className="font-semibold text-amber-800">จุดไข่ปลา:</span>
                    <button
                      type="button"
                      onClick={() => setDotsCount((d) => Math.max(8, d - 4))}
                      className="px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 font-bold text-xs text-amber-900 cursor-pointer"
                    >
                      - สั้นลง
                    </button>
                    <span className="w-8 text-center font-bold text-amber-900 font-mono text-xs">{dotsCount} จุด</span>
                    <button
                      type="button"
                      onClick={() => setDotsCount((d) => Math.min(55, d + 4))}
                      className="px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 font-bold text-xs text-amber-900 cursor-pointer"
                    >
                      + ยาวขึ้น
                    </button>
                  </div>
                )}

                {/* Student Name Font Size (ขนาดชื่อนิสิต) */}
                {showStudentSign && (
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-indigo-200 shadow-sm" title="ขนาดตัวอักษรชื่อ-นามสกุลนิสิต">
                    <span className="font-semibold text-indigo-700">ขนาดชื่อนิสิต:</span>
                    <button
                      type="button"
                      onClick={() => setStudentSignFontSize((s) => Math.max(9, s - 1))}
                      className="w-5 h-5 rounded bg-indigo-50 hover:bg-indigo-100 font-bold text-indigo-800 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-7 text-center font-bold text-indigo-900">{studentSignFontSize}pt</span>
                    <button
                      type="button"
                      onClick={() => setStudentSignFontSize((s) => Math.min(24, s + 1))}
                      className="w-5 h-5 rounded bg-indigo-50 hover:bg-indigo-100 font-bold text-indigo-800 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                )}

                {/* Student Signature (Name) Shift */}
                {showStudentSign && (
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-sm text-xs">
                    <span className="font-semibold text-slate-600">ตำแหน่ง (ชื่อ):</span>
                    <button
                      type="button"
                      onClick={() => {
                        setStudentSignAlign('left');
                        setStudentSignOffsetX(0);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                        studentSignAlign === 'left' && studentSignOffsetX === 0
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="จัดชิดซ้ายของจุดไข่ปลา"
                    >
                      ◀ ซ้าย
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStudentSignAlign('center');
                        setStudentSignOffsetX(0);
                      }}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                        studentSignAlign === 'center' && studentSignOffsetX === 0
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="จัดกึ่งกลางของจุดไข่ปลา"
                    >
                      กึ่งกลาง
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStudentSignAlign('right');
                        setStudentSignOffsetX(0);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                        studentSignAlign === 'right' && studentSignOffsetX === 0
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="จัดชิดขวาของจุดไข่ปลา"
                    >
                      ขวา ▶
                    </button>
                    {/* Fine-tuning offset nudge */}
                    <div className="flex items-center gap-0.5 ml-1 pl-1.5 border-l border-slate-200">
                      <button
                        type="button"
                        onClick={() => setStudentSignOffsetX((x) => x - 5)}
                        className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                        title="ขยับละเอียดไปทางซ้าย (-5px)"
                      >
                        -
                      </button>
                      <span className="font-mono text-[10px] text-slate-500 w-8 text-center" title="ระยะขยับละเอียด (px)">
                        {studentSignOffsetX > 0 ? `+${studentSignOffsetX}` : studentSignOffsetX}px
                      </span>
                      <button
                        type="button"
                        onClick={() => setStudentSignOffsetX((x) => x + 5)}
                        className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                        title="ขยับละเอียดไปทางขวา (+5px)"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Toggles */}
                <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-xl border border-purple-200 shadow-sm">
                  <label className="flex items-center gap-1 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPhotoBox}
                      onChange={(e) => setShowPhotoBox(e.target.checked)}
                      className="rounded text-purple-600"
                    />
                    <span>กรอบรูป 1.5&quot;</span>
                  </label>
                  <label className="flex items-center gap-1 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showStudentSign}
                      onChange={(e) => setShowStudentSign(e.target.checked)}
                      className="rounded text-purple-600"
                    />
                    <span>ลายเซ็นนิสิต</span>
                  </label>
                </div>
              </div>

              <div className="text-[11px] text-amber-800 bg-amber-50/80 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span><b>คำแนะนำ:</b> ท่านสามารถใช้เมาส์คลิกที่ข้อความใดๆ ในเอกสารเพื่อพิมพ์แก้ไขคำ เปลี่ยนชื่อธนาคาร หรือปรับข้อความได้ทันทีก่อนสั่งพิมพ์หรือดาวน์โหลด PDF</span>
              </div>
            </div>
  );
}
