'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileUp,
  Download,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Course } from '@/types';

interface CourseImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCourses?: Course[];
  onSuccess: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Robust CSV / TSV / Excel text parser for Courses & Schedules
// ─────────────────────────────────────────────────────────────────────────────
function parseCSVToCourses(rawText: string): Partial<Course>[] {
  const text = rawText.trim();
  if (!text) return [];

  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' || char === "'") {
      if (inQuotes && next === char) {
        current += char;
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === '\r' && next === '\n') || char === '\n' || char === '\r') {
      if (!inQuotes) {
        lines.push(current);
        current = '';
        if (char === '\r' && next === '\n') i++;
      } else {
        current += '\n';
      }
    } else {
      current += char;
    }
  }
  if (current.trim()) lines.push(current);
  if (lines.length < 2) return [];

  // Determine delimiter: tab or comma
  const headerLine = lines[0];
  const delimiter = headerLine.includes('\t') ? '\t' : ',';

  const parseLine = (line: string): string[] => {
    const cols: string[] = [];
    let col = '';
    let inQ = false;
    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      const n = line[j + 1];
      if (c === '"') {
        if (inQ && n === '"') {
          col += '"';
          j++;
        } else {
          inQ = !inQ;
        }
      } else if (c === delimiter && !inQ) {
        cols.push(col.trim());
        col = '';
      } else {
        col += c;
      }
    }
    cols.push(col.trim());
    return cols;
  };

  const headers = parseLine(headerLine).map((h) => h.toLowerCase().replace(/[\s\-_()]/g, ''));
  const parsed: Partial<Course>[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseLine(lines[i]);
    const obj: Record<string, string> = {};

    headers.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx] : '';
    });

    const code =
      obj['รหัสวิชา'] ||
      obj['coursecode'] ||
      obj['code'] ||
      obj['รหัส'] ||
      obj['subjectcode'] ||
      values[0] ||
      '';

    const name =
      obj['ชื่อรายวิชาไทย'] ||
      obj['ชื่อรายวิชา'] ||
      obj['coursename'] ||
      obj['ชื่อวิชา'] ||
      obj['nameth'] ||
      values[1] ||
      '';

    if (!code && !name) continue;

    const nameEn =
      obj['ชื่อรายวิชาอังกฤษ'] ||
      obj['coursenameen'] ||
      obj['nameen'] ||
      values[2] ||
      '';

    const rawCredits = obj['หน่วยกิต'] || obj['credits'] || obj['credit'] || values[3] || '3';
    const credits = parseInt(rawCredits.replace(/\D/g, ''), 10) || 3;

    const rawProg = (obj['หลักสูตร'] || obj['programtype'] || obj['program'] || values[4] || '').toUpperCase();
    const programType = rawProg.includes('ENG') || rawProg.includes('INTER') ? 'ENGLISH' : 'THAI';

    const degree =
      obj['ระดับหลักสูตร'] ||
      obj['degreelevel'] ||
      obj['degree'] ||
      obj['ระดับการศึกษา'] ||
      values[5] ||
      'ปริญญาตรี';

    const major =
      obj['สาขาวิชา'] ||
      obj['major'] ||
      obj['department'] ||
      values[6] ||
      'พระพุทธศาสนา';

    const rawYear = obj['ชั้นปี'] || obj['yearlevel'] || obj['year'] || values[7] || '1';
    const yearLevel = parseInt(rawYear.replace(/\D/g, ''), 10) || 1;

    const section = obj['ตอนเรียน'] || obj['section'] || obj['sec'] || values[8] || (programType === 'ENGLISH' ? 'EN' : '1');
    const academicYear = obj['ปีการศึกษา'] || obj['academicyear'] || values[9] || '2569';
    const semester = parseInt((obj['ภาคเรียน'] || obj['semester'] || values[10] || '1').replace(/\D/g, ''), 10) || 1;
    const instructor = obj['อาจารย์ผู้สอน'] || obj['instructor'] || obj['teacher'] || values[11] || '';

    // Day of week conversion
    const rawDay = obj['วันเรียน'] || obj['dayofweek'] || obj['day'] || values[12] || '';
    let dayOfWeek = 1;
    if (rawDay.includes('จันทร์') || rawDay === '1') dayOfWeek = 1;
    else if (rawDay.includes('อังคาร') || rawDay === '2') dayOfWeek = 2;
    else if (rawDay.includes('พุธ') || rawDay === '3') dayOfWeek = 3;
    else if (rawDay.includes('พฤหัส') || rawDay === '4') dayOfWeek = 4;
    else if (rawDay.includes('ศุกร์') || rawDay === '5') dayOfWeek = 5;
    else if (rawDay.includes('เสาร์') || rawDay === '6') dayOfWeek = 6;
    else if (rawDay.includes('อาทิตย์') || rawDay === '0' || rawDay === '7') dayOfWeek = 7;

    const startTime = obj['เวลาเริ่ม'] || obj['starttime'] || values[13] || '09.00';
    const endTime = obj['เวลาสิ้นสุด'] || obj['endtime'] || values[14] || '11.30';
    const room = obj['ห้องเรียน'] || obj['room'] || values[15] || '';
    const description = obj['คำอธิบายรายวิชา'] || obj['description'] || values[16] || '';

    parsed.push({
      courseCode: code.trim(),
      courseName: name.trim(),
      courseNameEn: nameEn.trim(),
      credits,
      programType,
      degreeLevel: degree.trim(),
      major: major.trim(),
      yearLevel,
      section: section.trim(),
      academicYear: academicYear.trim(),
      semester,
      term: `${semester}/${academicYear}`,
      instructor: instructor.trim(),
      dayOfWeek,
      startTime: startTime.replace(/:/g, '.').trim(),
      endTime: endTime.replace(/:/g, '.').trim(),
      room: room.trim(),
      description: description.trim(),
    });
  }

  return parsed;
}

