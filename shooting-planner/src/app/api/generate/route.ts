import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, apiKey } = await req.json();

    if (!apiKey) return NextResponse.json({ error: "API Key 未配置" }, { status: 400 });

    // 根据 ListModels 的结果，锁定您的可用模型
    const tryConfigs = [
      { url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, name: "gemini-2.0-flash" },
      { url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, name: "gemini-2.5-flash" }
    ];

    let lastErrorDetails = null;

    for (const config of tryConfigs) {
      try {
        console.log(`正在尝试您的可用模型: ${config.name}...`);
        const response = await fetch(config.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4096,
              // Ask the model to return strict JSON when possible.
              responseMimeType: 'application/json',
            }
          })
        });

        const data = await response.json();

        if (response.ok) {
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          console.log(`✅ 成功连接！使用的模型是: ${config.name}`);
          return NextResponse.json({ text: text.replace(/```json\n?|\n?```/g, '').trim() });
        }

        console.warn(`❌ ${config.name} 失败:`, data.error?.message || response.status);
        lastErrorDetails = data.error;
      } catch (e: any) {
        console.error(`网络异常: ${config.name}`, e.message);
      }
    }

    return NextResponse.json({ 
      error: "模型调用失败", 
      message: lastErrorDetails?.message || "请检查网络代理和 API Key 状态"
    }, { status: 404 });

  } catch (error: any) {
    return NextResponse.json({ error: "服务器内部错误", message: error.message }, { status: 500 });
  }
}
