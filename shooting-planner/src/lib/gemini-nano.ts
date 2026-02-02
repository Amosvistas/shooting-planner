// Window AI API 声明
declare global {
  interface Window {
    ai: {
      canCreateTextSession: () => Promise<string>;
      createTextSession: (options?: {
        temperature?: number;
        topK?: number;
      }) => Promise<AISession>;
    };
  }
}

interface AISession {
  prompt: (input: string) => Promise<string>;
  promptStreaming: (input: string) => AsyncIterable<string>;
  destroy: () => void;
}

export async function getGeminiNanoSession() {
  if (typeof window !== 'undefined' && window.ai) {
    const canCreate = await window.ai.canCreateTextSession();
    if (canCreate === 'readily') {
      return await window.ai.createTextSession();
    }
  }
  return null;
}

export async function generateContent(prompt: string) {
  const session = await getGeminiNanoSession();
  if (!session) {
    throw new Error('Gemini Nano is not available. Please check chrome://flags');
  }
  try {
    const result = await session.prompt(prompt);
    return result;
  } finally {
    session.destroy();
  }
}
