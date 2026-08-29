#!/usr/bin/env bash
#
# Generate Pulse reference traces. Developer tool — never runs as part of the app or of
# `npm run verify`, which reads only the committed JSON this produces.
#
#   ./run.sh                    regenerate every trace in traces.json
#   ./run.sh hemorrhage-class3  regenerate one
#
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo="$(cd "$here/../.." && pwd)"
raw="$here/raw"
mkdir -p "$raw"

# Docker Desktop for Mac does not always symlink its CLI into /usr/local/bin, and its
# credential helper must be on PATH or `docker pull` fails with a confusing credentials error.
if ! command -v docker >/dev/null 2>&1; then
  desktop_bin="/Applications/Docker.app/Contents/Resources/bin"
  if [ -x "$desktop_bin/docker" ]; then
    export PATH="$desktop_bin:$PATH"
    export DOCKER_HOST="${DOCKER_HOST:-unix://$HOME/.docker/run/docker.sock}"
  else
    echo "docker not found. See README.md — this needs Docker Desktop and kitware/pulse." >&2
    exit 1
  fi
fi

image="$(node -e 'process.stdout.write(require("./traces.json").pulseImage)' 2>/dev/null \
  || python3 -c 'import json;print(json.load(open("traces.json"))["pulseImage"],end="")')"

cd "$here"
failed=""
# macOS ships bash 3.2, which has no `mapfile`.
if [ "$#" -eq 0 ]; then
  set -- $(python3 -c 'import json;[print(t["id"]) for t in json.load(open("traces.json"))["traces"]]')
fi

for id in "$@"; do
  scenario="$(python3 -c "
import json,sys
t=[t for t in json.load(open('traces.json'))['traces'] if t['id']=='$id']
if not t: sys.exit('unknown trace id: $id')
print(t[0]['scenario'])
")"
  echo "==> $id"
  echo "    scenario: $scenario"
  # Some scenarios do not record everything a module needs (StandardDataRequests.json has no pH
  # column, for one). `extraDataRequests` appends to the scenario's DataRequestManager and leaves
  # AnyAction untouched — it changes what is RECORDED, never what is simulated, so the case stays
  # Kitware's.
  extra="$(python3 -c "
import json
t=[t for t in json.load(open('traces.json'))['traces'] if t['id']=='$id'][0]
print(json.dumps(t.get('extraDataRequests', [])))
")"

  # The image is amd64-only; on Apple Silicon this runs under Rosetta. Slow, and fine —
  # nothing about generating a reference trace is latency-sensitive.
  docker run --rm --platform linux/amd64 -v "$raw:/work" -e EXTRA_REQUESTS="$extra" "$image" bash -lc "
    set -e
    python3 - '$scenario' /work/\$(basename '$scenario') <<'PYEOF'
import json, os, sys
scenario = json.load(open(sys.argv[1]))
extra = json.loads(os.environ.get('EXTRA_REQUESTS') or '[]')
if extra:
    mgr = scenario.setdefault('DataRequestManager', {})
    requests = mgr.setdefault('DataRequest', [])
    have = {(r.get('Category'), r.get('PropertyName'), r.get('CompartmentName')) for r in requests}
    for r in extra:
        if (r.get('Category'), r.get('PropertyName'), r.get('CompartmentName')) not in have:
            requests.append(r)
json.dump(scenario, open(sys.argv[2], 'w'), indent=2)
PYEOF
    cd /pulse/bin && ./PulseScenarioDriver /work/\$(basename '$scenario')
  " 2>&1 | tail -3 || echo "    (driver exited non-zero — some scenarios end in an irreversible state and abort; a partial CSV is still usable)"
  # Downsample whatever was written. A scenario that kills the patient still leaves a valid
  # trace up to the moment it died, which is often the interesting part.
  if ! node "$here/downsample.mjs" "$id"; then
    echo "    !! downsample failed for $id — continuing" >&2
    failed="$failed $id"
  fi
done

if [ -n "${failed// /}" ]; then
  echo "FAILED:$failed" >&2
  exit 1
fi
