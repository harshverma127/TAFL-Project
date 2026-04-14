import React from "react";
const CFGDisplay = ({ cfg }) => {
  if (!cfg?.rules) return null;
  return (
    <div className="panel anim-up" style={{marginTop:0}}>
      <div className="panel-head"><div className="panel-title">Parsed grammar <span className="ptag">visual</span></div></div>
      <div className="panel-body" style={{paddingTop:"8px"}}>
        <div className="cfg-rules-box">
          {Object.entries(cfg.rules).map(([nt,prods])=>(
            <div key={nt} className="cfg-rule-row">
              <span className="r-nt">{nt}</span>
              <span className="r-arr">→</span>
              <span>
                {prods.map((p,i)=>(
                  <React.Fragment key={i}>
                    {i>0 && <span className="r-arr"> | </span>}
                    {p==="" ? <span className="r-eps">ε</span>
                      : p.split("").map((ch,j)=>(
                        <span key={j} className={ch>="A"&&ch<="Z"?"r-nt":ch>="a"&&ch<="z"?"r-term":"r-arr"}>{ch}</span>
                      ))}
                  </React.Fragment>
                ))}
              </span>
            </div>
          ))}
        </div>
        <div className="cfg-legend">
          <span><span style={{width:8,height:8,background:"var(--violet-lt)",border:"1.5px solid var(--violet-bdr)",borderRadius:2,display:"inline-block"}}/>Non-terminal</span>
          <span><span style={{width:8,height:8,background:"var(--teal-lt)",border:"1.5px solid var(--teal-bdr)",borderRadius:2,display:"inline-block"}}/>Terminal</span>
          <span><span style={{width:8,height:8,background:"var(--gold-lt)",border:"1.5px solid var(--gold-bdr)",borderRadius:2,display:"inline-block"}}/>ε</span>
        </div>
      </div>
    </div>
  );
};
export default CFGDisplay;
