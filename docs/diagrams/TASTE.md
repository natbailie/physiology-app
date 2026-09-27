# Diagram taste

**Status: corrected against the work, September 2026.** The first draft was written from the 22
reference images in `references/` before anything had been built to it. Converting eight modules,
drawing ten organs and deleting six of them showed which parts of it were right, which were too
strong, and which were simply absent. Every correction below is marked and says what it cost.

`CLAUDE.md`'s "Drawing diagrams" section is a list of corrections — things that broke and must not
be repeated. It stays. This file is the other half: what to aim at, so a drawing can be held
against something.

---

## The rule the first draft did not have

**The question is never "should this have a rail / an organ / an outline". It is "is what is drawn
now worse than what would replace it".**

This is the single most expensive lesson in the project. Working from the spec downwards produced:
eight organ builders of which six were worse than the drawings they were meant to replace and were
deleted; a rail backlog of 26 modules of which exactly one was a genuine fault; and a "styling gap"
of 3,085 CSS lines that turned out to be one class. Each was found by looking at the thing rather
than by reading the rule.

`renalTubular`, `vision`, `vestibular`, `somaticSensation` and `hearing` are already good. Leave
them. A generic shape that satisfies this file is not an improvement on a specific one that does
not.

## The four decisions

| | |
|---|---|
| **Colour** | Anatomical identity, signal palette on top. |
| **Label case** | Sentence case everywhere. |
| **Fidelity** | Shaded and recognisable, not painted. |
| **Phone layout** | Label rail when wide; numbered key when narrow. |

---

## Register

Unchanged, and the references split into exactly these three groups on their own.

- **Anatomical** where the subject is an organ. Draw the organ.
- **Schematic** where the subject is cellular, molecular, or a pathway. Drawing these as gross
  anatomy lies about the scale.
- **Graph** where the subject is a relationship. These must not be dressed as anatomy.

**Correction.** Register is decided by the SUBJECT, not the topic. The respiratory family splits
across all three: `respiratory` is anatomical, `respiratoryMechanics` and `mechanicalVentilation`
are instrument panels, `respiratoryFailure` is a plot. Grouping work by topic wasted a tranche.

---

## Labels

### The rail

Names go in a column down the margin, on a thin leader ending in a small dot on the thing named.
Declared as a `labelRail`, never placed by hand: the renderer stacks them at a fixed line height
beside their own targets, so two labels cannot collide.

**Correction — this was far too strong.** The first draft said "names live in the margin, not on
the drawing", and on that reading 26 modules needed converting. They did not. A detector for the
real fault returned 14 and the two worst were false positives: `autonomicNervous` and
`calciumHomeostasis` put each name directly under its own organ, near the frame edge only because
the organs are.

**The fault the rail fixes is a name DETACHED from what it names.** `neuromuscularJunction` had
five labels pinned at x=20 and x=438 with nothing joining them; "Acetylcholinesterase" named an
enzyme drawn 280 units away. That is a rail. A name already sitting on or beside its structure is
finished — adding a leader to it buys nothing.

### Labels that stay on the drawing

Region names: a lobe, a chamber, a zone. "Superior" inside a lung, "Heart" on a heart.

**Correction — there is a second test, and it wins.** Where the frame has no room, the margin is
the room. `glucoseRegulation` is 360 units across with four pathway labels already in it: set on
the organ, "Pancreas" landed on "Insulin → uptake" and "Liver" landed on the gallbladder. Both are
railed, which contradicts the region rule and is still right.

### Case

Sentence case. Acronyms keep their capitals. Matches 17 of the 22 references; the Cascade
screenshots are the exception and we are not following them there.

### Density

**Correction — the "8–14 names" figure was invented.** It came from counting the references, which
are textbook plates with more room than a 480-unit frame. In practice a converted module carries
four to eight. What matters is the ceiling, not the floor: above about sixteen a rail stops reading
as a list.

**Name only what is drawn.** `respiratory` carried two names over a builder drawing a trachea,
carina, both main bronchi, three fissures and a diaphragm — eight things, none of them named.
Converting the two labels would have changed nothing. Naming what the builder already draws is
most of what makes a diagram look like the references.

### Gutters

**New — this is not in the first draft and every conversion needed it.**

- The 96-unit default clips anything longer than about fifteen characters. "R. main bronchus"
  needs 110; "Acetylcholinesterase" needs 124. Abbreviate the way the reference plates do
  ("L. main bronchus") *and* widen.
- A gutter is not always needed on both sides. `neuromuscularJunction` puts every name in the left
  column and is widened on the left alone — a right gutter would have been 124 units of empty
  margin, and its EPP bar is what the right column's leaders were crossing.
- **A single column is a legitimate layout**, not a failure to balance. The Britannica kidney and
  the Kenhub synapse both do it, and `coronaryCirculation` has to: every target is left of the
  midline and a right-column leader would cross the whole ventricle.

### Targets are measured, not derived

**New, and the most repeated mistake in the project.** Organ builders are placed with a translate,
a scale and sometimes a flip. Deriving a target by hand through that transform produced
`respiratory`'s first set pointing into empty space and `gastrointestinal`'s aimed at a stomach
body mistaken for the oesophagus.

Render the frame, read the group's bounding box out of the DOM, and place targets against that.

