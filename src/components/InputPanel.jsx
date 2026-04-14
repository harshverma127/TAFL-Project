import React, { useState } from "react";

const PRESETS = [
  { label:"aⁿbⁿ",       value:"S -> aSb | ε" },
  { label:"Palindromes", value:"S -> aSa | bSb | a | b | ε" },
  { label:"wcwᴿ",        value:"S -> aSa | bSb | c" },
  { label:"Even-length", value:"S -> aSa | bSb | aa | bb | ε" },
];

const InputPanel = ({ onGenerate, onStep, onPDAToCFG, onReset, onSimulate }) => {
  const [grammar, setGrammar] = useState("S -> aSb | ε");
  const [simStr,  setSimStr]  = useState("aabb");

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title">Input grammar <span className="ptag">CFG</span></div>
      </div>
      <div className="panel-body">
        <p className="grammar-hint">
          One rule per line · <code>|</code> for alternatives · <code>ε</code> for empty string
        </p>
        <textarea className="garea" value={grammar} onChange={e=>setGrammar(e.target.value)} rows={5} spellCheck={false}/>
        <div className="presets">
          {PRESETS.map(p=>(
            <button key={p.label} className="pchip" onClick={()=>setGrammar(p.value)}>{p.label}</button>
          ))}
        </div>
        <div className="btns">
          <button className="btn btn-primary" onClick={()=>onGenerate(grammar)}>
            <span className="bico">⊕</span> Generate PDA
          </button>
          <button className="btn btn-teal" onClick={onStep}>
            <span className="bico">→</span> Step forward
          </button>
          <button className="btn btn-gold" onClick={onPDAToCFG}>
            <span className="bico">↩</span> Convert PDA → CFG
          </button>
          <button className="btn btn-ghost" onClick={onReset}>
            <span className="bico">↺</span> Reset
          </button>
        </div>

        <div className="sim-section">
          <div className="panel-title" style={{marginBottom:"6px",fontSize:"13px"}}>
            String simulator <span className="ptag" style={{background:"var(--emerald-lt)",borderColor:"var(--emerald-bdr)",color:"var(--emerald)"}}>extra</span>
          </div>
          <p className="grammar-hint">Test if a string belongs to the language</p>
          <div className="sim-row">
            <input className="sim-input" value={simStr} onChange={e=>setSimStr(e.target.value)} placeholder="e.g. aabb"/>
            <button className="btn btn-primary btn-sm" onClick={()=>onSimulate(simStr)}>Test</button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default InputPanel;
