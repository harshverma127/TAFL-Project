export function parseCFG(text) {
  const rules = {};
  for (const line of text.trim().split("\n")) {
    if (!line.includes("->")) continue;
    const [left, right] = line.split("->");
    const lhs = left.trim();
    const prods = right.split("|").map(p => {
      const t = p.trim();
      return (t === "ε" || t === "") ? "" : t;
    });
    if (lhs) rules[lhs] = prods;
  }
  return { start: Object.keys(rules)[0], rules };
}

// ─────────────────────────────────────────────────────────────
//  Correct Sipser 3-state CFG → PDA construction
//
//  States:  q_s (start)  →  q_loop (main)  →  q_acc (accept)
//
//  q_s  → q_loop : ε, ε / S$          push start symbol + $
//  q_loop self-loops for every production rule:
//           ε, A / γ    (replace non-terminal A with γ)
//  q_loop self-loops for every terminal:
//           a, a / ε    (match and consume terminal a)
//  q_loop → q_acc : ε, $ / ε          pop $ and accept
//
//  This is correct because q_loop handles BOTH productions
//  AND terminal matching as self-loops, so the PDA can
//  alternate between them freely (non-deterministically).
// ─────────────────────────────────────────────────────────────
export function cfgToPDA(cfg) {
  const { start, rules } = cfg;

  const states = [
    { id: "q_s",    x: 80,  y: 195, isStart: true },
    { id: "q_loop", x: 310, y: 195, isLoop: true  },
    { id: "q_acc",  x: 530, y: 195, isAccept: true },
  ];

  const transitions = [];
  const steps = [];

  // ── Phase 1: Initialize ──────────────────────────────────
  transitions.push({
    from: "q_s", to: "q_loop",
    label: `ε, ε / ${start}$`,
    phase: 1,
  });
  steps.push({
    phase: 1,
    title: "Initialize stack",
    description: `Push start symbol ${start} then bottom marker $ onto the stack. Stack is now [${start}, $] with ${start} on top. The PDA moves to the main loop state.`,
    stackEffect: `∅ → [${start}, $]`,
    rule: null,
  });

  // ── Phase 2: Production rules (self-loops on q_loop) ────
  for (const [A, prods] of Object.entries(rules)) {
    for (const prod of prods) {
      const rhs = prod === "" ? "ε" : prod;
      transitions.push({
        from: "q_loop", to: "q_loop",
        label: `ε, ${A} / ${rhs}`,
        phase: 2,
        rule: `${A} → ${rhs}`,
      });
      steps.push({
        phase: 2,
        title: "Apply production rule",
        description: `Non-terminal ${A} is on top of stack. Pop it and push "${rhs === "ε" ? "nothing (ε)" : rhs}". This simulates one leftmost derivation step. The PDA stays in q_loop to continue.`,
        stackEffect: `pop [${A}] → push [${rhs === "ε" ? "—" : rhs}]`,
        rule: `${A} → ${rhs}`,
      });
    }
  }

  // ── Phase 3: Terminal matching (self-loops on q_loop) ───
  const terminals = new Set();
  for (const prods of Object.values(rules))
    for (const p of prods)
      for (const ch of p)
        if (ch >= "a" && ch <= "z") terminals.add(ch);

  for (const t of [...terminals].sort()) {
    transitions.push({
      from: "q_loop", to: "q_loop",
      label: `${t}, ${t} / ε`,
      phase: 3,
    });
    steps.push({
      phase: 3,
      title: "Match terminal",
      description: `Read input '${t}', pop matching '${t}' from the stack, push nothing. The terminal is consumed from both input and stack. PDA stays in q_loop.`,
      stackEffect: `read '${t}', pop [${t}]`,
      rule: null,
    });
  }

  // ── Phase 4: Accept by popping $ ────────────────────────
  transitions.push({
    from: "q_loop", to: "q_acc",
    label: "ε, $ / ε",
    phase: 4,
  });
  steps.push({
    phase: 4,
    title: "Accept — pop $ and finish",
    description: "Pop the bottom marker $. Stack is now empty. If all input has also been consumed, the string is ACCEPTED. This is acceptance by empty stack.",
    stackEffect: "pop [$] → stack empty ✓",
    rule: null,
  });

  return { states, transitions, steps };
}

