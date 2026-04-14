import React from "react";

const PC  = { 1:"var(--teal-mid)", 2:"var(--violet-mid)", 3:"var(--gold-mid)", 4:"var(--emerald-mid)" };
const PNM = { 1:"phase 1 · init", 2:"phase 2 · production", 3:"phase 3 · terminal", 4:"phase 4 · accept" };

const StepsPanel = ({ steps, activeStep, onJump, simResult, simStr }) => {
  const cur = steps[activeStep];
  return (
    <div className="panel steps-panel">
      <div className="panel-head">
        <div className="panel-title">
          Conversion steps {steps.length>0 && <span className="ptag">{steps.length} total</span>}
        </div>
      </div>

      {cur ? (
        <div className="active-card" key={activeStep}>
          <div className="ac-phase" style={{color: PC[cur.phase]}}>{PNM[cur.phase]}</div>
          <div className="ac-title">{cur.title}</div>
          <div className="ac-desc">{cur.description}</div>
          {cur.rule && <div className="ac-rule">{cur.rule}</div>}
          <div className="ac-stack">{cur.stackEffect}</div>
        </div>
      ) : (
        <div style={{padding:"10px 16px 0",fontSize:"11px",color:"var(--ink4)"}}>
          Generate a PDA, then use <strong style={{color:"var(--teal-mid)"}}>Step forward</strong> or click any step.
        </div>
      )}

      {steps.length === 0 ? (
        <div style={{padding:"24px 16px",fontSize:"11px",color:"var(--ink4)",textAlign:"center"}}>
          Steps appear here after generating a PDA
        </div>
      ) : (
        <div className="steps-scroll">
          {steps.map((s,i)=>{
            const ph = s.phase || 1;
            return (
              <div key={i} className={`step-row ${i===activeStep?"active":""}`} onClick={()=>onJump(i)}>
                <div className="snum">{i+1}</div>
                <div className="sbody">
                  <div className="s-title">
                    {s.title}
                    <span className="phase-dot" style={{background:PC[ph]}}/>
                  </div>
                  {s.rule && <div className="s-rule">{s.rule}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {simResult !== null && (
        <div className="sim-panel anim-in">
          <div style={{fontSize:"10px",fontWeight:"700",textTransform:"uppercase",letterSpacing:".6px",color:"var(--ink4)",fontFamily:"var(--mono)"}}>
            Simulation — "{simStr}"
          </div>
          <div className={`sim-result ${simResult.accepted?"sim-accept":"sim-reject"}`} style={{marginTop:"8px"}}>
            {simResult.accepted ? "✓  ACCEPTED" : "✗  REJECTED"}
          </div>
          {simResult.accepted && simResult.path.length>0 && (
            <div className="trace-scroll" style={{marginTop:"10px"}}>
              <div style={{fontSize:"9.5px",fontWeight:"700",textTransform:"uppercase",letterSpacing:".5px",color:"var(--ink4)",marginBottom:"5px",fontFamily:"var(--mono)"}}>
                Acceptance path
              </div>
              {simResult.path.map((h,i)=>(
                <div key={i} className="trace-row">
                  <span className="tr-state">{h.from}</span>
                  <span style={{color:"var(--ink4)"}}>→</span>
                  <span className="tr-state">{h.to}</span>
                  <span className="tr-lbl">{h.label}</span>
                  {h.inputConsumed && <span className="tr-inp">'{h.inputConsumed}'</span>}
                  <span className="tr-stk">[{h.stackAfter.slice().reverse().join(",") || "∅"}]</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default StepsPanel;
