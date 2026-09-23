import { test } from 'vitest';
import { loadCorpus } from '@/shared/chat/corpus';
import { buildIndex, retrieve } from '@/shared/chat/retrieve';
import { excerptsFrom, moduleCatalogue } from '@/shared/chat/systemPrompt';
import { MODULES } from '@/home/moduleRegistry';

const catalogue = moduleCatalogue(MODULES);

async function ask(index: any, messages: {role:'user'|'assistant';content:string}[], moduleId?: string) {
  const q = messages.at(-1)!.content;
  const hits = retrieve(index, q, { moduleId, limit: 6 });
  const res = await fetch('http://localhost:5174/api/chat', { method: 'POST', headers: {'content-type':'application/json'},
    body: JSON.stringify({ messages, context: { catalogue, excerpts: excerptsFrom(hits) } }) });
  const body = await res.text();
  let answer = '';
  for (const f of body.split('\n\n')) { try { const e = JSON.parse(f.replace(/^data: /,'')); if (e.type==='text') answer += e.text; else if (e.type!=='done') answer += ` [${JSON.stringify(e)}]`; } catch {} }
  console.log(`\n### Q: ${q}\nstatus ${res.status}\nretrieved: ${hits.map(h=>h.title.slice(0,70)).join(' | ')}\nA: ${answer}\n`);
  return answer;
}

test('probe', async () => {
  const index = buildIndex(await loadCorpus());
  console.log('chunks', index.chunks.length, 'catalogue lines', catalogue.split('\n').length, 'catalogue chars', catalogue.length);
  const a1 = await ask(index, [{ role: 'user', content: 'How does the Frank-Starling mechanism work?' }]);
  await ask(index, [{ role: 'user', content: 'How does the Frank-Starling mechanism work?' }, { role: 'assistant', content: a1 }, { role: 'user', content: 'why does that happen at the molecular level?' }]);
  await ask(index, [{ role: 'user', content: 'What is the capital of France?' }]);
  await ask(index, [{ role: 'user', content: 'Can you explain how mRNA vaccines work?' }]);
  await ask(index, [{ role: 'user', content: 'Which module in the app should I use to learn about ADH?' }]);
}, 300_000);
