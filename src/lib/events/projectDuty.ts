import type { AuthUser } from '@/types';
import { isAdminOrOfficer } from '@/lib/auth-client';
import { getSubstantiveTokens } from '@/lib/utils/name-matcher';

/**
 * Checks whether an authenticated user has duty to supervise / manage the meditation project
 * (อาจารย์ที่ได้รับหน้าที่ดูแลในโครงการ / บันทึกเวลาปฏิบัติธรรม 4 รอบ).
 * 
 * Returns true if:
 * 1. User is an Admin, Super Admin, Officer, Staff, Acting Officer, or Vipassana Master.
 * 2. User has an explicit flag `isProjectCoordinator` or `isMeditationStaff`.
 * 3. User's `instructorType` indicates meditation or project staff (e.g. contains 'วิปัสสนา', 'โครงการ', 'ผู้ดูแล').
 * 4. User is assigned to one of the events in `eventsList`:
 *    - Is the project coordinator (`coordinatorEmail` or `coordinatorName`)
 *    - Is an advisor or vipassana master in `event.meditationConfig?.groupAssignments`
 *    - Is an advisor in `event.meditationConfig?.groups`
 * 5. User is registered as 'COMMITTEE' or 'STAFF' in `registrationsList`.
 * 
 * Returns false for regular instructors who only have normal course teaching duties.
 */
export function hasProjectDuty(
  user?: AuthUser | null,
  eventsList?: any[],
  registrationsList?: any[]
): boolean {
  if (!user) return false;

  // 1. Administrative, Vipassana, or Acting Officer roles always have project access
  if (isAdminOrOfficer(user)) return true;

  const role = String(user.role || '').toUpperCase();
  if (role === 'VIPASSANA_MASTER' || role === 'STAFF') return true;
  if (Boolean(user.isActingOfficer)) return true;

  // 2. Explicit project assignment flags on user profile
  if ((user as any).isProjectCoordinator === true || (user as any).isMeditationStaff === true) {
    return true;
  }

  // 3. Instructor type indicator
  const instType = String((user as any).instructorType || '');
  if (
    instType.includes('วิปัสสนา') ||
    instType.includes('โครงการ') ||
    instType.includes('ผู้ดูแล')
  ) {
    return true;
  }

  // 4. Extract user identity strings and substantive tokens for comparison
  const userEmails = [user.email, user.gmail]
    .filter(Boolean)
    .map((e) => String(e).toLowerCase().trim());

  const userNames = [
    user.name,
    user.nameEn,
    (user as any).fullName,
    ...((user as any).aliases || []),
  ]
    .filter(Boolean)
    .map((n) => String(n).trim());

  const userTokens = new Set<string>();
  userNames.forEach((name) => {
    getSubstantiveTokens(name).forEach((tok) => userTokens.add(tok.toLowerCase()));
  });
  userEmails.forEach((email) => {
    const localPart = email.split('@')[0] || '';
    localPart
      .split(/[._-]+/)
      .filter((p) => p.length >= 4)
      .forEach((tok) => userTokens.add(tok.toLowerCase()));
  });

  const matchesUser = (targetText?: string): boolean => {
    if (!targetText) return false;
    const clean = String(targetText).trim();
    if (!clean) return false;

    // Check exact name / email match (case-insensitive)
    const lower = clean.toLowerCase();
    if (userEmails.some((e) => e === lower)) return true;
    if (userNames.some((n) => n.toLowerCase() === lower)) return true;

    // Check substantive tokens
    const tokens = getSubstantiveTokens(clean);
    if (
      tokens.length > 0 &&
      Array.from(userTokens).some((ut) =>
        tokens.some((t) => t.toLowerCase() === ut)
      )
    ) {
      return true;
    }
    return false;
  };

  // Check against eventsList
  if (Array.isArray(eventsList) && eventsList.length > 0) {
    for (const evt of eventsList) {
      if (!evt) continue;

      // a) Project Coordinator Email or Name
      if (
        evt.coordinatorEmail &&
        userEmails.includes(String(evt.coordinatorEmail).toLowerCase().trim())
      ) {
        return true;
      }
      if (evt.coordinatorName && matchesUser(evt.coordinatorName)) {
        return true;
      }

      // b) Meditation Group Assignments (advisors or vipassanaMasters)
      const groupAssignments = evt.meditationConfig?.groupAssignments;
      if (groupAssignments && typeof groupAssignments === 'object') {
        for (const g of Object.values(groupAssignments) as any[]) {
          if (!g) continue;
          if (
            Array.isArray(g.advisors) &&
            g.advisors.some((adv: string) => matchesUser(adv))
          ) {
            return true;
          }
          if (
            Array.isArray(g.vipassanaMasters) &&
            g.vipassanaMasters.some((m: string) => matchesUser(m))
          ) {
            return true;
          }
        }
      }

      // c) Legacy or alternate groups array (advisorName or advisor)
      const groups = evt.meditationConfig?.groups;
      if (Array.isArray(groups)) {
        for (const g of groups) {
          if (!g) continue;
          if (g.advisorName && matchesUser(g.advisorName)) return true;
          if (g.advisor && matchesUser(g.advisor)) return true;
          if (
            Array.isArray(g.advisors) &&
            g.advisors.some((adv: string) => matchesUser(adv))
          ) {
            return true;
          }
        }
      }
    }
  }

  // 5. Check against event registrations if registered as COMMITTEE or STAFF
  if (Array.isArray(registrationsList) && registrationsList.length > 0) {
    const isStaffOrCommittee = registrationsList.some((r) => {
      if (!r) return false;
      const roleStr = String(r.role || '').toUpperCase();
      if (
        roleStr !== 'COMMITTEE' &&
        roleStr !== 'STAFF' &&
        roleStr !== 'OFFICER'
      ) {
        return false;
      }
      return matchesUser(r.studentName) || matchesUser(r.studentCode);
    });
    if (isStaffOrCommittee) return true;
  }

  return false;
}
