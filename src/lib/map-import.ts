type ImportMemory = { memory: string; next_menu?: string | null; tags: string[]; visited: boolean };

export function getKakaoPlaceId(item: { placeId?: string; kakaoPlace?: { id: string } }) {
  return item.placeId ?? item.kakaoPlace?.id;
}

export function getStableVisitId(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ? id : undefined;
}

export function getVisitsToSave<T extends { id: string }>(visits: T[] | undefined): T[] {
  return visits ?? [];
}

export function getMapRecordSavePlan<T extends { id: string }>(options: {
  createPlace?: boolean;
  memory?: boolean;
  placeName?: string;
  visits?: T[];
}) {
  return {
    createPlace: options.createPlace ?? false,
    saveMemory: options.memory ?? false,
    placeName: options.placeName,
    visits: getVisitsToSave(options.visits),
  };
}

export function resolveSavedMapRestaurant<T extends { id: string }>(saved: T, refreshed: T[]): T {
  return refreshed.find(item => item.id === saved.id) ?? saved;
}

export function canUpdateMapPlace(createdBy: string, userId: string) {
  return createdBy === userId;
}

export function canManageMapVisit(visit: { userId?: string }, userId: string | null, sharedMode: boolean) {
  return !sharedMode || (!!userId && visit.userId === userId);
}

export function getImportMemory(existing: ImportMemory | null, incoming: ImportMemory) {
  if (!existing) return { memory: incoming, conflict: false };
  return {
    memory: existing,
    conflict: existing.memory !== incoming.memory || (existing.next_menu ?? '') !== (incoming.next_menu ?? '') ||
      existing.visited !== incoming.visited || JSON.stringify(existing.tags) !== JSON.stringify(incoming.tags),
  };
}

export function getMissingImportVisits<T extends { sourceId: string }>(existingSourceIds: string[], incoming: T[]) {
  const known = new Set(existingSourceIds);
  return incoming.filter(visit => {
    if (known.has(visit.sourceId)) return false;
    known.add(visit.sourceId);
    return true;
  });
}