export function pdaToCFG(states, transitions) {
  const prods = [];
  const startState = states[0]?.id;
  const finalStates = states.filter(s => s.isAccept).map(s => s.id);

  const parseLabel = (label) => {
    try {
      const [left, right] = label.split("/");
      const [inp, pop] = left.split(",");
      return { input: inp.trim() || "ε", pop: pop.trim(), push: right.trim() === "ε" ? "" : right.trim() };
    } catch { return null; }
  };

  for (const f of finalStates)
    prods.push({ lhs:"S", rhs:`A(${startState},$,${f})`, isStart:true, explanation:"Start rule: S derives any string that takes the PDA from start state with $ on stack to an accept state." });

  for (const t of transitions) {
    const p2 = parseLabel(t.label);
    if (!p2) continue;
    const { input, pop, push } = p2;
    const p = t.from, r = t.to;
    if (push === "") {
      prods.push({ lhs:`A(${p},${pop},${r})`, rhs: input === "ε" ? "ε" : input, fromTransition:t.label, explanation:`Transition ${t.label}: pops ${pop} and moves ${p}→${r}, so A(${p},${pop},${r}) derives ${input === "ε" ? "ε" : input}.` });
    } else {
      for (const q of states) {
        const rhs = (input === "ε" ? "" : input) + push.split("").map((sym, i) => { const next = i === push.length - 1 ? r : q.id; return ` A(${r},${sym},${next})`; }).join("");
        prods.push({ lhs:`A(${p},${pop},${q.id})`, rhs: rhs.trim() || "ε", fromTransition:t.label, explanation:`Transition ${t.label}: pushes ${push}. The non-terminal A(${p},${pop},${q.id}) generates the string by chaining sub-derivations for each pushed symbol.` });
      }
    }
  }
  return prods;
}

// ─────────────────────────────────────────────────────────────
//  PDA Simulator — BFS over configurations
//  Configuration: (state, stack, input_position)
//
//  Transition label format:  "inputSym, popSym / pushStr"
//    inputSym : symbol to read from input (ε = read nothing)
//    popSym   : symbol to pop from stack  (ε = pop nothing)
//    pushStr  : string to push onto stack (ε = push nothing)
//               leftmost char of pushStr ends up on top
//
//  Example: "ε, S / aSb"
//    read nothing, pop S, push b then S then a (so a is on top)
// ─────────────────────────────────────────────────────────────
function parseLabel(label) {
  // Format: "inputSym, popSym / pushStr"
  const slashIdx = label.lastIndexOf("/");
  if (slashIdx === -1) return null;
  const left    = label.slice(0, slashIdx).trim();
  const pushStr = label.slice(slashIdx + 1).trim();
  const commaIdx = left.indexOf(",");
  if (commaIdx === -1) return null;
  const inpSym = left.slice(0, commaIdx).trim();
  const popSym = left.slice(commaIdx + 1).trim();
  return {
    inpSym:  inpSym  === "ε" ? "ε" : inpSym,
    popSym:  popSym  === "ε" ? "ε" : popSym,
    pushStr: pushStr === "ε" ? ""  : pushStr,
  };
}

