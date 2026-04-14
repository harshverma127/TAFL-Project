import React, { useState, useEffect, useRef } from "react";
import { simulateString, buildDerivation } from "../converter";

const EquivalenceTab = ({ cfg, states, transitions, simStr }) => {
  const [inputStr,  setInputStr]  = useState(simStr || "aabb");
  const [derivSteps,setDerivSteps]= useState([]);
  const [pdaPath,   setPdaPath]   = useState([]);
  const [accepted,  setAccepted]  = useState(null);
  const [stepIdx,   setStepIdx]   = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ran,       setRan]       = useState(false);
  const timerRef = useRef(null);

  const maxSteps = Math.max(derivSteps.length - 1, pdaPath.length);

  useEffect(() => { if (simStr) setInputStr(simStr); }, [simStr]);

  useEffect(() => {
    clearInterval(timerRef.current);
    if (isPlaying && stepIdx < maxSteps - 1) {
      timerRef.current = setInterval(() => {
        setStepIdx(prev => {
          if (prev >= maxSteps - 1) { setIsPlaying(false); return prev; }
          return prev + 1;
        });
      }, 700);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, maxSteps, stepIdx]);

  const handleRun = () => {
    if (!cfg || !states.length) { alert("Generate a PDA on the CFG→PDA tab first."); return; }
    const ds  = buildDerivation(inputStr, cfg);
    const res = simulateString(inputStr, transitions, states);
    setDerivSteps(ds);
    setPdaPath(res.path);
    setAccepted(res.accepted);
    setStepIdx(-1);
    setIsPlaying(false);
    setRan(true);
  };

  const handlePlay = () => {
    if (!ran) { handleRun(); return; }
    if (stepIdx >= maxSteps - 1) setStepIdx(-1);
    setIsPlaying(p => !p);
  };

  const derivIdx = Math.min(stepIdx, derivSteps.length - 1);
  const pdaIdx   = Math.min(stepIdx, pdaPath.length - 1);
  const lit      = ran && accepted && stepIdx >= maxSteps - 1;

  return (
    <div className="eq-wrap">
      {/* Theorem card */}
      <div className="equiv-hero">
        <div className="equiv-badge">✦ Theorem 2.20 · Sipser — live proof</div>
        <div className="equiv-theorem">
          A language is <strong>context-free</strong>
          <span className="equiv-iff"> if and only if </span>
          some <strong>pushdown automaton</strong> recognises it
        </div>
        <div className="equiv-sub">
          Enter any string below and animate both the CFG derivation and PDA execution simultaneously — watch them agree.
        </div>
      </div>

      {/* Controls */}
      <div className="eq-ctrl-bar">
        <span className="eq-ctrl-label">Prove it live —</span>
        <input className="eq-str-input" value={inputStr} onChange={e=>{setInputStr(e.target.value);setRan(false);}} placeholder="e.g. aabb"/>
        <button className="eq-btn eq-run" onClick={handleRun}>Run</button>
        <button className={`eq-btn ${isPlaying?"eq-stop":"eq-play"}`} onClick={handlePlay}>
          {isPlaying ? "⏸ Pause" : ran ? "▶ Replay" : "▶ Animate"}
        </button>
        {ran && stepIdx >= 0 && <>
          <button className="eq-btn eq-nav" onClick={()=>setStepIdx(p=>Math.max(p-1,0))}>← prev</button>
          <button className="eq-btn eq-nav" onClick={()=>setStepIdx(p=>Math.min(p+1,maxSteps-1))}>next →</button>
          <span className="sbadge">{stepIdx+1} / {maxSteps}</span>
        </>}
      </div>

      {/* Main proof row */}
      <div className="eq-proof-row">
        {/* LEFT — CFG derivation */}
        <div className="eq-side">
          <div className="eq-side-head">
            <div className="eq-side-icon" style={{background:"var(--teal-lt)",border:"1.5px solid var(--teal-bdr)",color:"var(--teal-mid)"}}>⟨G⟩</div>
            <div>
              <div className="eq-side-title">Context-Free Grammar</div>
              <div className="eq-side-sub">leftmost derivation</div>
            </div>
          </div>
          <div className="eq-side-body">
            {derivSteps.length === 0 ? (
              <div style={{fontSize:"11.5px",color:"var(--ink4)",textAlign:"center",paddingTop:"24px"}}>
                Enter a string and click <strong>Run</strong>
              </div>
            ) : (
              <div className="deriv-list">
                {derivSteps.map((d,i)=>{
                  const cls = i < derivIdx ? "ds-past" : i === derivIdx ? "ds-active" : "ds-future";
                  return (
                    <div key={i} className="deriv-item">
                      {i>0 && <span className="deriv-implies">⇒</span>}
                      <span className={`deriv-sym ${cls}`}>
                        {(d||"ε").split("").map((ch,j)=>(
                          <span key={j} style={{color: ch>="A"&&ch<="Z"?"var(--violet-mid)":ch>="a"&&ch<="z"?"var(--teal-mid)":"var(--gold-mid)"}}>
                            {ch}
                          </span>
                        ))}
                      </span>
                    </div>
                  );
                })}
                {derivIdx >= derivSteps.length - 1 && derivSteps.length > 0 && (
                  <div style={{marginTop:"10px",padding:"6px 12px",borderRadius:"var(--r-sm)",background:"var(--teal-lt)",border:"1.5px solid var(--teal-bdr)",color:"var(--teal)",fontFamily:"var(--mono)",fontSize:"11px",fontWeight:"700"}}>
                    ✓ derived "{derivSteps[derivSteps.length-1]}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CENTER — equivalence orb */}
        <div className="eq-center">
          <div className={`equiv-orb ${lit?"lit":""}`}>
            <span className="equiv-symbol">≡</span>
          </div>
          <div className={`equiv-orb-label ${lit?"lit":""}`}>
            {lit ? "EQUIVALENT" : "same language"}
          </div>
          {lit && (
            <div className="equiv-biconditional">
              CFG derives <em>w</em><br/>
              ⟺<br/>
              PDA accepts <em>w</em>
            </div>
          )}
        </div>

        {/* RIGHT — PDA trace */}
        <div className="eq-side">
          <div className="eq-side-head">
            <div className="eq-side-icon" style={{background:"var(--violet-lt)",border:"1.5px solid var(--violet-bdr)",color:"var(--violet-mid)"}}>⟨M⟩</div>
            <div>
              <div className="eq-side-title">Pushdown Automaton</div>
              <div className="eq-side-sub">execution trace</div>
            </div>
          </div>
          <div className="eq-side-body">
            {pdaPath.length === 0 ? (
              <div style={{fontSize:"11.5px",color:"var(--ink4)",textAlign:"center",paddingTop:"24px"}}>
                {ran && !accepted ? "String rejected — no accepting path" : "Run equivalence to see PDA trace"}
              </div>
            ) : (
              <div className="trace-list">
                {pdaPath.map((h,i)=>{
                  const cls = i < pdaIdx ? "ti-past" : i === pdaIdx ? "ti-active" : "ti-future";
                  return (
                    <div key={i} className={`trace-item ${cls}`}>
                      <span style={{color:"var(--violet-mid)",fontWeight:"700",minWidth:"42px"}}>{h.from}</span>
                      <span style={{color:"var(--ink4)"}}>→</span>
                      <span style={{color:"var(--violet-mid)",fontWeight:"700",minWidth:"42px"}}>{h.to}</span>
                      <span style={{color:"var(--ink3)",flex:1,fontSize:"10px"}}>{h.label}</span>
                      {h.inputConsumed && <span style={{color:"var(--teal-mid)",fontWeight:"700"}}>'{h.inputConsumed}'</span>}
                      <span style={{color:"var(--gold-mid)",fontSize:"9px"}}>[{h.stackAfter.slice().reverse().join(",") || "∅"}]</span>
                    </div>
                  );
                })}
                {pdaIdx >= pdaPath.length - 1 && pdaPath.length > 0 && (
                  <div style={{marginTop:"10px",padding:"6px 12px",borderRadius:"var(--r-sm)",background:"var(--violet-lt)",border:"1.5px solid var(--violet-bdr)",color:"var(--violet-mid)",fontFamily:"var(--mono)",fontSize:"11px",fontWeight:"700"}}>
                    ✓ accepted "{inputStr}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result banner */}
      {ran && (
        <div className={`eq-result-banner ${accepted?"eq-ok":"eq-no"}`}>
          {accepted
            ? `✓  "${inputStr}" is in the language — the CFG derives it in ${derivSteps.length-1} step${derivSteps.length!==2?"s":""} AND the PDA accepts it via ${pdaPath.length} transition${pdaPath.length!==1?"s":""}. Both models agree: this is equivalence in action.`
            : `✗  "${inputStr}" is NOT in the language — the CFG cannot derive it and the PDA rejects it. Both models agree on this too — the equivalence holds in both directions.`
          }
        </div>
      )}

      {/* Proof direction cards */}
      <div className="eq-proof-cards">
        {[{
          label:"⟹ direction (CFG → PDA)", color:"var(--teal-mid)", bg:"var(--teal-lt)", bdr:"var(--teal-bdr)",
          from:"CFG", to:"PDA",
          desc:"Given grammar G, construct a 3-state PDA: push start symbol S, non-deterministically apply productions by replacing stack tops, match and consume terminals, accept by empty stack. This PDA accepts exactly L(G).",
        },{
          label:"⟸ direction (PDA → CFG)", color:"var(--violet-mid)", bg:"var(--violet-lt)", bdr:"var(--violet-bdr)",
          from:"PDA", to:"CFG",
          desc:"Given PDA M, build CFG G′ via triple construction: each variable A(p,A,q) represents strings the PDA can consume starting in state p with A on top and ending in state q with A popped. G′ generates exactly L(M).",
        }].map(d=>(
          <div key={d.label} className="eq-proof-card" style={{background:d.bg,borderColor:d.bdr}}>
            <div className="epc-label" style={{color:d.color}}>{d.label}</div>
            <div className="epc-models">
              <span className="epc-model" style={{background:d.bg,borderColor:d.bdr,color:d.color}}>{d.from}</span>
              <span className="epc-arrow" style={{color:d.color}}>→</span>
              <span className="epc-model" style={{background:d.bg,borderColor:d.bdr,color:d.color}}>{d.to}</span>
            </div>
            <div className="epc-desc" style={{color:d.color === "var(--teal-mid)" ? "var(--teal)" : "var(--violet)"}}>{d.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default EquivalenceTab;
