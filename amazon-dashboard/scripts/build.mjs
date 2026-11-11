import { mkdir, cp, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = new URL('../', import.meta.url);
// 当前项目仅使用具名导入及声明式导出；不引入第三方打包依赖。
const moduleNames = ['mock-data.js', 'core.js', 'storage.js', 'sku-alerts.js', 'sku-view.js', 'knowledge-data.js', 'knowledge.js', 'views.js', 'main.js'];

function inlineModule(source) {
  return source
    .replace(/^import\s+\{([^}]+)\}\s+from\s+['"][^'"]+['"];?\s*$/gm, (_, names) => names.split(',')
      .map(name => name.trim().match(/^(\w+)\s+as\s+(\w+)$/))
      .filter(Boolean)
      .map(([, name, alias]) => `const ${alias} = ${name};`)
      .join('\n'))
    .replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
}

export async function createStandaloneHtml() {
  const template = await readFile(new URL('src/template.html', root), 'utf8');
  const css = await readFile(new URL('src/styles.css', root), 'utf8');
  const modules = await Promise.all(moduleNames.map(async name => `// ${name}\n${inlineModule(await readFile(new URL(`src/${name}`, root), 'utf8'))}`));
  const script = `document.addEventListener('DOMContentLoaded', () => {\n'use strict';\n${modules.join('\n\n')}\n});`;
  return template
    .replace('<link rel="stylesheet" href="./styles.css">', () => `<style>\n${css.replaceAll('</style', '<\\/style')}\n</style>`)
    .replace('<script type="module" src="./main.js"></script>', () => `<script>\n${script.replaceAll('</script', '<\\/script')}\n</script>`);
}

export async function buildProject() {
  const html = await createStandaloneHtml();
  await mkdir(new URL('dist/', root), { recursive: true });
  // 根目录 index.html 与部署入口均为独立单文件，双击即可使用。
  await writeFile(new URL('index.html', root), html);
  await writeFile(new URL('dist/index.html', root), html);
  await cp(new URL('src/', root), new URL('dist/src/', root), { recursive: true });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await buildProject();
  console.log(`构建完成：index.html 可直接双击；静态部署目录 ${fileURLToPath(new URL('dist/', root))}`);
}
