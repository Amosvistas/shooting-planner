import type { ProjectPlan, ScenePlan } from '@/types/project-plan';
import { buildProjectTitle } from '@/lib/plan-title';

/**
 * 注意：
 * - 为了保持“极简高级”的版心感，导出使用固定网格与留白。
 * - 图片只支持 data:image/... 的 dataURL（Gemini 返回 base64 可直接嵌入）。
 */

export interface ShootingPlan {
  title: string;
  theme: string;
  creativeIdea: string;
  copywriting: string;
  scenes: {
    location: string;
    description: string;
    shots: string;
  }[];
}

type ExportImages = Record<number, string>; // single: sceneIndex -> dataURL; project: lookIndex * 100 + sceneIndex

const SLIDE = {
  w: 13.33,
  h: 7.5,
};

// 版心（左文右图）
const GRID = {
  x: 0.75,
  yHeader: 0.55,
  headerH: 1.15,
  gap: 0.4,
  leftW: 7.1,
  rightW: 4.8,
  contentTop: 1.9,
  imageY: 2.05,
  imageH: 4.95,
};

const COLORS = {
  ink: '161616',
  sub: '5E5E5E',
  light: '9A9A9A',
  line: 'E6E6E6',
  paper: 'FFFFFF',
  paper2: 'F6F6F6',
};

function safe(v: any): string {
  return typeof v === 'string' ? v : '';
}

function compactSpaces(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function truncateText(s: string, maxChars: number): string {
  const t = compactSpaces(s || '');
  if (!t) return '';
  if (t.length <= maxChars) return t;
  return t.slice(0, Math.max(0, maxChars - 1)) + '…';
}

function bulletsFromText(s: string, maxBullets = 6): string {
  const raw = (s || '').trim();
  if (!raw) return '';
  const parts = raw
    .split(/\n|；|;|。/)
    .map((x) => compactSpaces(x))
    .filter(Boolean)
    .slice(0, maxBullets);
  if (!parts.length) return '';
  return parts.map((x) => `• ${x}`).join('\n');
}

function isEmbeddableDataUrl(v?: string): boolean {
  return !!v && typeof v === 'string' && v.startsWith('data:image/');
}

function addBackground(slide: any) {
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: SLIDE.w,
    h: SLIDE.h,
    fill: { color: COLORS.paper },
    line: { color: COLORS.paper },
  });
}

function addAccentBar(slide: any, hex: string, transparency = 82) {
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: SLIDE.w,
    h: 0.11,
    fill: { color: hex, transparency },
    line: { color: hex, transparency: 100 },
  });
}

function addFooterPageNumber(slide: any, pageNo: number) {
  slide.addText(String(pageNo), {
    x: 12.45,
    y: 7.18,
    w: 0.8,
    h: 0.25,
    fontSize: 9,
    color: COLORS.light,
    align: 'right',
  });
}

function addHeader(slide: any, title: string, subtitle?: string) {
  slide.addText(truncateText(title, 60), {
    x: GRID.x,
    y: GRID.yHeader,
    w: SLIDE.w - GRID.x * 2,
    h: 0.6,
    fontSize: 30,
    bold: true,
    color: COLORS.ink,
  });

  if (subtitle) {
    slide.addText(truncateText(subtitle, 90), {
      x: GRID.x,
      y: GRID.yHeader + 0.62,
      w: SLIDE.w - GRID.x * 2,
      h: 0.35,
      fontSize: 13,
      color: COLORS.sub,
    });
  }

  // 细分割线
  slide.addShape('rect', {
    x: GRID.x,
    y: GRID.yHeader + GRID.headerH,
    w: SLIDE.w - GRID.x * 2,
    h: 0.02,
    fill: { color: COLORS.line, transparency: 25 },
    line: { color: COLORS.line, transparency: 100 },
  });
}

