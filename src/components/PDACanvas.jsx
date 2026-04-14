import React, { useMemo, useEffect, useRef, useState } from "react";

const R = 28;
const PC = { 1:"#0f766e", 2:"#7c3aed", 3:"#b45309", 4:"#16a34a" };
const PL = { 1:"init", 2:"production rule", 3:"terminal match", 4:"accept" };

function calcEdge(fx,fy,tx,ty,offset=0) {
  const dx=tx-fx, dy=ty-fy, len=Math.sqrt(dx*dx+dy*dy)||1;
  const nx=-dy/len, ny=dx/len;
  const mx=(fx+tx)/2+nx*offset, my=(fy+ty)/2+ny*offset;
  const ang=Math.atan2(ty-my,tx-mx);
  const sang=Math.atan2(my-fy,mx-fx);
  const ex=tx-Math.cos(ang)*(R+5), ey=ty-Math.sin(ang)*(R+5);
  const sx=fx+Math.cos(sang)*(R+3), sy=fy+Math.sin(sang)*(R+3);
  return { d:`M${sx},${sy} Q${mx},${my} ${ex},${ey}`, lx:mx+nx*18, ly:my+ny*18 };
}

function pathLength(d) {
  // Approximate length for dasharray animation
  return 300;
}

const PDACanvas = ({ states, transitions, activeStep, simPath, buildStep }) => {
  const [revealedNodes, setRevealedNodes] = useState(new Set());
  const [revealedEdges, setRevealedEdges] = useState(new Set());
  // Key = first transition label + count — unique per grammar, so switching grammars
  // always re-triggers animation even when state/transition counts are the same.
  const genKey = transitions.length > 0 ? transitions[0].label + "|" + transitions.length : "";
  const prevGenKey = useRef("");
  const pendingTimers = useRef([]);

  useEffect(() => {
    if (states.length === 0) {
      setRevealedNodes(new Set());
      setRevealedEdges(new Set());
      prevGenKey.current = "";
      return;
    }
    if (prevGenKey.current === genKey) return;
    prevGenKey.current = genKey;

    // Cancel any in-flight timers from the previous grammar
    pendingTimers.current.forEach(clearTimeout);
    pendingTimers.current = [];

    // Reset immediately so old diagram disappears before new one animates in
    setRevealedNodes(new Set());
    setRevealedEdges(new Set());

    // Animate nodes one by one
    states.forEach((s, i) => {
      const id = setTimeout(() => {
        setRevealedNodes(prev => new Set([...prev, s.id]));
      }, i * 160);
      pendingTimers.current.push(id);
    });

    // Animate ALL edges after nodes are done — critically includes the last accept edge
    const nodeDelay = states.length * 160 + 120;
    transitions.forEach((t, i) => {
      const id = setTimeout(() => {
        setRevealedEdges(prev => new Set([...prev, i]));
      }, nodeDelay + i * 75);
      pendingTimers.current.push(id);
    });
  }, [genKey]);

  const byId = useMemo(() => {
    const m={}; states.forEach(s=>m[s.id]=s); return m;
  }, [states]);

  const selfLoopsByState = useMemo(() => {
    const m = {};
    transitions.forEach((t,i) => {
      if (t.from === t.to) {
        if (!m[t.from]) m[t.from] = [];
        m[t.from].push({ t, i });
      }
    });
    return m;
  }, [transitions]);

  const edgeCnt = useMemo(() => {
    const c={};
    transitions.forEach(t => {
      if (t.from !== t.to) { const k=`${t.from}>${t.to}`; c[k]=(c[k]||0)+1; }
    });
    return c;
  }, [transitions]);

  const simStates = useMemo(() => {
    if (!simPath?.length) return new Set();
    return new Set([...simPath.map(h=>h.from), ...simPath.map(h=>h.to)]);
  }, [simPath]);

  if (!states.length) return (
    <div className="pda-wrap">
      <div className="empty-state">
        <div className="empty-ring">◉</div>
        <p>Enter a grammar and click<br/><strong>Generate PDA</strong></p>
      </div>
    </div>
  );

  const activeT = transitions[activeStep];
  const aph  = activeT?.phase;
  const acol = aph ? PC[aph] : "#7c3aed";
  const edgeSeen = {};

  return (
    <div className="pda-wrap">
      <svg className="pda-svg" viewBox="0 0 660 420" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {Object.entries(PC).map(([ph,col])=>(
            <marker key={ph} id={`a${ph}`} markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
              <path d="M0,0 L0,7 L9,3.5z" fill={col}/>
            </marker>
          ))}
          <marker id="adef" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
            <path d="M0,0 L0,7 L9,3.5z" fill="#c8c0b8"/>
          </marker>
          <filter id="glow-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* background grid */}
        {Array.from({length:9},(_,r)=>Array.from({length:14},(_,c)=>(
          <circle key={`${r}${c}`} cx={c*50+18} cy={r*46+18} r="1.3" fill="rgba(0,0,0,0.035)"/>
        )))}

        {/* ── Self-loops ── */}
        {Object.entries(selfLoopsByState).map(([stateId, items]) => {
          const s = byId[stateId];
          if (!s) return null;
          const cx = s.x + R, cy = s.y + R;
          const n = items.length;
          const startAngle = (-215 * Math.PI) / 180;
          const endAngle   = (-25  * Math.PI) / 180;

          return items.map(({ t, i }, loopIdx) => {
            if (!revealedEdges.has(i)) return null;
            const isAct = i === activeStep;
            const col   = isAct ? (PC[t.phase] || acol) : "#cdc7be";
            const sw    = isAct ? 2.5 : 1.2;
            const mk    = isAct ? `url(#a${t.phase})` : "url(#adef)";
            const frac  = n === 1 ? 0.5 : loopIdx / (n - 1);
            const angle = startAngle + frac * (endAngle - startAngle);
            const loopR  = n <= 2 ? 34 : n <= 4 ? 27 : n <= 7 ? 21 : 17;
            const outDist = loopR * 2.7;
            const exitX  = cx + Math.cos(angle) * R;
            const exitY  = cy + Math.sin(angle) * R;
            const cpX    = cx + Math.cos(angle) * (R + outDist);
            const cpY    = cy + Math.sin(angle) * (R + outDist);
            const ang2   = angle + 0.38;
            const entX   = cx + Math.cos(ang2) * R;
            const entY   = cy + Math.sin(ang2) * R;
            const loopD  = `M${exitX},${exitY} C${cpX-10},${cpY-10} ${cpX+10},${cpY+10} ${entX},${entY}`;
            const lblDist = R + outDist + 17;
            const lblAngle = angle + 0.19;
            const lblX    = cx + Math.cos(lblAngle) * lblDist;
            const lblY    = cy + Math.sin(lblAngle) * lblDist;

            return (
              <g key={i} style={{animation:`fadeIn .4s ease both`}}>
                {isAct && <path d={loopD} stroke={col} strokeWidth="8" fill="none" opacity=".12"/>}
                <path d={loopD} stroke={col} strokeWidth={sw} fill="none" markerEnd={mk}
                  style={isAct ? {} : {strokeDasharray:200, strokeDashoffset:0}}
                />
                {/* label background pill */}
                <rect
                  x={lblX - t.label.length * 3 - 4}
                  y={lblY - 8}
                  width={t.label.length * 6 + 8}
                  height={14}
                  rx="3"
                  fill={isAct ? col+"22" : "rgba(250,248,245,.85)"}
                  stroke={isAct ? col : "rgba(0,0,0,0.06)"}
                  strokeWidth=".5"
                />
                <text x={lblX} y={lblY} textAnchor="middle" dominantBaseline="middle"
                  fontSize="8.5" fontWeight={isAct?"700":"400"}
                  fill={isAct ? col : "#7a7570"} fontFamily="Space Mono" style={{userSelect:"none"}}>
                  {t.label}
                </text>
              </g>
            );
          });
        })}

        {/* ── Regular edges ── */}
        {transitions.map((t,i) => {
          if (t.from === t.to) return null;
          if (!revealedEdges.has(i)) return null;
          const isAct = i === activeStep;
          const from  = byId[t.from], to = byId[t.to];
          if (!from || !to) return null;
          const col = isAct ? (PC[t.phase]||acol) : "#cdc7be";
          const sw  = isAct ? 2.5 : 1.5;
          const mk  = isAct ? `url(#a${t.phase})` : "url(#adef)";
          const key = `${t.from}>${t.to}`;
          edgeSeen[key] = edgeSeen[key] || 0;
          const idx   = edgeSeen[key]++;
          const total = edgeCnt[key] || 1;
          const offset = (idx - (total-1)/2) * 40;
          const fx=from.x+R, fy=from.y+R, tx2=to.x+R, ty2=to.y+R;
          const { d, lx, ly } = calcEdge(fx,fy,tx2,ty2,offset);

          return (
            <g key={i} style={{animation:`fadeIn .4s ease both`}}>
              {isAct && <path d={d} stroke={col} strokeWidth="9" fill="none" opacity=".1"/>}
              <path d={d} stroke={col} strokeWidth={sw} fill="none" markerEnd={mk}/>
              {/* label pill */}
              <rect x={lx - t.label.length*3-5} y={ly-8} width={t.label.length*6+10} height={14}
                rx="3" fill={isAct?col+"22":"rgba(250,248,245,.9)"} stroke={isAct?col:"rgba(0,0,0,.07)"} strokeWidth=".5"/>
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                fontSize="9.5" fontWeight={isAct?"700":"500"}
                fill={isAct ? col : "#3d3a36"} fontFamily="Space Mono">
                {t.label}
              </text>
            </g>
          );
        })}

        {/* ── States ── */}
        {states.map((s,si) => {
          if (!revealedNodes.has(s.id)) return null;
          const cx = s.x + R, cy = s.y + R;
          const isAct = activeT?.from === s.id || activeT?.to === s.id;
          const isSim = simStates.has(s.id);
          const scol  = s.isAccept ? "#7c3aed" : (isAct ? acol : "#b8b3ac");
          const fill  = isAct ? `${acol}18` : isSim ? "#ccfbf1" : "#faf8f5";

          return (
            <g key={s.id} style={{animation:`nodeAppear .4s cubic-bezier(.34,1.56,.64,1) ${si*150}ms both`}}>
              {s.isStart && (
                <g>
                  <path d={`M${cx-R-30},${cy} L${cx-R-3},${cy}`}
                    stroke="#b8b3ac" strokeWidth="2" markerEnd="url(#adef)"/>
                  <text x={cx-R-34} y={cy-6} fontSize="9" fill="#b8b3ac" fontFamily="Space Mono" textAnchor="middle">start</text>
                </g>
              )}
              {s.isAccept && (
                <circle cx={cx} cy={cy} r={R+10} fill="none"
                  stroke={scol} strokeWidth="2" strokeDasharray="6 3" opacity=".6"/>
              )}
              {isAct && (
                <circle cx={cx} cy={cy} r={R+2} fill="none" stroke={acol} strokeWidth="1.5" opacity=".4">
                  <animate attributeName="r" values={`${R+2};${R+18};${R+2}`} dur="1.1s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values=".4;0;.4" dur="1.1s" repeatCount="indefinite"/>
                </circle>
              )}
              {/* drop shadow */}
              <circle cx={cx} cy={cy+2} r={R} fill="rgba(0,0,0,.06)"/>
              <circle cx={cx} cy={cy} r={R} fill={fill} stroke={scol} strokeWidth={isAct?2.8:2}/>

              {/* inner ring for accept state */}
              {s.isAccept && (
                <circle cx={cx} cy={cy} r={R-6} fill="none" stroke={scol} strokeWidth="1" opacity=".4"/>
              )}

              <text x={cx} y={cy+1} textAnchor="middle" dominantBaseline="middle"
                fontSize="11" fontWeight="700"
                fill={isAct ? acol : "#0d0c0b"} fontFamily="Space Mono">
                {s.id}
              </text>
              {s.isAccept && (
                <text x={cx+R+6} y={cy-R+2} fontSize="11" fill="#7c3aed">✦</text>
              )}
            </g>
          );
        })}

        {/* ── Legend ── */}
        {Object.entries(PL).map(([ph,lbl],i) => (
          <g key={ph} transform={`translate(${10+i*155},404)`}>
            <rect width="10" height="10" rx="3" fill={`${PC[ph]}22`} stroke={PC[ph]} strokeWidth="1.5" y="-2"/>
            <text x="16" y="7" fontSize="9" fill="#b8b3ac" fontFamily="Space Mono">{lbl}</text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default PDACanvas;
