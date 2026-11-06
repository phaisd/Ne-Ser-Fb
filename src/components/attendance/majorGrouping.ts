export interface MajorGroupMeta {
  key: 'BUDDHISM' | 'VIPASSANA' | 'PHILOSOPHY' | 'PALI' | 'OTHER';
  order: number;
  labelTh: string;
  labelEn: string;
  shortEn: string;
  badgeColor: string;
}

export function classifyMajor(rawMajor?: string | null): MajorGroupMeta {
  const m = (rawMajor || '').trim().toLowerCase();

  if (m.includes('วิปัสสนา') || m.includes('vipassana') || m.includes('meditation') || m.includes('ภาวนา')) {
    return {
      key: 'VIPASSANA',
      order: 2,
      labelTh: 'สาขาวิชาวิปัสสนาภาวนา',
      labelEn: 'Major: Vipassana Meditation',
      shortEn: 'Vip.',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
    };
  }

  if (m.includes('ศาสนาและปรัชญา') || m.includes('ปรัชญา') || m.includes('phil') || m.includes('relig')) {
    return {
      key: 'PHILOSOPHY',
      order: 3,
      labelTh: 'สาขาวิชาศาสนาและปรัชญา',
      labelEn: 'Major: Religion and Philosophy',
      shortEn: 'Rel.',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
    };
  }

  if (m.includes('บาลี') || m.includes('สันสกฤต') || m.includes('pali') || m.includes('sanskrit')) {
    return {
      key: 'PALI',
      order: 4,
      labelTh: 'สาขาวิชาบาลีสันสกฤต',
      labelEn: 'Major: Pali and Sanskrit',
      shortEn: 'Pali',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    };
  }

  if (m.includes('พระพุทธศาสนา') || m.includes('พุทธศาสนา') || m.includes('buddh') || m === '') {
    return {
      key: 'BUDDHISM',
      order: 1,
      labelTh: 'สาขาวิชาพระพุทธศาสนา',
      labelEn: 'Major: Buddhist Studies',
      shortEn: 'Bud.',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
  }

  const clean = (rawMajor || 'ไม่ระบุสาขา').replace(/^สาขาวิชา/, '').trim();
  return {
    key: 'OTHER',
    order: 5,
    labelTh: `สาขาวิชา${clean}`,
    labelEn: `Major: ${clean}`,
    shortEn: clean.substring(0, 4) + '.',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
  };
}

export interface GroupedMajorSection<T> {
  meta: MajorGroupMeta;
  groupKey: string;
  items: Array<T & { indexInMajor: number; globalIndex: number; majorMeta: MajorGroupMeta }>;
}

/**
 * Sorts students by Major group (พระพุทธศาสนา -> วิปัสสนาภาวนา -> ศาสนาและปรัชญา -> บาลีสันสกฤต -> อื่นๆ)
 * and within each Major group sorts by studentCode ascending, assigning indexInMajor (1, 2, 3...)
 */
export function groupAndSortByMajor<T extends { studentCode: string; major?: string }>(
  list: T[]
): {
  sections: GroupedMajorSection<T>[];
  flatSorted: Array<T & { indexInMajor: number; globalIndex: number; majorMeta: MajorGroupMeta }>;
} {
  const bucketMap = new Map<string, { meta: MajorGroupMeta; items: T[] }>();

  list.forEach((item) => {
    const meta = classifyMajor(item.major);
    const bucketKey = meta.key === 'OTHER' ? `OTHER_${meta.labelTh}` : meta.key;
    if (!bucketMap.has(bucketKey)) {
      bucketMap.set(bucketKey, { meta, items: [] });
    }
    bucketMap.get(bucketKey)!.items.push(item);
  });

  const sortedBuckets = Array.from(bucketMap.entries()).sort((a, b) => {
    if (a[1].meta.order !== b[1].meta.order) {
      return a[1].meta.order - b[1].meta.order;
    }
    return a[1].meta.labelTh.localeCompare(b[1].meta.labelTh, 'th');
  });

  let globalCounter = 0;
  const sections: GroupedMajorSection<T>[] = [];
  const flatSorted: Array<T & { indexInMajor: number; globalIndex: number; majorMeta: MajorGroupMeta }> = [];

  sortedBuckets.forEach(([groupKey, bucket]) => {
    const sortedItems = [...bucket.items].sort((a, b) =>
      String(a.studentCode || '').localeCompare(String(b.studentCode || ''), undefined, {
        numeric: true,
      })
    );

    const enriched = sortedItems.map((item, idx) => {
      globalCounter += 1;
      const row = {
        ...item,
        indexInMajor: idx + 1,
        globalIndex: globalCounter,
        majorMeta: bucket.meta,
      };
      flatSorted.push(row);
      return row;
    });

    sections.push({
      meta: bucket.meta,
      groupKey,
      items: enriched,
    });
  });

  return { sections, flatSorted };
}
