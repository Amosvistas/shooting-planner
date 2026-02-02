export type Gender = '男' | '女' | '不限';

export type LayeringTemplateKey =
  | '外套叠穿'
  | '帽子/发饰'
  | '围巾/披肩'
  | '鞋包替换'
  | '层次细节（卷袖/塞衣角/腰带）'
  | '道具加持（气球/花束/玩具/书本）'
  | '发型变化（扎发/散发/半扎）'
  | '动作变化（站/坐/走/跑/跳）'
  | '机位变化（近景/半身/全身/俯拍/仰拍）';

export type OutfitInput = {
  id: string;
  name: string;
  color?: string;
  styleTags: string[];
  material?: string;
  notes?: string;
  layeringA?: LayeringTemplateKey;
  layeringB?: LayeringTemplateKey;
};

export type ClientProfile = {
  age: number | null;
  gender: Gender;
  usage?: '电商' | '种草' | '品牌' | '留念' | '其它';
};

export type SceneType = '主场景' | '叠搭A' | '叠搭B' | '纯色版面';

export type CutoutSpec = {
  background: string; // e.g. 浅灰/米白/浅蓝
  lighting: string; // e.g. 双柔光 + 弱轮廓
  framing: string; // e.g. 右侧留白30%
};

export type ScenePlan = {
  type: SceneType;
  location: string;
  description: string;
  shots: string;
  visualPrompt?: string;
  cutoutSpec?: CutoutSpec;
};

export type OutfitPlan = {
  outfitId: string;
  outfitName: string;
  themeTitle: string;
  theme: string;
  creativeIdea: string;
  copywriting: string;
  scenes: ScenePlan[]; // 固定 4 个：主场景/叠搭A/叠搭B/纯色版面
};

export type ProjectPlan = {
  id: string;
  createdAt: number;
  client: ClientProfile;
  outfits: OutfitInput[];
  plans: OutfitPlan[];
};
