import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { createStandaloneHtml } from '../scripts/build.mjs';

test('双击入口包含全部样式和脚本，不依赖 file:// 外部模块加载', async () => {
  const html = await createStandaloneHtml();
  assert.doesNotMatch(html, /<script[^>]+src=|<link[^>]+stylesheet/);
  assert.doesNotMatch(html, /^import\s|^export\s/gm);
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  assert.doesNotThrow(() => new vm.Script(script));
  for (const name of ['业绩总览', '业绩详情', '广告构成', '单品明细', 'AI基础分析', '数据源设置', '权限设置']) assert.ok(html.includes(name));
});
