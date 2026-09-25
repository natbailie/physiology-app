# Diagram taste

**Status: draft, written from the 22 reference images in `references/`. Nat corrects it.**

`CLAUDE.md`'s "Drawing diagrams" section is a list of corrections — things that broke
and must not be repeated. It is valuable and it stays, but it describes what to avoid
and never what to aim at. This file is the other half: what a good diagram in this app
looks like, stated positively, so a drawing can be held against something.

Where the two disagree, say so out loud and fix one of them. There is one known
disagreement today, recorded under *Insets* below.

---

## The four decisions

| | |
|---|---|
| **Colour** | Anatomical identity, signal palette on top. |
| **Label case** | Sentence case everywhere. |
| **Fidelity** | Shaded and recognisable, not painted. |
| **Phone layout** | Label rail when wide; numbered key when narrow. |

---

## Register

Unchanged from `CLAUDE.md`, and the references confirm it rather than challenge it —
they split into exactly these three groups on their own.

- **Anatomical** where the subject is an organ. Draw the organ.
- **Schematic** where the subject is cellular, molecular, or a pathway. A sarcomere, a
  synapse, a coagulation cascade, a lineage tree. Drawing these as gross anatomy lies
  about the scale.
- **Graph** where the subject is a relationship. Guyton curves, a Davenport diagram, a
  pressure–volume loop. These must not be dressed as anatomy.

Topological and structural truth is the floor under all three.

---

## Labels

### The rail

**Names live in the margin, not on the drawing.** 17 of the 22 references do this and
it is the most visible single difference between them and what we currently draw.

- Labels stack in a column down the left and right margins, in author order, at a
  fixed line height.
- A **leader** joins each label to the thing it names: a thin straight line from the
  label's inner edge, ending in a small filled dot (about 1.5 units) on the target.
- The rail is declared, not hand-placed — see `labelRail` in
  `shared/presentation/types.ts`. A presentation says *what is named and where it
  points*; the renderer owns the layout. This is what makes collisions impossible
  rather than something the sweep finds afterwards.

### Labels that stay on the drawing

Reserved for **regions**, where a leader would be absurd: a lobe, a chamber, a zone,
a compartment. Centred on the region, and on nothing smaller than a region.

The respiratory reference does both at once and is the model: "Superior lobe" and
"Inferior lobe" sit inside the lungs; everything narrower — bronchus, epiglottis,
thyroid cartilage — is on a leader out to the margin.

### Case

**Sentence case. Acronyms keep their capitals; nothing else shouts.** "Bowman's
capsule", "Proximal tubule", "V/Q", "FEV1/FVC".

This matches 17 of the references and the existing house rule. The Cascade screenshots
are the exception in the reference set — they set labels in tracked uppercase — and we
are not following them there.

### Density

A frame carries **8–14 rail labels**. The references cluster tightly around this: the
kidney has 11, the heart 11, the intestine 18 (and is the busiest of them by some
way), the synapse 8.

Above about 16 the rail stops reading as a list and starts reading as a wall. If a
diagram needs more than that, it is two diagrams or one diagram with an inset.

---

## Drawing an organ

### Layering

Opaque underlay → wash → internal structures → **outline** → labels. This is the order
`organShapes.ts` already implements.

**Every reference organ has a visible darker outline.** Most of ours do not, and it is
a large part of why theirs read as objects and ours read as stains. The outline is the
organ's own hue, darker — never black.

### Shading

The organ's own colour getting denser. The same hue at 16% against the same hue at 68%
reads as volume in both themes, where a white highlight survives light and vanishes in
dark. Light falls from the top-left, consistently, across the whole app.

A gradient is **depth, never data**. It says an organ is round, not that a value is
high.

### Fidelity

Clear silhouette, a darker outline, two to four internal structures, colour-on-colour
shading. The kidney, heart and intestine references are the level; the Cascade liver
and colon are past it.

Roughly 30–80 path commands per organ. That is a deliberate ceiling: everything here
is hand-written SVG with no runtime dependency, so fidelity is paid for in path data
we author and then have to maintain.

---

## Colour

**Anatomical identity first; signal colour on top of it.**

- The organ is painted its real colour — arterial red, venous blue, hepatic maroon,
  biliary green, pancreatic tan, renal cortex against a darker medulla.
- **Signal colour is reserved for what VARIES.** A value, a rate, a pathological
  highlight. This is the point of the change: once anatomy carries its own colour, a
  signal colour always means *read me*, which it does not today.
- **At most two signal colours live at once**, on top of the anatomical hues.
- Colour that encodes a quantity still needs a legend.

Anatomical hues are `-base` tokens like every other colour here, so they lift into
dark mode by the existing derivation and are checked by `src/theme/palette.test.ts`.

---

## Flow

**Draw it.** Six of the references make arrows a first-class element and most of our
diagrams have none at all:

- white arrows sweeping through the heart chambers
- dashed arrows tracing a circuit from vena cava to aorta
- curved current loops along an axon, one per node of Ranvier
- a single broad translucent arrow for the direction a signal propagates
- bold black arrows for bulk transit through the gut

An arrow is anatomy-coloured or signal-coloured by the same rule as everything else:
its own colour if it is a *thing* (blood, bile, air), a signal colour if its size or
presence is a *reading*.

---

## Frame idioms

### Step sequences

The hemostasis reference draws the same vessel three times down the frame, captioned
"step 1: vascular spasm", "step 2: platelet plug formation", "step 3: coagulation",
with only the thing being taught changing between panels.

This is a strong teaching device and we have nothing like it. Use it where a module's
subject is a **sequence** rather than a state.

### Insets

The synapse reference embeds a small membrane-potential plot inside the diagram frame
and wires it by a leader to the exact point on the membrane it describes.

**This conflicts with `CLAUDE.md`'s "charts leave the diagram frame".** The rule is
right in general — a supply-versus-demand bar pair is a chart and belongs in the
`charts` slot under the shared time axis. The exception is narrow and worth having:

> A plot may sit inside the diagram frame **only** when it is anchored by a leader to
> the structure it explains, and only when what it plots is a property of that exact
> location.

An unanchored plot in the diagram frame is the old fault and stays banned.

---

## The graph register

From the cardiac-cycle reference, which is the only pure graph in the set:

- **Thick curves**, noticeably heavier than axis or gridline weight.
- **Each series named inline, in its own colour**, sitting beside the curve — not in a
  legend box. "Aortic pressure" in red on the red curve.
- **Annotations on curved leaders** with an arrowhead, pointing at the event they name
  ("Semilunar valves open" at the point where they do).
- **Axis title rotated** along the axis, units in brackets.
- A second, simpler trace can share the x-axis below the main plot (heart sounds under
  the pressure curves) when the two are read together.

---

## What never happens

Carried over from `CLAUDE.md` because these are the rules the references also obey:

- **The answer is never printed during practice.** A diagram that names the pattern
  answers the question being asked a few hundred pixels below it.
- **Motion is emphasis, never the only carrier of meaning** — everything stops under
  `prefers-reduced-motion`.
- **Every control has a visible correlate.** Moving a slider changes the picture, not
  just a number. A control with no structure to show belongs in a group labelled as a
  model parameter.

---

## On the references themselves

`references/` holds textbook plates, teaching figures and competitor screenshots.
Several are watermarked or credited — Kenhub, Encyclopædia Britannica, AnatomyStuff,
BioRender.

**They inform proportion, layering, label discipline and colour. No path is traced and
no figure reproduced.** Every diagram stays independently drawn from the schema. This
is a commercial requirement in a paid product, not a preference.
