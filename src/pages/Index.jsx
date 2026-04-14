import { useState, useEffect, useRef, useCallback } from "react";
import PDATab from "../components/PDATab";
import CFGTab from "../components/CFGTab";
import EquivalenceTab from "../components/EquivalenceTab";
import { parseCFG, cfgToPDA, pdaToCFG, simulateString, buildDerivation } from "../converter";

export default function Index() {
  const [tab, setTab]             = useState(0);
  const [cfg, setCfg]             = useState(null);
  const [states, setStates]       = useState([]);
  const [transitions, setTrans]   = useState([]);
  const [steps, setSteps]         = useState([]);
  const [activeStep, setStep]     = useState(-1);
  const [productions, setProds]   = useState([]);
  const [simResult, setSim]       = useState(null);
  const [simStr, setSimStr]       = useState("");
  const [derivSteps, setDeriv]    = useState(null);
  const [isPlaying, setPlaying]   = useState(false);
  const [speed, setSpeed]         = useState(900);
  const playRef = useRef(null);

  useEffect(() => {
    clearInterval(playRef.current);
    if (isPlaying && transitions.length > 0) {
      playRef.current = setInterval(() => {
        setStep(prev => {
          if (prev >= transitions.length - 1) { setPlaying(false); return prev; }
          return prev + 1;
        });
      }, speed);
    }
    return () => clearInterval(playRef.current);
  }, [isPlaying, transitions.length, speed]);

  const handleGenerate = useCallback((grammar) => {
    try {
      const parsed = parseCFG(grammar);
      const pda    = cfgToPDA(parsed);
      setCfg(parsed); setStates(pda.states); setTrans(pda.transitions);
      setSteps(pda.steps); setStep(-1); setProds([]);
      setSim(null); setDeriv(null); setPlaying(false);
    } catch(e) { alert("Parse error: " + e.message); }
  }, []);

  const handleStep = useCallback(() => {
    if (!transitions.length) { alert("Generate a PDA first."); return; }
    setStep(p => p < transitions.length - 1 ? p + 1 : 0);
  }, [transitions.length]);

  const handlePDAToCFG = useCallback(() => {
    if (!states.length) { alert("Generate a PDA first."); return; }
    setProds(pdaToCFG(states, transitions)); setTab(1);
  }, [states, transitions]);

  const handleReset = useCallback(() => {
    setCfg(null); setStates([]); setTrans([]); setSteps([]);
    setStep(-1); setProds([]); setSim(null); setDeriv(null); setPlaying(false);
  }, []);

  const handleSimulate = useCallback((str) => {
    if (!states.length) { alert("Generate a PDA first."); return; }
    const result = simulateString(str, transitions, states);
    setSim(result); setSimStr(str);
    if (cfg && str) setDeriv(buildDerivation(str, cfg));
  }, [states, transitions, cfg]);

  const handlePlayPause = useCallback(() => {
    if (!transitions.length) return;
    if (activeStep >= transitions.length - 1) setStep(-1);
    setPlaying(p => !p);
  }, [transitions.length, activeStep]);

  const statusText = transitions.length
    ? `${transitions.length} transitions · ${activeStep >= 0 ? `step ${activeStep+1}/${transitions.length}` : "ready"}`
    : "ready";

  return (
    <div className="shell">
      <header className="header">
        <div className="hdr-brand">
          <div className="hdr-logo">⟨ CFG↔PDA ⟩</div>
          <div className="hdr-text">
            <h1>CFG ↔ PDA Visualizer</h1>
            <p>Theory of Automata · Sipser 3-State Construction · Interactive</p>
          </div>
        </div>
        <div className="hdr-right">
          <div className="status-pill"><span className="sdot"/>{statusText}</div>
        </div>
      </header>

      <nav className="tab-bar">
        {[
          { label:"CFG → PDA", cls:"" },
          { label:"PDA → CFG", cls:"", count: productions.length },
          { label:"✦ Equivalence", cls:"gold-tab" },
        ].map((t,i)=>(
          <button key={i} className={`tbtab ${t.cls} ${tab===i?"active":""}`} onClick={()=>setTab(i)}>
            {t.label}
            {t.count > 0 && <span className="tab-count">{t.count}</span>}
          </button>
        ))}
      </nav>

      {tab === 0 && (
        <PDATab cfg={cfg} states={states} transitions={transitions} steps={steps} activeStep={activeStep}
          simResult={simResult} simStr={simStr} derivSteps={derivSteps}
          onGenerate={handleGenerate} onStep={handleStep} onPDAToCFG={handlePDAToCFG}
          onReset={handleReset} onSimulate={handleSimulate} onJump={setStep}
          isPlaying={isPlaying} onPlayPause={handlePlayPause} speed={speed} onSpeedChange={setSpeed}/>
      )}
      {tab === 1 && (
        <CFGTab productions={productions} states={states} transitions={transitions}/>
      )}
      {tab === 2 && (
        <EquivalenceTab cfg={cfg} states={states} transitions={transitions} simStr={simStr}/>
      )}
    </div>
  );
}
