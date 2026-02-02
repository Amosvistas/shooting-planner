import type { ProjectPlan, OutfitPlan, ScenePlan } from '@/types/project-plan';

function safeString(v: any, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function safeArray<T>(v: any): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export function normalizeProjectPlan(raw: any): ProjectPlan {
  const id = safeString(raw?.id, Date.now().toString());
  const createdAt = typeof raw?.createdAt === 'number' ? raw.createdAt : Date.now();

  const client = {
    age: typeof raw?.client?.age === 'number' ? raw.client.age : null,
    gender: raw?.client?.gender === '男' || raw?.client?.gender === '女' || raw?.client?.gender === '不限' ? raw.client.gender : '不限',
    usage: raw?.client?.usage,
  };

  const outfits = safeArray<any>(raw?.outfits).map((o) => ({
    id: safeString(o?.id, `${Date.now()}_${Math.random()}`),
    name: safeString(o?.name, '未命名'),
    color: safeString(o?.color, ''),
    styleTags: safeArray<string>(o?.styleTags).map((s) => safeString(s)).filter(Boolean),
    material: safeString(o?.material, ''),
    notes: safeString(o?.notes, ''),
    layeringA: o?.layeringA,
    layeringB: o?.layeringB,
  }));

  const plans: OutfitPlan[] = safeArray<any>(raw?.plans).map((p) => {
    const scenes: ScenePlan[] = safeArray<any>(p?.scenes).map((s) => ({
      type: s?.type,
      location: safeString(s?.location, ''),
      description: safeString(s?.description, ''),
      shots: safeString(s?.shots, ''),
      visualPrompt: safeString(s?.visualPrompt, ''),
      cutoutSpec: s?.cutoutSpec
        ? {
            background: safeString(s.cutoutSpec.background, ''),
            lighting: safeString(s.cutoutSpec.lighting, ''),
            framing: safeString(s.cutoutSpec.framing, ''),
          }
        : undefined,
    }));

    return {
      outfitId: safeString(p?.outfitId, ''),
      outfitName: safeString(p?.outfitName, ''),
      themeTitle: safeString(p?.themeTitle, ''),
      theme: safeString(p?.theme, ''),
      creativeIdea: safeString(p?.creativeIdea, ''),
      copywriting: safeString(p?.copywriting, ''),
      scenes,
    };
  });

  return { id, createdAt, client, outfits, plans };
}
