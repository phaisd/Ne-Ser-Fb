'use client';

import React from 'react';
import { Mail, Share2, ExternalLink, Eye } from 'lucide-react';
import { SystemSettings } from '@/types';

interface ContactAndSocialCardProps {
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
}

export function ContactAndSocialCard({
  settings,
  setSettings,
}: ContactAndSocialCardProps) {
  return (
    <>
      {/* 5. Contact & Announcements & Portal Footer */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Mail className="w-4 h-4 text-pink-600" />
            <span>5. ข้อมูลติดต่อสำนักงานและส่วนท้ายหน้าแรก (Office Contact & Portal Footer)</span>
          </h3>
          <span className="text-[11px] text-slate-500">
            ข้อความในส่วนนี้จะปรากฏที่กล่องข้อมูลท้ายหน้าแรกของระบบ (http://localhost:3020)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="md:col-span-2">
            <label className="font-bold text-slate-700 block mb-1">
              ชื่อสำนักงาน / หัวข้อส่วนท้ายหน้าแรก (Office Name / Footer Title):
            </label>
            <input
              type="text"
              value={settings.footerTitleTh ?? ''}
              onChange={(e) =>
                setSettings({ ...settings, footerTitleTh: e.target.value })
              }
              placeholder="เช่น สำนักงานคณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (เว้นว่าง = ใช้ชื่อตามคณะ)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium"
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-bold text-slate-700 block mb-1">ที่ตั้งสำนักงาน / ที่อยู่ / อาคาร (Address):</label>
            <input
              type="text"
              value={settings.addressTh ?? ''}
              onChange={(e) =>
                setSettings({ ...settings, addressTh: e.target.value })
              }
              placeholder="อาคารสมเด็จพระพุฒาจารย์ (เกี่ยว อุปเสณมหาเถร) อาคารเรียนรวม ตำบลลำไทร อำเภอวังน้อย จังหวัดพระนครศรีอยุธยา 13170"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">เบอร์โทรศัพท์ติดต่อ:</label>
            <input
              type="text"
              value={settings.contactPhone ?? ''}
              onChange={(e) =>
                setSettings({ ...settings, contactPhone: e.target.value })
              }
              placeholder="เช่น 035-247-8000 ต่อ 8323"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">เว็บไซต์ทางการคณะ (Website URL):</label>
            <input
              type="text"
              value={settings.websiteUrl ?? ''}
              onChange={(e) =>
                setSettings({ ...settings, websiteUrl: e.target.value })
              }
              placeholder="https://fb.mcu.ac.th/"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">อีเมลติดต่อสำนักงาน:</label>
            <input
              type="text"
              value={settings.contactEmail ?? ''}
              onChange={(e) =>
                setSettings({ ...settings, contactEmail: e.target.value })
              }
              placeholder="buddhism@mcu.ac.th"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">วัน-เวลาทำการ (Office Hours):</label>
            <input
              type="text"
              value={settings.officeHours ?? ''}
              onChange={(e) =>
                setSettings({ ...settings, officeHours: e.target.value })
              }
              placeholder="เช่น จันทร์ - ศุกร์ 08.30 - 16.30 น. (เว้นวันหยุดราชการ)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-bold text-slate-700 block mb-1">
              ข้อความหมายเหตุเพิ่มเติมท้ายกล่อง (Optional Note / Extra Text):
            </label>
            <input
              type="text"
              value={settings.footerCustomNote ?? ''}
              onChange={(e) =>
                setSettings({ ...settings, footerCustomNote: e.target.value })
              }
              placeholder="เช่น งานบริการการศึกษาและทะเบียน ยินดีให้บริการคำร้องออนไลน์ 24 ชั่วโมง (เว้นว่างได้)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-bold text-slate-700 block mb-1">
              ข้อความประกาศต้อนรับหน้าแรก (Announcement Text):
            </label>
            <textarea
              rows={2}
              value={settings.announcementText || ''}
              onChange={(e) =>
                setSettings({ ...settings, announcementText: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {/* Developer Credit Setting */}
          <div className="md:col-span-2 p-3.5 bg-purple-50/70 rounded-xl border border-purple-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-purple-950 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.devCreditEnabled !== false}
                  onChange={(e) =>
                    setSettings({ ...settings, devCreditEnabled: e.target.checked })
                  }
                  className="rounded border-purple-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                />
                <span>เปิดใช้งานข้อความแสดงผู้พัฒนาระบบ (Developer Credit ที่แถบล่างสุด)</span>
              </label>
              <span className="text-[11px] font-bold text-purple-800">
                {settings.devCreditEnabled !== false ? '🟢 กำลังแสดง' : '⚪ ปิดการแสดงผล'}
              </span>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1 text-[11px]">
                ข้อความผู้พัฒนาระบบ (แก้ไขได้อิสระ):
              </label>
              <input
                type="text"
                value={settings.devCreditText ?? ''}
                onChange={(e) =>
                  setSettings({ ...settings, devCreditText: e.target.value })
                }
                placeholder="Dev. by สำนักงานคณบดีคณะพุทธศาสตร์"
                disabled={settings.devCreditEnabled === false}
                className="w-full px-3.5 py-2 rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Live Preview of the Portal Footer */}
          <div className="md:col-span-2 pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
              <span className="flex items-center gap-1.5 text-purple-900">
                <Eye className="w-4 h-4 text-purple-600" />
                <span>ตัวอย่างการแสดงผลแถบล่างสุด (Live Preview at http://localhost:3020):</span>
              </span>
              <span className="text-slate-400 font-normal">
                * จะอัปเดตทันทีเมื่อกดปุ่มบันทึกด้านล่าง
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-500 shadow-xs">
              <div className="space-y-1">
                <p>© 2026 {settings.facultyNameTh || 'คณะพุทธศาสตร์'} {settings.universityNameTh || 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย'}. สงวนลิขสิทธิ์ทั้งหมด.</p>
                <div className="text-slate-400 flex flex-wrap items-center gap-1.5">
                  <span>ระบบบริการการศึกษาและวิชาการ</span>
                  {settings.devCreditEnabled !== false && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 text-[10.5px]">
                        {settings.devCreditText || 'Dev. by สำนักงานคณบดีคณะพุทธศาสตร์'}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 font-medium text-slate-600">
                <span>มาตรการคุ้มครองข้อมูล (PDPA)</span>
                <span className="text-slate-300">•</span>
                <span>ตรวจสอบเอกสาร (/verify)</span>
                <span className="text-slate-300">•</span>
                <span>เงื่อนไขการให้บริการ</span>
                <span className="text-slate-300">•</span>
                <span>🔒 สำหรับเจ้าหน้าที่</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Social Media & Facebook Settings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1 rounded-lg bg-blue-100 text-blue-700">
                <Share2 className="w-4 h-4" />
              </span>
              <span>6. ช่องทางโซเชียลมีเดีย & Facebook ของคณะ (Social Media & Facebook Page)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              กำหนดลิงก์ Facebook, LINE OA, YouTube, TikTok และเปิด-ปิดการแสดงผลบนหน้าแรกและแถบล่างสุด (Footer)
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer font-bold text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={settings.showSocialLinks !== false}
              onChange={(e) =>
                setSettings({ ...settings, showSocialLinks: e.target.checked })
              }
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
            <span className={settings.showSocialLinks !== false ? 'text-blue-800' : 'text-slate-500'}>
              {settings.showSocialLinks !== false ? '🟢 เปิดแสดงโซเชียลทั้งระบบ' : '⚪ ปิดแสดงโซเชียลทั้งหมด'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* 1. Facebook */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                  f
                </div>
                <span className="font-bold text-blue-950 text-sm">Facebook ของคณะ (แนะนำ)</span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[11px] text-blue-900">
                <input
                  type="checkbox"
                  checked={settings.showFacebook !== false}
                  onChange={(e) =>
                    setSettings({ ...settings, showFacebook: e.target.checked })
                  }
                  className="rounded border-blue-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span>{settings.showFacebook !== false ? 'เปิดแสดง' : 'ปิด'}</span>
              </label>
            </div>

            <div className="space-y-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  ชื่อหรือคำบรรยายเพจ Facebook:
                </label>
                <input
                  type="text"
                  value={settings.facebookTitle ?? ''}
                  onChange={(e) =>
                    setSettings({ ...settings, facebookTitle: e.target.value })
                  }
                  placeholder="เช่น คณะพุทธศาสตร์ มจร - Faculty of Buddhism"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  ลิงก์เพจ Facebook (Facebook URL):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={settings.facebookUrl ?? ''}
                    onChange={(e) =>
                      setSettings({ ...settings, facebookUrl: e.target.value })
                    }
                    placeholder="https://www.facebook.com/buddhism.mcu"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 pr-8"
                  />
                  {settings.facebookUrl && (
                    <a
                      href={settings.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2.5 top-2.5 text-blue-600 hover:text-blue-800"
                      title="เปิดทดสอบลิงก์ Facebook"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. LINE Official Account */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">
                  LINE
                </div>
                <span className="font-bold text-emerald-950 text-sm">LINE Official Account</span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[11px] text-emerald-900">
                <input
                  type="checkbox"
                  checked={settings.showLineOa === true}
                  onChange={(e) =>
                    setSettings({ ...settings, showLineOa: e.target.checked })
                  }
                  className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>{settings.showLineOa ? 'เปิดแสดง' : 'ปิด'}</span>
              </label>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                ลิงก์เพิ่มเพื่อน LINE OA หรือ LINE ID:
              </label>
              <input
                type="text"
                value={settings.lineOaUrl ?? ''}
                onChange={(e) =>
                  setSettings({ ...settings, lineOaUrl: e.target.value })
                }
                placeholder="เช่น https://line.me/ti/p/... หรือ @buddhism.mcu"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* 3. YouTube */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-[10px]">
                  ▶
                </div>
                <span className="font-bold text-rose-950 text-sm">YouTube Channel</span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[11px] text-rose-900">
                <input
                  type="checkbox"
                  checked={settings.showYoutube === true}
                  onChange={(e) =>
                    setSettings({ ...settings, showYoutube: e.target.checked })
                  }
                  className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                />
                <span>{settings.showYoutube ? 'เปิดแสดง' : 'ปิด'}</span>
              </label>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                ลิงก์ YouTube Channel:
              </label>
              <input
                type="text"
                value={settings.youtubeUrl ?? ''}
                onChange={(e) =>
                  setSettings({ ...settings, youtubeUrl: e.target.value })
                }
                placeholder="https://www.youtube.com/@buddhism_mcu"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
          </div>

          {/* 4. TikTok */}
          <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                  ♪
                </div>
                <span className="font-bold text-slate-900 text-sm">TikTok</span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[11px] text-slate-900">
                <input
                  type="checkbox"
                  checked={settings.showTiktok === true}
                  onChange={(e) =>
                    setSettings({ ...settings, showTiktok: e.target.checked })
                  }
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 w-3.5 h-3.5"
                />
                <span>{settings.showTiktok ? 'เปิดแสดง' : 'ปิด'}</span>
              </label>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                ลิงก์ TikTok ของคณะ:
              </label>
              <input
                type="text"
                value={settings.tiktokUrl ?? ''}
                onChange={(e) =>
                  setSettings({ ...settings, tiktokUrl: e.target.value })
                }
                placeholder="https://www.tiktok.com/@buddhism_mcu"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
