import React from "react";
import PDACanvas from "./PDACanvas";
import InputPanel from "./InputPanel";
import StepsPanel from "./StepsPanel";
import CFGDisplay from "./CFGDisplay";

const PC  = { 1:"var(--teal-mid)",  2:"var(--violet-mid)", 3:"var(--gold-mid)", 4:"var(--emerald-mid)" };
const PBG = { 1:"ph1bg", 2:"ph2bg", 3:"ph3bg", 4:"ph4bg" };
const PNM = { 1:"init", 2:"production", 3:"terminal match", 4:"accept" };

const PDATab = ({
  cfg, states, transitions, steps, activeStep,
  simResult, simStr, derivSteps,
  onGenerate, onStep, onPDAToCFG, onReset, onSimulate, onJump,
  isPlaying, onPlayPause, speed, onSpeedChange,
}) => {
  const curStep = steps[activeStep];

  const stackTokens = React.useMemo(() => {
    if (!curStep?.stackEffect) return [];
    const m = curStep.stackEffect.match(/\[([^\]]+)\]/g);
    if (!m) return [];
    return m.map(x => x.replace(/[\[\]]/g,"")).filter(Boolean)
      .flatMap(x => x.split(",").map(s => s.trim()))
      .filter(s => s && s !== "—" && s !== "∅");
  }, [curStep]);

  return (
    <>
      {derivSteps && derivSteps.length > 1 && (
        <div className="deriv-strip">
          <div className="deriv-title">Leftmost derivation trace — CFG produces this string</div>
          <div className="deriv-steps">
            {derivSteps.map((d,i)=>(
              <React.Fragment key={i}>
                {i>0 && <span className="deriv-arrow">⇒</span>}
                <span className={`deriv-token ${i===derivSteps.length-1?"current":i<derivSteps.length-1&&derivSteps.length>1?"done":""}`}>
                  {d||"ε"}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="main-grid">
        <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
          <InputPanel onGenerate={onGenerate} onStep={onStep} onPDAToCFG={onPDAToCFG} onReset={onReset} onSimulate={onSimulate}/>
          {cfg && <CFGDisplay cfg={cfg}/>}
        </div>

        <div className="canvas-card">
          <div className="canvas-toolbar">
            <span className="ctitle">PDA diagram</span>
            <div className="ctrls">
              {transitions.length > 0 && <>
                <span style={{fontSize:"10px",color:"var(--ink3)",fontFamily:"var(--mono)"}}>speed:</span>
                <select className="ctrl" value={speed} onChange={e=>onSpeedChange(Number(e.target.value))}>
                  <option value={1400}>slow</option>
                  <option value={900}>normal</option>
                  <option value={450}>fast</option>
                </select>
                <button className={`ctrl ${isPlaying?"playing":""}`} onClick={onPlayPause}>
                  {isPlaying ? "⏸ pause" : "▶ auto-play"}
                </button>
                <button className="ctrl" onClick={onStep}>step →</button>
                <span className="sbadge">{activeStep>=0?activeStep+1:0} / {transitions.length}</span>
              </>}
            </div>
          </div>

          <PDACanvas states={states} transitions={transitions} activeStep={activeStep} simPath={simResult?.accepted ? simResult.path : []}/>

          <div className="sub-row">
            <div className="stack-col">
              <h4>Stack state</h4>
              {stackTokens.length > 0 ? (
                <div className="stack-chips">
                  {stackTokens.map((tok,i)=>(
                    <div key={i} className={`stack-chip ${i===0?"s-top":""} ${tok==="$"?"s-bot":""}`}>{tok}</div>
                  ))}
                </div>
              ) : (
                <div style={{fontSize:"10px",color:"var(--ink4)",fontFamily:"var(--mono)"}}>
                  {activeStep>=0 ? "— transitioning" : "step through to see stack"}
                </div>
              )}
            </div>
            <div className="hint-col">
              {curStep ? (
                <>
                  <div className={`phase-label ${PBG[curStep.phase]||""}`} style={{color:PC[curStep.phase]}}>
                    Phase {curStep.phase} · {PNM[curStep.phase]}
                  </div>
                  <p>{curStep.description}</p>
                </>
              ) : (
                <p style={{color:"var(--ink4)",fontSize:"10.5px"}}>
                  Active transition highlighted · pulsing ring = active state · click any step to jump
                </p>
              )}
            </div>
          </div>
        </div>

        <StepsPanel steps={steps} activeStep={activeStep} onJump={onJump} simResult={simResult} simStr={simStr}/>
      </div>
    </>
  );
};
export default PDATab;
