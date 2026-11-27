'use client';

import { useState, useEffect, useMemo } from 'react';
import type { StudentEvent, EventRegistration, MeditationGroupAssignment, MeditationConfig } from '@/types/event';
import type { UserAccount } from '@/types/instructor';

interface UseGroupAssignmentsOptions {
  isOpen: boolean;
  event: StudentEvent;
  registrations: EventRegistration[];
  initialUsers?: UserAccount[];
  onAssignmentsSaved?: (updatedEvent: StudentEvent) => void;
}

export function useGroupAssignments({
  isOpen,
  event,
  registrations,
  initialUsers,
  onAssignmentsSaved,
}: UseGroupAssignmentsOptions) {
  // 1. Group list calculation
  const availableGroups = useMemo(() => {
    const setG = new Set<number>();
    registrations.forEach((r) => {
      const gNum = r.groupNumber || (r.groupName ? parseInt(r.groupName.replace(/\D/g, ''), 10) : 0);
      if (gNum && gNum > 0) setG.add(gNum);
    });

    for (let i = 1; i <= 12; i++) {
      setG.add(i);
    }
    return Array.from(setG).sort((a, b) => a - b);
  }, [registrations]);

  const [activeGroup, setActiveGroup] = useState<number>(1);
  const [assignments, setAssignments] = useState<Record<string, MeditationGroupAssignment>>({});
  const [systemUsers, setSystemUsers] = useState<UserAccount[]>(initialUsers || []);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    if (initialUsers && initialUsers.length > 0) {
      setSystemUsers(initialUsers);
    }
  }, [initialUsers]);

  const [advisorSearch, setAdvisorSearch] = useState<string>('');
  const [masterSearch, setMasterSearch] = useState<string>('');
  const [selectedUserAdvisorId, setSelectedUserAdvisorId] = useState<string>('');
  const [customAdvisorName, setCustomAdvisorName] = useState<string>('');
  const [selectedUserMasterId, setSelectedUserMasterId] = useState<string>('');
  const [customMasterName, setCustomMasterName] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Map of which groups each teacher/master is already assigned to
  const userAssignedGroupsMap = useMemo(() => {
    const map: Record<string, number[]> = {};
    Object.entries(assignments).forEach(([gKey, gData]) => {
      const gNum = parseInt(gKey, 10);
      (gData.advisors || []).forEach((name) => {
        if (!map[name]) map[name] = [];
        if (!map[name].includes(gNum)) map[name].push(gNum);
      });
      (gData.vipassanaMasters || []).forEach((name) => {
        if (!map[name]) map[name] = [];
        if (!map[name].includes(gNum)) map[name].push(gNum);
      });
    });
    return map;
  }, [assignments]);

  // Search filter for advisors
  const filteredAdvisors = useMemo(() => {
    const q = advisorSearch.trim().toLowerCase();
    if (!q) return systemUsers;
    return systemUsers.filter((u) => {
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.nameEn || '').toLowerCase().includes(q) ||
        (u.department || '').toLowerCase().includes(q) ||
        (u.instructorType || '').toLowerCase().includes(q) ||
        (u.ecclesiasticalTitle || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        u.aliases?.some((al) => al.toLowerCase().includes(q))
      );
    });
  }, [systemUsers, advisorSearch]);

  const filteredRegularAdvisors = useMemo(() => {
    return filteredAdvisors.filter((u) => u.role !== 'VIPASSANA_MASTER' && !(u.instructorType || '').includes('วิปัสสนา'));
  }, [filteredAdvisors]);

  const filteredVipassanaAdvisors = useMemo(() => {
    return filteredAdvisors.filter((u) => u.role === 'VIPASSANA_MASTER' || (u.instructorType || '').includes('วิปัสสนา'));
  }, [filteredAdvisors]);

  // Search filter for masters
  const filteredMasters = useMemo(() => {
    const q = masterSearch.trim().toLowerCase();
    if (!q) return systemUsers;
    return systemUsers.filter((u) => {
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.nameEn || '').toLowerCase().includes(q) ||
        (u.department || '').toLowerCase().includes(q) ||
        (u.instructorType || '').toLowerCase().includes(q) ||
        (u.ecclesiasticalTitle || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        u.aliases?.some((al) => al.toLowerCase().includes(q))
      );
    });
  }, [systemUsers, masterSearch]);

  const filteredMasterVipassana = useMemo(() => {
    return filteredMasters.filter((u) => u.role === 'VIPASSANA_MASTER' || (u.instructorType || '').includes('วิปัสสนา'));
  }, [filteredMasters]);

  const filteredMasterOthers = useMemo(() => {
    return filteredMasters.filter((u) => u.role !== 'VIPASSANA_MASTER' && !(u.instructorType || '').includes('วิปัสสนา'));
  }, [filteredMasters]);

  // Initialize from event config
  useEffect(() => {
    if (isOpen) {
      const existing = event.meditationConfig?.groupAssignments || {};
      const cloned: Record<string, MeditationGroupAssignment> = {};
      Object.keys(existing).forEach((k) => {
        cloned[k] = {
          groupNumber: existing[k].groupNumber,
          groupName: existing[k].groupName || `กลุ่ม ${k}`,
          advisors: [...(existing[k].advisors || [])],
          vipassanaMasters: [...(existing[k].vipassanaMasters || [])],
          notes: existing[k].notes || '',
        };
      });

      availableGroups.forEach((g) => {
        const key = String(g);
        if (!cloned[key]) {
          cloned[key] = {
            groupNumber: g,
            groupName: `กลุ่ม ${g}`,
            advisors: [],
            vipassanaMasters: [],
            notes: '',
          };
        }
      });

      setAssignments(cloned);
      if (availableGroups.length > 0 && !cloned[String(activeGroup)]) {
        setActiveGroup(availableGroups[0]);
      }
    }
  }, [isOpen, event, availableGroups]);

  // Fetch system users if empty
  useEffect(() => {
    if (isOpen && systemUsers.length === 0) {
      setIsLoadingUsers(true);
      fetch('/api/users')
        .then((res) => res.json())
        .then((resData) => {
          const list: UserAccount[] = Array.isArray(resData)
            ? resData
            : Array.isArray(resData?.data)
            ? resData.data
            : Array.isArray(resData?.users)
            ? resData.users
            : [];
          if (list.length > 0) {
            setSystemUsers(list);
          }
        })
        .catch((err) => console.warn('Could not load users for assignment:', err))
        .finally(() => setIsLoadingUsers(false));
    }
  }, [isOpen, systemUsers.length]);

  const currentGroupKey = String(activeGroup);
  const currentAssignment = assignments[currentGroupKey] || {
    groupNumber: activeGroup,
    groupName: `กลุ่ม ${activeGroup}`,
    advisors: [],
    vipassanaMasters: [],
    notes: '',
  };

  const handleAddAdvisor = (nameToAdd?: string) => {
    const name = (nameToAdd || customAdvisorName).trim();
    if (!name) return;

    setAssignments((prev) => {
      const cur = prev[currentGroupKey] || {
        groupNumber: activeGroup,
        groupName: `กลุ่ม ${activeGroup}`,
        advisors: [],
        vipassanaMasters: [],
      };
      if (cur.advisors?.includes(name)) return prev;
      return {
        ...prev,
        [currentGroupKey]: {
          ...cur,
          advisors: [...(cur.advisors || []), name],
        },
      };
    });
    setCustomAdvisorName('');
    setSelectedUserAdvisorId('');
  };

  const handleRemoveAdvisor = (nameToRemove: string) => {
    setAssignments((prev) => {
      const cur = prev[currentGroupKey];
      if (!cur) return prev;
      return {
        ...prev,
        [currentGroupKey]: {
          ...cur,
          advisors: (cur.advisors || []).filter((a) => a !== nameToRemove),
        },
      };
    });
  };

  const handleAddMaster = (nameToAdd?: string) => {
    const name = (nameToAdd || customMasterName).trim();
    if (!name) return;

    setAssignments((prev) => {
      const cur = prev[currentGroupKey] || {
        groupNumber: activeGroup,
        groupName: `กลุ่ม ${activeGroup}`,
        advisors: [],
        vipassanaMasters: [],
      };
      if (cur.vipassanaMasters?.includes(name)) return prev;
      return {
        ...prev,
        [currentGroupKey]: {
          ...cur,
          vipassanaMasters: [...(cur.vipassanaMasters || []), name],
        },
      };
    });
    setCustomMasterName('');
    setSelectedUserMasterId('');
  };

  const handleRemoveMaster = (nameToRemove: string) => {
    setAssignments((prev) => {
      const cur = prev[currentGroupKey];
      if (!cur) return prev;
      return {
        ...prev,
        [currentGroupKey]: {
          ...cur,
          vipassanaMasters: (cur.vipassanaMasters || []).filter((m) => m !== nameToRemove),
        },
      };
    });
  };

  const handleUpdateNotes = (notes: string) => {
    setAssignments((prev) => {
      const cur = prev[currentGroupKey] || {
        groupNumber: activeGroup,
        groupName: `กลุ่ม ${activeGroup}`,
        advisors: [],
        vipassanaMasters: [],
      };
      return {
        ...prev,
        [currentGroupKey]: {
          ...cur,
          notes,
        },
      };
    });
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      const updatedMeditationConfig: MeditationConfig = {
        ...(event.meditationConfig || {}),
        groupAssignments: assignments,
      };

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_event',
          id: event.id,
          updates: {
            meditationConfig: updatedMeditationConfig,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'ไม่สามารถบันทึกข้อมูลได้');
      }

      event.meditationConfig = updatedMeditationConfig;
      setSaveSuccess(true);
      if (onAssignmentsSaved) {
        onAssignmentsSaved({
          ...event,
          meditationConfig: updatedMeditationConfig,
        });
      }
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyFromGroup = (sourceGroup: number) => {
    const src = assignments[String(sourceGroup)];
    if (!src) return;
    const srcAdvisors = src.advisors || [];
    const srcMasters = src.vipassanaMasters || [];
    if (srcAdvisors.length === 0 && srcMasters.length === 0) {
      alert(`กลุ่ม ${sourceGroup} ยังไม่มีการระบุรายชื่อผู้ดูแล`);
      return;
    }
    setAssignments((prev) => {
      const cur = prev[currentGroupKey] || {
        groupNumber: activeGroup,
        groupName: `กลุ่ม ${activeGroup}`,
        advisors: [],
        vipassanaMasters: [],
      };
      const mergedAdvisors = Array.from(new Set([...(cur.advisors || []), ...srcAdvisors]));
      const mergedMasters = Array.from(new Set([...(cur.vipassanaMasters || []), ...srcMasters]));
      return {
        ...prev,
        [currentGroupKey]: {
          ...cur,
          advisors: mergedAdvisors,
          vipassanaMasters: mergedMasters,
        },
      };
    });
  };

  const practitionerCountForGroup = (gNum: number) => {
    return registrations.filter((r) => {
      const n = r.groupNumber || (r.groupName ? parseInt(r.groupName.replace(/\D/g, ''), 10) : 0);
      return n === gNum;
    }).length;
  };

  return {
    availableGroups,
    activeGroup,
    setActiveGroup,
    assignments,
    currentAssignment,
    currentGroupKey,
    systemUsers,
    isLoadingUsers,
    userAssignedGroupsMap,
    advisorSearch,
    setAdvisorSearch,
    masterSearch,
    setMasterSearch,
    selectedUserAdvisorId,
    setSelectedUserAdvisorId,
    customAdvisorName,
    setCustomAdvisorName,
    selectedUserMasterId,
    setSelectedUserMasterId,
    customMasterName,
    setCustomMasterName,
    filteredAdvisors,
    filteredRegularAdvisors,
    filteredVipassanaAdvisors,
    filteredMasters,
    filteredMasterVipassana,
    filteredMasterOthers,
    isSaving,
    saveSuccess,
    errorMsg,
    handleAddAdvisor,
    handleRemoveAdvisor,
    handleAddMaster,
    handleRemoveMaster,
    handleUpdateNotes,
    handleSaveAll,
    handleCopyFromGroup,
    practitionerCountForGroup,
  };
}
