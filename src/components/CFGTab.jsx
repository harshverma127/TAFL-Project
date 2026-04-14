import React, { useState, useMemo } from "react";

// ── Decode A(p,X,q) variable ──────────────────────────────────
function decodeVariable(lhs) {
  const m = lhs.match(/^A\((.+?),(.+?),(.+?)\)$/);
  if (!m) return null;
  return { p: m[1], sym: m[2], q: m[3] };
}

// ── Mini PDA that highlights a source transition ──────────────
const MiniPDA = ({ states, transitions, highlightedTransition }) => {
  if (!states.length) return null;
  const W = 420, H = 120;
  const positioned = states.map((s, i) => ({
    ...s,
    cx: 55 + i * ((W - 110) / Math.max(states.length - 1, 1)),
    cy: H / 2,
  }));
  const byId = {};
  positioned.forEach(s => { byId[s.id] = s; });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:"auto", display:"block" }}>
      <defs>
        <marker id="mA" markerWidth="7" markerHeight="6" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3z" fill="#b8b3ac"/>
        </marker>
        <marker id="mAH" markerWidth="7" markerHeight="6" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3z" fill="#7c3aed"/>
        </marker>
      </defs>
      {transitions.map((t, i) => {
        const from = byId[t.from], to = byId[t.to];
        if (!from || !to) return null;
        const isH = t.label === highlightedTransition;
        const col = isH ? "#7c3aed" : "#c8c0b8";
        const sw  = isH ? 2 : 1;
        const mk  = isH ? "url(#mAH)" : "url(#mA)";
        if (t.from === t.to) {
          return (
            <g key={i}>
              <path d={`M${from.cx-12},${from.cy-14} C${from.cx-30},${from.cy-44} ${from.cx+30},${from.cy-44} ${from.cx+12},${from.cy-14}`}
                stroke={col} strokeWidth={sw} fill="none" markerEnd={mk}/>
              <text x={from.cx} y={from.cy-40} textAnchor="middle" fontSize="7"
                fill={col} fontFamily="Space Mono" fontWeight={isH?"700":"400"}>{t.label}</text>
            </g>
          );
        }
        const mx = (from.cx+to.cx)/2, my = (from.cy+to.cy)/2 - 18;
        return (
          <g key={i}>
            <path d={`M${from.cx+13},${from.cy} Q${mx},${my} ${to.cx-13},${to.cy}`}
              stroke={col} strokeWidth={sw} fill="none" markerEnd={mk}/>
            <text x={mx} y={my-4} textAnchor="middle" fontSize="7"
              fill={col} fontFamily="Space Mono" fontWeight={isH?"700":"400"}>{t.label}</text>
          </g>
        );
      })}
      {positioned.map(s => (
        <g key={s.id}>
          {s.isAccept && <circle cx={s.cx} cy={s.cy} r={17} fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="4 2"/>}
          {s.isStart && <path d={`M${s.cx-28},${s.cy} L${s.cx-14},${s.cy}`} stroke="#b8b3ac" strokeWidth="1.5" markerEnd="url(#mA)"/>}
          <circle cx={s.cx} cy={s.cy} r={13} fill="#faf8f5" stroke="#b8b3ac" strokeWidth="1.5"/>
          <text x={s.cx} y={s.cy+4} textAnchor="middle" fontSize="8" fontFamily="Space Mono" fontWeight="700" fill="#0d0c0b">{s.id}</text>
        </g>
      ))}
    </svg>
  );
};

