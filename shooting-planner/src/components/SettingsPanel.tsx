'use client';

import { useEffect, useState } from 'react';
import {
  Settings,
  X,
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  TOPIC_EXAMPLES_STORAGE_KEY,
  defaultTopicExamples,
  validateTopicExamples,
} from '@/config/topics';

type Mode = 'nano' | 'api';

export default function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);

  const [mode, setMode] = useState<Mode>('nano');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  // 示例主题（可编辑）
  const [topicExamplesDraft, setTopicExamplesDraft] = useState('');
  const [topicExamplesError, setTopicExamplesError] = useState<string | null>(null);
  const [topicExamplesSaved, setTopicExamplesSaved] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    const savedMode = (localStorage.getItem('gemini_mode') as Mode) || 'nano';

    setApiKey(savedKey);
    setMode(savedMode);

    const rawTopics = localStorage.getItem(TOPIC_EXAMPLES_STORAGE_KEY);
    let initial = defaultTopicExamples;
    if (rawTopics) {
      try {
        const parsed = JSON.parse(rawTopics);
        const result = validateTopicExamples(parsed);
        if (result.ok) initial = result.examples;
      } catch {
        // ignore
      }
    }

    setTopicExamplesDraft(JSON.stringify(initial, null, 2));
  }, []);

  const resetTopicExamples = () => {
    localStorage.removeItem(TOPIC_EXAMPLES_STORAGE_KEY);
    setTopicExamplesDraft(JSON.stringify(defaultTopicExamples, null, 2));
    setTopicExamplesError(null);
    setTopicExamplesSaved(false);
  };

  const saveSettings = () => {
    localStorage.setItem('gemini_mode', mode);
    localStorage.setItem('gemini_api_key', apiKey);

    if (topicExamplesDraft.trim()) {
      try {
        const parsed = JSON.parse(topicExamplesDraft);
        const result = validateTopicExamples(parsed);
        if (!result.ok) {
          setTopicExamplesError(result.error);
          setTopicExamplesSaved(false);
          return;
        }
        localStorage.setItem(TOPIC_EXAMPLES_STORAGE_KEY, JSON.stringify(result.examples));
        setTopicExamplesError(null);
        setTopicExamplesSaved(true);
      } catch (e: any) {
        setTopicExamplesError(e?.message || '示例主题 JSON 解析失败');
        setTopicExamplesSaved(false);
        return;
      }
    }

    setIsOpen(false);
    window.location.reload();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full border border-[var(--line)] bg-white p-3 shadow-sm hover:bg-gray-50 transition"
        aria-label="打开设置"
      >
        <Settings className="w-6 h-6 text-[var(--ink-2)]" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-[var(--line)] bg-white px-6 py-4">
          <h2 className="text-base font-semibold text-[var(--ink)]">设置</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-2 hover:bg-gray-100 transition"
            aria-label="关闭设置"
          >
            <X className="w-5 h-5 text-[var(--ink-2)]" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 运行模式 */}
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-3">运行模式</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('nano')}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  mode === 'nano'
                    ? 'border-[var(--line)] bg-gray-50 text-[var(--ink)]'
                    : 'border-[var(--line)] bg-white text-[var(--ink-2)] hover:bg-gray-50'
                }`}
              >
                本地模式
              </button>
              <button
                type="button"
                onClick={() => setMode('api')}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  mode === 'api'
                    ? 'border-[var(--line)] bg-gray-50 text-[var(--ink)]'
                    : 'border-[var(--line)] bg-white text-[var(--ink-2)] hover:bg-gray-50'
                }`}
              >
                在线模式
              </button>
            </div>
            <p className="mt-2 text-xs text-[var(--ink-3)]">在线模式需要填写 Gemini API Key；本地模式不需要。</p>
          </div>

          {/* API Key */}
          {mode === 'api' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[var(--ink)] flex items-center">
                <Key className="w-4 h-4 mr-2 text-[var(--ink-2)]" /> Gemini API Key
              </label>

              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="在此粘贴你的 API Key"
                  className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 pr-12 text-sm font-mono text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:ring-2 focus:ring-black/10"
                  style={{
                    color: '#000000',
                    backgroundColor: '#ffffff',
                    colorScheme: 'light',
                    WebkitTextFillColor: '#000000',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 hover:bg-gray-100 transition"
                  title={showKey ? '隐藏' : '显示'}
                >
                  {showKey ? (
                    <EyeOff className="w-5 h-5 text-[var(--ink-2)]" />
                  ) : (
                    <Eye className="w-5 h-5 text-[var(--ink-2)]" />
                  )}
                </button>
              </div>

              <p className="text-xs text-[var(--ink-2)] bg-gray-50 p-3 rounded-xl flex items-start border border-[var(--line)]">
                <ShieldCheck className="w-4 h-4 mr-2 flex-shrink-0 text-[var(--ink-2)]" />
                <span>
                  <b>隐私提示：</b>Key 仅保存在你的浏览器本地。
                </span>
              </p>
            </div>
          )}

          {/* 示例主题 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-[var(--ink)]">示例主题（可编辑）</label>
              <button
                type="button"
                onClick={resetTopicExamples}
                className="text-xs font-medium text-[var(--ink-2)] hover:text-[var(--ink)] flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> 恢复默认
              </button>
            </div>

            <textarea
              value={topicExamplesDraft}
              onChange={(e) => {
                setTopicExamplesDraft(e.target.value);
                setTopicExamplesSaved(false);
                setTopicExamplesError(null);
              }}
              rows={7}
              className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-xs font-mono text-[var(--ink)] shadow-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              style={{
                color: '#000000',
                backgroundColor: '#ffffff',
                colorScheme: 'light',
                WebkitTextFillColor: '#000000',
              }}
              placeholder='[\n  "巴洛克人像：单侧硬光、深阴影、油画皮肤质感",\n  "雨夜街头人像：霓虹反光、伞面高光、颗粒胶片感"\n]'
            />

            {topicExamplesError ? (
              <p className="text-xs text-red-700 bg-red-50 p-3 rounded-xl flex items-start border border-red-200">
                <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{topicExamplesError}</span>
              </p>
            ) : topicExamplesSaved ? (
              <p className="text-xs text-green-700 bg-green-50 p-3 rounded-xl flex items-start border border-green-200">
                <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>示例主题已保存（刷新后生效）。</span>
              </p>
            ) : (
              <p className="text-[11px] text-[var(--ink-3)] bg-gray-50 p-3 rounded-xl border border-[var(--line)]">
                说明：这是一个 JSON 字符串数组，最多保留 16 条，会自动去重和 trim。
              </p>
            )}
          </div>

          <button
            onClick={saveSettings}
            className="w-full rounded-xl bg-[var(--accent)] text-white py-3 font-semibold shadow-sm hover:opacity-95 transition"
          >
            保存并应用
          </button>
        </div>
      </div>
    </div>
  );
}
