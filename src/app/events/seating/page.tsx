'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  Search,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  Compass,
  ZoomIn,
  ZoomOut,
  ArrowLeft,
  ChevronRight,
  QrCode,
  AlertCircle,
  Share2,
} from 'lucide-react';
import type { StudentEvent, EventSeatingConfig, SeatZone } from '@/types/event';

const ZONE_COLORS: Record<string, { bg: string; border: string; text: string; lightBg: string }> = {
  amber: { bg: 'bg-amber-500', border: 'border-amber-400', text: 'text-amber-900', lightBg: 'bg-amber-50' },
  blue: { bg: 'bg-blue-600', border: 'border-blue-400', text: 'text-blue-900', lightBg: 'bg-blue-50' },
  emerald: { bg: 'bg-emerald-600', border: 'border-emerald-400', text: 'text-emerald-900', lightBg: 'bg-emerald-50' },
  purple: { bg: 'bg-purple-600', border: 'border-purple-400', text: 'text-purple-900', lightBg: 'bg-purple-50' },
  rose: { bg: 'bg-rose-600', border: 'border-rose-400', text: 'text-rose-900', lightBg: 'bg-rose-50' },
  teal: { bg: 'bg-teal-600', border: 'border-teal-400', text: 'text-teal-900', lightBg: 'bg-teal-50' },
  indigo: { bg: 'bg-indigo-600', border: 'border-indigo-400', text: 'text-indigo-900', lightBg: 'bg-indigo-50' },
};