---

## Drawing an organ

### Layering

Opaque underlay → wash → internal structures → **outline** → labels, which is the order
`organShapes.ts` already implements.

**Correction to "every organ has a visible outline".** True of objects, false as a blanket rule: 49
filled shapes in the app carry no edge and many are correct that way. A plot's region band, a wash
behind a label, a glow — these are tints, not objects, and an outline on one is wrong. **Outline
what is meant to be a thing.**

### Shading

The organ's own colour getting denser. A gradient is depth, never data. Light from the top-left.

### Scale

**New.** `respiratory`'s lungs were 23% of the frame's width before the rail took another 220
units out of it — a plate with a lot of margin and a small drawing in it. Every reference gives its
subject roughly half the plate. Scale the organ to match, then re-measure every target and every
pathway label, because both move.

### Fidelity

Clear silhouette, a darker outline, two to four internal structures, colour-on-colour volume.
Roughly 30–80 path commands. The kidney, heart and intestine references are the level; the Cascade
liver is past it.

**Shape it standalone first.** `node --experimental-strip-types` loads `organShapes.ts` directly —
its only import is type-only, which is exactly what makes that work, so never add a value import to
that file. Two states side by side, before wiring. That loop caught a bladder whose wall and urine
were the same colour, a cord whose grey matter was a blob, an ossicular chain that read as a
lightning bolt and a skull whose mass band was the same red as its blood band.

### Make the subject's variable visible

**New.** An organ that does not move teaches nothing here. The bladder's dome is computed from
volume; the ventricle is two rings because subendocardial starving while subepicardium holds is the
claim; the skull's vault is the one shape in the file that must respond to nothing.

Watch for a control whose correlate is fake: `micturition` drew both sphincters from
`externalSphincterTone`, so the internal one was never driven by the nerve that controls it — in
the module whose point is that they are independent.

---

## Colour

**Anatomical identity first; signal colour on top.** An organ takes its own hue so that a signal
colour always means *read me*. At most two signal colours at once.

**Correction — the gap was much smaller than assumed.** The palette already carried `--liver`,
`--marrow`, `--placenta`, `--pituitary`, `--retina`, `--cochlea`, `--vestibular`, `--venous`,
`--capillary`, `--tubule` and `--medulla`. Twelve new bases closed it.

**Anatomy tokens are exempt from the 4.5:1 text floor, and enforced never to be text.** That floor
is right for a signal because a signal labels a readout; applied to a fill it forces lung pink to a
maroon. They are held to the 3:1 graphical floor as an outline instead, and `palette.test.ts` fails
if any presentation paints a `text` node in one.

**A container and its contents must not share a hue.** `--bladder` was an olive a shade off
`--urine` and a full bladder read as a solid object rather than as a container with something in
it. The wall is muscle; it is a muscle colour now.

---

## Flow

Draw it. Six of the references make arrows a first-class element. An arrow takes anatomical colour
if it is a thing (blood, bile, air) and a signal colour if its size or presence is a reading.

---

## Frame idioms

### Step sequences

The hemostasis reference draws one vessel three times, captioned step 1/2/3, with only the taught
thing changing. Use it where the subject is a sequence. **Still unused in this app.**

### Insets

A plot may sit inside the diagram frame **only** when a leader anchors it to the structure it
explains, and only when it plots a property of that exact location. An unanchored plot in the
diagram frame is the old fault and stays banned.

### Legends

**New.** A leader onto the thing beats a colour chip beside a word. `coronaryCirculation` had a
two-row swatch legend for its wall layers — and both swatches were the same colour, because both
resolved to `artery` at rest. The rail replaced it.

---

## The graph register

Thick curves. **Each series named inline in its own colour, beside its own curve, not in a legend
box.** Annotations on curved leaders. Axis titles rotated along their own axis.

**Correction — already met.** `venousReturn` names "venous return" and "cardiac function" inline in
their own colours and annotates on the curves; `metabolism` names each bar segment beside it. What
needed fixing was narrower: `anaesthesia` and `toxicology` put both axis names on one centred line
where the frame clipped it and it ran through the tick row.

**One title per axis, and place both from measured boxes.** Splitting them moved the collision
rather than removing it — the rotated y title occupied x 3–16, exactly where the y ticks sat.

---

## What never happens

- **The answer is never printed during practice.**
- **Motion is emphasis, never the only carrier of meaning.**
- **Every control has a visible correlate** — and the correlate must be its own, not one shared
  with another control.

---

## On the references themselves

`references/` holds textbook plates, teaching figures and competitor screenshots, several
watermarked or credited — Kenhub, Encyclopædia Britannica, AnatomyStuff, BioRender.

**They inform proportion, layering, label discipline and colour. No path is traced and no figure
reproduced.** A commercial requirement in a paid product, not a preference.

---

## Still unsettled

Honest list of what this file asserts without evidence, so the next person knows which lines to
distrust:

- **Nat has not corrected this file.** It is my reading of the references, twice over.
- The 16-name ceiling is a judgement, not a measurement.
- Step sequences are recommended and unused, so nothing has tested whether they work here.
- "Shaded and recognisable" was chosen over "painted" before any organ existed. Two were built and
  kept. Whether that level is actually the right one for a paid product is untested.
