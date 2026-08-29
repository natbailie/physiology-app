// Turn a 20 MB Pulse results CSV into the small JSON trace the oracle tests read.
//
// Pulse emits one row per 0.02 s timestep, which is both far more resolution than a
// clinical assertion needs and far too much to commit. This selects the columns named in
// traces.json, samples them at the manifest's interval, and records the landmark times the
// tests assert against.
//
//   node downsample.mjs <traceId>

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..');

const traceId = process.argv[2];
if (!traceId) {
  console.error('usage: node downsample.mjs <traceId>');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(join(here, 'traces.json'), 'utf8'));
const trace = manifest.traces.find((t) => t.id === traceId);
if (!trace) {
  console.error(`unknown trace id: ${traceId}`);
  process.exit(1);
}

// PulseScenarioDriver names its output after the scenario FILE, not the scenario's "Name" field.
const scenarioBase = trace.scenario.split('/').pop().replace(/\.json$/, '');
const resultsCsv = `${scenarioBase}Results.csv`;
const csvPath = join(here, 'raw', resultsCsv);
const lines = readFileSync(csvPath, 'utf8').split('\n');
const header = lines[0].split(',');

const TIME = 'Time(s)';
const timeIndex = header.indexOf(TIME);
if (timeIndex === -1) throw new Error(`no ${TIME} column in ${resultsCsv}`);

// Fail loudly on a renamed column rather than silently committing a trace full of nulls —
// a Pulse upgrade changing a property name is exactly the case this must not paper over.
const picks = Object.entries(trace.columns).map(([name, column]) => {
  const index = header.indexOf(column);
  if (index === -1) {
    throw new Error(`column "${column}" (for "${name}") is not in ${resultsCsv}`);
  }
  return { name, index };
});

const landmarks = new Set(Object.values(trace.landmarks).map(round));
// `denseWindows` keeps EVERY timestep inside the given [start, end] spans. A PV loop is a shape,
// not a value, so it cannot be read off a trace sampled once every ten seconds — but keeping all
// 50 Hz rows for the whole run would be megabytes. Dense windows are the compromise.
const denseWindows = trace.denseWindows ?? [];
const inDenseWindow = (t) => denseWindows.some(([from, to]) => t >= from && t <= to);
const isWanted = (t) =>
  landmarks.has(t) ||
  inDenseWindow(t) ||
  Math.abs(t / trace.sampleIntervalSeconds - Math.round(t / trace.sampleIntervalSeconds)) < 1e-9;

const samples = [];
let lastTime = 0;
for (let i = 1; i < lines.length; i += 1) {
  const line = lines[i];
  if (!line) continue;
  const cells = line.split(',');
  const t = round(Number(cells[timeIndex]));
  lastTime = t;
  if (!isWanted(t)) continue;
  const sample = { t };
  for (const { name, index } of picks) sample[name] = round(Number(cells[index]));
  samples.push(sample);
}

const out = {
  $generatedBy: 'tools/pulse-oracle/run.sh — do not edit by hand',
  pulseImage: manifest.pulseImage,
  scenario: trace.scenario,
  description: trace.description,
  durationSeconds: lastTime,
  sampleIntervalSeconds: trace.sampleIntervalSeconds,
  landmarks: trace.landmarks,
  denseWindows,
  samples,
};

const outPath = join(repo, 'src', 'modules', trace.module, 'engine', '__oracle__', `${trace.id}.json`);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);

console.log(`    ${samples.length} samples over ${lastTime}s -> ${outPath.replace(`${repo}/`, '')}`);

function round(n) {
  return Math.round(n * 100) / 100;
}
