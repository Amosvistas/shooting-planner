import type { PlanRecord } from '@/types/plan-record';
import type { ExtendedShootingPlan } from '@/types/single-plan';
import type { ProjectPlan } from '@/types/project-plan';

export function updateSinglePrompt(
  record: PlanRecord,
  sceneIndex: number,
  nextPrompt: string
): PlanRecord {
  if (record.kind !== 'single') return record;

  const data: ExtendedShootingPlan = {
    ...record.data,
    scenes: record.data.scenes.map((s, i) =>
      i === sceneIndex ? { ...s, visualPrompt: nextPrompt } : s
    ),
  };

  return { kind: 'single', data };
}

export function updateProjectPrompt(
  record: PlanRecord,
  sceneKey: number,
  nextPrompt: string
): PlanRecord {
  if (record.kind !== 'project') return record;

  const lookIdx = Math.floor(sceneKey / 100);
  const sceneIdx = sceneKey % 100;

  const nextProject: ProjectPlan = {
    ...record.data,
    plans: record.data.plans.map((p, li) => {
      if (li !== lookIdx) return p;
      return {
        ...p,
        scenes: (p.scenes || []).map((s, si) =>
          si === sceneIdx ? { ...s, visualPrompt: nextPrompt } : s
        ),
      };
    }),
  };

  return { ...record, data: nextProject };
}
