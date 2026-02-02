import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { apiKey } = await req.json();
    if (!apiKey) return NextResponse.json({ error: "Key required" }, { status: 400 });

    // 默认初始化会尝试访问 v1 或 v1beta
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 使用 fetch 直接调用列表接口，绕过 SDK 可能的版本硬编码
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