export const CourseImportModal: React.FC<CourseImportModalProps> = ({
  isOpen,
  onClose,
  existingCourses = [],
  onSuccess,
}) => {
  const [inputType, setInputType] = useState<'FILE' | 'TEXT'>('FILE');
  const [rawText, setRawText] = useState('');
  const [parsedCourses, setParsedCourses] = useState<Partial<Course>[]>([]);
  const [importMode, setImportMode] = useState<'UPSERT' | 'APPEND'>('UPSERT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) {
        setErrorMsg('ไม่สามารถอ่านไฟล์ได้ หรือไฟล์ว่างเปล่า');
        return;
      }
      setRawText(content);
      const res = parseCSVToCourses(content);
      if (res.length === 0) {
        setErrorMsg('ไม่พบข้อมูลรายวิชาในไฟล์ กรุณาตรวจสอบหัวตารางตามไฟล์ต้นแบบ');
      } else {
        setParsedCourses(res);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Handle text change
  const handleTextChange = (txt: string) => {
    setRawText(txt);
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!txt.trim()) {
      setParsedCourses([]);
      return;
    }
    const res = parseCSVToCourses(txt);
    setParsedCourses(res);
  };

  // Download Sample Template with UTF-8 BOM
  const downloadSampleTemplate = () => {
    const headers = [
      'รหัสวิชา',
      'ชื่อรายวิชา (ไทย)',
      'ชื่อรายวิชา (อังกฤษ)',
      'หน่วยกิต',
      'หลักสูตร (THAI หรือ ENGLISH)',
      'ระดับหลักสูตร (ปริญญาตรี/ปริญญาโท)',
      'สาขาวิชา',
      'ชั้นปี',
      'ตอนเรียน (Section)',
      'ปีการศึกษา',
      'ภาคเรียน',
      'อาจารย์ผู้สอน',
      'วันเรียน (วันจันทร์-วันอาทิตย์)',
      'เวลาเริ่ม',
      'เวลาสิ้นสุด',
      'ห้องเรียน',
      'คำอธิบายรายวิชา',
    ];

    const sampleRows = [
      [
        '000 113',
        'ตรรกศาสตร์เบื้องต้น',
        'Introduction to Logic',
        '3',
        'THAI',
        'ปริญญาตรี',
        'พระพุทธศาสนา',
        '1',
        '1',
        '2570',
        '1',
        'พระมหาดวงเด่น ฐิตญาโณ, ผศ.ดร.*',
        'วันจันทร์',
        '09.00',
        '11.30',
        'อาคารเรียนรวม ชั้น 5 ห้อง D 516/2',
        'ศึกษาหลักการและกระบวนการคิดตามหลักตรรกศาสตร์',
      ],
      [
        '000 237',
        'ประวัติพระพุทธศาสนา',
        'History of Buddhism',
        '3',
        'THAI',
        'ปริญญาตรี',
        'วิปัสสนาภาวนา',
        '2',
        '1',
        '2570',
        '1',
        'พระครูสิริรัตนบัณฑิต, ผศ.ดร.* / อ.ดร.จันทรา บริรักษ์',
        'วันอังคาร',
        '13.00',
        '15.30',
        'อาคารเรียนรวม ชั้น 5 ห้อง D 516/1',
        'ศึกษาประวัติความเป็นมาและพัฒนาการของพระพุทธศาสนา',
      ],
      [
        '000 206',
        'คณิตศาสตร์และสถิติเพื่อการวิจัย',
        'Mathematics and Statistics for Research',
        '3',
        'ENGLISH',
        'ปริญญาตรี',
        'พระพุทธศาสนา',
        '1',
        'EN',
        '2570',
        '1',
        'Dr. John Smith*',
        'วันพุธ',
        '09.00',
        '11.30',
        'อาคารเรียนรวม ชั้น 4 ห้อง D 401',
        'Basic mathematics and statistical analysis',
      ],
    ];

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...sampleRows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `template_courses_timetable_${new Date().getFullYear() + 543}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit Bulk Import to /api/courses
  const handleSubmitImport = async () => {
    if (parsedCourses.length === 0) {
      setErrorMsg('ไม่พบข้อมูลรายวิชาที่พร้อมนำเข้า');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import',
          courses: parsedCourses,
          mode: importMode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
      }

      setSuccessMsg(`นำเข้าข้อมูลสำเร็จ: เพิ่ม ${data.added || 0} รายการ, อัปเดต ${data.updated || 0} รายการ`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setErrorMsg((err instanceof Error ? err.message : String(err)) || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shadow-xs shrink-0">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                นำเข้าตารางเรียนและรายวิชา (Import Courses & Timetables)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                รองรับไฟล์ Excel, CSV หรือคัดลอกจากตาราง Excel มาวาง เพื่ออัปเดตตารางสอนสำหรับภาคการศึกษาถัดไป
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Download Card (ป้องกันการใส่ข้อมูลผิดพลาด) */}
        <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="space-y-1">
            <div className="font-bold text-indigo-900 flex items-center gap-1.5 text-sm">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              <span>ไฟล์ต้นฉบับแม่แบบมาตรฐาน (ป้องกันการใส่ข้อมูลผิดพลาด)</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              ดาวน์โหลดไฟล์ตัวอย่างต้นแบบ CSV (มีฟอนต์ภาษาไทย UTF-8 BOM เปิดใน Microsoft Excel ได้ถูกต้อง) เพื่อนำไปกรอกข้อมูลปีการศึกษาถัดไป
            </p>
          </div>
          <button
            type="button"
            onClick={downloadSampleTemplate}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shrink-0 shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>ดาวน์โหลดไฟล์ต้นแบบ CSV</span>
          </button>
        </div>

        {/* Input Type Selector: File Upload vs Textarea Paste */}
        <div className="space-y-3">
          <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setInputType('FILE')}
              className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                inputType === 'FILE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileUp className="w-4 h-4 text-indigo-600" />
              <span>อัปโหลดไฟล์ (.csv / .tsv / .txt)</span>
            </button>
            <button
              type="button"
              onClick={() => setInputType('TEXT')}
              className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                inputType === 'TEXT' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-purple-600" />
              <span>คัดลอกจาก Excel มาวาง (Copy-Paste)</span>
            </button>
          </div>

          {inputType === 'FILE' ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition bg-slate-50/50 hover:bg-indigo-50/20"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
              <div className="font-bold text-slate-700 text-sm">คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่</div>
              <div className="text-xs text-slate-400 mt-1">รองรับไฟล์ .CSV (UTF-8) หรือไฟล์ Text ที่ส่งออกจาก Excel</div>
            </div>
          ) : (
            <div>
              <textarea
                rows={5}
                value={rawText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="คัดลอกแถวและคอลัมน์จากโปรแกรม Microsoft Excel แล้วกด Ctrl+V วางที่นี่..."
                className="w-full p-3.5 border border-slate-300 rounded-2xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Import Mode Options (UPSERT vs APPEND) */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
          <div className="font-bold text-slate-800">รูปแบบการบันทึกข้อมูล (Import Strategy):</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                importMode === 'UPSERT'
                  ? 'bg-white border-indigo-500 shadow-sm text-indigo-950 font-bold'
                  : 'bg-white/50 border-slate-200 text-slate-600 hover:bg-white'
              }`}
            >
              <input
                type="radio"
                name="importMode"
                value="UPSERT"
                checked={importMode === 'UPSERT'}
                onChange={() => setImportMode('UPSERT')}
                className="mt-0.5 text-indigo-600"
              />
              <div>
                <div>อัปเดตข้อมูลเดิมและเพิ่มวิชาใหม่ (UPSERT) - แนะนำ</div>
                <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                  ถ้ารหัสวิชาตรงกันจะอัปเดตข้อมูลให้ทันสมัย ถ้าเป็นวิชาใหม่จะเพิ่มเข้าไป
                </div>
              </div>
            </label>

            <label
              className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                importMode === 'APPEND'
                  ? 'bg-white border-indigo-500 shadow-sm text-indigo-950 font-bold'
                  : 'bg-white/50 border-slate-200 text-slate-600 hover:bg-white'
              }`}
            >
              <input
                type="radio"
                name="importMode"
                value="APPEND"
                checked={importMode === 'APPEND'}
                onChange={() => setImportMode('APPEND')}
                className="mt-0.5 text-indigo-600"
              />
              <div>
                <div>เพิ่มต่อท้ายทั้งหมด (APPEND)</div>
                <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                  เพิ่มเป็นคาบเรียนและตารางสอนใหม่ทั้งหมด เหมาะสำหรับการเปิดเทอมถัดไป
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Parsed Preview Table */}
        {parsedCourses.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                ตรวจพบรายวิชาที่พร้อมนำเข้าจำนวน {parsedCourses.length} รายการ
              </span>
              <span className="text-slate-400 font-normal text-[11px]">
                (แสดงตัวอย่าง 5 รายการแรก)
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-x-auto max-h-48 text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b text-[11px] text-slate-600 sticky top-0">
                  <tr>
                    <th className="p-2 border-r">รหัสวิชา</th>
                    <th className="p-2 border-r">ชื่อวิชา</th>
                    <th className="p-2 border-r">นก.</th>
                    <th className="p-2 border-r">ปี/เทอม</th>
                    <th className="p-2 border-r">วัน/เวลา</th>
                    <th className="p-2 border-r">ห้องเรียน</th>
                    <th className="p-2">อาจารย์ผู้สอน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedCourses.slice(0, 5).map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2 font-mono font-bold text-indigo-700 border-r">{c.courseCode}</td>
                      <td className="p-2 font-medium text-slate-900 border-r">{c.courseName}</td>
                      <td className="p-2 text-center border-r">{c.credits}</td>
                      <td className="p-2 border-r">ปี {c.academicYear} (เทอม {c.semester})</td>
                      <td className="p-2 border-r">วัน {c.dayOfWeek} ({c.startTime}-{c.endTime})</td>
                      <td className="p-2 border-r text-slate-500">{c.room || '-'}</td>
                      <td className="p-2 text-slate-700">{c.instructor || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Error / Success Messages */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold transition"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={handleSubmitImport}
            disabled={parsedCourses.length === 0 || isSubmitting}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                <span>กำลังนำเข้าข้อมูล...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>ยืนยันนำเข้า {parsedCourses.length > 0 ? `(${parsedCourses.length} วิชา)` : ''}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
