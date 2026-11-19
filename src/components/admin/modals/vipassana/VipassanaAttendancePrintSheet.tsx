'use client';

import React from 'react';
import type { MeditationPeriodConfig } from '@/types';

export interface PrintAttendanceRow {
  registrationId: string;
  studentCode: string;
  studentName: string;
  vasa?: string | number;
  groupNumber?: number;
  groupName?: string;
  programType?: string;
  p1: string;
  p2: string;
  p3: string;
  p4: string;
  remark?: string;
}

interface VipassanaAttendancePrintSheetProps {
  activeProgram: 'THAI' | 'ENGLISH';
  selectedDayNumber: number;
  selectedGroup: number | string;
  p1Conf: MeditationPeriodConfig;
  p2Conf: MeditationPeriodConfig;
  p3Conf: MeditationPeriodConfig;
  p4Conf: MeditationPeriodConfig;
  printBlankRows: boolean;
  attendanceRows: PrintAttendanceRow[];
  advisors?: string[]; // รายนามอาจารย์ประจำกลุ่ม และผู้ช่วย
  scannerStaff?: string; // อาจารย์ผู้ดูแล หรือเจ้าหน้าที่ ที่สแกนตรวจเช็ค (กรณีสแกน QR Code)
}

export const VipassanaAttendancePrintSheet: React.FC<VipassanaAttendancePrintSheetProps> = ({
  activeProgram,
  selectedDayNumber,
  selectedGroup,
  p1Conf,
  p2Conf,
  p3Conf,
  p4Conf,
  printBlankRows,
  attendanceRows,
  advisors,
  scannerStaff,
}) => {
  return (
    <div className="flex flex-col items-center print:block print:w-full">
      {/* PRINT STYLES */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 6mm;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            height: auto !important;
            min-height: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #official-a4-sheet,
          #official-a4-sheet * {
            visibility: visible !important;
          }
          #official-a4-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            display: block !important;
            overflow: visible !important;
          }
          table {
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print\\:hidden, .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* A4 PAPER CONTAINER */}
      <div
        id="official-a4-sheet"
        className="w-full max-w-[800px] bg-white border border-slate-300 p-8 sm:p-10 shadow-lg text-slate-900 font-serif leading-tight print:border-none print:shadow-none print:p-0"
      >
        {activeProgram === 'ENGLISH' ? (
          /* ================= ENGLISH PROGRAM FORM ================= */
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center space-y-1">
              <h2 className="text-sm sm:text-base font-bold tracking-tight">
                The Name List for the 1<sup>st</sup> - 4<sup>th</sup> students of the Faculty of Buddhism. (English Program)
              </h2>
              <h3 className="text-xs sm:text-sm font-semibold">
                The Meditation Practice on December 11 - 22, 2025
              </h3>
              <p className="text-xs">AT Bodhiyanmahavijjalai, Nakhon Pathom</p>
              <p className="text-xs pt-1">
                Date( &nbsp; &nbsp;{selectedDayNumber ? 10 + selectedDayNumber : '..........'}&nbsp; &nbsp; / December / 2025 )
              </p>
            </div>

            {/* Subhead: Group */}
            <div className="flex items-center justify-between border-b-2 border-black pb-1">
              <div className="text-base font-bold font-sans">
                Group : {selectedGroup !== 'ALL' ? selectedGroup : '12'}
              </div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse border border-black text-center text-[10.5px]">
              <thead>
                <tr className="border-b border-black">
                  <th rowSpan={2} className="border-r border-black p-1 w-8">No.</th>
                  <th rowSpan={2} className="border-r border-black p-1 w-16">Code</th>
                  <th rowSpan={2} className="border-r border-black p-1 text-left min-w-[150px]">Name/ Pali Name</th>
                  <th rowSpan={2} className="border-r border-black p-1 w-10">Vasa</th>
                  <th rowSpan={2} className="border-r border-black p-1 w-10">
                    <span className="block transform -rotate-90">Group</span>
                  </th>
                  <th colSpan={4} className="border-r border-black p-1 font-bold">
                    Signature
                  </th>
                  <th rowSpan={2} className="p-1 w-12">
                    <span className="block transform -rotate-90">Remark</span>
                  </th>
                </tr>
                <tr className="border-b border-black text-[9.5px]">
                  <th className="border-r border-black p-1 w-20">
                    <div>{p1Conf.nameEn || 'Dawn Period'}</div>
                    <div className="font-mono text-[8.5px]">{p1Conf.time}</div>
                  </th>
                  <th className="border-r border-black p-1 w-20">
                    <div>{p2Conf.nameEn || 'Morning Period'}</div>
                    <div className="font-mono text-[8.5px]">{p2Conf.time}</div>
                  </th>
                  <th className="border-r border-black p-1 w-20">
                    <div>{p3Conf.nameEn || 'Afternoon Period'}</div>
                    <div className="font-mono text-[8.5px]">{p3Conf.time}</div>
                  </th>
                  <th className="border-r border-black p-1 w-20">
                    <div>{p4Conf.nameEn || 'Evening Period'}</div>
                    <div className="font-mono text-[8.5px]">{p4Conf.time}</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {printBlankRows
                  ? Array.from({ length: 22 }, (_, idx) => (
                      <tr key={idx} className="border-b border-black/70 h-7">
                        <td className="border-r border-black/70 font-mono text-[9.5px]">{idx + 1}</td>
                        <td className="border-r border-black/70"></td>
                        <td className="border-r border-black/70"></td>
                        <td className="border-r border-black/70"></td>
                        <td className="border-r border-black/70">{selectedGroup !== 'ALL' ? selectedGroup : ''}</td>
                        <td className="border-r border-black/70"></td>
                        <td className="border-r border-black/70"></td>
                        <td className="border-r border-black/70"></td>
                        <td className="border-r border-black/70"></td>
                        <td></td>
                      </tr>
                    ))
                  : attendanceRows.map((row, idx) => (
                      <tr key={idx} className="border-b border-black/70 h-6.5 text-[10px]">
                        <td className="border-r border-black/70 font-mono text-[9.5px] p-0.5">{idx + 1}</td>
                        <td className="border-r border-black/70 font-mono p-0.5 font-semibold">{row.studentCode}</td>
                        <td className="border-r border-black/70 text-left px-1.5 p-0.5 truncate max-w-[180px]">
                          {row.studentName}
                        </td>
                        <td className="border-r border-black/70 font-mono p-0.5">{row.vasa || '-'}</td>
                        <td className="border-r border-black/70 p-0.5">
                          {row.groupNumber || (selectedGroup !== 'ALL' ? selectedGroup : '')}
                        </td>
                        <td className="border-r border-black/70 p-0.5 text-center">
                          {row.p1 === 'PRESENT' ? '✓' : row.p1 === 'LATE' ? 'สาย' : row.p1 === 'SICK' ? 'ป่วย' : row.p1 === 'ABSENT' ? 'ขาด' : ''}
                        </td>
                        <td className="border-r border-black/70 p-0.5 text-center">
                          {row.p2 === 'PRESENT' ? '✓' : row.p2 === 'LATE' ? 'สาย' : row.p2 === 'SICK' ? 'ป่วย' : row.p2 === 'ABSENT' ? 'ขาด' : ''}
                        </td>
                        <td className="border-r border-black/70 p-0.5 text-center">
                          {row.p3 === 'PRESENT' ? '✓' : row.p3 === 'LATE' ? 'สาย' : row.p3 === 'SICK' ? 'ป่วย' : row.p3 === 'ABSENT' ? 'ขาด' : ''}
                        </td>
                        <td className="border-r border-black/70 p-0.5 text-center">
                          {row.p4 === 'PRESENT' ? '✓' : row.p4 === 'LATE' ? 'สาย' : row.p4 === 'SICK' ? 'ป่วย' : row.p4 === 'ABSENT' ? 'ขาด' : ''}
                        </td>
                        <td className="p-0.5 text-left text-[9px] px-1 truncate">{row.remark || ''}</td>
                      </tr>
                    ))}
              </tbody>
            </table>

            {/* Footer */}
            <div className="pt-2 space-y-4 text-xs">
              <div>
                หมายเหตุ .......................................................................................................................................................................................
              </div>

              <div className="text-center pt-2 space-y-2">
                <div className="font-bold">รับรองตามนี้</div>
                <div className="text-[11px]">
                  {advisors && advisors.length > 0 ? (
                    <span className="font-semibold px-2 py-0.5 border-b border-black">
                      {advisors.join('  /  ')}
                    </span>
                  ) : (
                    '.........................................................'
                  )}{' '}
                  ผู้ดูแลกลุ่ม ......... / ............ / ..........
                </div>

                {/* ช่องชื่อของอาจารย์ผู้ดูแล หรือเจ้าหน้าที่ ที่สแกนตรวจเช็ค (กรณีสแกน QR Code) */}
                <div className="text-[11px] pt-1">
                  {scannerStaff ? (
                    <span className="font-semibold px-2 py-0.5 border-b border-black">
                      ( {scannerStaff} )
                    </span>
                  ) : (
                    '............................................................................................................'
                  )}{' '}
                  อาจารย์ผู้ดูแล / เจ้าหน้าที่ ที่สแกนตรวจเช็ค (QR Code Scanner / Staff)
                </div>
              </div>

              {/* Footnote Rules */}
              <div className="pt-4 border-t border-black/40 text-[9.5px] space-y-1">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div>• Please sign–in during the scheduled times above. Or you will not get credit for your ATTANDANCE !</div>
                    <div>• In order to get one full-day credit, you must sign in for 4 periods which can be done in different days.</div>
                  </div>
                  <span className="font-mono font-bold text-xs">1</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================= THAI PROGRAM FORM ================= */
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center space-y-1">
              <h2 className="text-sm sm:text-base font-bold tracking-tight">
                บัญชีเช็คชื่อและเวลาปฏิบัติวิปัสสนากัมมัฏฐาน แต่ละวัน
              </h2>
              <h3 className="text-xs sm:text-sm font-semibold">
                นิสิตคณะพุทธศาสตร์ ชั้นปีที่ 1 - 4 ปีการศึกษา 2568 (บรรพชิต)
              </h3>
              <p className="text-xs">ณ อาคารปฏิบัติธรรมโพธิญาณมหาวิชชาลัย ต.ศาลายา อ.พุทธมณฑล จ.นครปฐม</p>
              <p className="text-xs pt-1">
                วัน ........................... ที่ &nbsp; &nbsp;{selectedDayNumber ? 10 + selectedDayNumber : '..........'}&nbsp; &nbsp; เดือน ธันวาคม พ.ศ. 2568
              </p>
            </div>

            {/* Subhead: Group and Big Number Watermark */}
            <div className="flex items-center justify-between border-b-2 border-black pb-1">
              <div className="text-base font-bold font-sans">
                กลุ่มที่ : {selectedGroup !== 'ALL' ? selectedGroup : '3'}
              </div>
              <div className="text-2xl font-black font-sans px-2 border border-black rounded">
                {selectedGroup !== 'ALL' ? selectedGroup : '3'}
              </div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse border border-black text-center text-[10.5px]">
              <thead>
                <tr className="border-b border-black">
                  <th rowSpan={2} className="border-r border-black p-1 w-8">ที่</th>
                  <th rowSpan={2} className="border-r border-black p-1 w-16">รหัส</th>
                  <th rowSpan={2} className="border-r border-black p-1 text-left min-w-[150px]">ชื่อ ฉายา/นามสกุล</th>
                  <th rowSpan={2} className="border-r border-black p-1 w-10">
                    <span className="block transform -rotate-90">กลุ่ม</span>
                  </th>
                  <th colSpan={4} className="border-r border-black p-1 font-bold">
                    ลงชื่อ / ในแต่ละช่วงเวลา
                  </th>
                  <th rowSpan={2} className="p-1 w-16">
                    หมายเหตุ
                  </th>
                </tr>
                <tr className="border-b border-black text-[9.5px]">
                  <th className="border-r border-black p-1 w-20">
                    <div>{p1Conf.nameTh}</div>
                    <div className="font-mono text-[8.5px]">{p1Conf.time}</div>
                  </th>
                  <th className="border-r border-black p-1 w-20">
                    <div>{p2Conf.nameTh}</div>
                    <div className="font-mono text-[8.5px]">{p2Conf.time}</div>
                  </th>
                  <th className="border-r border-black p-1 w-20">
                    <div>{p3Conf.nameTh}</div>
                    <div className="font-mono text-[8.5px]">{p3Conf.time}</div>
                  </th>
                  <th className="border-r border-black p-1 w-20">
                    <div>{p4Conf.nameTh}</div>
                    <div className="font-mono text-[8.5px]">{p4Conf.time}</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {printBlankRows
                  ? Array.from({ length: 22 }, (_, idx) => (
                      <tr key={idx} className="border-b border-black/70 h-7">
                        <td className="border-r border-black/70 font-mono text-[9.5px]">{idx + 1}</td>
                        <td className="border-r border-black/70"></td>
                        <td className="border-r border-black/70"></td>
                        <td className="border-r border-black/70">{selectedGroup !== 'ALL' ? selectedGroup : ''}</td>
                        <td className="border-r border-black/70"></td>
                        <td className="border-r border-black/70"></td>
                        <td className="border-r border-black/70"></td>
                        <td className="border-r border-black/70"></td>
                        <td></td>
                      </tr>
                    ))
                  : attendanceRows.map((row, idx) => (
                      <tr key={idx} className="border-b border-black/70 h-6.5 text-[10px]">
                        <td className="border-r border-black/70 font-mono text-[9.5px] p-0.5">{idx + 1}</td>
                        <td className="border-r border-black/70 font-mono p-0.5 font-semibold">{row.studentCode}</td>
                        <td className="border-r border-black/70 text-left px-1.5 p-0.5 truncate max-w-[180px]">
                          {row.studentName}
                        </td>
                        <td className="border-r border-black/70 p-0.5">
                          {row.groupNumber || (selectedGroup !== 'ALL' ? selectedGroup : '')}
                        </td>
                        <td className="border-r border-black/70 p-0.5 text-center">
                          {row.p1 === 'PRESENT' ? '✓' : row.p1 === 'LATE' ? 'สาย' : row.p1 === 'SICK' ? 'ป่วย' : row.p1 === 'ABSENT' ? 'ขาด' : ''}
                        </td>
                        <td className="border-r border-black/70 p-0.5 text-center">
                          {row.p2 === 'PRESENT' ? '✓' : row.p2 === 'LATE' ? 'สาย' : row.p2 === 'SICK' ? 'ป่วย' : row.p2 === 'ABSENT' ? 'ขาด' : ''}
                        </td>
                        <td className="border-r border-black/70 p-0.5 text-center">
                          {row.p3 === 'PRESENT' ? '✓' : row.p3 === 'LATE' ? 'สาย' : row.p3 === 'SICK' ? 'ป่วย' : row.p3 === 'ABSENT' ? 'ขาด' : ''}
                        </td>
                        <td className="border-r border-black/70 p-0.5 text-center">
                          {row.p4 === 'PRESENT' ? '✓' : row.p4 === 'LATE' ? 'สาย' : row.p4 === 'SICK' ? 'ป่วย' : row.p4 === 'ABSENT' ? 'ขาด' : ''}
                        </td>
                        <td className="p-0.5 text-left text-[9px] px-1 truncate">{row.remark || ''}</td>
                      </tr>
                    ))}
              </tbody>
            </table>

            {/* Footer */}
            <div className="pt-2 space-y-4 text-xs">
              <div>
                หมายเหตุ .......................................................................................................................................................................................
              </div>

              <div className="text-center pt-2 space-y-2">
                <div className="font-bold">รับรองตามนี้</div>
                <div className="text-[11px]">
                  {advisors && advisors.length > 0 ? (
                    <span className="font-semibold px-2 py-0.5 border-b border-black">
                      {advisors.join('  /  ')}
                    </span>
                  ) : (
                    '................................................................./...........................................................................'
                  )}{' '}
                  อาจารย์ประจำกลุ่ม กลุ่มที่ : {selectedGroup !== 'ALL' ? selectedGroup : '3'}
                </div>

                {/* ช่องชื่อของอาจารย์ผู้ดูแล หรือเจ้าหน้าที่ ที่สแกนตรวจเช็ค (กรณีสแกน QR Code) */}
                <div className="text-[11px] pt-1">
                  {scannerStaff ? (
                    <span className="font-semibold px-2 py-0.5 border-b border-black">
                      ( {scannerStaff} )
                    </span>
                  ) : (
                    '..................................................................................................................................................'
                  )}{' '}
                  อาจารย์ผู้ดูแล / เจ้าหน้าที่ ที่สแกนตรวจเช็ค (กรณีสแกน QR Code)
                </div>
              </div>

              {/* Footnote Rules */}
              <div className="pt-4 border-t border-black/40 text-[9.5px] space-y-1">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div>• นิสิตจะต้องลงชื่อตามช่วงเวลาที่กำหนดให้ข้างต้นนี้ หากไม่ลงชื่อตามช่วงเวลาที่กำหนด ถือว่าขาดในช่วงระยะเวลานั้น ๆ</div>
                    <div>• หากขาด ๔ ช่วงเวลา เท่ากับว่าขาด ๑ วัน และถือว่าไม่ผ่านการปฏิบัติ</div>
                  </div>
                  <span className="font-mono font-bold text-xs">1</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
