import assert from 'node:assert/strict';
import test from 'node:test';
import { extractFirstJson, parseLlmJson } from '../src/lib/llm-json.ts';

test('extractFirstJson returns the first JSON object inside code fences', () => {
  const input = '```json\n{"a": 1}\n```\nTrailing text';
  assert.equal(extractFirstJson(input), '{"a": 1}');
});

test('parseLlmJson repairs unescaped newlines in string values', () => {
  const input = '{ "text": "hello\nworld" }';
  const parsed = parseLlmJson<{ text: string }>(input);
  assert.equal(parsed.text, 'hello\nworld');
});

test('parseLlmJson handles surrounding chatter before JSON', () => {
  const input = 'Some preface... {"ok": true, "count": 2} and more text';
  const parsed = parseLlmJson<{ ok: boolean; count: number }>(input);
  assert.deepEqual(parsed, { ok: true, count: 2 });
});