function SeatingLookupContent() {
  const searchParams = useSearchParams();
  const initialEventId = searchParams?.get('eventId') || '';
  const initialQuery = searchParams?.get('query') || searchParams?.get('code') || '';

  const [events, setEvents] = useState<StudentEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [loading, setLoading] = useState<boolean>(true);
  const [searching, setSearching] = useState<boolean>(false);

  // Loaded seating data
  const [eventData, setEventData] = useState<Partial<StudentEvent> | null>(null);
  const [seatingConfig, setSeatingConfig] = useState<EventSeatingConfig | null>(null);
  const [occupiedSeats, setOccupiedSeats] = useState<Array<{ seatNumber: string; isCheckedIn: boolean; groupNumber?: number; displayName: string }>>([]);
  const [matchedParticipant, setMatchedParticipant] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Map view controls
  const [activeZoneId, setActiveZoneId] = useState<string>('ALL');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Load events list on mount
  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.events)) {
          setEvents(d.events);
          if (!selectedEventId && d.events.length > 0) {
            // Pick first active or meditation event
            const def = d.events.find((e: any) => e.status === 'ACTIVE') || d.events[0];
            setSelectedEventId(def.id);
          }
        }
      })
      .catch((err) => console.error('Failed to load events:', err))
      .finally(() => setLoading(false));
  }, []);

  // Fetch seating data when selectedEventId changes or search is triggered
  const fetchSeatingData = async (eventId: string, queryStr?: string) => {
    if (!eventId) return;
    setSearching(true);
    try {
      const q = queryStr !== undefined ? queryStr : searchQuery;
      const url = `/api/events?action=public_seating&eventId=${encodeURIComponent(eventId)}${
        q ? `&query=${encodeURIComponent(q)}` : ''
      }`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setEventData(data.event);
        setSeatingConfig(data.seatingConfig);
        setOccupiedSeats(data.occupiedSeats || []);
        setMatchedParticipant(data.matchedParticipant || null);

        // Generate QR Code for participant badge check-in
        if (data.matchedParticipant) {
          const qrPayload = data.matchedParticipant.groupSpecificCode || data.matchedParticipant.studentCode;
          QRCode.toDataURL(qrPayload, {
            width: 256,
            margin: 1,
            color: { dark: '#0f172a', light: '#ffffff' },
          }).then(setQrDataUrl).catch(() => {});
        } else {
          setQrDataUrl('');
        }
      }
    } catch (err) {
      console.error('Fetch seating data error:', err);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      fetchSeatingData(selectedEventId, initialQuery);
      if (initialQuery) setHasSearched(true);
    }
  }, [selectedEventId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    setHasSearched(true);
    fetchSeatingData(selectedEventId, searchQuery);
  };

  const disabledSet = useMemo(() => {
    return new Set((seatingConfig?.disabledSeats || []).map((s) => s.trim().toUpperCase()));
  }, [seatingConfig]);

  const occupiedMap = useMemo(() => {
    const map = new Map<string, { isCheckedIn: boolean; groupNumber?: number; displayName: string }>();
    occupiedSeats.forEach((s) => {
      map.set(s.seatNumber.trim().toUpperCase(), s);
    });
    return map;
  }, [occupiedSeats]);

  const filteredZones = useMemo(() => {
    if (!seatingConfig?.zones) return [];
    if (activeZoneId === 'ALL') return seatingConfig.zones;
    return seatingConfig.zones.filter((z) => z.id === activeZoneId);
  }, [seatingConfig, activeZoneId]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/events"
            className="flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้ารายการโครงการ</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-extrabold text-slate-200">
              ระบบสืบค้นผังที่นั่งอัตโนมัติ
            </span>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-slate-900 via-amber-950/40 to-slate-900 py-6 px-4 border-b border-slate-800">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
            <Compass className="w-3.5 h-3.5" />
            <span>ค้นหาจุดที่นั่งของคุณ (Self-Service Seat Finder)</span>
          </div>

          <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
            ผังที่นั่ง & ตรวจสอบจุดปฏิบัติธรรม
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            พิมพ์รหัสนิสิต หรือชื่อ-ฉายา เพื่อดูหมายเลขที่นั่ง โซนที่จัด และจุดนั่งจริงบนแผนผัง
          </p>

          {/* Event Picker if multiple events */}
          {events.length > 1 && (
            <div className="pt-2 max-w-md mx-auto">
              <label className="text-[11px] text-amber-200 block mb-1 font-medium">
                เลือกโครงการกิจกรรม:
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  setHasSearched(false);
                  setMatchedParticipant(null);
                }}
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.academicYear || '2569'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="pt-3 max-w-lg mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="พิมพ์รหัสนิสิต (เช่น 6601201001) หรือชื่อ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-800/90 border-2 border-amber-500/50 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:border-amber-400 font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition shadow-lg cursor-pointer shrink-0 disabled:opacity-50"
            >
              {searching ? 'กำลังค้นหา...' : 'ค้นหาที่นั่ง'}
            </button>
          </form>
        </div>
      </section>

      {/* Main Body */}
      <main className="max-w-5xl mx-auto w-full px-4 py-6 space-y-6 flex-1">
        {/* Participant Matched Seat Card */}
        {matchedParticipant ? (
          <div className="bg-gradient-to-br from-amber-900/90 via-slate-800 to-slate-900 rounded-3xl p-5 sm:p-6 border-2 border-amber-400/80 shadow-2xl relative overflow-hidden animate-in zoom-in-95">
            {/* Background Glow */}
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Left Column: Participant Details */}
              <div className="space-y-3 flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {matchedParticipant.seatCheckinAt ? 'เช็คอินเข้าที่นั่งแล้ว' : 'พบข้อมูลที่นั่งของคุณแล้ว'}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {matchedParticipant.studentName}
                </h2>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs text-slate-300 font-medium">
                  <span className="bg-slate-700/80 px-2.5 py-1 rounded-lg font-mono">
                    รหัส: {matchedParticipant.studentCode}
                    {matchedParticipant.groupSpecificCode && ` (${matchedParticipant.groupSpecificCode})`}
                  </span>
                  <span className="bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg font-bold border border-amber-500/30">
                    กลุ่มที่ {matchedParticipant.groupNumber || '-'}
                  </span>
                  {matchedParticipant.major && (
                    <span className="bg-slate-700/80 px-2.5 py-1 rounded-lg">
                      {matchedParticipant.major}
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-300 pt-1 flex items-center justify-center md:justify-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    {seatingConfig?.venueName || eventData?.location || 'คณะพุทธศาสตร์ มจร'} •{' '}
                    {seatingConfig?.roomName || 'หอประชุมใหญ่'}
                  </span>
                </div>
              </div>

              {/* Center / Right: Huge Seat Number Display */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950/60 p-4 rounded-2xl border border-amber-400/30 shrink-0">
                <div className="text-center px-4">
                  <div className="text-[11px] font-bold text-amber-300 tracking-wider uppercase mb-1">
                    หมายเลขที่นั่งของคุณ
                  </div>
                  <div className="text-5xl sm:text-6xl font-black text-amber-400 tracking-tight drop-shadow-md animate-pulse">
                    {matchedParticipant.seatNumber || 'รอจัดที่นั่ง'}
                  </div>
                  <div className="text-xs font-bold text-slate-200 mt-1">
                    {matchedParticipant.seatZone || 'โซนห้องประชุม'}
                  </div>
                </div>

                {/* QR Code for Fast Staff Check-in */}
                {qrDataUrl && (
                  <div className="p-2 bg-white rounded-xl shadow-md flex flex-col items-center">
                    <img
                      src={qrDataUrl}
                      alt="Badge QR"
                      className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                    />
                    <span className="text-[9px] font-bold text-slate-700 mt-1">
                      ยื่น QR ให้เจ้าหน้าที่
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : hasSearched ? (
          <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700 text-center space-y-2">
            <AlertCircle className="w-10 h-10 mx-auto text-amber-400" />
            <h3 className="font-extrabold text-base text-white">ไม่พบข้อมูลที่นั่งสำหรับคำค้นหา</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              กรุณาตรวจสอบรหัสนิสิต หรือติดต่อฝ่ายทะเบียนโครงการ ณ ทางเข้าหอประชุม
            </p>
          </div>
        ) : null}

        {/* 2D Hall Seating Map */}
        <section className="bg-slate-800/90 rounded-3xl p-4 sm:p-6 border border-slate-700 shadow-xl space-y-4">
          {/* Map Header & Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700">
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                <span>แผนผังห้องจริง</span>
                <span className="text-xs bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                  STAGE MAP
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {seatingConfig?.roomName || 'หอประชุมใหญ่'} • จุดสีทองกระพริบคือที่นั่งที่คุณได้รับมอบหมาย
              </p>
            </div>

            {/* Zone Filter & Zoom */}
            <div className="flex items-center gap-2 flex-wrap">
              {seatingConfig?.zones && seatingConfig.zones.length > 1 && (
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setActiveZoneId('ALL')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                      activeZoneId === 'ALL' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ทุกโซน
                  </button>
                  {seatingConfig.zones.map((zone) => (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => setActiveZoneId(zone.id)}
                      className={`px-2 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                        activeZoneId === zone.id
                          ? 'bg-amber-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {zone.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              )}

              {/* Zoom */}
              <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-bold px-1 text-slate-300">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Map Canvas */}
          <div className="overflow-auto max-h-[600px] p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col items-center">
            {/* Front Stage Graphic */}
            <div className="w-full max-w-2xl mb-6 flex flex-col items-center shrink-0">
              <div className="w-full py-2 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-950 rounded-xl shadow-md text-center font-black tracking-wider text-xs sm:text-sm border border-amber-400">
                🏛️ ด้านหน้าห้อง / พระวิปัสสนาจารย์ (STAGE FRONT)
              </div>
              <div className="w-32 h-1 bg-amber-400/50 rounded-full mt-1" />
            </div>

            {/* Zones Grid */}
            <div
              className="flex flex-col gap-6 transition-transform duration-150 origin-top"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {filteredZones.map((zone) => {
                const zoneColor = ZONE_COLORS[zone.color] || ZONE_COLORS.amber;
                const prefix = (zone.prefix || zone.name.substring(0, 1) || 'Z').trim().toUpperCase();

                return (
                  <div
                    key={zone.id}
                    className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-800 flex flex-col items-center"
                  >
                    <div className="w-full flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${zoneColor.bg}`} />
                        <span className="font-extrabold text-sm text-white">{zone.name}</span>
                      </div>
                      <span className="text-xs text-slate-400">{zone.description || ''}</span>
                    </div>

                    {/* Columns header */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-6 text-center text-[10px] font-bold text-slate-500">แถว</div>
                      <div
                        className="grid gap-1.5"
                        style={{ gridTemplateColumns: `repeat(${zone.cols}, minmax(32px, 1fr))` }}
                      >
                        {Array.from({ length: zone.cols }, (_, cIdx) => (
                          <div key={cIdx} className="text-center text-[9px] font-bold text-slate-500">
                            {cIdx + 1}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rows */}
                    <div className="flex flex-col gap-1.5">
                      {Array.from({ length: zone.rows }, (_, rIdx) => {
                        const rowChar = String.fromCharCode(65 + rIdx);
                        return (
                          <div key={rIdx} className="flex items-center gap-1.5">
                            <div className="w-6 text-center text-xs font-bold text-slate-400 bg-slate-800 py-1 rounded">
                              {rowChar}
                            </div>
                            <div
                              className="grid gap-1.5"
                              style={{ gridTemplateColumns: `repeat(${zone.cols}, minmax(32px, 1fr))` }}
                            >
                              {Array.from({ length: zone.cols }, (_, cIdx) => {
                                const colStr = cIdx + 1 < 10 ? `0${cIdx + 1}` : `${cIdx + 1}`;
                                const seatCode =
                                  zone.rows <= 26 ? `${prefix}${rowChar}-${colStr}` : `${prefix}${rIdx + 1}-${colStr}`;
                                const isDisabled = disabledSet.has(seatCode.toUpperCase());
                                const isMatchedUserSeat =
                                  Boolean(matchedParticipant?.seatNumber) &&
                                  matchedParticipant.seatNumber.trim().toUpperCase() === seatCode.toUpperCase();
                                const occupantInfo = occupiedMap.get(seatCode.toUpperCase());

                                if (isDisabled) {
                                  return (
                                    <div
                                      key={cIdx}
                                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-950 border border-dashed border-slate-800 flex items-center justify-center text-slate-700 text-[8px]"
                                    >
                                      —
                                    </div>
                                  );
                                }

                                if (isMatchedUserSeat) {
                                  return (
                                    <div
                                      key={cIdx}
                                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-400 text-slate-950 font-black flex flex-col items-center justify-center ring-4 ring-amber-300 ring-offset-2 ring-offset-slate-900 scale-110 z-10 shadow-lg animate-pulse"
                                      title="ที่นั่งของคุณ!"
                                    >
                                      <span className="text-[10px] leading-tight font-black">{seatCode}</span>
                                      <span className="text-[7px] font-black uppercase">คุณ</span>
                                    </div>
                                  );
                                }

                                if (occupantInfo) {
                                  return (
                                    <div
                                      key={cIdx}
                                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 font-bold flex flex-col items-center justify-center opacity-70"
                                      title={`ที่นั่ง ${seatCode} (มีผู้จอง)`}
                                    >
                                      <span className="text-[9px] leading-tight">{seatCode}</span>
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    key={cIdx}
                                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 font-medium flex items-center justify-center hover:border-slate-600 transition"
                                    title={`ที่นั่ง ${seatCode} (ว่าง)`}
                                  >
                                    <span className="text-[9px]">{seatCode}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function SeatingLookupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
          <p className="text-sm font-medium animate-pulse">กำลังโหลดแผนผังที่นั่ง...</p>
        </div>
      }
    >
      <SeatingLookupContent />
    </Suspense>
  );
}
