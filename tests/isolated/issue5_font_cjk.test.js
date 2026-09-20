import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodeEntities } from '../../src/sources/nekopoi/parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tokensPath = path.resolve(__dirname, '../../src/web/styles/tokens.css');

test('Issue 5 - tokens.css must include CJK system font fallbacks in typography tokens', () => {
  const css = fs.readFileSync(tokensPath, 'utf8');
  // Must include CJK font family fallbacks for Japanese, Chinese, and Korean
  const hasJapaneseFont = css.includes('Hiragino') || css.includes('Meiryo') || css.includes('Yu Gothic');
  const hasChineseFont = css.includes('PingFang') || css.includes('Microsoft YaHei');
  assert.ok(hasJapaneseFont, 'tokens.css font stack must include Japanese fonts (Hiragino/Meiryo/Yu Gothic)');
  assert.ok(hasChineseFont, 'tokens.css font stack must include Chinese fonts (PingFang/Microsoft YaHei)');
});

test('Issue 5 - decodeEntities must decode decimal and hex numeric unicode HTML entities', () => {
  // Test numeric unicode entities: &#26085;&#26412; -> 日本, &#x9b54;&#x6cd5; -> 魔法
  const rawHtmlText = '&#26085;&#26412; &#x9b54;&#x6cd5; &amp; English';
  const decoded = decodeEntities(rawHtmlText);
  assert.equal(decoded, '日本 魔法 & English', 'decodeEntities must properly decode numeric & hex unicode entities for CJK');
});