export function simulateString(inputStr, transitions, states) {
  const startState  = states[0]?.id;
  const acceptStates = new Set(states.filter(s => s.isAccept).map(s => s.id));

  // BFS — each node is a full configuration
  // Stack is an array where the LAST element is the TOP
  const initial = { state: startState, stack: [], pos: 0, history: [] };
  const queue   = [initial];

  // Visited: prevent infinite epsilon loops
  // Key = state|pos|top5stacksymbols — shallow enough to cut cycles,
  // deep enough not to cut valid paths for typical grammars
  const visited = new Set();
  const MAX_NODES = 20000;
  let explored = 0;

  while (queue.length > 0 && explored++ < MAX_NODES) {
    const { state, stack, pos, history } = queue.shift();

    const topStack  = stack.length > 0 ? stack[stack.length - 1] : "";
    const inputChar = pos < inputStr.length ? inputStr[pos] : null;

    // ── Accept check ──────────────────────────────────────
    // Accept when: in accept state AND all input consumed AND stack empty
    if (acceptStates.has(state) && pos === inputStr.length && stack.length === 0) {
      return { accepted: true, path: history };
    }

    // ── Visited guard (only for ε-moves to break cycles) ─
    const top5 = stack.slice(-5).join(",");
    const key  = `${state}|${pos}|${top5}`;
    if (visited.has(key)) continue;
    visited.add(key);

    // ── Stack depth guard ──────────────────────────────────
    if (stack.length > 80) continue;

    // ── Try all transitions ────────────────────────────────
    for (const t of transitions) {
      if (t.from !== state) continue;

      const parsed = parseLabel(t.label);
      if (!parsed) continue;
      const { inpSym, popSym, pushStr } = parsed;

      // Check if this transition fires
      const inputMatch = inpSym === "ε" || inpSym === inputChar;
      const stackMatch = popSym === "ε" || popSym === topStack;
      if (!inputMatch || !stackMatch) continue;

      // Build new stack
      const newStack = [...stack];
      if (popSym !== "ε") newStack.pop();  // pop top

      // Push pushStr left-to-right in reverse so index 0 ends up on top
      // e.g. pushStr = "aSb" → push b, push S, push a → top is a
      if (pushStr !== "") {
        for (let i = pushStr.length - 1; i >= 0; i--) {
          newStack.push(pushStr[i]);
        }
      }

      const newPos = inpSym === "ε" ? pos : pos + 1;

      queue.push({
        state:   t.to,
        stack:   newStack,
        pos:     newPos,
        history: [...history, {
          from:          state,
          to:            t.to,
          label:         t.label,
          inputConsumed: inpSym !== "ε" ? inpSym : null,
          stackBefore:   [...stack],
          stackAfter:    [...newStack],
        }],
      });
    }
  }

  return { accepted: false, path: [] };
}

// Build a derivation sequence for a string using BFS to find the correct path
export function buildDerivation(inputStr, cfg) {
  const { start, rules } = cfg;
  const target = inputStr === "" ? "" : inputStr;

  // BFS over sentential forms to find a derivation to target
  // Each node: { sentential, steps[] }
  const queue = [{ sent: start, path: [start] }];
  const visited = new Set([start]);
  const MAX_ITER = 2000;
  let iter = 0;

  while (queue.length && iter++ < MAX_ITER) {
    const { sent, path } = queue.shift();

    // Found it
    if (sent === target || (target === "" && sent === "")) {
      return path;
    }

    // Only expand if still has non-terminals and not too long
    const hasNT = sent.split("").some(ch => ch >= "A" && ch <= "Z");
    if (!hasNT) continue;
    if (sent.length > target.length + 2) continue;

    // Find leftmost non-terminal
    let ntIdx = -1;
    let ntChar = "";
    for (let i = 0; i < sent.length; i++) {
      if (sent[i] >= "A" && sent[i] <= "Z") { ntIdx = i; ntChar = sent[i]; break; }
    }
    if (ntIdx === -1) continue;

    const prods = rules[ntChar];
    if (!prods) continue;

    for (const prod of prods) {
      const next = sent.slice(0, ntIdx) + prod + sent.slice(ntIdx + 1);
      if (next.length > target.length + 2) continue;
      if (!visited.has(next)) {
        visited.add(next);
        queue.push({ sent: next, path: [...path, next === "" ? "ε" : next] });
      }
    }
  }

  // Fallback: return partial derivation if BFS couldn't reach target
  // (string not in language — just show the start symbol)
  return [start];
}
