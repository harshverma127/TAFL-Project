# CFG ↔ PDA Visualizer — v3.0 (Final)

🚀 **Live Demo:** [https://tafl-project-hazel.vercel.app/](https://tafl-project-hazel.vercel.app/)

## Setup

**To run locally:**
```bash
npm install
npm run dev


| Requirement | Implementation |
|---|---|
| Input CFG → generate PDA | ✅ Sipser 3-state construction |
| Step-by-step explanation | ✅ 5 phases, colour-coded, with full description per step |
| PDA → CFG conversion | ✅ Triple construction with derivation proof |
| Visual PDA diagram | ✅ Animated SVG — pulse ring, glow halos, phase colours |
| Visual CFG representation | ✅ Colour-coded grammar rules panel |
| Highlight equivalence | ✅ Equivalence theorem banner + Sipser proof explanation |

### Extra-marks features

| Feature | Detail |
|---|---|
| **Auto-play with speed control** | Play/pause + slow/normal/fast dropdown |
| **Animated SVG diagram** | Glow halos, pulsing rings on active states, phase-coloured edges |
| **String simulator** | BFS-based acceptance check, full trace shown |
| **Derivation strip** | Shows CFG leftmost derivation steps when simulating |
| **Stack visualiser** | Shows current stack contents for each step |
| **Phase colour-coding** | 5 phases each have their own colour throughout UI |
| **Preset grammars** | aⁿbⁿ, palindromes, wcwᴿ, even-length — one click |
| **Equivalence proof panel** | Full Sipser theorem 2.20 with 4-step construction explanation |
| **Production table** | Every generated production with source transition shown |
| **Stats summary** | State/transition/production/non-terminal counts |

## File structure

```
src/
  converter.js          — parseCFG · cfgToPDA · pdaToCFG · simulateString · buildDerivation
  pages/Index.jsx       — root state, tab routing, auto-play timer
  components/
    PDATab.jsx          — CFG→PDA tab layout + derivation strip
    CFGTab.jsx          — PDA→CFG tab with equivalence proof
    PDACanvas.jsx       — animated SVG PDA diagram
    InputPanel.jsx      — grammar textarea, presets, string simulator
    StepsPanel.jsx      — step list, active card, simulation trace
    CFGDisplay.jsx      — colour-coded grammar rules
  App.jsx
  main.jsx
  index.css             — full design system (Sora + JetBrains Mono + Playfair)
```

## Transition method

This project uses the **3-state CFG→PDA construction** (Sipser Theorem 2.20):

- **q0 → q1** : push start symbol S and bottom marker $
- **q1 → q2** : apply each production rule (non-deterministically replace top of stack)
- **q2 → q2** : match and consume each terminal symbol (self-loop)
- **q2 → q3** : handle ε-production for start symbol
- **q3 → q4** : pop $ and accept by empty stack

The reverse (PDA→CFG) uses the triple-construction where each variable A(p,A,q) represents "starting in state p with symbol A on top, the PDA can reach state q and pop A while generating some string w".
