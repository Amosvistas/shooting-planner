import { NextResponse } from "next/server";

// Gemini 3 图像生成模型列表（2025年11月发布）
// 参考: https://ai.google.dev/gemini-api/docs/models
const GEMINI_IMAGE_MODELS = [
  "gemini-3-pro-image-preview",           // Gemini 3 Pro Image (Nano Banana Pro) - 最高质量
  "gemini-2.5-flash-image",               // Gemini 2.5 Flash Image - 稳定版
  "gemini-2.0-flash-exp-image-generation", // 旧版备选
];

/**
 * 使用 Gemini 图像生成模型
 */
async function generateWithGemini(prompt: string, apiKey: string): Promise<{
  success: boolean;
  imageBase64?: string;
  mimeType?: string;
  model?: string;
  error?: string;
}> {
  for (const model of GEMINI_IMAGE_MODELS) {
    try {
      console.log(`[generate-image] 尝试模型: ${model}`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `Generate a high quality cinematic photograph for a professional film shoot: ${prompt}` }]
            }],
            generationConfig: {
              responseModalities: ["image", "text"]
            }
          })
        }
      );

      const data = await response.json();
      console.log(`[generate-image] ${model} 响应状态: ${response.status}`);

      if (!response.ok) {
        console.warn(`[generate-image] ${model} 错误:`, data.error?.message || JSON.stringify(data).substring(0, 200));
        continue;
      }

      // 查找图像数据
      const imagePart = data.candidates?.[0]?.content?.parts?.find(
        (p: { inlineData?: { mimeType?: string; data?: string } }) => 
          p.inlineData?.mimeType?.startsWith("image/")
      );

      if (imagePart?.inlineData?.data) {
        console.log(`[generate-image] ✅ 图像生成成功！模型: ${model}`);
        return {
          success: true,
          imageBase64: imagePart.inlineData.data,
          mimeType: imagePart.inlineData.mimeType,
          model
        };
      }

      console.warn(`[generate-image] ${model} 未返回图像`);
      
    } catch (err) {
      const error = err as Error;
      console.error(`[generate-image] ${model} 异常:`, error.message);
    }
  }

  return { success: false, error: "所有模型均未能生成图像" };
}

export async function POST(req: Request) {
  console.log("[generate-image] ========== 收到图像生成请求 ==========");
  
  try {
    const { prompt, apiKey } = await req.json();
    
    console.log("[generate-image] 提示词:", prompt?.substring(0, 100) + (prompt?.length > 100 ? "..." : ""));
    console.log("[generate-image] API Key:", apiKey ? "已提供" : "未提供");

    if (!prompt) {
      return NextResponse.json({ error: "缺少图像描述" }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: "需要 Google API Key 才能生成图像" }, { status: 400 });
    }

    // 使用 Gemini 生成图像
    const result = await generateWithGemini(prompt, apiKey);
    
    if (result.success) {
      return NextResponse.json({
        imageBase64: result.imageBase64,
        mimeType: result.mimeType,
        model: result.model
      });
    }

    return NextResponse.json(
      { error: result.error || "图像生成失败" }, 
      { status: 503 }
    );

  } catch (error) {
    const err = error as Error;
    console.error("[generate-image] ❌ 服务错误:", err.message);
    return NextResponse.json(
      { error: `图像生成失败: ${err.message}` }, 
      { status: 500 }
    );
  }
}
