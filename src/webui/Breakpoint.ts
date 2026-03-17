import { RangeSet, StateEffect, StateField } from "@codemirror/state";
import { EditorView, gutter, GutterMarker } from "@codemirror/view";

const breakpointMarker = new (class extends GutterMarker {
  toDOM() {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";
    container.style.height = "100%";

    const circle = document.createElement("span");
    circle.style.display = "inline-block";
    circle.style.width = "0.75em";
    circle.style.height = "0.75em";
    circle.style.borderRadius = "50%";
    circle.className = "cm-breakpoint-marker";

    container.appendChild(circle);
    return container;
  }
})();

const breakpointEffect = StateEffect.define<{ pos: number; on: boolean }>({
  map: (val, mapping) => ({ pos: mapping.mapPos(val.pos), on: val.on }),
});

type BreakpointState = { set: RangeSet<GutterMarker>; lines: number[] };

function computeLines(set: RangeSet<GutterMarker>, doc: { lineAt(pos: number): { number: number } }, docLength: number): number[] {
  const lines: number[] = [];
  set.between(0, docLength, (from) => {
    lines.push(doc.lineAt(from).number);
  });
  return lines;
}

export function breakpointGutter(update: (lines: number[]) => void) {
  const breakpointState = StateField.define<BreakpointState>({
    create() {
      return { set: RangeSet.empty, lines: [] };
    },
    update({ set, lines }, transaction) {
      let newSet = set.map(transaction.changes);

      for (const e of transaction.effects) {
        if (e.is(breakpointEffect)) {
          if (e.value.on)
            newSet = newSet.update({ add: [breakpointMarker.range(e.value.pos)] });
          else
            newSet = newSet.update({ filter: (from) => from !== e.value.pos });
        }
      }

      if (!transaction.docChanged && newSet === set) return { set, lines };

      const newLines = computeLines(newSet, transaction.newDoc, transaction.newDoc.length);

      const unchanged =
        newLines.length === lines.length &&
        newLines.every((l, i) => l === lines[i]);

      return unchanged ? { set: newSet, lines } : { set: newSet, lines: newLines };
    },
  });

  return [
    breakpointState,
    gutter({
      class: "cm-breakpoint-gutter",
      markers: (v) => v.state.field(breakpointState).set,
      initialSpacer: () => breakpointMarker,
      renderEmptyElements: true,
      domEventHandlers: {
        mousedown(view, line) {
          const pos = line.from;
          let hasBreakpoint = false;
          view.state.field(breakpointState).set.between(pos, pos, () => {
            hasBreakpoint = true;
          });
          view.dispatch({
            effects: breakpointEffect.of({ pos, on: !hasBreakpoint }),
          });
          return true;
        },
      },
    }),
    EditorView.updateListener.of((viewUpdate) => {
      const before = viewUpdate.startState.field(breakpointState);
      const after = viewUpdate.state.field(breakpointState);
      if (before.lines !== after.lines) {
        update(after.lines);
      }
    }),
    EditorView.baseTheme({
      ".cm-breakpoint-gutter .cm-gutterElement": {
        color: "red",
        cursor: "default",
        paddingLeft: "0.3em",
        position: "relative",
      },
      ".cm-breakpoint-gutter .cm-gutterElement:hover::before": {
        content: '""',
        position: "absolute",
        left: "0.3em",
        top: "50%",
        transform: "translateY(-50%)",
        width: "0.75em",
        height: "0.75em",
        borderRadius: "50%",
        backgroundColor: "red",
        opacity: "0.2",
      },
      ".cm-breakpoint-gutter .cm-gutterElement:has(.cm-breakpoint-marker)::before": {
        display: "none",
      },
    }),
  ];
}