// ── Production list section ───────────────────────────────────
const ProdList = ({ items, onSelect, selectedIdx, allProductions }) => {
  if (!items.length) return (
    <div style={{ fontSize:11, color:"var(--ink4)", padding:"12px 0", textAlign:"center" }}>None for this grammar</div>
  );
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
      {items.map((p, i) => {
        const origIdx = allProductions.indexOf(p);
        const isSelected = selectedIdx === origIdx;
        return (
          <div key={origIdx} onClick={() => onSelect(isSelected ? null : origIdx)}
            style={{
              display:"flex", alignItems:"baseline", gap:8,
              padding:"6px 10px", borderRadius:7, cursor:"pointer",
              border:`1.5px solid ${isSelected ? "var(--violet-bdr)" : "transparent"}`,
              background: p.isStart ? "var(--violet-lt)" : isSelected ? "#f5f3ff" : "transparent",
              transition:"all .13s",
            }}>
            <span style={{ fontFamily:"Space Mono", fontSize:10.5, color:"var(--violet-mid)", fontWeight:700, minWidth:120, flexShrink:0 }}>{p.lhs}</span>
            <span style={{ fontFamily:"Space Mono", fontSize:10.5, color:"var(--ink4)" }}>→</span>
            <span style={{ fontFamily:"Space Mono", fontSize:10.5, color:"var(--ink)", flex:1 }}>{p.rhs}</span>
            {p.fromTransition && (
              <span style={{ fontFamily:"Space Mono", fontSize:8.5, color:"var(--ink4)", marginLeft:"auto", flexShrink:0, whiteSpace:"nowrap" }}>
                from: {p.fromTransition}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────
const CFGTab = ({ productions, states, transitions }) => {
  const [selectedProd, setSelectedProd] = useState(null);
  const [openSections, setOpenSections] = useState(new Set(["start","pop","push"]));

  const grouped = useMemo(() => {
    const start   = productions.filter(p => p.isStart);
    const popOnly = productions.filter(p => !p.isStart && !p.rhs.includes("A("));
    const push    = productions.filter(p => !p.isStart &&  p.rhs.includes("A("));
    return { start, popOnly, push };
  }, [productions]);

  const selProd = selectedProd !== null ? productions[selectedProd] : null;
  const decoded = selProd ? decodeVariable(selProd.lhs) : null;

  // Accordion toggle — multiple sections can be open
  const toggle = (key) => setOpenSections(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });

  if (!productions.length) return (
    <div className="cfg-tab-wrap">
      <div className="equiv-hero">
        <div className="equiv-badge">Theorem 2.20 - Sipser</div>
        <div className="equiv-theorem">
          A language is <strong>context-free</strong>
          <span className="equiv-iff"> if and only if </span>
          some <strong>pushdown automaton</strong> recognises it
        </div>
        <div className="equiv-sub">
          The triple construction converts any PDA back into an equivalent CFG, proving the reverse direction of this theorem.
        </div>
      </div>
      <div style={{ textAlign:"center", padding:"52px", color:"var(--ink4)" }}>
        <div style={{ fontFamily:"var(--serif)", fontSize:18, fontStyle:"italic", marginBottom:10, color:"var(--ink3)" }}>
          No conversion generated yet
        </div>
        <div style={{ fontSize:12, lineHeight:1.8 }}>
          Go to the <strong style={{color:"var(--violet-mid)"}}>CFG to PDA</strong> tab,
          generate a PDA, then click <strong style={{color:"var(--gold-mid)"}}>Convert PDA to CFG</strong>.
        </div>
      </div>
    </div>
  );

  return (
    <div className="cfg-tab-wrap">

      {/* ── Hero ── */}
      <div className="equiv-hero" style={{ marginBottom:20 }}>
        <div className="equiv-badge">Theorem 2.20 - Sipser - reverse direction</div>
        <div className="equiv-theorem">
          PDA converted back to CFG — triple construction
        </div>
        <div className="equiv-sub">
          Every PDA state-symbol-state triple (p, A, q) becomes a variable in the new grammar.
          The variable A(p, A, q) generates every string the PDA can read starting in state p with A on top of the stack, ending in state q with A removed.
        </div>
      </div>

      {/* ── Quick stats bar ── */}
      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        {[
          { label:"PDA states",      val: states.length,                             col:"#7c3aed" },
          { label:"PDA transitions", val: transitions.length,                        col:"#0f766e" },
          { label:"Start rules",     val: grouped.start.length,                      col:"#7c3aed" },
          { label:"Pop rules",       val: grouped.popOnly.length,                    col:"#0f766e" },
          { label:"Push rules",      val: grouped.push.length,                       col:"#b45309" },
          { label:"Total rules",     val: productions.length,                        col:"#0d0c0b" },
        ].map(s => (
          <div key={s.label} style={{ flex:"1 1 90px", padding:"10px 14px", background:"var(--paper)", border:"1.5px solid var(--paper3)", borderRadius:12, minWidth:90 }}>
            <div style={{ fontSize:9.5, fontWeight:700, textTransform:"uppercase", letterSpacing:.6, color:"var(--ink4)", fontFamily:"Space Mono", marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:24, fontFamily:"Space Mono", fontWeight:700, color:s.col }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* ── Section 1: Start rules ── */}
      <Section
        id="start" open={openSections.has("start")} onToggle={()=>toggle("start")}
        title={`Start rules (${grouped.start.length})`}
        badge="step 1"
        badgeColor="#7c3aed"
      >
        <div style={{ fontSize:12, color:"var(--ink3)", marginBottom:10, lineHeight:1.7 }}>
          These are the entry-point rules. S generates any string the PDA can accept starting from scratch.
        </div>
        <ProdList items={grouped.start} onSelect={setSelectedProd} selectedIdx={selectedProd} allProductions={productions}/>
      </Section>

      {/* ── Section 2: Pop-only rules ── */}
      <Section
        id="pop" open={openSections.has("pop")} onToggle={()=>toggle("pop")}
        title={`Pop-only rules (${grouped.popOnly.length})`}
        badge="step 2"
        badgeColor="#0f766e"
      >
        <div style={{ fontSize:12, color:"var(--ink3)", marginBottom:10, lineHeight:1.7 }}>
          These rules come from transitions that pop a symbol without pushing anything.
          The variable on the left generates whatever the PDA reads from input in that transition.
        </div>
        <ProdList items={grouped.popOnly} onSelect={setSelectedProd} selectedIdx={selectedProd} allProductions={productions}/>
      </Section>

      {/* ── Section 3: Push rules ── */}
      <Section
        id="push" open={openSections.has("push")} onToggle={()=>toggle("push")}
        title={`Push rules (${grouped.push.length})`}
        badge="step 3"
        badgeColor="#b45309"
      >
        <div style={{ fontSize:12, color:"var(--ink3)", marginBottom:10, lineHeight:1.7 }}>
          These rules come from transitions that push symbols onto the stack.
          Each one chains together sub-variables, one per pushed symbol, to track the PDA popping them later.
        </div>
        <ProdList items={grouped.push} onSelect={setSelectedProd} selectedIdx={selectedProd} allProductions={productions}/>
      </Section>

      {/* ── Section 4: How it works — theory ── */}
      <Section
        id="how" open={openSections.has("how")} onToggle={()=>toggle("how")}
        title="How the construction works"
        badge="theory"
        badgeColor="#7c3aed"
      >
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {[
            {
              num:"1", color:"#7c3aed", bg:"#ede9fe", bdr:"#c4b5fd",
              title:"Create a start rule",
              formula:"S  goes to  A( start-state,  $,  accept-state )",
              plain:"Add one rule: S goes to A(q_s, $, q_acc). This says: S generates any string that takes the PDA all the way from the start state with dollar sign on the stack to the accept state with the stack empty.",
            },
            {
              num:"2", color:"#0f766e", bg:"#ccfbf1", bdr:"#5eead4",
              title:"Pop-only transitions — simple rules",
              formula:"A( p,  a,  r )  goes to  the-input-symbol",
              plain:"If the PDA reads some symbol from input, pops symbol a from the stack, and moves from state p to state r without pushing anything — add a simple rule: A(p, a, r) generates that input symbol. If no input was read, it generates empty.",
            },
            {
              num:"3", color:"#b45309", bg:"#fef3c7", bdr:"#fcd34d",
              title:"Push transitions — chained rules",
              formula:"A( p,  a,  q )  goes to  input-symbol  then  A(r, top, q1)  then  A(q1, next, q2) ...",
              plain:"If the PDA pushes one or more symbols onto the stack, we create chained rules. Each pushed symbol gets its own sub-variable that tracks the PDA popping that symbol later. We try all possible intermediate states because the PDA is non-deterministic.",
            },
            {
              num:"4", color:"#16a34a", bg:"#dcfce7", bdr:"#86efac",
              title:"The key correctness property",
              formula:"A(p, X, q)  generates string w   =   PDA can go from state p to state q by reading w and popping X",
              plain:"This is the guarantee: the variable A(p, X, q) generates exactly the strings that let the PDA travel from state p to state q, consuming the string while popping X off the stack. This is proven by induction and it is what makes the two models equivalent.",
            },
          ].map(step => (
            <div key={step.num} style={{ display:"flex", gap:14, padding:"14px 16px", background:step.bg, border:`1.5px solid ${step.bdr}`, borderRadius:12, borderLeft:`4px solid ${step.color}` }}>
              <div style={{ width:32, height:32, borderRadius:8, background:step.color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Space Mono", fontSize:14, fontWeight:700, flexShrink:0, boxShadow:`0 4px 12px ${step.color}44` }}>
                {step.num}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"var(--serif)", fontSize:14, fontStyle:"italic", color:step.color, marginBottom:6 }}>{step.title}</div>
                <div style={{ fontFamily:"Space Mono", fontSize:11, fontWeight:700, background:"rgba(255,255,255,.75)", border:`1px solid ${step.bdr}`, borderRadius:6, padding:"6px 10px", marginBottom:8, color:step.color, letterSpacing:.2 }}>
                  {step.formula}
                </div>
                <div style={{ fontSize:12, color:"var(--ink2)", lineHeight:1.8 }}>{step.plain}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Variable decoder — always visible when something is selected ── */}
      {selProd && (
        <div style={{ marginTop:6, padding:"18px 20px", background:"var(--paper)", border:"1.5px solid var(--violet-bdr)", borderRadius:14, animation:"fadeUp .25s ease both" }}>
          <div style={{ fontFamily:"Space Mono", fontSize:9.5, fontWeight:700, textTransform:"uppercase", letterSpacing:.7, color:"var(--violet-mid)", marginBottom:12 }}>
            What this rule means in plain English
          </div>

          {/* The rule itself */}
          <div style={{ display:"flex", alignItems:"center", gap:10, fontFamily:"Space Mono", fontSize:13, fontWeight:700, marginBottom:16, flexWrap:"wrap" }}>
            <span style={{ color:"var(--violet-mid)", background:"var(--violet-lt)", border:"1.5px solid var(--violet-bdr)", padding:"5px 12px", borderRadius:8 }}>{selProd.lhs}</span>
            <span style={{ color:"var(--ink4)" }}>generates</span>
            <span style={{ color:"var(--ink)", background:"var(--paper2)", border:"1.5px solid var(--paper3)", padding:"5px 12px", borderRadius:8 }}>{selProd.rhs || "empty string"}</span>
          </div>

          {selProd.isStart ? (
            <div style={{ fontSize:12.5, lineHeight:1.85, color:"var(--ink2)", background:"var(--violet-lt)", borderRadius:10, padding:"12px 14px", border:"1px solid var(--violet-bdr)" }}>
              <strong style={{color:"var(--violet-mid)"}}>This is the start rule.</strong><br/>
              S generates every string that the PDA can accept. It does this by delegating to
              the variable <strong>{selProd.rhs}</strong>, which tracks the PDA running from the
              start state with $ on the stack all the way to the accept state with an empty stack.
            </div>
          ) : decoded ? (
            <>
              {/* Three-part breakdown */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14 }}>
                {[
                  { label:"Start state", val:decoded.p,   col:"#7c3aed", bg:"var(--violet-lt)", bdr:"var(--violet-bdr)", desc:"PDA is in this state at the beginning" },
                  { label:"Stack symbol", val:decoded.sym, col:"#b45309", bg:"var(--gold-lt)",   bdr:"var(--gold-bdr)",   desc:"This symbol sits on top of the stack" },
                  { label:"End state",   val:decoded.q,   col:"#0f766e", bg:"var(--teal-lt)",   bdr:"var(--teal-bdr)",   desc:"PDA arrives here at the end" },
                ].map(part => (
                  <div key={part.label} style={{ padding:"10px 12px", background:part.bg, border:`1.5px solid ${part.bdr}`, borderRadius:10, textAlign:"center" }}>
                    <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:.5, color:part.col, fontFamily:"Space Mono", marginBottom:6 }}>{part.label}</div>
                    <div style={{ fontSize:18, fontFamily:"Space Mono", fontWeight:700, color:part.col, marginBottom:4 }}>{part.val}</div>
                    <div style={{ fontSize:9.5, color:part.col, opacity:.75, lineHeight:1.4 }}>{part.desc}</div>
                  </div>
                ))}
              </div>

              {/* Plain English explanation */}
              <div style={{ fontSize:12.5, lineHeight:1.9, color:"var(--ink2)", background:"var(--paper2)", borderRadius:10, padding:"12px 14px", border:"1px solid var(--paper3)", marginBottom: selProd.fromTransition ? 12 : 0 }}>
                <strong style={{color:"var(--violet-mid)"}}>In plain English:</strong><br/>
                The PDA starts in state <strong style={{color:"var(--violet-mid)"}}>{decoded.p}</strong> with
                the symbol <strong style={{color:"var(--gold-mid)"}}>{decoded.sym}</strong> sitting on top of the stack.
                It then reads the input string <strong style={{color:"var(--teal-mid)"}}>{selProd.rhs || "empty"}</strong> from the tape,
                and by the time it finishes, it has reached state <strong style={{color:"var(--violet-mid)"}}>{decoded.q}</strong> and
                the symbol <strong style={{color:"var(--gold-mid)"}}>{decoded.sym}</strong> has been removed from the stack.
                That is exactly what this rule captures.
              </div>

              {/* Source transition + mini diagram */}
              {selProd.fromTransition && (
                <div style={{ background:"var(--paper2)", borderRadius:10, padding:"12px 14px", border:"1px solid var(--paper3)" }}>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:.6, color:"var(--ink4)", fontFamily:"Space Mono", marginBottom:8 }}>
                    This rule was created from PDA transition:
                    <span style={{ marginLeft:8, color:"var(--teal-mid)", fontWeight:700 }}>{selProd.fromTransition}</span>
                  </div>
                  <div style={{ fontSize:12, color:"var(--ink3)", marginBottom:10, lineHeight:1.6 }}>
                    The highlighted arrow below shows which transition in the PDA produced this rule.
                  </div>
                  <MiniPDA states={states} transitions={transitions} highlightedTransition={selProd.fromTransition}/>
                </div>
              )}
            </>
          ) : null}

          <button onClick={() => setSelectedProd(null)}
            style={{ marginTop:12, padding:"5px 14px", fontSize:10, fontFamily:"Space Mono", fontWeight:700, cursor:"pointer", borderRadius:6, border:"1px solid var(--paper3)", background:"var(--paper2)", color:"var(--ink3)" }}>
            Close
          </button>
        </div>
      )}

    </div>
  );
};

// ── Accordion section wrapper ─────────────────────────────────
const Section = ({ id, open, onToggle, title, badge, badgeColor, children }) => (
  <div style={{ marginBottom:10, background:"var(--paper)", border:"1.5px solid var(--paper3)", borderRadius:14, overflow:"hidden" }}>
    <button onClick={onToggle}
      style={{
        width:"100%", padding:"14px 18px", background:"none", border:"none",
        display:"flex", alignItems:"center", gap:10, cursor:"pointer",
        borderBottom: open ? "1.5px solid var(--paper3)" : "none",
        transition:"background .12s",
      }}
      onMouseEnter={e=>e.currentTarget.style.background="var(--paper2)"}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}
    >
      <span style={{ fontFamily:"var(--serif)", fontSize:14, fontStyle:"italic", color:"var(--ink)", flex:1, textAlign:"left" }}>{title}</span>
      <span style={{ fontFamily:"Space Mono", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:20, background:badgeColor+"18", color:badgeColor, border:`1px solid ${badgeColor}44` }}>{badge}</span>
      <span style={{ fontFamily:"Space Mono", fontSize:12, color:"var(--ink4)", fontWeight:700 }}>{open ? "−" : "+"}</span>
    </button>
    {open && (
      <div style={{ padding:"16px 18px", animation:"fadeUp .2s ease both" }}>
        {children}
      </div>
    )}
  </div>
);

export default CFGTab;
