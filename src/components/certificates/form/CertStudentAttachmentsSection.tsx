'use client';

import React from 'react';
import { Paperclip, UploadCloud, FileCheck2, Camera } from 'lucide-react';

interface CertStudentAttachmentsSectionProps {
  enrollmentSlipUrl: string;
  setEnrollmentSlipUrl: (val: string) => void;
  passportCopyUrl: string;
  setPassportCopyUrl: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  uploadingDoc: string | null;
  onFileUpload: (file: File, target: 'passport' | 'photo' | 'enrollment') => void;
}

export function CertStudentAttachmentsSection({
  enrollmentSlipUrl,
  setEnrollmentSlipUrl,
  passportCopyUrl,
  setPassportCopyUrl,
  email,
  setEmail,
  uploadingDoc,
  onFileUpload,
}: CertStudentAttachmentsSectionProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/90 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-purple-700" />
              <span>แนบเอกสารสำเนาใบลงทะเบียนเรียน</span>
            </label>
            <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
              รูปภาพ / PDF
            </span>
          </div>

          <p className="text-[11px] text-slate-600">
            ใบเสร็จรับเงิน หรือหลักฐานยืนยันการลงทะเบียนเรียนในภาคการศึกษาปัจจุบัน
          </p>

          {enrollmentSlipUrl ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-emerald-200 shadow-sm text-xs">
              <div className="flex items-center gap-2 truncate">
                <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <a
                  href={enrollmentSlipUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-emerald-800 underline truncate hover:text-emerald-900"
                  title="คลิกเพื่อเปิดดูไฟล์ที่แนบ"
                >
                  {enrollmentSlipUrl.toLowerCase().endsWith('.pdf')
                    ? '📄 ดูไฟล์ PDF สำเนาลงเรียน'
                    : '🖼️ ดูรูปภาพสำเนาลงเรียน'}
                </a>
              </div>
              <button
                type="button"
                onClick={() => setEnrollmentSlipUrl('')}
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer shrink-0 ml-2 shadow-xs"
              >
                ลบออก
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-1 w-full p-3 rounded-xl border-2 border-dashed border-purple-300 bg-white hover:bg-purple-50 text-purple-700 text-xs font-bold transition cursor-pointer shadow-xs">
              <div className="flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-purple-600" />
                <span>
                  {uploadingDoc === 'enrollment'
                    ? 'กำลังอัปโหลดไฟล์...'
                    : 'คลิกเลือกไฟล์สำเนาลงเรียน'}
                </span>
              </div>
              <span className="text-[10px] font-normal text-slate-500">
                (รองรับไฟล์ JPG, PNG, WEBP หรือ PDF)
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFileUpload(f, 'enrollment');
                }}
              />
            </label>
          )}
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-2">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              อีเมลติดต่อ (Email for Notifications):
            </label>
            <input
              type="email"
              placeholder="student@mcu.ac.th"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              สำหรับรับการแจ้งเตือนความคืบหน้าและผลการอนุมัติคำร้อง
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-4">
        <div className="flex items-center justify-between border-b border-purple-200/60 pb-2.5">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-purple-700" />
            <span className="font-bold text-xs sm:text-sm text-slate-900">
              แนบเอกสารประกอบคำร้องเพิ่มเติม (Additional Documents)
            </span>
          </div>
          <span className="text-[11px] text-purple-700 font-semibold">
            รองรับไฟล์ JPG, PNG หรือ PDF
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 bg-white rounded-xl border border-purple-100 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-sky-600" />
                สำเนาพาสปอร์ต / บัตร ปชช.
              </span>
              {passportCopyUrl && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  แนบแล้ว ✓
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              หน้าที่มีรูปถ่ายและวันหมดอายุชัดเจน (รูปภาพ หรือ PDF)
            </p>
            {passportCopyUrl ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-sky-50/60 border border-sky-200 text-xs">
                <a
                  href={passportCopyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-800 underline truncate max-w-[150px] font-medium"
                >
                  {passportCopyUrl.toLowerCase().endsWith('.pdf') ? '📄 ดูไฟล์ PDF พาสปอร์ต' : '🖼️ ดูภาพพาสปอร์ต'}
                </a>
                <button
                  type="button"
                  onClick={() => setPassportCopyUrl('')}
                  className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                >
                  ลบ
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-dashed border-sky-300 text-sky-700 hover:bg-sky-50 text-xs font-bold cursor-pointer transition">
                <UploadCloud className="w-4 h-4" />
                <span>{uploadingDoc === 'passport' ? 'กำลังอัปโหลด...' : 'เลือกไฟล์พาสปอร์ต'}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFileUpload(f, 'passport');
                  }}
                />
              </label>
            )}
          </div>

          <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200/90 shadow-sm space-y-1.5 flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div className="space-y-1 text-xs">
              <span className="font-extrabold text-amber-950 block">
                📸 รูปถ่ายขนาด 1.5 - 2 นิ้ว (นำมาติดเอง):
              </span>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                <strong>ไม่ต้องอัปโหลดรูปถ่ายในระบบ</strong> ให้นิสิตเตรียมรูปถ่ายขนาด 1.5 - 2 นิ้ว (หน้าตรง สวมชุดสุภาพ) มาติดด้วยตนเองบนเอกสารฉบับจริงในวันมารับหนังสือ ณ สำนักงานคณะ
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