function addCard(
  slide: any,
  {
    x,
    y,
    w,
    h,
    label,
    body,
    bodyFontSize = 13,
    bullets = false,
  }: {
    x: number;
    y: number;
    w: number;
    h: number;
    label: string;
    body: string;
    bodyFontSize?: number;
    bullets?: boolean;
  }
) {
  slide.addShape('rect', {
    x,
    y,
    w,
    h,
    fill: { color: COLORS.paper2 },
    line: { color: COLORS.line, width: 1 },
  });

  slide.addText(label, {
    x: x + 0.22,
    y: y + 0.16,
    w: w - 0.44,
    h: 0.25,
    fontSize: 10,
    color: COLORS.light,
    bold: true,
  });

  const content = bullets ? bulletsFromText(body) : compactSpaces(body);
  const capped = truncateText(content || '—', bullets ? 220 : 320);

  slide.addText(capped || '—', {
    x: x + 0.22,
    y: y + 0.46,
    w: w - 0.44,
    h: h - 0.62,
    fontSize: bodyFontSize,
    color: COLORS.ink,
    valign: 'top',
  });
}

function addFramedImage(
  slide: any,
  {
    x,
    y,
    w,
    h,
    imageDataUrl,
    placeholder,
  }: {
    x: number;
    y: number;
    w: number;
    h: number;
    imageDataUrl?: string;
    placeholder?: string;
  }
) {
  const pad = 0.14; // 留白边框
  const canEmbed = isEmbeddableDataUrl(imageDataUrl);

  // 外框（白底 + 极细描边）
  slide.addShape('rect', {
    x,
    y,
    w,
    h,
    fill: { color: COLORS.paper },
    line: { color: COLORS.line, width: 1 },
  });

  if (canEmbed) {
    slide.addImage({
      data: imageDataUrl!,
      x: x + pad,
      y: y + pad,
      w: w - pad * 2,
      h: h - pad * 2,
    });
  } else {
    const text = imageDataUrl
      ? '图片为外链，无法嵌入（建议使用 Gemini 图片生成）'
      : placeholder || '未生成图片';
    slide.addText(text, {
      x,
      y: y + h / 2 - 0.2,
      w,
      h: 0.4,
      fontSize: 10,
      color: COLORS.light,
      align: 'center',
    });
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function getReadableTextColor(bgHex: string): string {
  const rgb = hexToRgb(bgHex);
  if (!rgb) return COLORS.paper;
  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return luminance > 0.62 ? COLORS.ink : COLORS.paper;
}

function normalizeColorToHex(input?: string): string {
  const raw = (input || '').trim();
  if (!raw) return 'CBB89C'; // warm neutral

  const first = raw.split(/[+、,，/\s]/).filter(Boolean)[0] || raw;

  // hex
  const hex = first.startsWith('#') ? first.slice(1) : first;
  if (/^[0-9a-fA-F]{6}$/.test(hex)) return hex.toUpperCase();

  const map: Record<string, string> = {
    白: 'F2F0EA',
    米白: 'EFE6D8',
    奶油: 'F3E7D2',
    黑: '111827',
    灰: 'B8B5AE',
    红: 'C05A5A',
    粉: 'E7B8C0',
    蓝: '7BA6C9',
    绿: '86B3A1',
    黄: 'E2C36B',
    紫: 'B39BC8',
    卡其: 'CBB89C',
    棕: '9B7A62',
    咖: '8A6A58',
    橙: 'D79A6E',
  };

  for (const k of Object.keys(map)) {
    if (first.includes(k)) return map[k];
  }

  return 'CBB89C';
}

function sceneTypeLabel(type: any): string {
  if (type === '主场景') return '主场景';
  if (type === '叠搭A') return '叠搭A';
  if (type === '叠搭B') return '叠搭B';
  if (type === '纯色版面') return '纯色版面';
  return safe(type) || '场景';
}

function getLookAccentHex(project: ProjectPlan, lookIdx: number): string {
  const plan = project.plans[lookIdx];
  const byId = plan?.outfitId ? project.outfits.find((o) => o.id === plan.outfitId) : null;
  const byIndex = project.outfits[lookIdx];
  const colorText = byId?.color || byIndex?.color || '';
  return normalizeColorToHex(colorText);
}

function addCollage2x2(
  slide: any,
  {
    x,
    y,
    w,
    h,
    images,
    labels,
    accentHex,
  }: {
    x: number;
    y: number;
    w: number;
    h: number;
    images: (string | undefined)[];
    labels?: string[];
    accentHex?: string;
  }
) {
  const gap = 0.12;
  const cellW = (w - gap) / 2;
  const cellH = (h - gap) / 2;

  const badgeBg = (accentHex || '111827').toUpperCase();
  const badgeText = getReadableTextColor(badgeBg);

  for (let i = 0; i < 4; i++) {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const cx = x + col * (cellW + gap);
    const cy = y + row * (cellH + gap);

    addFramedImage(slide, {
      x: cx,
      y: cy,
      w: cellW,
      h: cellH,
      imageDataUrl: images[i],
      placeholder: labels?.[i] ? `未生成：${labels[i]}` : '未生成图片',
    });

    if (labels?.[i]) {
      slide.addShape('rect', {
        x: cx,
        y: cy,
        w: cellW,
        h: 0.3,
        fill: { color: badgeBg, transparency: 35 },
        line: { color: badgeBg, transparency: 100 },
      });
      slide.addText(labels[i], {
        x: cx + 0.12,
        y: cy + 0.06,
        w: cellW - 0.24,
        h: 0.24,
        fontSize: 9,
        color: badgeText,
      });
    }
  }
}

/**
 * 单主题导出（保持兼容）：新增可选 images，把已生成参考图嵌入到场景页右侧。
 */
export const exportToPPT = async (plan: ShootingPlan, opts?: { images?: ExportImages }) => {
  const pptxgen = (await import('pptxgenjs')).default;
  const pres = new pptxgen();

  let pageNo = 1;

  // 封面
  let slide = pres.addSlide();
  addBackground(slide);
  addAccentBar(slide, '111827', 88);
  addFooterPageNumber(slide, pageNo++);

  slide.addText(truncateText(plan.title, 40), {
    x: GRID.x,
    y: 2.0,
    w: SLIDE.w - GRID.x * 2,
    h: 1.0,
    fontSize: 40,
    bold: true,
    color: COLORS.ink,
  });

  slide.addText(`主题：${truncateText(plan.theme, 80)}`, {
    x: GRID.x,
    y: 3.05,
    w: SLIDE.w - GRID.x * 2,
    h: 0.4,
    fontSize: 14,
    color: COLORS.sub,
  });

  // 创意
  slide = pres.addSlide();
  addBackground(slide);
  addAccentBar(slide, '111827', 92);
  addFooterPageNumber(slide, pageNo++);
  addHeader(slide, '创意思考', plan.title);

  addCard(slide, {
    x: GRID.x,
    y: GRID.contentTop,
    w: SLIDE.w - GRID.x * 2,
    h: 5.2,
    label: '创意思路',
    body: plan.creativeIdea,
    bodyFontSize: 14,
  });

  // 文案
  slide = pres.addSlide();
  addBackground(slide);
  addAccentBar(slide, '111827', 92);
  addFooterPageNumber(slide, pageNo++);
  addHeader(slide, '文案脚本', plan.title);

  addCard(slide, {
    x: GRID.x,
    y: GRID.contentTop,
    w: SLIDE.w - GRID.x * 2,
    h: 5.2,
    label: '核心文案',
    body: plan.copywriting,
    bodyFontSize: 16,
  });

  // 分镜（左文右图）
  const leftX = GRID.x;
  const leftW = GRID.leftW;
  const rightX = GRID.x + GRID.leftW + GRID.gap;
  const rightW = GRID.rightW;

  plan.scenes.forEach((scene, index) => {
    slide = pres.addSlide();
    addBackground(slide);
    addAccentBar(slide, '111827', 94);
    addFooterPageNumber(slide, pageNo++);

    addHeader(slide, `分镜 ${index + 1}`, scene.location);

    addCard(slide, {
      x: leftX,
      y: GRID.contentTop,
      w: leftW,
      h: 2.35,
      label: '场景描述',
      body: scene.description,
      bodyFontSize: 13,
    });

    addCard(slide, {
      x: leftX,
      y: GRID.contentTop + 2.55,
      w: leftW,
      h: 2.2,
      label: '镜头建议',
      body: scene.shots,
      bullets: true,
      bodyFontSize: 13,
    });

    // 右侧图片
    addFramedImage(slide, {
      x: rightX,
      y: GRID.imageY,
      w: rightW,
      h: GRID.imageH,
      imageDataUrl: opts?.images?.[index],
      placeholder: '未生成参考图',
    });

    // 小脚注（保留但极简）
    slide.addText('Tip：导出前先生成参考图，PPT 会自动嵌入。', {
      x: leftX,
      y: 7.18,
      w: 10.8,
      h: 0.25,
      fontSize: 9,
      color: COLORS.light,
    });
  });

  await pres.writeFile({ fileName: `${plan.title}_拍摄预案.pptx` });
};

/**
 * 三套服装项目导出：
 * - 项目封面（1）
 * - 每套：总览（1，右侧 2x2 拼贴）+ 4 场景页（4，右侧大图）
 */
export const exportProjectToPPT = async (
  project: ProjectPlan,
  opts?: { fileName?: string; images?: ExportImages }
) => {
  const pptxgen = (await import('pptxgenjs')).default;
  const pres = new pptxgen();

  const projectTitle = buildProjectTitle(project.client);
  const firstAccent = getLookAccentHex(project, 0);

  let pageNo = 1;

  // 项目封面
  let slide = pres.addSlide();
  addBackground(slide);
  addAccentBar(slide, firstAccent, 82);
  addFooterPageNumber(slide, pageNo++);

  slide.addText(truncateText(projectTitle, 40), {
    x: GRID.x,
    y: 1.85,
    w: SLIDE.w - GRID.x * 2,
    h: 0.8,
    fontSize: 38,
    bold: true,
    color: COLORS.ink,
  });

  slide.addText(`客户：${project.client.age ?? '未知'}岁｜${project.client.gender}${project.client.usage ? `｜${project.client.usage}` : ''}`, {
    x: GRID.x,
    y: 2.75,
    w: SLIDE.w - GRID.x * 2,
    h: 0.4,
    fontSize: 13,
    color: COLORS.sub,
  });

  // Look 列表（极简卡片）
  const cardY = 3.35;
  const cardH = 3.6;
  const cardGap = 0.22;
  const colW = (SLIDE.w - GRID.x * 2 - cardGap * 2) / 3;

  project.plans.slice(0, 3).forEach((p, i) => {
    const x = GRID.x + i * (colW + cardGap);
    slide.addShape('rect', {
      x,
      y: cardY,
      w: colW,
      h: cardH,
      fill: { color: COLORS.paper2 },
      line: { color: COLORS.line, width: 1 },
    });

    slide.addText(`LOOK ${i + 1}`, {
      x: x + 0.18,
      y: cardY + 0.15,
      w: colW - 0.36,
      h: 0.25,
      fontSize: 10,
      color: COLORS.light,
      bold: true,
    });

    slide.addText(truncateText(p.themeTitle || p.outfitName || `Look ${i + 1}`, 22), {
      x: x + 0.18,
      y: cardY + 0.5,
      w: colW - 0.36,
      h: 0.6,
      fontSize: 16,
      color: COLORS.ink,
      bold: true,
    });

    slide.addText(truncateText(p.theme || '', 80), {
      x: x + 0.18,
      y: cardY + 1.05,
      w: colW - 0.36,
      h: 2.4,
      fontSize: 12,
      color: COLORS.sub,
      valign: 'top',
    });
  });

  // Look slides
  const leftX = GRID.x;
  const leftW = GRID.leftW;
  const rightX = GRID.x + GRID.leftW + GRID.gap;
  const rightW = GRID.rightW;

  project.plans.forEach((p, idx) => {
    const lookName = p.themeTitle || p.outfitName || `Look ${idx + 1}`;
    const accentHex = getLookAccentHex(project, idx);

    // Look 总览页（右侧拼贴）
    slide = pres.addSlide();
    addBackground(slide);
    addAccentBar(slide, accentHex, 82);
    addFooterPageNumber(slide, pageNo++);

    addHeader(slide, `第 ${idx + 1} 套：${lookName}`, truncateText(p.theme || '', 80));

    addCard(slide, {
      x: leftX,
      y: GRID.contentTop,
      w: leftW,
      h: 1.05,
      label: '核心主题',
      body: p.theme,
      bodyFontSize: 13,
    });

    addCard(slide, {
      x: leftX,
      y: GRID.contentTop + 1.25,
      w: leftW,
      h: 2.25,
      label: '创意思路',
      body: p.creativeIdea,
      bodyFontSize: 13,
    });

    addCard(slide, {
      x: leftX,
      y: GRID.contentTop + 3.7,
      w: leftW,
      h: 1.65,
      label: '核心文案',
      body: p.copywriting,
      bodyFontSize: 14,
    });

    const collageImages = [0, 1, 2, 3].map((si) => opts?.images?.[idx * 100 + si]);
    addCollage2x2(slide, {
      x: rightX,
      y: GRID.contentTop,
      w: rightW,
      h: rightW, // 正方形拼贴
      images: collageImages,
      labels: ['主场景', '叠搭A', '叠搭B', '纯色版面'],
      accentHex,
    });

    // 场景页（4）
    (p.scenes || []).slice(0, 4).forEach((s: ScenePlan, si: number) => {
      const label = sceneTypeLabel(s.type);
      const sceneKey = idx * 100 + si;

      slide = pres.addSlide();
      addBackground(slide);
      addAccentBar(slide, accentHex, 86);
      addFooterPageNumber(slide, pageNo++);

      addHeader(slide, `第 ${idx + 1} 套 - ${label}`, s.location);

      addCard(slide, {
        x: leftX,
        y: GRID.contentTop,
        w: leftW,
        h: 2.35,
        label: '场景描述',
        body: s.description,
        bodyFontSize: 13,
      });

      // 如果是纯色版面，镜头建议里更偏“抠图/排版”，并额外补充一行规格
      const shotsText = s.type === '纯色版面' && s.cutoutSpec
        ? `${s.shots}\n背景：${safe(s.cutoutSpec.background)}；打光：${safe(s.cutoutSpec.lighting)}；构图：${safe(s.cutoutSpec.framing)}`
        : s.shots;

      addCard(slide, {
        x: leftX,
        y: GRID.contentTop + 2.55,
        w: leftW,
        h: 2.2,
        label: '镜头建议',
        body: shotsText,
        bullets: true,
        bodyFontSize: 13,
      });

      // 右侧大图（杂志留白边框）
      addFramedImage(slide, {
        x: rightX,
        y: GRID.imageY,
        w: rightW,
        h: GRID.imageH,
        imageDataUrl: opts?.images?.[sceneKey],
        placeholder: '未生成参考图',
      });

      // 极小英文 prompt（可选）
      if (s.visualPrompt) {
        slide.addText(`Prompt: ${truncateText(s.visualPrompt, 140)}`, {
          x: leftX,
          y: 7.18,
          w: 10.8,
          h: 0.25,
          fontSize: 8,
          color: COLORS.light,
        });
      }
    });
  });

  const fileName = opts?.fileName || `${projectTitle}_拍摄预案.pptx`;
  await pres.writeFile({ fileName });
};
