import { useState, useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Globe, Users, AlertTriangle, XCircle, X, Plus, Database, LayoutDashboard, Target, ChevronDown, ChevronRight, History, ExternalLink, ArrowLeft, Map, BookOpen, Sparkles } from "lucide-react";

// ── Fonts ──────────────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("wpf-fonts")) {
  const l = document.createElement("link");
  l.id = "wpf-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap";
  document.head.appendChild(l);
}

// ── Constants ──────────────────────────────────────────────────
const STATUS_CFG = {
  Member:        { color:"#15803d", bg:"#dcfce7", dot:"#22c55e" },
  Documentation: { color:"#1d4ed8", bg:"#dbeafe", dot:"#60a5fa" },
  Negotiating:   { color:"#b45309", bg:"#fef3c7", dot:"#f59e0b" },
  Replace:       { color:"#7c3aed", bg:"#ede9fe", dot:"#8b5cf6" },
  Needed:        { color:"#b91c1c", bg:"#fee2e2", dot:"#ef4444" },
};
const ALL_STATUSES = ["", ...Object.keys(STATUS_CFG)];

const ISO_MAP = {
  Brazil:76, England:826, Australia:36, Taiwan:158, Mexico:484,
  Israel:376, Germany:276, Japan:392, Canada:124,
  "United States":840, France:250, Argentina:32, Colombia:170,
  "South Africa":710, Nigeria:566, Egypt:818, Poland:616,
  Spain:724, Italy:380, Turkey:792, "South Korea":410,
  Indonesia:360, Thailand:764, "New Zealand":554,
};

// ── ISO numeric → Continent (covers all world-atlas 110m countries) ──
const ISO_TO_CONTINENT = {
  // Africa
  12:"Africa",24:"Africa",204:"Africa",72:"Africa",854:"Africa",108:"Africa",
  132:"Africa",120:"Africa",140:"Africa",148:"Africa",174:"Africa",180:"Africa",
  178:"Africa",262:"Africa",818:"Africa",232:"Africa",231:"Africa",266:"Africa",
  270:"Africa",288:"Africa",324:"Africa",624:"Africa",384:"Africa",404:"Africa",
  426:"Africa",430:"Africa",434:"Africa",450:"Africa",454:"Africa",466:"Africa",
  478:"Africa",480:"Africa",504:"Africa",508:"Africa",516:"Africa",562:"Africa",
  566:"Africa",646:"Africa",678:"Africa",686:"Africa",694:"Africa",706:"Africa",
  710:"Africa",729:"Africa",736:"Africa",748:"Africa",768:"Africa",788:"Africa",
  800:"Africa",834:"Africa",894:"Africa",716:"Africa",638:"Africa",175:"Africa",
  // Europe
  8:"Europe",20:"Europe",40:"Europe",56:"Europe",70:"Europe",100:"Europe",
  191:"Europe",196:"Europe",203:"Europe",208:"Europe",233:"Europe",246:"Europe",
  250:"Europe",276:"Europe",300:"Europe",348:"Europe",352:"Europe",372:"Europe",
  380:"Europe",428:"Europe",440:"Europe",442:"Europe",470:"Europe",498:"Europe",
  492:"Europe",499:"Europe",807:"Europe",528:"Europe",578:"Europe",616:"Europe",
  620:"Europe",642:"Europe",643:"Europe",688:"Europe",703:"Europe",705:"Europe",
  724:"Europe",752:"Europe",756:"Europe",804:"Europe",826:"Europe",112:"Europe",
  336:"Europe",792:"Europe",
  // Asia
  4:"Asia",50:"Asia",64:"Asia",96:"Asia",116:"Asia",156:"Asia",626:"Asia",
  356:"Asia",360:"Asia",398:"Asia",410:"Asia",408:"Asia",418:"Asia",
  458:"Asia",462:"Asia",496:"Asia",104:"Asia",524:"Asia",586:"Asia",
  608:"Asia",702:"Asia",144:"Asia",158:"Asia",762:"Asia",764:"Asia",
  860:"Asia",704:"Asia",417:"Asia",51:"Asia",31:"Asia",268:"Asia",
  // Middle East
  376:"Middle East",400:"Middle East",422:"Middle East",760:"Middle East",
  784:"Middle East",682:"Middle East",512:"Middle East",414:"Middle East",
  48:"Middle East",634:"Middle East",887:"Middle East",364:"Middle East",368:"Middle East",
  // North America
  84:"North America",124:"North America",188:"North America",192:"North America",
  214:"North America",222:"North America",320:"North America",332:"North America",
  340:"North America",388:"North America",484:"North America",558:"North America",
  591:"North America",840:"North America",44:"North America",52:"North America",
  308:"North America",659:"North America",662:"North America",670:"North America",
  780:"North America",28:"North America",630:"North America",192:"North America",
  // South America
  32:"South America",68:"South America",76:"South America",152:"South America",
  170:"South America",218:"South America",328:"South America",600:"South America",
  604:"South America",858:"South America",862:"South America",740:"South America",
  254:"South America",
  // Oceania
  36:"Oceania",242:"Oceania",296:"Oceania",584:"Oceania",583:"Oceania",
  520:"Oceania",554:"Oceania",585:"Oceania",598:"Oceania",882:"Oceania",
  90:"Oceania",776:"Oceania",548:"Oceania",
};

const CONTINENT_STYLE = {
  "Europe":        { stroke:"#818cf8", fill:"rgba(129,140,248,0.07)", labelLatLon:[54,15] },
  "Asia":          { stroke:"#fb923c", fill:"rgba(251,146,60,0.07)",  labelLatLon:[50,95] },
  "Africa":        { stroke:"#fbbf24", fill:"rgba(251,191,36,0.07)",  labelLatLon:[5,22]  },
  "North America": { stroke:"#34d399", fill:"rgba(52,211,153,0.07)",  labelLatLon:[55,-105] },
  "South America": { stroke:"#60a5fa", fill:"rgba(96,165,250,0.07)",  labelLatLon:[-15,-58] },
  "Oceania":       { stroke:"#e879f9", fill:"rgba(232,121,249,0.07)", labelLatLon:[-25,140] },
  "Middle East":   { stroke:"#a3e635", fill:"rgba(163,230,53,0.07)",  labelLatLon:[27,45]  },
};

// ── Country ISO3 codes (for local /geo/ files) ─────────────────
const COUNTRY_ISO3 = {
  "Brazil":"BRA","Argentina":"ARG","Colombia":"COL","Chile":"CHL",
  "United States":"USA","Canada":"CAN","Mexico":"MEX",
  "England":"GBR","France":"FRA","Germany":"DEU","Spain":"ESP",
  "Italy":"ITA","Poland":"POL","Australia":"AUS","Japan":"JPN",
  "South Korea":"KOR","China":"CHN","India":"IND","Indonesia":"IDN",
  "Taiwan":"TWN","Israel":"ISR","Egypt":"EGY","South Africa":"ZAF",
  "Nigeria":"NGA","Portugal":"PRT","Netherlands":"NLD","Belgium":"BEL",
  "Sweden":"SWE","Norway":"NOR","Denmark":"DNK","Finland":"FIN",
  "Switzerland":"CHE","Austria":"AUT","Greece":"GRC","Turkey":"TUR",
  "Romania":"ROU","Hungary":"HUN","Czech Republic":"CZE",
  "Ukraine":"UKR","Russia":"RUS","Kazakhstan":"KAZ","Thailand":"THA",
  "Vietnam":"VNM","Malaysia":"MYS","Philippines":"PHL",
  "Peru":"PER","Venezuela":"VEN","Ecuador":"ECU",
  "New Zealand":"NZL","United Arab Emirates":"ARE","Saudi Arabia":"SAU",
};

// ── Country rotation centers for D3 geoNaturalEarth1 ──────────
// Values are [-centerLon, -centerLat] — centers the country in the projection
const COUNTRY_CENTERS = {
  "Brazil":        [54.4,   14.3],
  "Argentina":     [63.7,   34.6],
  "Colombia":      [74.3,   -4.0],
  "Chile":         [71.5,   30.0],
  "United States": [98.6,  -39.5],
  "Canada":        [96.4,  -56.2],
  "Mexico":        [102.6, -23.9],
  "England":       [-2.0,  -52.5],
  "France":        [-2.2,  -46.6],
  "Germany":       [-10.5, -51.2],
  "Spain":         [-3.7,  -40.4],
  "Italy":         [-12.6, -42.5],
  "Poland":        [-19.1, -51.9],
  "Australia":     [-133.8,-26.9],
  "Japan":         [-138.3,-36.5],
  "South Korea":   [-127.8,-35.9],
  "China":         [-104.2,-35.9],
  "India":         [-78.9, -20.6],
  "Indonesia":     [-113.9, -0.8],
  "Taiwan":        [-120.9,-23.7],
  "Israel":        [-34.9, -31.1],
  "Egypt":         [-30.0, -26.8],
  "South Africa":  [-25.1, -29.1],
  "Nigeria":       [-8.7,  -9.1],
  "Turkey":        [-35.2, -39.1],
  "New Zealand":   [-172.5,-41.5],
};

// ── Embedded GeoJSON fallback (Brazil) ────────────────────────
// Used when /geo/ local files aren't available
const GEO_STATES = {};



// ── Country → Continent mapping ────────────────────────────────
const COUNTRY_CONTINENT = {
  "Brazil":"South America","Argentina":"South America","Colombia":"South America",
  "Chile":"South America","Peru":"South America","Venezuela":"South America",
  "Ecuador":"South America","Bolivia":"South America","Paraguay":"South America",
  "Uruguay":"South America","Guyana":"South America","Suriname":"South America",
  "United States":"North America","Canada":"North America","Mexico":"North America",
  "Cuba":"North America","Jamaica":"North America","Haiti":"North America",
  "Dominican Republic":"North America","Puerto Rico":"North America",
  "England":"Europe","France":"Europe","Germany":"Europe","Spain":"Europe",
  "Italy":"Europe","Poland":"Europe","Portugal":"Europe","Netherlands":"Europe",
  "Belgium":"Europe","Sweden":"Europe","Norway":"Europe","Denmark":"Europe",
  "Finland":"Europe","Switzerland":"Europe","Austria":"Europe","Greece":"Europe",
  "Turkey":"Europe","Romania":"Europe","Hungary":"Europe","Czech Republic":"Europe",
  "Ukraine":"Europe","Russia":"Europe","Serbia":"Europe","Croatia":"Europe",
  "Slovakia":"Europe","Bulgaria":"Europe","Slovenia":"Europe","Lithuania":"Europe",
  "Latvia":"Europe","Estonia":"Europe","Iceland":"Europe","Ireland":"Europe",
  "Scotland":"Europe","Wales":"Europe","United Kingdom":"Europe","Kosovo":"Europe",
  "Japan":"Asia","South Korea":"Asia","China":"Asia","India":"Asia",
  "Indonesia":"Asia","Taiwan":"Asia","Thailand":"Asia","Vietnam":"Asia",
  "Malaysia":"Asia","Philippines":"Asia","Singapore":"Asia","Bangladesh":"Asia",
  "Pakistan":"Asia","Sri Lanka":"Asia","Nepal":"Asia","Myanmar":"Asia",
  "Cambodia":"Asia","Mongolia":"Asia","Kazakhstan":"Asia","Uzbekistan":"Asia",
  "Azerbaijan":"Asia","Armenia":"Asia","Georgia":"Asia","Kyrgyzstan":"Asia",
  "Tajikistan":"Asia","Turkmenistan":"Asia","Afghanistan":"Asia",
  "Australia":"Oceania","New Zealand":"Oceania","Fiji":"Oceania",
  "Papua New Guinea":"Oceania","Samoa":"Oceania","Tonga":"Oceania",
  "South Africa":"Africa","Nigeria":"Africa","Egypt":"Africa","Kenya":"Africa",
  "Ethiopia":"Africa","Ghana":"Africa","Tanzania":"Africa","Uganda":"Africa",
  "Morocco":"Africa","Algeria":"Africa","Tunisia":"Africa","Cameroon":"Africa",
  "Ivory Coast":"Africa","Senegal":"Africa","Zimbabwe":"Africa","Mozambique":"Africa",
  "Israel":"Middle East","Saudi Arabia":"Middle East","United Arab Emirates":"Middle East",
  "Iran":"Middle East","Iraq":"Middle East","Jordan":"Middle East","Lebanon":"Middle East",
  "Kuwait":"Middle East","Qatar":"Middle East","Bahrain":"Middle East","Oman":"Middle East",
  "Yemen":"Middle East","Syria":"Middle East","Palestine":"Middle East",
};

function continentFromCountry(countryName) {
  if (!countryName) return "";
  return COUNTRY_CONTINENT[countryName] || "";
}

const CONTINENTS = ["All Continents","South America","North America","Europe","Asia","Oceania","Africa","Middle East"];
const STATUSES   = ["All Status","Member","Negotiating","Documentation","Needed"];
const QUARTERS   = ["","Q1","Q2","Q3","Q4"];
const GOAL       = 55;
const TODAY      = new Date("2026-03-05");

const fmt    = d => { if(!d) return "—"; const [y,m,dd]=d.split("-"); return `${dd}/${m}/${y}`; };

function quarterFromDate(dateStr) {
  if (!dateStr) return "";
  const month = parseInt(dateStr.slice(5, 7), 10);
  if (month <= 3)  return "Q1";
  if (month <= 6)  return "Q2";
  if (month <= 9)  return "Q3";
  return "Q4";
}
const fmtMMM = d => { if(!d) return "—"; const dt=new Date(d+"T00:00:00"); return dt.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); };

function calcVig(inicio, fim) {
  if (!inicio || !fim) return { status:null, label:null, color:null };
  const end=new Date(fim), start=new Date(inicio);
  const left=Math.round((end-TODAY)/86400000);
  const total=Math.round((end-start)/86400000);
  if (left<0)   return { status:"Expired",  label:`expired ${Math.abs(left)}d ago`, color:"#dc2626" };
  if (left<=30) return { status:"Expiring", label:`${left} days left`,              color:"#d97706" };
  return            { status:"Active",   label:`${total} days`,                 color:"#16a34a" };
}

// ── Chart helpers ──────────────────────────────────────────────
function statusAtMonth(record, ym) {
  const endOfMonth = new Date(ym.slice(0,4), parseInt(ym.slice(5,7)), 0);
  const hist = [...(record.statusHistory||[])].sort((a,b)=>a.date.localeCompare(b.date));
  let current = null;
  for (const h of hist) {
    if (new Date(h.date) <= endOfMonth) current = h.toStatus;
    else break;
  }
  return current;
}

function buildChartData(data) {
  const monthSet = new Set();
  data.forEach(r => (r.statusHistory||[]).forEach(h => {
    if (h.date && h.date.length >= 7) monthSet.add(h.date.slice(0,7));
  }));
  if (monthSet.size === 0) return [];
  const months = [...monthSet].sort();
  const first = months[0];
  const expanded = [];
  let cur = new Date(first + "-01");
  const last = new Date("2026-03-01");
  while (cur <= last) {
    const ym = `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,"0")}`;
    expanded.push(ym);
    cur.setMonth(cur.getMonth()+1);
  }
  return expanded.map(ym => {
    const counts = { Member:0, Documentation:0, Negotiating:0, Needed:0 };
    data.forEach(r => {
      const s = statusAtMonth(r, ym);
      if (s && counts[s] !== undefined) counts[s]++;
    });
    const dt = new Date(ym+"-01");
    const label = dt.toLocaleDateString("en-US",{month:"short",year:"2-digit"}).replace(","," ");
    return { m: label, ym, ...counts };
  });
}

// ── Initial data ───────────────────────────────────────────────
const INIT = [
  {
    id:1, country:"Brazil", continent:"South America", empresa:"CBTH", memberStatus:"Member",
    quarter:"Q1", inicio:"2026-03-04", fim:"2026-07-29", rep:"", email:"", tel:"+55 11 9999-0001", tournament:"WPF South America Open 2026",
    states:[
      {id:"s1a", name:"São Paulo", federation:"FPSP", inicio:"2026-01-01", fim:"2026-12-31", rep:"Carlos Motta", email:"carlos@fpsp.com.br", tel:"+55 11 3000-0001"},
      {id:"s1b", name:"Rio de Janeiro", federation:"FPRJ", inicio:"2026-02-01", fim:"2026-12-31", rep:"Ana Lima", email:"ana@fprj.com.br", tel:"+55 21 3000-0002"},
    ],
    media:[
      {id:"m1a", name:"ESPN Brasil", email:"contato@espn.com.br", representative:"Rodrigo Faria"},
      {id:"m1b", name:"Sportv", email:"poker@sportv.com.br", representative:"Mariana Costa"},
    ],
    tasks:[
      {id:"t1a", name:"Send official membership certificate", responsible:"Karina", start:"2026-02-01", deadline:"2026-03-15", taskStatus:"Done"},
      {id:"t1b", name:"Confirm tournament dates for South America Open", responsible:"", start:"2026-03-01", deadline:"2026-04-01", taskStatus:"Doing"},
      {id:"t1c", name:"Review federation bylaws compliance", responsible:"Karina", start:"2026-03-05", deadline:"2026-03-20", taskStatus:"Not Started"},
    ],
    statusHistory:[
      {id:"h1a", date:"2025-08-01", fromStatus:"",            toStatus:"Negotiating"},
      {id:"h1b", date:"2025-11-15", fromStatus:"Negotiating", toStatus:"Documentation"},
      {id:"h1c", date:"2026-01-10", fromStatus:"Documentation",toStatus:"Member"},
    ]
  },
  {
    id:2, country:"England", continent:"Europe", empresa:"", memberStatus:"Needed",
    quarter:"", inicio:"", fim:"", rep:"", email:"", tel:"", tournament:"",
    statusHistory:[{id:"h2a", date:"2025-09-01", fromStatus:"", toStatus:"Needed"}]
  },
  {
    id:3, country:"Australia", continent:"Oceania", empresa:"MGM", memberStatus:"Negotiating",
    quarter:"", inicio:"", fim:"", rep:"Mike Chen", email:"m@mgm.au", tel:"+61 2 0000-0003", tournament:"",
    statusHistory:[
      {id:"h3a", date:"2025-07-01", fromStatus:"",       toStatus:"Needed"},
      {id:"h3b", date:"2025-10-01", fromStatus:"Needed", toStatus:"Negotiating"},
    ]
  },
  {
    id:4, country:"Taiwan", continent:"Asia", empresa:"MGM 2", memberStatus:"Documentation",
    quarter:"", inicio:"", fim:"", rep:"Li Wei", email:"l@mgm2.tw", tel:"+886 2 0000", tournament:"",
    statusHistory:[
      {id:"h4a", date:"2025-09-15", fromStatus:"",            toStatus:"Negotiating"},
      {id:"h4b", date:"2025-12-01", fromStatus:"Negotiating", toStatus:"Documentation"},
    ]
  },
  {
    id:5, country:"Mexico", continent:"North America", empresa:"CTP", memberStatus:"Member",
    quarter:"Q1", inicio:"2026-03-04", fim:"2026-03-31", rep:"Carlos Torres", email:"c@ctp.mx", tel:"+52 55 0000", tournament:"WPF Mexico Classic 2026",
    statusHistory:[
      {id:"h5a", date:"2025-06-01", fromStatus:"",            toStatus:"Negotiating"},
      {id:"h5b", date:"2025-11-01", fromStatus:"Negotiating", toStatus:"Member"},
    ]
  },
  {
    id:6, country:"Israel", continent:"Middle East", empresa:"fake", memberStatus:"Member",
    quarter:"Q1", inicio:"2026-03-01", fim:"2026-03-03", rep:"David Levi", email:"d@fake.il", tel:"+972 3 0000", tournament:"",
    statusHistory:[
      {id:"h6a", date:"2025-10-01", fromStatus:"",            toStatus:"Negotiating"},
      {id:"h6b", date:"2026-02-01", fromStatus:"Negotiating", toStatus:"Member"},
    ]
  },
  {
    id:7, country:"Germany", continent:"Europe", empresa:"DPF", memberStatus:"Negotiating",
    quarter:"", inicio:"", fim:"", rep:"Hans Müller", email:"h@dpf.de", tel:"+49 30 0000", tournament:"",
    tasks:[
      {id:"t7a", name:"Schedule contract negotiation call", responsible:"Karina", start:"2026-02-15", deadline:"2026-03-10", taskStatus:"Doing"},
      {id:"t7b", name:"Translate membership agreement to German", responsible:"", start:"2026-03-01", deadline:"2026-04-15", taskStatus:"Not Started"},
    ],
    statusHistory:[{id:"h7a", date:"2025-11-01", fromStatus:"", toStatus:"Negotiating"}]
  },
  {
    id:8, country:"Japan", continent:"Asia", empresa:"JWF", memberStatus:"Documentation",
    quarter:"", inicio:"", fim:"", rep:"Kenji Tanaka", email:"k@jwf.jp", tel:"+81 3 0000", tournament:"",
    statusHistory:[
      {id:"h8a", date:"2025-08-15", fromStatus:"",       toStatus:"Needed"},
      {id:"h8b", date:"2025-12-15", fromStatus:"Needed", toStatus:"Documentation"},
    ]
  },
  {
    id:9, country:"Canada", continent:"North America", empresa:"CWF", memberStatus:"Member",
    quarter:"Q2", inicio:"2025-06-01", fim:"2026-06-01", rep:"Sarah Lee", email:"s@cwf.ca", tel:"+1 416 000", tournament:"WPF Canada Cup 2025",
    statusHistory:[{id:"h9a", date:"2025-06-01", fromStatus:"", toStatus:"Member"}]
  },
];

// ── Badge ──────────────────────────────────────────────────────
function Badge({ status }) {
  const c = STATUS_CFG[status]; if(!c) return null;
  return (
    <span style={{background:c.bg,color:c.color,padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:700,display:"inline-flex",alignItems:"center",gap:4}}>
      <span style={{width:5,height:5,borderRadius:"50%",background:c.dot,display:"inline-block"}}/>
      {status}
    </span>
  );
}

// ── Staircase Block ────────────────────────────────────────────
function StaircaseBlock({ data, onStepClick, goals = {} }) {
  const members = useMemo(() => data.filter(r => r.memberStatus === "Member" && r.country), [data]);
  const goalTotal = goals.total || 55;
  const steps = useMemo(() => {
    const qCounts = { Q1:0, Q2:0, Q3:0, Q4:0 };
    members.forEach(r => { if (r.quarter && qCounts[r.quarter] !== undefined) qCounts[r.quarter]++; });
    let cumulative = 0;
    return ["Q1","Q2","Q3","Q4"].map((q, i) => {
      const count = qCounts[q];
      cumulative += count;
      const qGoal = goals[q]?.target ?? [10,20,35,55][i];
      const onTrack = cumulative >= qGoal;
      const purpleColors = ["#94a3b8","#64748b","#475569","#1e293b"];
      const greenColors  = ["#86efac","#4ade80","#16a34a","#14532d"];
      const color = onTrack ? greenColors[i] : purpleColors[i];
      return {
        q, count, cumulative, qGoal, onTrack, color,
        rows: members.filter(r => r.quarter === q),
        label: goals[q]?.label || ["Jan – Mar","Apr – Jun","Jul – Sep","Oct – Dec"][i],
      };
    });
  }, [members, goals]);

  const totalMembers = members.length;
  const pct = Math.min((totalMembers / goalTotal) * 100, 100);
  const BASE_H = 48, STEP_INC = 28;

  return (
    <div style={{background:"#fff",borderRadius:12,padding:"22px 24px",marginBottom:18,boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
            <h2 style={{fontSize:14,fontWeight:700,margin:0,letterSpacing:1,textTransform:"uppercase"}}>Goals</h2>
          </div>
          <p style={{fontSize:11,color:"#9ca3af",margin:0}}>Quarterly member acquisition target · Click a step to see records</p>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:28,fontWeight:700,color:"#1a1a1a",lineHeight:1,fontFamily:"'Inter',system-ui,sans-serif"}}>
            {totalMembers}<span style={{fontSize:14,color:"#9ca3af",fontWeight:400,marginLeft:4}}>/ {goalTotal}</span>
          </div>
          <div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{Math.round(pct)}% of goal</div>
        </div>
      </div>
      <div style={{height:4,background:"#f3f4f6",borderRadius:4,marginBottom:22,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background: pct >= 100 ? "linear-gradient(90deg,#16a34a,#4ade80)" : "linear-gradient(90deg,#4ade80,#16a34a)",borderRadius:4,transition:"width 0.6s ease"}}/>
      </div>
      <div style={{display:"flex",alignItems:"flex-end",gap:10}}>
        {steps.map((step, i) => {
          const stepH = BASE_H + STEP_INC * (i + 1);
          const isActive = step.count > 0;
          return (
            <div key={step.q} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center"}}>
              {/* ✅ Show goal target above bar (replacing old "new members" count) */}
              <div style={{marginBottom:8,textAlign:"center"}}>
                <div style={{fontSize:11,color:"#9ca3af",marginBottom:2}}>meta</div>
                <div style={{fontSize:22,fontWeight:700,lineHeight:1,fontFamily:"'Inter',system-ui,sans-serif",color:step.onTrack?"#16a34a":"#1a1a1a"}}>{step.qGoal}</div>
                <div style={{fontSize:9,fontWeight:700,marginTop:3,color:step.onTrack?"#22c55e":"#ef4444"}}>
                  {step.onTrack?"on track":"behind"}
                </div>
              </div>
              <button
                onClick={() => step.rows.length > 0 && onStepClick({
                  title:`${step.q} Members`, subtitle:step.label,
                  rows:[...step.rows].sort((a,b)=>{
                    if(!a.inicio) return 1; if(!b.inicio) return -1;
                    return new Date(a.inicio)-new Date(b.inicio);
                  }),
                })}
                style={{width:"100%",height:stepH,
                  background:isActive?`linear-gradient(180deg,${step.color}22 0%,${step.color}44 100%)`:"#f9fafb",
                  border:`2px solid ${isActive?step.color:"#94a3b8"}`,
                  borderRadius:"10px 10px 0 0",cursor:step.rows.length>0?"pointer":"default",
                  display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",
                  padding:"12px 8px 0",transition:"all 0.2s"}}
                onMouseEnter={e=>{if(isActive){e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 6px 20px ${step.color}33`;}}}
                onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
                {isActive && (
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,width:"100%"}}>
                    <span style={{background:step.color,color:"#fff",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,whiteSpace:"nowrap"}}>
                      {step.cumulative} total
                    </span>
                    <span style={{background:"#fff",color:step.color,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,border:`1px solid ${step.color}`,whiteSpace:"nowrap"}}>
                      +{step.count} new
                    </span>
                  </div>
                )}
                <span style={{fontSize:13,fontWeight:700,color:isActive?step.color:"#9ca3af",marginTop:"auto",paddingBottom:10}}>{step.q}</span>
              </button>
              <div style={{fontSize:10,color:"#9ca3af",textAlign:"center",marginTop:6,whiteSpace:"nowrap"}}>{step.label}</div>
            </div>
          );
        })}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",minWidth:56}}>
          <div style={{marginBottom:8,textAlign:"center"}}>
            <div style={{fontSize:11,color:"#9ca3af",marginBottom:2}}>total</div>
            <div style={{fontSize:22,fontWeight:700,lineHeight:1,fontFamily:"'Inter',system-ui,sans-serif",color:"#1a1a1a"}}>{goalTotal}</div>
          </div>
          <div style={{width:48,height:BASE_H+STEP_INC*5,background:"linear-gradient(180deg,#f9fafb,#f3f4f6)",border:"2px dashed #9ca3af",borderRadius:"10px 10px 0 0",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Target size={16} color="#9ca3af"/>
          </div>
          <div style={{fontSize:10,color:"#9ca3af",marginTop:6}}>target</div>
        </div>
      </div>
    </div>
  );
}

// ── Records Modal ──────────────────────────────────────────────
function RecordsModal({ title, subtitle, rows, onClose, onEdit }) {
  const vigDot = {"Active":"#22c55e","Expiring":"#f59e0b","Expired":"#ef4444"};
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}}>
      <div style={{background:"#fff",borderRadius:16,width:860,maxWidth:"100%",maxHeight:"85vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 64px rgba(0,0,0,0.18)"}}>
        <div style={{padding:"20px 24px",borderBottom:"1px solid #f3f4f6",display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1}}>
            <h2 style={{margin:0,fontSize:17,fontWeight:700,fontFamily:"'Inter',system-ui,sans-serif"}}>{title}</h2>
            {subtitle&&<p style={{margin:"2px 0 0",fontSize:12,color:"#6b7280"}}>{subtitle}</p>}
          </div>
          <span style={{background:"#f3f4f6",borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:600,color:"#374151"}}>{rows.length} records</span>
          <button onClick={onClose} style={{background:"none",border:"1px solid #e5e7eb",borderRadius:"50%",width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#6b7280"}}><X size={13}/></button>
        </div>
        <div style={{overflowY:"auto",flex:1}}>
          {rows.length===0
            ?<div style={{padding:40,textAlign:"center",color:"#9ca3af",fontSize:14}}>No records found</div>
            :<table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead style={{position:"sticky",top:0,background:"#fafafa"}}>
                <tr>{["Country","Continent","Company","Quarter","Status","Start","End","Vigência"].map(h=>(
                  <th key={h} style={{textAlign:"left",fontSize:11,color:"#9ca3af",fontWeight:600,padding:"10px 16px",borderBottom:"1px solid #f3f4f6",whiteSpace:"nowrap"}}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {rows.map(r=>{
                  const v=calcVig(r.inicio,r.fim);
                  return (
                    <tr key={r.id} onClick={()=>onEdit&&onEdit(r)} style={{cursor:"pointer",borderBottom:"1px solid #f9fafb"}}
                      onMouseEnter={e=>e.currentTarget.style.background="#f8faff"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{padding:"11px 16px",fontSize:13,fontWeight:600}}>{r.country||"—"}</td>
                      <td style={{padding:"11px 16px",fontSize:12,color:"#6b7280"}}>{r.continent||"—"}</td>
                      <td style={{padding:"11px 16px",fontSize:12}}>{r.empresa||"—"}</td>
                      <td style={{padding:"11px 16px",fontSize:12,fontWeight:700,color:"#6366f1"}}>{r.quarter||"—"}</td>
                      <td style={{padding:"11px 16px"}}><Badge status={r.memberStatus}/></td>
                      <td style={{padding:"11px 16px",fontSize:12,color:"#6b7280"}}>{fmt(r.inicio)}</td>
                      <td style={{padding:"11px 16px",fontSize:12,color:"#6b7280"}}>{fmt(r.fim)}</td>
                      <td style={{padding:"11px 16px"}}>
                        {v.status?<span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:6,height:6,borderRadius:"50%",background:vigDot[v.status],flexShrink:0}}/><span style={{fontSize:12,color:v.color,fontWeight:600}}>{v.status} · {v.label}</span></span>:<span style={{color:"#d1d5db"}}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          }
        </div>
      </div>
    </div>
  );
}

// ── Edit Modal ─────────────────────────────────────────────────
function EditModal({ row, onClose, onSave, onExpandCountry }) {
  const [f, setF] = useState({...row, states: row.states||[]});
  const v = calcVig(f.inicio, f.fim);
  const set = (k,val) => setF(p=>({...p,[k]:val}));

  const addState = () => {
    const newState = {id:`s${Date.now()}`, name:"", federation:"", memberStatus:"Member", inicio:"", fim:"", rep:"", email:"", tel:""};
    setF(p=>({...p, states:[...(p.states||[]), newState]}));
  };
  const updateState = (sid, field, val) => {
    setF(p=>({...p, states:(p.states||[]).map(s=>s.id===sid?{...s,[field]:val}:s)}));
  };
  const removeState = (sid) => {
    setF(p=>({...p, states:(p.states||[]).filter(s=>s.id!==sid)}));
  };

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1100,padding:16}}>
      <div style={{background:"#fff",borderRadius:16,padding:28,width:560,maxWidth:"100%",maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,0.2)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22}}>
          <Globe size={18} color="#f59e0b"/>
          <h2 style={{fontSize:18,fontWeight:700,margin:0,fontFamily:"'Inter',system-ui,sans-serif"}}>{f.country||"New Country"}</h2>
          {f.country && onExpandCountry && (
            <button onClick={()=>{onSave(f);onClose();onExpandCountry(f);}}
              style={{display:"flex",alignItems:"center",gap:4,background:"none",border:"1px solid #e0e7ff",borderRadius:20,padding:"3px 10px",cursor:"pointer",fontSize:11,color:"#6366f1",fontWeight:600,marginLeft:4}}
              onMouseEnter={e=>{e.currentTarget.style.background="#eef2ff";}}
              onMouseLeave={e=>{e.currentTarget.style.background="none";}}>
              <ExternalLink size={11}/> Expand Country
            </button>
          )}
          <button onClick={onClose} style={{marginLeft:"auto",background:"none",border:"1px solid #e5e7eb",borderRadius:"50%",width:26,height:26,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#9ca3af"}}><X size={12}/></button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          {[
            {k:"country",     label:"Country",    type:"text"},
            {k:"continent",   label:"Continent",  type:"select",opts:CONTINENTS.slice(1)},
            {k:"empresa",     label:"Company",    type:"text"},
            {k:"memberStatus",label:"Status",     type:"select",opts:Object.keys(STATUS_CFG)},
            {k:"inicio",      label:"Start Date (sets Quarter)", type:"date"},
            {k:"fim",         label:"End Date",   type:"date"},
          ].map(({k,label,type,opts})=>(
            <div key={k}>
              <label style={{fontSize:10,color:"#9ca3af",fontWeight:700,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>{label}</label>
              {type==="select"
                ?<select value={f[k]||""} onChange={e=>set(k,e.target.value)} style={{width:"100%",border:"1px solid #e5e7eb",borderRadius:8,padding:"7px 10px",fontSize:13,background:"#fff"}}>
                  {(opts||[]).map(o=><option key={o} value={o}>{o||"—"}</option>)}
                </select>
                :<input type={type} value={f[k]||""} onChange={e=>{
                    set(k,e.target.value);
                    if(k==="inicio") set("quarter", quarterFromDate(e.target.value));
                    if(k==="country") {
                      const autoContinent = continentFromCountry(e.target.value);
                      if(autoContinent) set("continent", autoContinent);
                    }
                  }}
                  style={{width:"100%",border:"1px solid #e5e7eb",borderRadius:8,padding:"7px 10px",fontSize:13,boxSizing:"border-box"}}/>
              }
            </div>
          ))}
          <div>
            <label style={{fontSize:10,color:"#9ca3af",fontWeight:700,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>Quarter (auto)</label>
            <div style={{border:"1px solid #f3f4f6",borderRadius:8,padding:"7px 10px",fontSize:13,background:"#f9fafb",color:f.quarter?"#6366f1":"#c4c9d4",fontWeight:f.quarter?700:400}}>
              {f.quarter || "— set Start Date"}
            </div>
          </div>
        </div>
        {v.status&&(
          <div style={{background:"#f9fafb",borderRadius:8,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:v.color,flexShrink:0}}/>
            <span style={{fontSize:13,fontWeight:600,color:v.color}}>{v.status}</span>
            <span style={{fontSize:12,color:"#6b7280",marginLeft:4}}>{v.label}</span>
          </div>
        )}
        <div style={{borderTop:"1px solid #f3f4f6",paddingTop:14,marginBottom:18}}>
          <p style={{fontSize:10,fontWeight:700,color:"#9ca3af",letterSpacing:1,margin:"0 0 12px"}}>TOURNAMENT</p>
          <input value={f.tournament||""} onChange={e=>set("tournament",e.target.value)} placeholder="Tournament name (optional)"
            style={{width:"100%",border:"1px solid #e5e7eb",borderRadius:8,padding:"7px 10px",fontSize:13,boxSizing:"border-box",marginBottom:14}}/>
        </div>
        <div style={{borderTop:"1px solid #f3f4f6",paddingTop:14,marginBottom:18}}>
          <p style={{fontSize:10,fontWeight:700,color:"#9ca3af",letterSpacing:1,margin:"0 0 12px"}}>CONTACT</p>
          {[{k:"rep",label:"Representative"},{k:"email",label:"Email"},{k:"tel",label:"Phone"}].map(({k,label})=>(
            <div key={k} style={{marginBottom:10}}>
              <label style={{fontSize:11,color:"#9ca3af",display:"block",marginBottom:3}}>{label}</label>
              <input value={f[k]||""} onChange={e=>set(k,e.target.value)} placeholder="Click to edit"
                style={{width:"100%",border:"none",borderBottom:"1px solid #e5e7eb",padding:"4px 0",fontSize:13,background:"transparent",outline:"none",boxSizing:"border-box"}}/>
            </div>
          ))}
        </div>
        <div style={{borderTop:"1px solid #f3f4f6",paddingTop:14,marginBottom:18}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <p style={{fontSize:10,fontWeight:700,color:"#9ca3af",letterSpacing:1,margin:0}}>STATES / PROVINCES</p>
            <button onClick={addState}
              style={{display:"flex",alignItems:"center",gap:4,background:"none",border:"1px dashed #a5b4fc",borderRadius:6,padding:"3px 9px",cursor:"pointer",fontSize:11,color:"#6366f1",fontWeight:600}}
              onMouseEnter={e=>e.currentTarget.style.background="#eef2ff"}
              onMouseLeave={e=>e.currentTarget.style.background="none"}>
              <Plus size={10}/> Add State
            </button>
          </div>
          {(f.states||[]).length === 0 && (
            <div style={{fontSize:12,color:"#c4c9d4",fontStyle:"italic",padding:"8px 0"}}>No states added yet.</div>
          )}
          {(f.states||[]).map((st)=>(
            <div key={st.id} style={{background:"#f8faff",borderRadius:10,padding:"12px 14px",marginBottom:10,border:"1px solid #e0e7ff",position:"relative"}}>
              <button onClick={()=>removeState(st.id)}
                style={{position:"absolute",top:8,right:8,background:"none",border:"none",cursor:"pointer",color:"#d1d5db",padding:3,borderRadius:4,display:"flex",alignItems:"center"}}
                onMouseEnter={e=>e.currentTarget.style.color="#ef4444"}
                onMouseLeave={e=>e.currentTarget.style.color="#d1d5db"}>
                <X size={12}/>
              </button>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                {[{k:"name",label:"State / Province"},{k:"federation",label:"Federation"}].map(({k,label})=>(
                  <div key={k}>
                    <label style={{fontSize:10,color:"#9ca3af",fontWeight:700,display:"block",marginBottom:3,textTransform:"uppercase",letterSpacing:.4}}>{label}</label>
                    <input value={st[k]||""} onChange={e=>updateState(st.id,k,e.target.value)} placeholder={label}
                      style={{width:"100%",border:"1px solid #e5e7eb",borderRadius:6,padding:"5px 8px",fontSize:12,boxSizing:"border-box",background:"#fff"}}/>
                  </div>
                ))}
                <div>
                  <label style={{fontSize:10,color:"#9ca3af",fontWeight:700,display:"block",marginBottom:3,textTransform:"uppercase",letterSpacing:.4}}>Status</label>
                  <select value={st.memberStatus||"Member"} onChange={e=>updateState(st.id,"memberStatus",e.target.value)}
                    style={{width:"100%",border:"1px solid #e5e7eb",borderRadius:6,padding:"5px 8px",fontSize:12,background:"#fff",
                      color:STATUS_CFG[st.memberStatus||"Member"]?.color,fontWeight:600,cursor:"pointer"}}>
                    {Object.keys(STATUS_CFG).map(o=><option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                {[{k:"inicio",label:"Entry Date"},{k:"fim",label:"Exit Date"}].map(({k,label})=>(
                  <div key={k}>
                    <label style={{fontSize:10,color:"#9ca3af",fontWeight:700,display:"block",marginBottom:3,textTransform:"uppercase",letterSpacing:.4}}>{label}</label>
                    <input type="date" value={st[k]||""} onChange={e=>updateState(st.id,k,e.target.value)}
                      style={{width:"100%",border:"1px solid #e5e7eb",borderRadius:6,padding:"5px 8px",fontSize:12,boxSizing:"border-box",background:"#fff"}}/>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                {[{k:"rep",label:"Representative"},{k:"email",label:"Email"},{k:"tel",label:"Phone"}].map(({k,label})=>(
                  <div key={k}>
                    <label style={{fontSize:10,color:"#9ca3af",fontWeight:700,display:"block",marginBottom:3,textTransform:"uppercase",letterSpacing:.4}}>{label}</label>
                    <input value={st[k]||""} onChange={e=>updateState(st.id,k,e.target.value)} placeholder={label}
                      style={{width:"100%",border:"none",borderBottom:"1px solid #e5e7eb",padding:"3px 0",fontSize:12,background:"transparent",outline:"none",boxSizing:"border-box"}}/>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
          <button onClick={onClose} style={{padding:"8px 18px",borderRadius:8,border:"1px solid #e5e7eb",background:"#fff",cursor:"pointer",fontSize:13}}>Cancel</button>
          <button onClick={()=>{onSave(f);onClose();}} style={{padding:"8px 18px",borderRadius:8,border:"none",background:"#1a1a1a",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600}}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Approximate lat/lon centers for countries ──────────────────
const COUNTRY_LATLON = {
  "Brazil":[-14.2,-51.9],"England":[52.4,-1.6],"Australia":[-25.3,133.8],
  "Taiwan":[23.7,121.0],"Mexico":[23.6,-102.6],"Israel":[31.0,34.9],
  "Germany":[51.2,10.4],"Japan":[36.2,138.3],"Canada":[56.1,-106.3],
  "United States":[37.1,-95.7],"France":[46.2,2.2],"Argentina":[-38.4,-63.6],
  "Colombia":[4.6,-74.1],"South Africa":[-30.6,22.9],"Nigeria":[9.1,8.7],
  "Egypt":[26.8,30.8],"Poland":[51.9,19.1],"Spain":[40.5,-3.7],
  "Italy":[41.9,12.6],"Turkey":[38.9,35.2],"South Korea":[35.9,127.8],
  "Indonesia":[-0.8,113.9],"Thailand":[15.9,100.9],"New Zealand":[-40.9,174.9],
  "China":[35.9,104.2],"India":[20.6,78.9],"Portugal":[39.4,-8.2],
  "Chile":[-35.7,-71.5],"Peru":[-9.2,-75.0],"Venezuela":[6.4,-66.6],
};

// ── Shared world features cache (loaded once, reused everywhere) ─
let _worldFeaturesCache = null;
let _worldTopologyCache = null;
let _worldFeaturesLoading = false;
let _worldFeaturesCallbacks = [];
function loadWorldFeatures(cb) {
  if (_worldFeaturesCache) { cb(_worldFeaturesCache, _worldTopologyCache); return; }
  _worldFeaturesCallbacks.push(cb);
  if (_worldFeaturesLoading) return;
  _worldFeaturesLoading = true;
  const ensureTopojson = (done) => {
    if (window.topojson) { done(); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js";
    s.onload = done; s.onerror = () => { _worldFeaturesLoading=false; }; document.head.appendChild(s);
  };
  ensureTopojson(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then(r=>r.json())
      .then(world => {
        _worldTopologyCache = world;
        _worldFeaturesCache = window.topojson.feature(world, world.objects.countries).features;
        _worldFeaturesCallbacks.forEach(fn=>fn(_worldFeaturesCache, _worldTopologyCache));
        _worldFeaturesCallbacks = [];
      })
      .catch(() => { _worldFeaturesLoading=false; });
  });
}

// ── World Map (D3 + topojson via CDN, with marker fallback) ────
function WorldMap({ countries, onCountryClick, showTrophies, showTasks, responsibles=[], showContinents=false, showCountryStatus=true, showCountryNames=true, onContinentClick=null }) {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [features, setFeatures] = useState(null);
  const [topology, setTopology] = useState(null);
  const [projFn, setProjFn] = useState(null);

  // Load world features (shared cache)
  useEffect(() => {
    let cancelled = false;
    loadWorldFeatures((feats, topo) => {
      if (!cancelled) { setFeatures(feats); setTopology(topo); setMapReady(true); }
    });
    return () => { cancelled = true; };
  }, []);

  // Draw SVG map
  useEffect(() => {
    if (!mapReady || mapReady === "error" || !features || !svgRef.current) return;
    const el = svgRef.current;
    const W = el.parentElement?.clientWidth || 900;
    const H = Math.round(W * 0.5);
    el.setAttribute("width", W);
    el.setAttribute("height", H);
    el.setAttribute("viewBox", `0 0 ${W} ${H}`);

    const byIso = {};
    countries.forEach(c => { if (c.country && ISO_MAP[c.country]) byIso[ISO_MAP[c.country]] = c; });

    const proj = d3.geoNaturalEarth1().fitSize([W, H], { type:"Sphere" });
    const path = d3.geoPath().projection(proj);
    setProjFn(() => proj);

    // Clear
    while (el.firstChild) el.removeChild(el.firstChild);

    // Ocean bg
    const ns = "http://www.w3.org/2000/svg";
    const defs = document.createElementNS(ns, "defs");
    // Ocean gradient — soft slate blue
    const lg = document.createElementNS(ns, "linearGradient");
    lg.setAttribute("id","ocean-grad"); lg.setAttribute("x1","0"); lg.setAttribute("y1","0"); lg.setAttribute("x2","0"); lg.setAttribute("y2","1");
    const s1=document.createElementNS(ns,"stop"); s1.setAttribute("offset","0%"); s1.setAttribute("stop-color","#e8ecf0");
    const s2=document.createElementNS(ns,"stop"); s2.setAttribute("offset","100%"); s2.setAttribute("stop-color","#dde3e9");
    lg.appendChild(s1); lg.appendChild(s2); defs.appendChild(lg);
    // Subtle drop shadow filter for tracked countries
    const filt = document.createElementNS(ns,"filter");
    filt.setAttribute("id","cShadow"); filt.setAttribute("x","-10%"); filt.setAttribute("y","-10%"); filt.setAttribute("width","120%"); filt.setAttribute("height","120%");
    const fe = document.createElementNS(ns,"feDropShadow");
    fe.setAttribute("dx","0"); fe.setAttribute("dy","1"); fe.setAttribute("stdDeviation","1.5"); fe.setAttribute("flood-color","rgba(0,0,0,0.18)");
    filt.appendChild(fe); defs.appendChild(filt);
    el.appendChild(defs);
    const bg = document.createElementNS(ns,"rect");
    bg.setAttribute("width",W); bg.setAttribute("height",H); bg.setAttribute("fill","url(#ocean-grad)"); bg.setAttribute("rx","10");
    el.appendChild(bg);

    // Untracked countries group (no filter)
    const gUntracked = document.createElementNS(ns,"g");
    // Tracked countries group (with shadow)
    const gTracked = document.createElementNS(ns,"g");
    gTracked.setAttribute("filter","url(#cShadow)");

    // Countries
    features.forEach(f => {
      const c = byIso[+f.id];
      const d = path(f); if (!d) return;
      const pathEl = document.createElementNS(ns, "path");
      pathEl.setAttribute("d", d);
      // Untracked: warm light grey; tracked: vibrant status color or neutral if status hidden
      pathEl.setAttribute("fill", c ? (showCountryStatus ? (STATUS_CFG[c.memberStatus]?.dot || "#94a3b8") : "#94a3b8") : "#d4dbe3");
      // Refined border: very subtle
      pathEl.setAttribute("stroke", c ? "#a0aab4" : "#c2cad3");
      pathEl.setAttribute("stroke-width", c ? "0.6" : "0.3");
      pathEl.setAttribute("stroke-linejoin","round");
      pathEl.style.cursor = c ? "pointer" : "default";
      pathEl.style.transition = "opacity 0.15s";
      if (c) {
        pathEl.addEventListener("mouseenter", e => {
          pathEl.setAttribute("opacity","0.78");
          const rect = el.getBoundingClientRect();
          setTooltip({ c, x: e.clientX - rect.left, y: e.clientY - rect.top });
        });
        pathEl.addEventListener("mousemove", e => {
          const rect = el.getBoundingClientRect();
          setTooltip(prev => prev ? {...prev, x: e.clientX-rect.left, y: e.clientY-rect.top} : prev);
        });
        pathEl.addEventListener("mouseleave", () => { pathEl.setAttribute("opacity","1"); setTooltip(null); });
        pathEl.addEventListener("click", () => onCountryClick(c));
        gTracked.appendChild(pathEl);
      } else {
        gUntracked.appendChild(pathEl);
      }
    });
    el.appendChild(gUntracked);
    el.appendChild(gTracked);

    // ── Continent outlines ──────────────────────────────────────
    if (showContinents && topology && window.topojson) {
      const gContinents = document.createElementNS(ns, "g");

      Object.entries(CONTINENT_STYLE).forEach(([cont, style]) => {
        const geoms = topology.objects.countries.geometries.filter(g => ISO_TO_CONTINENT[+g.id] === cont);
        if (!geoms.length) return;
        try {
          const merged = window.topojson.merge(topology, geoms);
          if (!merged) return;

          const gCont = document.createElementNS(ns, "g");
          gCont.style.cursor = onContinentClick ? "pointer" : "default";

          // Filled background (hit area + visual)
          const fillPath = document.createElementNS(ns,"path");
          fillPath.setAttribute("d", path(merged));
          fillPath.setAttribute("fill", style.fill);
          fillPath.setAttribute("stroke","none");
          gCont.appendChild(fillPath);

          // Outline stroke
          const strokePath = document.createElementNS(ns,"path");
          strokePath.setAttribute("d", path(merged));
          strokePath.setAttribute("fill","none");
          strokePath.setAttribute("stroke", style.stroke);
          strokePath.setAttribute("stroke-width","1.8");
          strokePath.setAttribute("stroke-dasharray","5,3");
          strokePath.setAttribute("opacity","0.85");
          gCont.appendChild(strokePath);

          // Continent label — always black for legibility
          const [lat, lon] = style.labelLatLon;
          const pt = proj([lon, lat]);
          if (pt && !isNaN(pt[0])) {
            const label = cont.toUpperCase();
            const tw = label.length * 5.6 + 14;

            const bg = document.createElementNS(ns,"rect");
            bg.setAttribute("x", pt[0] - tw/2); bg.setAttribute("y", pt[1] - 9);
            bg.setAttribute("width", tw); bg.setAttribute("height", 13);
            bg.setAttribute("rx","3");
            bg.setAttribute("fill","rgba(255,255,255,0.82)");
            gCont.appendChild(bg);

            const txt = document.createElementNS(ns,"text");
            txt.setAttribute("x", pt[0]); txt.setAttribute("y", pt[1]+1.5);
            txt.setAttribute("text-anchor","middle");
            txt.setAttribute("font-size","7.5");
            txt.setAttribute("font-weight","800");
            txt.setAttribute("fill","#1a1a1a");
            txt.setAttribute("letter-spacing","1.1");
            txt.setAttribute("font-family","Inter,system-ui,sans-serif");
            txt.setAttribute("pointer-events","none");
            txt.textContent = label;
            gCont.appendChild(txt);
          }

          if (onContinentClick) {
            gCont.addEventListener("mouseenter", () => { fillPath.setAttribute("fill", style.fill.replace("0.07","0.18")); strokePath.setAttribute("stroke-width","2.5"); });
            gCont.addEventListener("mouseleave", () => { fillPath.setAttribute("fill", style.fill); strokePath.setAttribute("stroke-width","1.8"); });
            gCont.addEventListener("click", (e) => { e.stopPropagation(); onContinentClick(cont); });
          }

          gContinents.appendChild(gCont);
        } catch(e) { /* skip if merge fails */ }
      });

      el.insertBefore(gContinents, gTracked);
    }

    // ── Invisible continent hit areas (when showContinents=false but clickable) ──
    // Inserted BEFORE gTracked so tracked country paths get click priority
    if (!showContinents && onContinentClick && topology && window.topojson) {
      const gHit = document.createElementNS(ns, "g");
      Object.entries(CONTINENT_STYLE).forEach(([cont, style]) => {
        const geoms = topology.objects.countries.geometries.filter(g => ISO_TO_CONTINENT[+g.id] === cont);
        if (!geoms.length) return;
        try {
          const merged = window.topojson.merge(topology, geoms);
          if (!merged) return;
          const hitPath = document.createElementNS(ns,"path");
          hitPath.setAttribute("d", path(merged));
          hitPath.setAttribute("fill","transparent");
          hitPath.setAttribute("stroke","none");
          hitPath.style.cursor = "pointer";
          hitPath.addEventListener("click", () => onContinentClick(cont));
          gHit.appendChild(hitPath);
        } catch(e) {}
      });
      // Insert before gTracked so tracked countries (with their own click handlers) sit on top
      el.insertBefore(gHit, gTracked);
    }

    // Avatar helpers (mirror of JS avatarColor/initials)
    const AVATAR_COLORS = ["#6366f1","#f59e0b","#22c55e","#ef4444","#3b82f6","#ec4899","#8b5cf6","#14b8a6","#f97316","#64748b"];
    const avatarCol = name => {
      let hash=0; for(let i=0;i<(name||"").length;i++) hash=name.charCodeAt(i)+((hash<<5)-hash);
      return AVATAR_COLORS[Math.abs(hash)%AVATAR_COLORS.length];
    };
    const avatarInit = name => {
      if(!name) return "?";
      const parts=name.trim().split(/\s+/);
      return parts.length===1 ? parts[0].slice(0,2).toUpperCase() : (parts[0][0]+parts[parts.length-1][0]).toUpperCase();
    };
    const drawAvatar = (g, x, y, r, name, photo) => {
      const bg = avatarCol(name);
      // white ring
      const ring = document.createElementNS(ns,"circle");
      ring.setAttribute("cx",x); ring.setAttribute("cy",y); ring.setAttribute("r",r+1.5);
      ring.setAttribute("fill","#fff"); ring.setAttribute("opacity","0.9");
      g.appendChild(ring);
      if (photo) {
        // clip path for round photo
        const clipId = "avc_"+Math.random().toString(36).slice(2,7);
        const defs2 = document.createElementNS(ns,"defs");
        const cp = document.createElementNS(ns,"clipPath"); cp.setAttribute("id",clipId);
        const cpc = document.createElementNS(ns,"circle"); cpc.setAttribute("cx",x); cpc.setAttribute("cy",y); cpc.setAttribute("r",r);
        cp.appendChild(cpc); defs2.appendChild(cp); g.appendChild(defs2);
        const img = document.createElementNS(ns,"image");
        img.setAttribute("href",photo); img.setAttribute("x",x-r); img.setAttribute("y",y-r);
        img.setAttribute("width",r*2); img.setAttribute("height",r*2);
        img.setAttribute("clip-path",`url(#${clipId})`); img.setAttribute("preserveAspectRatio","xMidYMid slice");
        g.appendChild(img);
      } else {
        const circle = document.createElementNS(ns,"circle");
        circle.setAttribute("cx",x); circle.setAttribute("cy",y); circle.setAttribute("r",r);
        circle.setAttribute("fill",bg); g.appendChild(circle);
        const txt = document.createElementNS(ns,"text");
        txt.setAttribute("x",x); txt.setAttribute("y",y+r*0.36);
        txt.setAttribute("text-anchor","middle"); txt.setAttribute("font-size",r*0.9);
        txt.setAttribute("font-weight","700"); txt.setAttribute("fill","#fff");
        txt.setAttribute("font-family","Inter,system-ui,sans-serif");
        txt.setAttribute("pointer-events","none"); txt.textContent=avatarInit(name);
        g.appendChild(txt);
      }
    };

    // Labels + avatar bubbles for tracked countries
    const gLabels = document.createElementNS(ns,"g");
    countries.filter(c=>c.country && ISO_MAP[c.country]).forEach(c => {
      const feat = features.find(f => +f.id === ISO_MAP[c.country]); if (!feat) return;
      const cen = path.centroid(feat); if (!cen || isNaN(cen[0])) return;
      const hasTrophy = showTrophies && c.tournament;
      const tasks = c.tasks||[];
      const openTasks = tasks.filter(t=>t.taskStatus!=="Done");
      const today = new Date(); today.setHours(0,0,0,0);
      const overdueTasks = openTasks.filter(t => t.deadline && new Date(t.deadline) < today);

      // Show avatars only for OVERDUE tasks on the map
      const responsibleMap = {};
      if (showTasks) {
        overdueTasks.forEach(t => {
          const name = (t.responsible||"").trim();
          if (name && !responsibleMap[name]) responsibleMap[name] = t;
        });
      }
      const responsibles = Object.keys(responsibleMap).slice(0, 4); // max 4 avatars

      const hasExtras = hasTrophy || responsibles.length > 0;
      const AVATAR_R = 7;
      const AVATAR_Y = cen[1] - (hasExtras ? 14 : 0);

      // Trophy icon above
      if (hasTrophy) {
        const t = document.createElementNS(ns,"text");
        const trophyX = responsibles.length > 0 ? cen[0] - (responsibles.length * (AVATAR_R*2+2))/2 - 8 : cen[0];
        t.setAttribute("x", trophyX);
        t.setAttribute("y", cen[1] - (responsibles.length>0 ? 6 : 3));
        t.setAttribute("text-anchor","middle"); t.setAttribute("font-size","10");
        t.setAttribute("pointer-events","none");
        t.textContent = "🏆";
        gLabels.appendChild(t);
      }

      // Avatar row for task responsibles
      if (responsibles.length > 0) {
        const totalW = responsibles.length * (AVATAR_R*2+3) - 3;
        const startX = cen[0] + (hasTrophy ? 8 : 0) - totalW/2 + AVATAR_R;
        responsibles.forEach((name, i) => {
          const ax = startX + i*(AVATAR_R*2+3);
          const ay = cen[1] - 12;
          // get photo from responsibles list if available (passed via country data)
          const respObj = responsibles.find(r=>r.name===name);
          drawAvatar(gLabels, ax, ay, AVATAR_R, name, respObj?.photo||null);
        });
      }

      // Country name label
      if (showCountryNames) {
        const lbl = document.createElementNS(ns,"text");
        lbl.setAttribute("x", cen[0]); lbl.setAttribute("y", cen[1]+(hasExtras ? 6 : 4));
        lbl.setAttribute("text-anchor","middle"); lbl.setAttribute("font-size","8");
        lbl.setAttribute("font-weight","600"); lbl.setAttribute("fill","#1e2d3d");
        lbl.setAttribute("letter-spacing","0.3");
        lbl.setAttribute("pointer-events","none");
        lbl.style.textShadow="0 1px 3px rgba(255,255,255,0.9), 0 0 6px rgba(255,255,255,0.6)";
        lbl.textContent = c.country.length>12 ? c.country.slice(0,11)+"…" : c.country;
        gLabels.appendChild(lbl);
      }
    });
    el.appendChild(gLabels);
  }, [mapReady, features, topology, countries, showTrophies, showTasks, responsibles, showContinents, showCountryStatus, showCountryNames, onContinentClick]);

  // Fallback marker map when D3 fails
  const MarkerMap = () => {
    const W=900, H=440;
    const toXY = (lat,lon) => [(lon+180)*(W/360), (90-lat)*(H/180)];
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto",borderRadius:10}}>
        <defs>
          <linearGradient id="ocean2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dbeafe"/><stop offset="100%" stopColor="#bfdbfe"/>
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill="url(#ocean2)" rx="10"/>
        <text x={W/2} y={H/2-30} textAnchor="middle" fontSize="14" fill="#94a3b8" fontWeight="600">World Map</text>
        {countries.filter(c=>c.country && COUNTRY_LATLON[c.country]).map(c => {
          const [lat,lon] = COUNTRY_LATLON[c.country];
          const [x,y] = toXY(lat,lon);
          const col = STATUS_CFG[c.memberStatus]?.dot || "#94a3b8";
          return (
            <g key={c.id} style={{cursor:"pointer"}} onClick={()=>onCountryClick(c)}>
              <circle cx={x} cy={y} r={12} fill={col} opacity={0.9} stroke="#fff" strokeWidth={2}/>
              <text x={x} y={y+4} textAnchor="middle" fontSize="7" fontWeight="700" fill="#fff" pointerEvents="none">
                {c.country.slice(0,3).toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  if (mapReady === "error") return <MarkerMap/>;

  return (
    <div style={{position:"relative",width:"100%"}}>
      {!mapReady && (
        <div style={{height:460,display:"flex",alignItems:"center",justifyContent:"center",color:"#94a3b8",fontSize:13,background:"#f1f5f9",borderRadius:10}}>
          Carregando mapa…
        </div>
      )}
      <svg ref={svgRef} style={{width:"100%",display:mapReady&&mapReady!=="error"?"block":"none",borderRadius:10}}/>
      {tooltip && (
        <div style={{position:"absolute",left:tooltip.x+12,top:tooltip.y-50,background:"#1e293b",color:"#fff",
          borderRadius:10,padding:"8px 12px",fontSize:12,pointerEvents:"none",zIndex:10,
          boxShadow:"0 4px 20px rgba(0,0,0,0.25)",maxWidth:200}}>
          <div style={{fontWeight:700,marginBottom:3}}>{tooltip.c.country}</div>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:STATUS_CFG[tooltip.c.memberStatus]?.dot,display:"inline-block"}}/>
            <span style={{color:STATUS_CFG[tooltip.c.memberStatus]?.dot}}>{tooltip.c.memberStatus}</span>
          </div>
          {tooltip.c.empresa && <div style={{color:"#94a3b8",fontSize:11,marginTop:2}}>{tooltip.c.empresa}</div>}
          {showTrophies && tooltip.c.tournament && <div style={{fontSize:11,marginTop:2}}>🏆 {tooltip.c.tournament}</div>}
          <div style={{fontSize:10,color:"#64748b",marginTop:4}}>Click to edit</div>
        </div>
      )}
    </div>
  );
}

// ── Country Zoom Map ───────────────────────────────────────────
// Member Map style, zoomed into the country, state outlines overlay.
// Unregistered states = white. Registered = status color.
function CountryZoomMap({ country, localStates, showTrophies, worldFeatures }) {
  const svgRef = useRef(null);
  const [stateGeo, setStateGeo] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [hoveredState, setHoveredState] = useState(null);
  const W = 860, H = 480;

  useEffect(() => {
    setStateGeo(null);
    const iso3 = COUNTRY_ISO3[country.country];
    if (!iso3) { setStateGeo(GEO_STATES[country.country] || "none"); return; }
    const url = `https://cdn.jsdelivr.net/gh/wmgeolab/geoBoundaries@main/releaseData/gbOpen/${iso3}/ADM1/geoBoundaries-${iso3}-ADM1_simplified.geojson`;
    fetch(url).then(r=>{if(!r.ok)throw 0;return r.json();})
      .then(geo => setStateGeo(geo))
      .catch(() => setStateGeo(GEO_STATES[country.country] || "none"));
  }, [country.country]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el || !worldFeatures) return;
    const ns = "http://www.w3.org/2000/svg";
    const STATUS_COLOR = { Member:"#22c55e", Negotiating:"#f59e0b", Documentation:"#60a5fa", Needed:"#ef4444" };

    const iso = ISO_MAP[country.country];
    const targetFeat = iso ? worldFeatures.find(f => +f.id === iso) : null;

    // Projection: zoom into target country exactly like geoMercator fitExtent
    let proj;
    if (targetFeat) {
      proj = d3.geoMercator().fitExtent([[50, 40], [W-50, H-40]], targetFeat);
    } else {
      proj = d3.geoNaturalEarth1().fitSize([W, H], {type:"Sphere"});
    }
    const path = d3.geoPath().projection(proj);

    el.setAttribute("viewBox", `0 0 ${W} ${H}`);
    while (el.firstChild) el.removeChild(el.firstChild);

    // ── Defs ──
    const defs = document.createElementNS(ns,"defs");
    // Same ocean gradient as WorldMap
    const lg = document.createElementNS(ns,"linearGradient");
    lg.setAttribute("id","czm-bg"); lg.setAttribute("x1","0"); lg.setAttribute("y1","0"); lg.setAttribute("x2","0"); lg.setAttribute("y2","1");
    const s1=document.createElementNS(ns,"stop"); s1.setAttribute("offset","0%"); s1.setAttribute("stop-color","#e8ecf0");
    const s2=document.createElementNS(ns,"stop"); s2.setAttribute("offset","100%"); s2.setAttribute("stop-color","#dde3e9");
    lg.appendChild(s1); lg.appendChild(s2); defs.appendChild(lg);
    // Shadow for target country
    const filt=document.createElementNS(ns,"filter"); filt.setAttribute("id","czm-sh");
    filt.setAttribute("x","-15%"); filt.setAttribute("y","-15%"); filt.setAttribute("width","130%"); filt.setAttribute("height","130%");
    const fe=document.createElementNS(ns,"feDropShadow");
    fe.setAttribute("dx","0"); fe.setAttribute("dy","2"); fe.setAttribute("stdDeviation","5"); fe.setAttribute("flood-color","rgba(0,0,0,0.2)");
    filt.appendChild(fe); defs.appendChild(filt);
    el.appendChild(defs);

    // ── Background ──
    const bg=document.createElementNS(ns,"rect");
    bg.setAttribute("width",W); bg.setAttribute("height",H); bg.setAttribute("fill","url(#czm-bg)"); bg.setAttribute("rx","12");
    el.appendChild(bg);

    // ── World countries — same style as WorldMap ──
    const gWorld=document.createElementNS(ns,"g");
    worldFeatures.forEach(f => {
      const isTarget = iso && +f.id === iso;
      const d = path(f); if (!d) return;
      const p=document.createElementNS(ns,"path");
      p.setAttribute("d", d);
      // Target country: filled with its member status color (same as WorldMap)
      // Neighbours: same muted grey as WorldMap untracked countries
      const cData = isTarget ? country : null;
      p.setAttribute("fill", isTarget
        ? (STATUS_CFG[country.memberStatus]?.dot || "#94a3b8")
        : "#d4dbe3");
      p.setAttribute("stroke", isTarget ? "#a0aab4" : "#c2cad3");
      p.setAttribute("stroke-width", isTarget ? "0.8" : "0.3");
      p.setAttribute("stroke-linejoin","round");
      gWorld.appendChild(p);
    });
    el.appendChild(gWorld);

    // ── State outlines (on top of country fill) ──
    const statesByName = {};
    localStates.forEach(s => { if (s.name) statesByName[s.name.toLowerCase()] = s; });

    if (stateGeo && stateGeo !== "none" && stateGeo.features?.length) {
      const feats = stateGeo.features;
      const nk = ["shapeName","name","NAME_1","NAME","shapenam"]
        .find(k => feats[0]?.properties?.[k] !== undefined)
        || Object.keys(feats[0]?.properties||{})[0] || "name";

      // State fills
      const gStates = document.createElementNS(ns,"g");
      gStates.setAttribute("filter","url(#czm-sh)");
      feats.forEach(f => {
        const name = f.properties[nk] || "";
        const st = statesByName[name.toLowerCase()];
        const d = path(f); if (!d) return;
        const p = document.createElementNS(ns,"path");
        p.setAttribute("d", d);
        // Registered federation → status color. No federation → white.
        p.setAttribute("fill", st ? (STATUS_COLOR[st.memberStatus] || "#22c55e") : "#ffffff");
        p.setAttribute("stroke", "#a0aab4");
        p.setAttribute("stroke-width", "0.7");
        p.setAttribute("stroke-linejoin","round");
        p.style.cursor = "pointer";
        p.style.transition = "opacity 0.12s";
        p.addEventListener("mouseenter", e => {
          p.setAttribute("opacity","0.78");
          setHoveredState(name);
          const rect = el.getBoundingClientRect();
          setTooltip({ name, st, x:(e.clientX-rect.left)*(W/rect.width), y:(e.clientY-rect.top)*(H/rect.height) });
        });
        p.addEventListener("mousemove", e => {
          const rect = el.getBoundingClientRect();
          setTooltip(prev => prev ? {...prev, x:(e.clientX-rect.left)*(W/rect.width), y:(e.clientY-rect.top)*(H/rect.height)} : prev);
        });
        p.addEventListener("mouseleave", () => { p.setAttribute("opacity","1"); setHoveredState(null); setTooltip(null); });
        gStates.appendChild(p);
      });
      el.appendChild(gStates);

      // State labels
      const gLabels = document.createElementNS(ns,"g");
      feats.forEach(f => {
        const name = f.properties[nk] || "";
        const st = statesByName[name.toLowerCase()];
        const cen = path.centroid(f);
        if (!cen || isNaN(cen[0])) return;
        const hasTrophy = showTrophies && st?.tournament;
        if (hasTrophy) {
          const t=document.createElementNS(ns,"text");
          t.setAttribute("x",cen[0]); t.setAttribute("y",cen[1]-8);
          t.setAttribute("text-anchor","middle"); t.setAttribute("font-size","11");
          t.setAttribute("pointer-events","none"); t.textContent="🏆";
          gLabels.appendChild(t);
        }
        const short = name.length>16 ? name.slice(0,14)+"…" : name;
        const lbl=document.createElementNS(ns,"text");
        lbl.setAttribute("x",cen[0]); lbl.setAttribute("y",cen[1]+(hasTrophy?8:3));
        lbl.setAttribute("text-anchor","middle"); lbl.setAttribute("font-size","9");
        lbl.setAttribute("font-weight","700");
        lbl.setAttribute("fill", st ? "#fff" : "#1e2d3d");
        lbl.setAttribute("paint-order","stroke");
        lbl.setAttribute("stroke", st ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.9)");
        lbl.setAttribute("stroke-width","2.5"); lbl.setAttribute("stroke-linejoin","round");
        lbl.setAttribute("pointer-events","none");
        lbl.textContent = short;
        gLabels.appendChild(lbl);
      });
      el.appendChild(gLabels);
    }

    // ── Tooltip ──
    if (tooltip) {
      const STATUS_COLOR2 = { Member:"#22c55e", Negotiating:"#f59e0b", Documentation:"#60a5fa", Needed:"#ef4444" };
      const tg=document.createElementNS(ns,"g");
      const tx=Math.min(tooltip.x+14,W-205), ty=Math.max(tooltip.y-75,6);
      const bh = tooltip.st ? (tooltip.st.federation ? (tooltip.st.rep?88:70) : 52) : 44;
      const box=document.createElementNS(ns,"rect");
      box.setAttribute("x",tx); box.setAttribute("y",ty); box.setAttribute("width","195"); box.setAttribute("height",bh);
      box.setAttribute("rx","8"); box.setAttribute("fill","#1e293b"); box.setAttribute("opacity","0.94");
      tg.appendChild(box);
      const tn=document.createElementNS(ns,"text");
      tn.setAttribute("x",tx+10); tn.setAttribute("y",ty+17); tn.setAttribute("font-size","12");
      tn.setAttribute("font-weight","700"); tn.setAttribute("fill","#fff");
      tn.textContent=tooltip.name+(showTrophies&&tooltip.st?.tournament?" 🏆":"");
      tg.appendChild(tn);
      if (tooltip.st) {
        const dot=document.createElementNS(ns,"circle");
        dot.setAttribute("cx",tx+10); dot.setAttribute("cy",ty+32); dot.setAttribute("r","5");
        dot.setAttribute("fill",STATUS_COLOR2[tooltip.st.memberStatus]||"#94a3b8"); tg.appendChild(dot);
        const ts=document.createElementNS(ns,"text");
        ts.setAttribute("x",tx+20); ts.setAttribute("y",ty+36); ts.setAttribute("font-size","11");
        ts.setAttribute("fill",STATUS_COLOR2[tooltip.st.memberStatus]||"#94a3b8"); ts.setAttribute("font-weight","600");
        ts.textContent=tooltip.st.memberStatus; tg.appendChild(ts);
        if(tooltip.st.federation){const tf=document.createElementNS(ns,"text"); tf.setAttribute("x",tx+10); tf.setAttribute("y",ty+52); tf.setAttribute("font-size","10"); tf.setAttribute("fill","#86efac"); tf.textContent=tooltip.st.federation; tg.appendChild(tf);}
        if(tooltip.st.rep){const tr=document.createElementNS(ns,"text"); tr.setAttribute("x",tx+10); tr.setAttribute("y",ty+68); tr.setAttribute("font-size","10"); tr.setAttribute("fill","#94a3b8"); tr.textContent=tooltip.st.rep; tg.appendChild(tr);}
      } else {
        const tn2=document.createElementNS(ns,"text");
        tn2.setAttribute("x",tx+10); tn2.setAttribute("y",ty+34); tn2.setAttribute("font-size","10");
        tn2.setAttribute("fill","#94a3b8"); tn2.setAttribute("font-style","italic");
        tn2.textContent="No federation registered"; tg.appendChild(tn2);
      }
      el.appendChild(tg);
    }

  }, [worldFeatures, stateGeo, localStates, showTrophies, tooltip, hoveredState]);

  return (
    <div style={{position:"relative",width:"100%"}}>
      {!stateGeo && (
        <div style={{height:460,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,background:"url(#czm-bg)",borderRadius:12,background:"#e8ecf0"}}>
          <div style={{width:36,height:36,border:"3px solid #e0e7ff",borderTopColor:"#6366f1",borderRadius:"50%",animation:"spin 0.9s linear infinite"}}/>
          <span style={{color:"#9ca3af",fontSize:13}}>Loading map…</span>
        </div>
      )}
      {stateGeo && <svg ref={svgRef} style={{width:"100%",height:"auto",display:"block",borderRadius:12}}/>}
    </div>
  );
}

// ── Country State Map ──────────────────────────────────────────
// ── Google Tasks Integration ───────────────────────────────────
// Replace this with your actual OAuth Client ID from Google Cloud Console
const GOOGLE_CLIENT_ID = window.__WPF_GOOGLE_CLIENT_ID__ || "";
const GOOGLE_SCOPES = "https://www.googleapis.com/auth/tasks";

// Responsible name → Google email mapping (edit to match your workspace)
const RESP_EMAIL_MAP = {
  "Karina": "karina@worldpokerfederation.org",
};

function useGoogleAuth() {
  const [token, setToken] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("wpf_gtoken") || "null"); } catch { return null; }
  });

  const signIn = () => {
    if (!GOOGLE_CLIENT_ID) {
      alert("Configure o Google Client ID primeiro.\nVeja o guia de configuração no bloco Google Tasks.");
      return;
    }
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: window.location.origin + window.location.pathname,
      response_type: "token",
      scope: GOOGLE_SCOPES,
      prompt: "select_account",
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  // Handle OAuth redirect with token in hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token=")) {
      const params = new URLSearchParams(hash.slice(1));
      const t = { access_token: params.get("access_token"), expires_in: params.get("expires_in"), ts: Date.now() };
      sessionStorage.setItem("wpf_gtoken", JSON.stringify(t));
      setToken(t);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const isValid = token && (Date.now() - token.ts) < (token.expires_in - 60) * 1000;
  const signOut = () => { sessionStorage.removeItem("wpf_gtoken"); setToken(null); };

  return { token: isValid ? token : null, signIn, signOut };
}

async function gTasksCreate(token, task, countryName) {
  // Find or create tasklist named "WPF"
  const listRes = await fetch("https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
    headers: { Authorization: `Bearer ${token.access_token}` }
  });
  const lists = await listRes.json();
  let list = lists.items?.find(l => l.title === "WPF");
  if (!list) {
    const cr = await fetch("https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
      method:"POST", headers:{ Authorization:`Bearer ${token.access_token}`, "Content-Type":"application/json" },
      body: JSON.stringify({ title:"WPF" })
    });
    list = await cr.json();
  }
  const body = {
    title: `[${countryName}] ${task.name}`,
    notes: task.responsible ? `Responsável: ${task.responsible}` : undefined,
    due: task.deadline ? new Date(task.deadline).toISOString() : undefined,
    status: task.taskStatus === "Done" ? "completed" : "needsAction",
  };
  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks`, {
    method:"POST", headers:{ Authorization:`Bearer ${token.access_token}`, "Content-Type":"application/json" },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function gTasksUpdateStatus(token, taskListId, googleTaskId, done) {
  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${googleTaskId}`, {
    method:"PATCH", headers:{ Authorization:`Bearer ${token.access_token}`, "Content-Type":"application/json" },
    body: JSON.stringify({ status: done ? "completed" : "needsAction" })
  });
  return res.json();
}

function GoogleTasksSyncButton({ tasks, countryName, onTasksUpdate }) {
  const { token, signIn, signOut } = useGoogleAuth();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);

  const syncAll = async () => {
    if (!token) { signIn(); return; }
    setSyncing(true); setResult(null);
    let ok = 0, fail = 0;
    const updated = [...tasks];
    for (let i = 0; i < updated.length; i++) {
      const t = updated[i];
      if (!t.name) continue;
      try {
        const created = await gTasksCreate(token, t, countryName);
        if (created.id) {
          updated[i] = { ...t, googleTaskId: created.id, googleListId: created.selfLink?.match(/lists\/([^/]+)/)?.[1] };
          ok++;
        } else { fail++; }
      } catch { fail++; }
    }
    onTasksUpdate(updated);
    setSyncing(false);
    setResult({ ok, fail });
    setTimeout(() => setResult(null), 4000);
  };

  if (!GOOGLE_CLIENT_ID) return (
    <span style={{fontSize:11,color:"#9ca3af",background:"#f3f4f6",borderRadius:8,padding:"5px 10px",display:"flex",alignItems:"center",gap:5}}>
      <span style={{fontSize:13}}>🔗</span> Google Tasks: <a href="#" style={{color:"#6366f1",fontWeight:700}} onClick={e=>{e.preventDefault();document.getElementById("gtasks-setup")?.scrollIntoView({behavior:"smooth"});}}>Configure</a>
    </span>
  );

  return (
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      {token ? (
        <>
          <button onClick={syncAll} disabled={syncing}
            style={{display:"flex",alignItems:"center",gap:5,background:syncing?"#f3f4f6":"#e0f2fe",border:"1px solid #7dd3fc",borderRadius:8,padding:"6px 12px",cursor:syncing?"not-allowed":"pointer",fontSize:12,color:"#0369a1",fontWeight:600}}>
            {syncing ? "Syncing…" : "Sync to Google"}
          </button>
          {result && <span style={{fontSize:11,color:result.fail>0?"#dc2626":"#16a34a",fontWeight:700}}>{result.ok} synced{result.fail>0?`, ${result.fail} failed`:""}</span>}
          <button onClick={signOut} title="Disconnect Google" style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#9ca3af",padding:"2px 4px"}}title="Sign out">✕</button>
        </>
      ) : (
        <button onClick={signIn}
          style={{display:"flex",alignItems:"center",gap:5,background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,color:"#374151",fontWeight:600}}>
          <span style={{fontSize:14}}>🔗</span> Connect Google
        </button>
      )}
    </div>
  );
}

function CountryHistoryBlock({ country }) {
  const HTYPES = ["Meeting","Update","Note","Decision","Alert"];
  const HCFG = {
    Meeting:  { bg:"#dbeafe", color:"#1d4ed8", icon:"📅" },
    Update:   { bg:"#dcfce7", color:"#15803d", icon:"📊" },
    Note:     { bg:"#f3f4f6", color:"#374151", icon:"📝" },
    Decision: { bg:"#fef3c7", color:"#b45309", icon:"⚡" },
    Alert:    { bg:"#fee2e2", color:"#dc2626", icon:"🚨" },
  };
  const [entries, setEntries] = useState([]);
  const [note, setNote] = useState("");
  const [type, setType] = useState("Note");
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));

  const add = () => {
    const n = note.trim(); if (!n) return;
    setEntries(p => [{id:`ch_${Date.now()}`, date, type, note:n, scope: country.country}, ...p]);
    setNote("");
  };

  return (
    <div id="country-history" style={{background:"#fff",borderRadius:16,padding:"22px 24px",marginTop:18,boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
        <BookOpen size={16} color="#6366f1"/>
        <h2 style={{fontSize:15,fontWeight:700,margin:0,fontFamily:"'Inter',system-ui,sans-serif"}}>History</h2>
        <span style={{fontSize:11,background:"#eef2ff",color:"#6366f1",borderRadius:20,padding:"2px 8px",fontWeight:600}}>{entries.length} entries</span>
      </div>

      {/* Add entry */}
      <div style={{background:"#f8faff",borderRadius:10,padding:"14px 16px",marginBottom:16,border:"1px solid #e0e7ff"}}>
        <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            style={{border:"1px solid #e5e7eb",borderRadius:8,padding:"5px 9px",fontSize:12,outline:"none"}}/>
          <select value={type} onChange={e=>setType(e.target.value)}
            style={{border:"1px solid #e5e7eb",borderRadius:8,padding:"5px 9px",fontSize:12,background:"#fff",outline:"none"}}>
            {HTYPES.map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
        <div style={{display:"flex",gap:8}}>
          <textarea value={note} onChange={e=>setNote(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&(e.metaKey||e.ctrlKey)) add();}}
            placeholder={`Add a note about ${country.country}… (Cmd+Enter to save)`}
            style={{flex:1,border:"1px solid #e5e7eb",borderRadius:8,padding:"7px 10px",fontSize:12,outline:"none",resize:"vertical",minHeight:56,fontFamily:"'Inter',system-ui,sans-serif"}}/>
          <button onClick={add}
            style={{background:"#1a1a1a",color:"#fff",border:"none",borderRadius:8,padding:"0 16px",cursor:"pointer",fontSize:12,fontWeight:600,flexShrink:0}}>
            <Plus size={13} style={{display:"block",margin:"0 auto 2px"}}/>Save
          </button>
        </div>
      </div>

      {entries.length === 0
        ? <div style={{padding:"24px 0",textAlign:"center",color:"#c4c9d4",fontSize:13,fontStyle:"italic"}}>No history yet for {country.country}.</div>
        : <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {entries.map(e => {
              const cfg = HCFG[e.type] || HCFG.Note;
              return (
                <div key={e.id} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"10px 12px",borderRadius:10,background:"#fafafa",border:"1px solid #f3f4f6"}}>
                  <span style={{fontSize:16,flexShrink:0,marginTop:1}}>{cfg.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",gap:6,marginBottom:3,flexWrap:"wrap",alignItems:"center"}}>
                      <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:10,background:cfg.bg,color:cfg.color}}>{e.type}</span>
                      <span style={{fontSize:10,color:"#9ca3af"}}>{new Date(e.date+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span>
                    </div>
                    <p style={{margin:0,fontSize:12,color:"#374151",lineHeight:1.5}}>{e.note}</p>
                  </div>
                  <button onClick={()=>setEntries(p=>p.filter(x=>x.id!==e.id))} style={{background:"none",border:"none",cursor:"pointer",color:"#e5e7eb",padding:2,flexShrink:0}} onMouseEnter={el=>el.currentTarget.style.color="#ef4444"} onMouseLeave={el=>el.currentTarget.style.color="#e5e7eb"}><X size={12}/></button>
                </div>
              );
            })}
          </div>
      }
    </div>
  );
}



function CountryStateMap({ country, states, onBack, onSaveStates }) {
  const [localStates, setLocalStates] = useState(states || []);
  const [localMedia, setLocalMedia] = useState(country.media || []);
  const [localTasks, setLocalTasks] = useState(country.tasks || []);
  const [showTrophies, setShowTrophies] = useState(true);
  const [tooltip, setTooltip] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [hoveredName, setHoveredName] = useState(null);
  const [paths, setPaths] = useState([]);
  const [worldFeatures, setWorldFeatures] = useState(null);
  const W = 800, H = 500;

  // Load shared world features for zoom map
  useEffect(() => {
    loadWorldFeatures(feats => setWorldFeatures(feats));
  }, []);

  useEffect(() => { setLocalStates(states || []); }, [states]);

  useEffect(() => {
    setGeoLoading(true); setGeoData(null); setPaths([]);
    const iso3 = COUNTRY_ISO3[country.country];
    const tryLoad = (geo) => { setGeoData(geo); setGeoLoading(false); };
    if (!iso3) { const emb=GEO_STATES[country.country]; tryLoad(emb||null); return; }
    const url = `https://cdn.jsdelivr.net/gh/wmgeolab/geoBoundaries@main/releaseData/gbOpen/${iso3}/ADM1/geoBoundaries-${iso3}-ADM1_simplified.geojson`;
    fetch(url).then(r=>{if(!r.ok)throw 0;return r.json();}).then(tryLoad).catch(()=>{tryLoad(GEO_STATES[country.country]||null);});
  }, [country.country]);

  // Compute SVG paths with d3 projection
  useEffect(() => {
    if (!geoData) { setPaths([]); return; }
    const features = geoData.features || [];
    if (!features.length) { setPaths([]); return; }
    const nk = ["shapeName","name","NAME_1","NAME","shapenam"]
      .find(k=>features[0]?.properties?.[k]!==undefined)
      || Object.keys(features[0]?.properties||{})[0] || "name";
    const collection = {type:"FeatureCollection",features};
    const proj = d3.geoMercator().fitSize([W-40,H-40],collection);
    const [ptx,pty] = proj.translate();
    proj.translate([ptx+20,pty+20]);
    const pathFn = d3.geoPath().projection(proj);
    const result = features.map(f => {
      const name = f.properties[nk] || "";
      const dStr = pathFn(f);
      const cen = pathFn.centroid(f);
      return { name, dStr, cx: isNaN(cen[0])?null:cen[0], cy: isNaN(cen[1])?null:cen[1] };
    }).filter(p=>p.dStr);
    setPaths(result);
  }, [geoData]);


  const addState = () => {
    const s = {id:`s${Date.now()}`, name:"", type:"Federation", federation:"", memberStatus:"Member", tournament:"", inicio:"", fim:"", rep:"", email:"", tel:""};
    const next = [...localStates, s];
    setLocalStates(next);
    if (onSaveStates) onSaveStates(next);
  };
  const updateState = (sid, field, val) => {
    const next = localStates.map(s => s.id === sid ? {...s,[field]:val} : s);
    setLocalStates(next);
    if (onSaveStates) onSaveStates(next);
  };
  const removeState = (sid) => {
    const next = localStates.filter(s => s.id !== sid);
    setLocalStates(next);
    if (onSaveStates) onSaveStates(next);
  };

  const kpiCounts = useMemo(() => {
    const counts = { Member:0, Negotiating:0, Documentation:0, Needed:0 };
    localStates.forEach(s => { if (counts[s.memberStatus] !== undefined) counts[s.memberStatus]++; });
    return counts;
  }, [localStates]);

  // AI Discussion Topics
  const [aiTopics, setAiTopics] = useState(null);
  const [aiLoading, setAiLoading] = useState(true);
  useEffect(() => {
    const taskLines = (country.tasks||[]).map(t=>`  • [${t.taskStatus||"Not Started"}] ${t.name||"(unnamed)"} — resp: ${t.responsible||"?"}, deadline: ${t.deadline||"—"}`).join("\n");
    const histLines = (country.statusHistory||[]).slice(-5).map(h=>`  ${h.date}: ${h.fromStatus||"—"}→${h.toStatus}`).join("\n");
    const prompt = `You are a WPF strategic advisor. Analyze this country and generate 4 discussion topics for a regional meeting.

Country: ${country.country} (${country.memberStatus})
Continent: ${country.continent||"—"} | Company: ${country.empresa||"—"}
Status history:\n${histLines||"None"}
Tasks:\n${taskLines||"None"}

Return a JSON array of 4 objects with: "title" (max 7 words), "body" (1-2 sentences), "priority" ("high"|"medium"|"low"), "tag" ("Risk"|"Opportunity"|"Follow-up"|"Action"|"Info").
Respond ONLY with the raw JSON array.`;

    setAiLoading(true);
    fetch("https://api.anthropic.com/v1/messages", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:800, messages:[{role:"user",content:prompt}] })
    })
    .then(r=>r.json())
    .then(d => {
      const text = d.content?.find(b=>b.type==="text")?.text||"[]";
      setAiTopics(JSON.parse(text.replace(/```json|```/g,"").trim()));
    })
    .catch(()=>setAiTopics([]))
    .finally(()=>setAiLoading(false));
  }, [country.id]);

  const PRIORITY_CFG = { high:{bg:"#fee2e2",color:"#dc2626"}, medium:{bg:"#fef3c7",color:"#b45309"}, low:{bg:"#f0fdf4",color:"#16a34a"} };
  const TAG_CFG = { Risk:{bg:"#fee2e2",color:"#dc2626"}, Opportunity:{bg:"#dcfce7",color:"#15803d"}, "Follow-up":{bg:"#dbeafe",color:"#1d4ed8"}, Action:{bg:"#fef3c7",color:"#b45309"}, Info:{bg:"#f3f4f6",color:"#374151"} };

  return (
    <div style={{minHeight:"100vh",background:"#f7f6f3",fontFamily:"'Inter',system-ui,sans-serif"}}>
      {/* ── Top bar ── */}
      <div style={{background:"#fff",borderBottom:"1px solid #ede9e3",padding:"0 28px",display:"flex",alignItems:"center",gap:12,height:52,position:"sticky",top:0,zIndex:50}}>
        <button onClick={onBack}
          style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#6b7280",fontWeight:500,padding:"4px 8px",borderRadius:6,transition:"color .15s"}}
          onMouseEnter={e=>e.currentTarget.style.color="#1a1a1a"}
          onMouseLeave={e=>e.currentTarget.style.color="#6b7280"}>
          <ArrowLeft size={14}/> Dashboard
        </button>
        <span style={{color:"#e5e7eb",fontSize:16}}>|</span>
        <Map size={15} color="#f59e0b"/>
        <span style={{fontSize:15,fontWeight:700,fontFamily:"'Inter',system-ui,sans-serif"}}>
          {country.country}
        </span>
        <div style={{marginLeft:"auto",display:"flex",gap:6,flexWrap:"wrap"}}>
          {Object.entries(STATUS_CFG).map(([s,c])=>(
            <span key={s} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:700,color:c.color,background:c.bg,padding:"3px 10px",borderRadius:20}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:c.dot,display:"inline-block"}}/>{s}
            </span>
          ))}
        </div>
      </div>

      <div style={{maxWidth:1300,margin:"0 auto",padding:"28px 24px"}}>

        {/* ── Map + AI side by side ── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:18,marginBottom:22,alignItems:"start"}}>
          {/* Map */}
          <div style={{background:"#fff",borderRadius:16,padding:"22px 24px",boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
            <h2 style={{fontSize:15,fontWeight:700,margin:"0 0 16px",fontFamily:"'Inter',system-ui,sans-serif"}}>
              {country.country}
            </h2>
            <CountryZoomMap
              country={country}
              localStates={localStates}
              showTrophies={true}
              worldFeatures={worldFeatures}
            />
          </div>

          {/* AI Discussion Topics */}
          <div style={{background:"#fff",borderRadius:16,boxShadow:"0 1px 4px rgba(0,0,0,0.07)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"16px 18px",borderBottom:"1px solid #f3f4f6",display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:26,height:26,borderRadius:8,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Sparkles size={13} color="#fff"/>
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:"#1a1a1a"}}>Discussion Topics</div>
                <div style={{fontSize:10,color:"#9ca3af"}}>AI · tasks & status history</div>
              </div>
            </div>
            <div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}}>
              {aiLoading ? (
                <>
                  {[1,2,3,4].map(i=>(
                    <div key={i} style={{background:"#f3f4f6",borderRadius:10,padding:"12px 14px"}}>
                      <div style={{width:`${55+i*10}%`,height:9,background:"#e5e7eb",borderRadius:4,marginBottom:7}}/>
                      <div style={{width:"88%",height:7,background:"#e5e7eb",borderRadius:4,marginBottom:4}}/>
                      <div style={{width:"65%",height:7,background:"#e5e7eb",borderRadius:4}}/>
                    </div>
                  ))}
                  <p style={{textAlign:"center",fontSize:10,color:"#9ca3af",margin:"2px 0 0"}}>Analisando dados…</p>
                </>
              ) : !aiTopics || aiTopics.length===0 ? (
                <div style={{padding:"32px 12px",textAlign:"center",color:"#9ca3af",fontSize:12}}>
                  <Sparkles size={24} style={{opacity:.2,display:"block",margin:"0 auto 10px"}}/>
                  Adicione tarefas ou histórico para gerar tópicos.
                </div>
              ) : aiTopics.map((t,i)=>{
                const pCfg = PRIORITY_CFG[t.priority]||PRIORITY_CFG.medium;
                const tCfg = TAG_CFG[t.tag]||TAG_CFG.Info;
                return (
                  <div key={i} style={{background:"#fafafa",borderRadius:10,padding:"12px 14px",border:"1px solid #f0f0f0"}}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:5}}>
                      <span style={{fontSize:12,fontWeight:700,color:"#1a1a1a",lineHeight:1.3}}>{t.title}</span>
                      <div style={{display:"flex",gap:3,flexShrink:0}}>
                        <span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:8,background:tCfg.bg,color:tCfg.color}}>{t.tag}</span>
                        <span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:8,background:pCfg.bg,color:pCfg.color,textTransform:"uppercase"}}>{t.priority}</span>
                      </div>
                    </div>
                    <p style={{margin:0,fontSize:11,color:"#6b7280",lineHeight:1.5}}>{t.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── National Entities Table ── */}
        <div style={{background:"#fff",borderRadius:16,padding:"22px 24px",marginBottom:18,boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <h2 style={{fontSize:15,fontWeight:700,margin:0,fontFamily:"'Inter',system-ui,sans-serif"}}>🌍 National Entities</h2>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{background:"#f3f4f6",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:600,color:"#6b7280"}}>{localStates.length} records</span>
              <button onClick={addState}
                style={{display:"flex",alignItems:"center",gap:4,background:"#f0fdf4",border:"1px solid #86efac",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,color:"#16a34a",fontWeight:600}}
                onMouseEnter={e=>e.currentTarget.style.background="#dcfce7"}
                onMouseLeave={e=>e.currentTarget.style.background="#f0fdf4"}>
                <Plus size={12}/> Add Entity
              </button>
            </div>
          </div>
          {localStates.length===0
            ?<div style={{padding:"40px 0",textAlign:"center",color:"#c4c9d4",fontSize:13,fontStyle:"italic"}}>No entities registered yet. Click "Add Entity" to begin.</div>
            :<div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{borderBottom:"2px solid #f3f4f6",background:"#fafafa"}}>
                    {["Name","Tournament 🏆","Federation","Entry Date","Exit Date","Representative","Email","Phone",""].map(h=>(
                      <th key={h} style={{textAlign:"left",padding:"10px 12px",fontSize:10,color:"#9ca3af",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {localStates.map(st=>(
                    <tr key={st.id} style={{borderBottom:"1px solid #f3f4f6"}}
                      onMouseEnter={e=>e.currentTarget.style.background="#f8faff"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{padding:"9px 12px"}}>
                        <input value={st.name||""} onChange={e=>updateState(st.id,"name",e.target.value)} placeholder="Name"
                          style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:12,fontWeight:600,background:"transparent",outline:"none",width:"100%",minWidth:100}}/>
                      </td>
                      <td style={{padding:"9px 12px",minWidth:140}}>
                        <input value={st.tournament||""} onChange={e=>updateState(st.id,"tournament",e.target.value)} placeholder="Tournament name…"
                          style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:11,background:"transparent",outline:"none",width:"100%",color:"#b45309"}}/>
                      </td>
                      <td style={{padding:"9px 12px"}}>
                        <input value={st.federation||""} onChange={e=>updateState(st.id,"federation",e.target.value)} placeholder="Federation"
                          style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:12,background:"transparent",outline:"none",width:"100%",minWidth:80,color:"#16a34a",fontWeight:600}}/>
                      </td>
                      <td style={{padding:"9px 12px"}}><input type="date" value={st.inicio||""} onChange={e=>updateState(st.id,"inicio",e.target.value)} style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:11,background:"transparent",outline:"none"}}/></td>
                      <td style={{padding:"9px 12px"}}><input type="date" value={st.fim||""} onChange={e=>updateState(st.id,"fim",e.target.value)} style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:11,background:"transparent",outline:"none"}}/></td>
                      <td style={{padding:"9px 12px"}}><input value={st.rep||""} onChange={e=>updateState(st.id,"rep",e.target.value)} placeholder="Representative" style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:12,background:"transparent",outline:"none",width:"100%",minWidth:110}}/></td>
                      <td style={{padding:"9px 12px"}}><input value={st.email||""} onChange={e=>updateState(st.id,"email",e.target.value)} placeholder="Email" style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:12,background:"transparent",outline:"none",width:"100%",minWidth:120}}/></td>
                      <td style={{padding:"9px 12px"}}><input value={st.tel||""} onChange={e=>updateState(st.id,"tel",e.target.value)} placeholder="Phone" style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:12,background:"transparent",outline:"none",width:"100%",minWidth:90}}/></td>
                      <td style={{padding:"9px 6px",textAlign:"center"}}>
                        <button onClick={()=>removeState(st.id)}
                          style={{background:"none",border:"none",cursor:"pointer",color:"#e5e7eb",padding:3,borderRadius:4,display:"flex",alignItems:"center"}}
                          onMouseEnter={e=>e.currentTarget.style.color="#ef4444"}
                          onMouseLeave={e=>e.currentTarget.style.color="#e5e7eb"}>
                          <X size={12}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        </div>

        {/* ── Media section ── */}
        <div style={{background:"#fff",borderRadius:16,padding:"22px 24px",marginBottom:18,boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <h2 style={{fontSize:15,fontWeight:700,margin:0,fontFamily:"'Inter',system-ui,sans-serif"}}>📡 Media</h2>
            <button onClick={()=>{const m={id:`m${Date.now()}`,name:"",email:"",representative:""};setLocalMedia(p=>[...p,m]);}}
              style={{display:"flex",alignItems:"center",gap:4,background:"#f5f3ff",border:"1px solid #c4b5fd",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,color:"#7c3aed",fontWeight:600}}
              onMouseEnter={e=>e.currentTarget.style.background="#ede9fe"}
              onMouseLeave={e=>e.currentTarget.style.background="#f5f3ff"}>
              <Plus size={12}/> Add Media
            </button>
          </div>
          {localMedia.length===0
            ? <div style={{padding:"32px 0",textAlign:"center",color:"#c4c9d4",fontSize:13,fontStyle:"italic"}}>No media contacts yet.</div>
            : <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{borderBottom:"2px solid #f3f4f6",background:"#fafafa"}}>
                    {["Name","Email","Representative",""].map(h=>(
                      <th key={h} style={{textAlign:"left",padding:"10px 12px",fontSize:10,color:"#9ca3af",fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {localMedia.map(m=>(
                    <tr key={m.id} style={{borderBottom:"1px solid #f3f4f6"}}
                      onMouseEnter={e=>e.currentTarget.style.background="#faf5ff"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{padding:"9px 12px"}}><input value={m.name||""} onChange={e=>setLocalMedia(p=>p.map(x=>x.id===m.id?{...x,name:e.target.value}:x))} placeholder="Media name" style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:12,fontWeight:600,background:"transparent",outline:"none",width:"100%",minWidth:120}}/></td>
                      <td style={{padding:"9px 12px"}}><input value={m.email||""} onChange={e=>setLocalMedia(p=>p.map(x=>x.id===m.id?{...x,email:e.target.value}:x))} placeholder="email@media.com" style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:12,background:"transparent",outline:"none",width:"100%",minWidth:160,color:"#7c3aed"}}/></td>
                      <td style={{padding:"9px 12px"}}><input value={m.representative||""} onChange={e=>setLocalMedia(p=>p.map(x=>x.id===m.id?{...x,representative:e.target.value}:x))} placeholder="Contact person" style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:12,background:"transparent",outline:"none",width:"100%",minWidth:130}}/></td>
                      <td style={{padding:"9px 6px"}}>
                        <button onClick={()=>setLocalMedia(p=>p.filter(x=>x.id!==m.id))} style={{background:"none",border:"none",cursor:"pointer",color:"#e5e7eb",padding:3,borderRadius:4,display:"flex",alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.color="#ef4444"} onMouseLeave={e=>e.currentTarget.style.color="#e5e7eb"}><X size={12}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>

        {/* ── Tasks ── */}
        <div style={{background:"#fff",borderRadius:16,padding:"22px 24px",boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <h2 style={{fontSize:15,fontWeight:700,margin:0,fontFamily:"'Inter',system-ui,sans-serif"}}>✅ Tasks</h2>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {localTasks.filter(t=>t.taskStatus!=="Done"&&t.deadline&&new Date(t.deadline)<new Date()).length>0&&(
                <span style={{fontSize:11,color:"#dc2626",background:"#fee2e2",padding:"3px 10px",borderRadius:20,fontWeight:700}}>
                  🔴 {localTasks.filter(t=>t.taskStatus!=="Done"&&t.deadline&&new Date(t.deadline)<new Date()).length} overdue
                </span>
              )}
              <GoogleTasksSyncButton tasks={localTasks} countryName={country.country} onTasksUpdate={setLocalTasks}/>
              <button onClick={()=>{const t={id:`t${Date.now()}`,name:"",responsible:"",start:"",deadline:"",taskStatus:"Not Started"};setLocalTasks(p=>[...p,t]);}}
                style={{display:"flex",alignItems:"center",gap:4,background:"#fffbeb",border:"1px solid #fcd34d",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,color:"#b45309",fontWeight:600}}
                onMouseEnter={e=>e.currentTarget.style.background="#fef3c7"}
                onMouseLeave={e=>e.currentTarget.style.background="#fffbeb"}>
                <Plus size={12}/> Add Task
              </button>
            </div>
          </div>
          {localTasks.length===0
            ? <div style={{padding:"32px 0",textAlign:"center",color:"#c4c9d4",fontSize:13,fontStyle:"italic"}}>No tasks yet.</div>
            : <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{borderBottom:"2px solid #f3f4f6",background:"#fafafa"}}>
                    {["Task Name","Responsible","Start","Deadline","Status","Google",""].map(h=>(
                      <th key={h} style={{textAlign:"left",padding:"10px 12px",fontSize:10,color:"#9ca3af",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {localTasks.map(t=>{
                    const overdue = t.taskStatus!=="Done"&&t.deadline&&new Date(t.deadline)<new Date();
                    return (
                      <tr key={t.id} style={{borderBottom:"1px solid #f3f4f6",background:overdue?"#fff7f7":"transparent"}}
                        onMouseEnter={e=>e.currentTarget.style.background=overdue?"#fef2f2":"#fffbeb"}
                        onMouseLeave={e=>e.currentTarget.style.background=overdue?"#fff7f7":"transparent"}>
                        <td style={{padding:"9px 12px"}}><input value={t.name||""} onChange={e=>setLocalTasks(p=>p.map(x=>x.id===t.id?{...x,name:e.target.value}:x))} placeholder="Task name" style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:12,fontWeight:600,background:"transparent",outline:"none",width:"100%",minWidth:140}}/></td>
                        <td style={{padding:"9px 12px",minWidth:130}}><input value={t.responsible||""} onChange={e=>setLocalTasks(p=>p.map(x=>x.id===t.id?{...x,responsible:e.target.value}:x))} placeholder="Responsible" style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:12,background:"transparent",outline:"none",width:"100%"}}/></td>
                        <td style={{padding:"9px 12px"}}><input type="date" value={t.start||""} onChange={e=>setLocalTasks(p=>p.map(x=>x.id===t.id?{...x,start:e.target.value}:x))} style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:11,background:"transparent",outline:"none"}}/></td>
                        <td style={{padding:"9px 12px"}}>
                          <div style={{display:"flex",alignItems:"center",gap:4}}>
                            {overdue&&<span>🔴</span>}
                            <input type="date" value={t.deadline||""} onChange={e=>setLocalTasks(p=>p.map(x=>x.id===t.id?{...x,deadline:e.target.value}:x))} style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:11,background:"transparent",outline:"none"}}/>
                          </div>
                        </td>
                        <td style={{padding:"9px 12px",minWidth:130}}>
                          <select value={t.taskStatus||"Not Started"} onChange={e=>setLocalTasks(p=>p.map(x=>x.id===t.id?{...x,taskStatus:e.target.value}:x))}
                            style={{border:"1px solid #e5e7eb",borderRadius:6,padding:"3px 8px",fontSize:11,background:TASK_STATUS_CFG[t.taskStatus||"Not Started"]?.bg,color:TASK_STATUS_CFG[t.taskStatus||"Not Started"]?.color,fontWeight:600,cursor:"pointer"}}>
                            {TASK_STATUS.map(o=><option key={o} value={o}>{o}</option>)}
                          </select>
                        </td>
                        <td style={{padding:"9px 12px",textAlign:"center"}}>
                          {t.googleTaskId
                            ? <span title="Synced to Google Tasks" style={{fontSize:16}}>✅</span>
                            : <span title="Not synced" style={{fontSize:13,color:"#d1d5db"}}>—</span>
                          }
                        </td>
                        <td style={{padding:"9px 6px"}}>
                          <button onClick={()=>setLocalTasks(p=>p.filter(x=>x.id!==t.id))} style={{background:"none",border:"none",cursor:"pointer",color:"#e5e7eb",padding:3,borderRadius:4,display:"flex",alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.color="#ef4444"} onMouseLeave={e=>e.currentTarget.style.color="#e5e7eb"}><X size={12}/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          }
        </div>

        {/* ── History Block ── */}
        <CountryHistoryBlock country={country}/>

      </div>
    </div>
  );
}

// ── Editable Cell ──────────────────────────────────────────────
function EditableCell({ value, onChange, type="text", opts }) {
  const [editing,setEditing]=useState(false);
  const [v,setV]=useState(value);
  useEffect(()=>setV(value),[value]);
  if(editing){
    if(type==="select") return(
      <select autoFocus value={v||""} onChange={e=>setV(e.target.value)} onBlur={()=>{onChange(v);setEditing(false);}}
        style={{border:"1px solid #60a5fa",borderRadius:6,padding:"2px 6px",fontSize:12,background:"#fff",width:"100%"}}>
        {(opts||[]).map(o=><option key={o} value={o}>{o||"—"}</option>)}
      </select>
    );
    return <input autoFocus type={type} value={v||""} onChange={e=>setV(e.target.value)}
      onBlur={()=>{onChange(v);setEditing(false);}}
      onKeyDown={e=>{if(e.key==="Enter"){onChange(v);setEditing(false);}if(e.key==="Escape")setEditing(false);}}
      style={{border:"1px solid #60a5fa",borderRadius:6,padding:"2px 6px",fontSize:12,width:"100%",boxSizing:"border-box"}}/>;
  }
  return(
    <span onClick={()=>setEditing(true)}
      style={{cursor:"text",display:"block",padding:"3px 4px",borderRadius:4,fontSize:12,color:v?"#374151":"#c4c9d4",minHeight:20}}
      onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      {type==="date"?fmt(v):(v||"—")}
    </span>
  );
}

// ── Status History Editor ──────────────────────────────────────
const TASK_STATUS = ["Not Started","Doing","Done"];
const TASK_STATUS_CFG = {
  "Not Started": {color:"#6b7280", bg:"#f3f4f6"},
  "Doing":       {color:"#1d4ed8", bg:"#dbeafe"},
  "Done":        {color:"#15803d", bg:"#dcfce7"},
};

function StatusHistoryEditor({ record, onUpdate, responsibles, setResponsibles, history = [] }) {
  const hist = useMemo(()=>[...(record.statusHistory||[])].sort((a,b)=>a.date.localeCompare(b.date)),[record.statusHistory]);
  const statesList = record.states||[];
  const tasksList  = record.tasks||[];
  const mediaList  = record.media||[];
  const [addingResp, setAddingResp] = useState(null);
  const [newRespName, setNewRespName] = useState("");
  const [aiTopics, setAiTopics] = useState(null);
  const [aiLoading, setAiLoading] = useState(true);

  // AI Topics generation
  useEffect(() => {
    const histEntries = (history||[]).filter(h => h.scope === record.country || h.scope === "Global");
    const taskLines = tasksList.map(t => `  • [${t.taskStatus||"Not Started"}] ${t.name||"(unnamed)"} — resp: ${t.responsible||"?"}, deadline: ${t.deadline||"—"}`).join("\n");
    const histLines = (record.statusHistory||[]).slice(-5).map(h=>`  ${h.date}: ${h.fromStatus||"—"}→${h.toStatus}`).join("\n");
    const globalHist = histEntries.slice(-6).map(h=>`[${h.date}] ${h.note}`).join("\n") || "None";
    const prompt = `You are a WPF strategic advisor. Analyze this country and generate 4 discussion topics for a regional meeting.

Country: ${record.country} (${record.memberStatus})
Continent: ${record.continent||"—"}
Company: ${record.empresa||"—"}
Status history:\n${histLines||"None"}
Tasks:\n${taskLines||"None"}
Global/history notes:\n${globalHist}

Return a JSON array of 4 objects with: "title" (max 7 words), "body" (1-2 sentences), "priority" ("high"|"medium"|"low"), "tag" ("Risk"|"Opportunity"|"Follow-up"|"Action"|"Info").
Respond ONLY with the raw JSON array.`;

    setAiLoading(true);
    fetch("https://api.anthropic.com/v1/messages", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:800, messages:[{role:"user",content:prompt}] })
    })
    .then(r=>r.json())
    .then(d => {
      const text = d.content?.find(b=>b.type==="text")?.text||"[]";
      setAiTopics(JSON.parse(text.replace(/```json|```/g,"").trim()));
    })
    .catch(()=>setAiTopics([]))
    .finally(()=>setAiLoading(false));
  }, [record.id]);

  const addMedia = () => {
    const m = {id:`m${Date.now()}`, name:"", email:"", representative:""};
    onUpdate({...record, media:[...(record.media||[]), m]});
  };
  const updateMedia = (mid, field, val) => {
    onUpdate({...record, media:(record.media||[]).map(m=>m.id===mid?{...m,[field]:val}:m)});
  };
  const removeMedia = (mid) => {
    onUpdate({...record, media:(record.media||[]).filter(m=>m.id!==mid)});
  };

  const confirmNewResp = (tid) => {
    const name = newRespName.trim();
    if (!name) { setAddingResp(null); return; }
    const exists = (responsibles||[]).find(r=>r.name.toLowerCase()===name.toLowerCase());
    if (!exists) setResponsibles(p=>[...p, {id:`r${Date.now()}`, name, area:""}]);
    updateTask(tid, "responsible", name);
    setAddingResp(null);
    setNewRespName("");
  };

  const updateEntry = (id, field, val) => {
    const updated = (record.statusHistory||[]).map(h=>h.id===id?{...h,[field]:val}:h);
    onUpdate({...record, statusHistory: updated});
  };
  const addEntry = () => {
    const newH = {id:`h${Date.now()}`, date:"", fromStatus:"", toStatus:""};
    onUpdate({...record, statusHistory:[...(record.statusHistory||[]), newH]});
  };
  const removeEntry = (id) => {
    onUpdate({...record, statusHistory:(record.statusHistory||[]).filter(h=>h.id!==id)});
  };

  const addState = () => {
    const s = {id:`s${Date.now()}`, name:"", federation:"", inicio:"", fim:"", rep:"", email:"", tel:""};
    onUpdate({...record, states:[...(record.states||[]), s]});
  };
  const updateState = (sid, field, val) => {
    onUpdate({...record, states:(record.states||[]).map(s=>s.id===sid?{...s,[field]:val}:s)});
  };
  const removeState = (sid) => {
    onUpdate({...record, states:(record.states||[]).filter(s=>s.id!==sid)});
  };

  const addTask = () => {
    const t = {id:`t${Date.now()}`, name:"", responsible:"", start:"", deadline:"", taskStatus:"Not Started"};
    onUpdate({...record, tasks:[...(record.tasks||[]), t]});
  };
  const updateTask = (tid, field, val) => {
    onUpdate({...record, tasks:(record.tasks||[]).map(t=>t.id===tid?{...t,[field]:val}:t)});
  };
  const removeTask = (tid) => {
    onUpdate({...record, tasks:(record.tasks||[]).filter(t=>t.id!==tid)});
  };

  const PRIORITY_CFG = { high:{bg:"#fee2e2",color:"#dc2626"}, medium:{bg:"#fef3c7",color:"#b45309"}, low:{bg:"#f0fdf4",color:"#16a34a"} };
  const TAG_CFG = { Risk:{bg:"#fee2e2",color:"#dc2626"}, Opportunity:{bg:"#dcfce7",color:"#15803d"}, "Follow-up":{bg:"#dbeafe",color:"#1d4ed8"}, Action:{bg:"#fef3c7",color:"#b45309"}, Info:{bg:"#f3f4f6",color:"#374151"} };

  return (
    <tr>
      <td colSpan={12} style={{padding:0,background:"#f8faff",borderBottom:"2px solid #e0e7ff"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 300px",minHeight:200}}>

          {/* ── Left: all data sections ── */}
          <div style={{padding:"14px 16px 14px 48px",borderRight:"1px solid #e0e7ff"}}>

            {/* Status History */}
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <History size={13} color="#6366f1"/>
              <span style={{fontSize:11,fontWeight:700,color:"#6366f1",textTransform:"uppercase",letterSpacing:.8}}>Status History — {record.country||"(no name)"}</span>
              <span style={{fontSize:10,color:"#9ca3af",background:"#eef2ff",padding:"1px 7px",borderRadius:10}}>{hist.length} entries</span>
            </div>
            {hist.length === 0 && <div style={{fontSize:12,color:"#9ca3af",padding:"8px 0",fontStyle:"italic"}}>No status changes recorded yet.</div>}
            {hist.length > 0 && (
              <table style={{width:"100%",borderCollapse:"collapse",marginBottom:8}}>
                <thead><tr>{["Date","From Status","→  To Status",""].map(h=>(
                  <th key={h} style={{textAlign:"left",fontSize:10,color:"#9ca3af",fontWeight:600,padding:"4px 10px",borderBottom:"1px solid #e0e7ff",textTransform:"uppercase",letterSpacing:.5}}>{h}</th>
                ))}</tr></thead>
                <tbody>
                  {hist.map(h=>(
                    <tr key={h.id} style={{borderBottom:"1px solid #eef2ff"}}>
                      <td style={{padding:"5px 10px",minWidth:110}}><EditableCell value={h.date} type="date" onChange={val=>updateEntry(h.id,"date",val)}/></td>
                      <td style={{padding:"5px 10px",minWidth:130}}><EditableCell value={h.fromStatus} type="select" opts={ALL_STATUSES} onChange={val=>updateEntry(h.id,"fromStatus",val)}/></td>
                      <td style={{padding:"5px 10px",minWidth:130}}><EditableCell value={h.toStatus} type="select" opts={ALL_STATUSES.slice(1)} onChange={val=>updateEntry(h.id,"toStatus",val)}/></td>
                      <td style={{padding:"5px 6px",textAlign:"center"}}>
                        <button onClick={()=>removeEntry(h.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#e5e7eb",padding:3,borderRadius:4,display:"flex",alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.color="#ef4444"} onMouseLeave={e=>e.currentTarget.style.color="#e5e7eb"}><X size={12}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button onClick={addEntry} style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"1px dashed #a5b4fc",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,color:"#6366f1",fontWeight:600,marginBottom:20}} onMouseEnter={e=>e.currentTarget.style.background="#eef2ff"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
              <Plus size={11}/> Add status change
            </button>

            {/* National Entities (no Status, no Type columns) */}
            <div style={{borderTop:"1px solid #e0e7ff",paddingTop:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <Map size={13} color="#16a34a"/>
                <span style={{fontSize:11,fontWeight:700,color:"#16a34a",textTransform:"uppercase",letterSpacing:.8}}>🌍 National Entities</span>
                <span style={{fontSize:10,color:"#9ca3af",background:"#dcfce7",padding:"1px 7px",borderRadius:10}}>{statesList.length}</span>
              </div>
              {statesList.length === 0 && <div style={{fontSize:12,color:"#9ca3af",padding:"4px 0 10px",fontStyle:"italic"}}>No entities added yet.</div>}
              {statesList.length > 0 && (
                <table style={{width:"100%",borderCollapse:"collapse",marginBottom:8}}>
                  <thead><tr>{["Name","Federation","Entry","Exit","Rep","Email","Phone",""].map(h=>(
                    <th key={h} style={{textAlign:"left",fontSize:10,color:"#9ca3af",fontWeight:600,padding:"4px 10px",borderBottom:"1px solid #dcfce7",textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap"}}>{h}</th>
                  ))}</tr></thead>
                  <tbody>
                    {statesList.map(st=>(
                      <tr key={st.id} style={{borderBottom:"1px solid #f0fdf4"}}>
                        <td style={{padding:"4px 10px",minWidth:100}}><input value={st.name||""} onChange={e=>updateState(st.id,"name",e.target.value)} placeholder="Name" style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:12,fontWeight:600,background:"transparent",outline:"none",width:"100%"}}/></td>
                        <td style={{padding:"4px 10px",minWidth:90}}><input value={st.federation||""} onChange={e=>updateState(st.id,"federation",e.target.value)} placeholder="Federation" style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:12,color:"#16a34a",fontWeight:600,background:"transparent",outline:"none",width:"100%"}}/></td>
                        <td style={{padding:"4px 10px",minWidth:110}}><EditableCell value={st.inicio} type="date" onChange={val=>updateState(st.id,"inicio",val)}/></td>
                        <td style={{padding:"4px 10px",minWidth:110}}><EditableCell value={st.fim} type="date" onChange={val=>updateState(st.id,"fim",val)}/></td>
                        <td style={{padding:"4px 10px",minWidth:120}}><input value={st.rep||""} onChange={e=>updateState(st.id,"rep",e.target.value)} placeholder="Rep." style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:12,background:"transparent",outline:"none",width:"100%"}}/></td>
                        <td style={{padding:"4px 10px",minWidth:140}}><input value={st.email||""} onChange={e=>updateState(st.id,"email",e.target.value)} placeholder="Email" style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:12,background:"transparent",outline:"none",width:"100%"}}/></td>
                        <td style={{padding:"4px 10px",minWidth:110}}><input value={st.tel||""} onChange={e=>updateState(st.id,"tel",e.target.value)} placeholder="Phone" style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:12,background:"transparent",outline:"none",width:"100%"}}/></td>
                        <td style={{padding:"4px 6px"}}><button onClick={()=>removeState(st.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#e5e7eb",padding:3,borderRadius:4,display:"flex",alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.color="#ef4444"} onMouseLeave={e=>e.currentTarget.style.color="#e5e7eb"}><X size={12}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <button onClick={addState} style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"1px dashed #86efac",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,color:"#16a34a",fontWeight:600}} onMouseEnter={e=>e.currentTarget.style.background="#dcfce7"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                <Plus size={11}/> Add entity
              </button>
            </div>

            {/* Media */}
            <div style={{borderTop:"1px solid #e0e7ff",paddingTop:14,marginTop:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                
                <span style={{fontSize:11,fontWeight:700,color:"#7c3aed",textTransform:"uppercase",letterSpacing:.8}}>📡 Media</span>
                <span style={{fontSize:10,color:"#9ca3af",background:"#f5f3ff",padding:"1px 7px",borderRadius:10}}>{mediaList.length}</span>
              </div>
              {mediaList.length === 0 && <div style={{fontSize:12,color:"#9ca3af",padding:"4px 0 10px",fontStyle:"italic"}}>No media contacts added yet.</div>}
              {mediaList.length > 0 && (
                <table style={{width:"100%",borderCollapse:"collapse",marginBottom:8}}>
                  <thead><tr>{["Name","Email","Representative",""].map(h=>(
                    <th key={h} style={{textAlign:"left",fontSize:10,color:"#9ca3af",fontWeight:600,padding:"4px 10px",borderBottom:"1px solid #ede9f8",textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap"}}>{h}</th>
                  ))}</tr></thead>
                  <tbody>
                    {mediaList.map(m=>(
                      <tr key={m.id} style={{borderBottom:"1px solid #f5f3ff"}}>
                        <td style={{padding:"4px 10px",minWidth:120}}><input value={m.name||""} onChange={e=>updateMedia(m.id,"name",e.target.value)} placeholder="Media name" style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:12,fontWeight:600,background:"transparent",outline:"none",width:"100%"}}/></td>
                        <td style={{padding:"4px 10px",minWidth:150}}><input value={m.email||""} onChange={e=>updateMedia(m.id,"email",e.target.value)} placeholder="email@media.com" style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:12,background:"transparent",outline:"none",width:"100%",color:"#7c3aed"}}/></td>
                        <td style={{padding:"4px 10px",minWidth:130}}><input value={m.representative||""} onChange={e=>updateMedia(m.id,"representative",e.target.value)} placeholder="Contact person" style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:12,background:"transparent",outline:"none",width:"100%"}}/></td>
                        <td style={{padding:"4px 6px"}}><button onClick={()=>removeMedia(m.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#e5e7eb",padding:3,borderRadius:4,display:"flex",alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.color="#ef4444"} onMouseLeave={e=>e.currentTarget.style.color="#e5e7eb"}><X size={12}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <button onClick={addMedia} style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"1px dashed #c4b5fd",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,color:"#7c3aed",fontWeight:600}} onMouseEnter={e=>e.currentTarget.style.background="#f5f3ff"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                <Plus size={11}/> Add media
              </button>
            </div>

            {/* Tasks */}
            <div style={{borderTop:"1px solid #e0e7ff",paddingTop:14,marginTop:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <Target size={13} color="#f59e0b"/>
                <span style={{fontSize:11,fontWeight:700,color:"#b45309",textTransform:"uppercase",letterSpacing:.8}}>✅ Tasks</span>
                <span style={{fontSize:10,color:"#9ca3af",background:"#fef3c7",padding:"1px 7px",borderRadius:10}}>{tasksList.length}</span>
                {tasksList.filter(t=>t.taskStatus!=="Done"&&t.deadline&&new Date(t.deadline)<new Date()).length>0&&(
                  <span style={{fontSize:10,color:"#dc2626",background:"#fee2e2",padding:"1px 7px",borderRadius:10,fontWeight:700}}>
                    🔴 {tasksList.filter(t=>t.taskStatus!=="Done"&&t.deadline&&new Date(t.deadline)<new Date()).length} overdue
                  </span>
                )}
              </div>
              {tasksList.length===0&&<div style={{fontSize:12,color:"#9ca3af",padding:"4px 0 10px",fontStyle:"italic"}}>No tasks added yet.</div>}
              {tasksList.length>0&&(
                <table style={{width:"100%",borderCollapse:"collapse",marginBottom:8}}>
                  <thead><tr>{["Task Name","Responsible","Start","Deadline","Status",""].map(h=>(
                    <th key={h} style={{textAlign:"left",fontSize:10,color:"#9ca3af",fontWeight:600,padding:"4px 10px",borderBottom:"1px solid #fef3c7",textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap"}}>{h}</th>
                  ))}</tr></thead>
                  <tbody>
                    {tasksList.map(t=>{
                      const overdue = t.taskStatus!=="Done" && t.deadline && new Date(t.deadline)<new Date();
                      return(
                      <tr key={t.id} style={{borderBottom:"1px solid #fffbeb",background:overdue?"#fff7f7":"transparent"}}>
                        <td style={{padding:"4px 10px",minWidth:140}}><input value={t.name||""} onChange={e=>updateTask(t.id,"name",e.target.value)} placeholder="Task name" style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:12,fontWeight:600,background:"transparent",outline:"none",width:"100%"}}/></td>
                        <td style={{padding:"4px 10px",minWidth:140}}>
                          {addingResp===t.id ? (
                            <div style={{display:"flex",gap:4,alignItems:"center"}}>
                              <input autoFocus value={newRespName} onChange={e=>setNewRespName(e.target.value)}
                                onKeyDown={e=>{if(e.key==="Enter")confirmNewResp(t.id);if(e.key==="Escape"){setAddingResp(null);setNewRespName("");}}}
                                placeholder="Name..." style={{border:"1px solid #60a5fa",borderRadius:6,padding:"2px 6px",fontSize:12,width:"100%",boxSizing:"border-box"}}/>
                              <button onClick={()=>confirmNewResp(t.id)} style={{background:"#1a1a1a",color:"#fff",border:"none",borderRadius:5,padding:"2px 7px",cursor:"pointer",fontSize:11,fontWeight:700,flexShrink:0}}>✓</button>
                              <button onClick={()=>{setAddingResp(null);setNewRespName("");}} style={{background:"none",border:"1px solid #e5e7eb",borderRadius:5,padding:"2px 6px",cursor:"pointer",fontSize:11,color:"#9ca3af",flexShrink:0}}>✕</button>
                            </div>
                          ) : (
                            <select value={t.responsible||""} onChange={e=>{
                              if(e.target.value==="__new__"){setAddingResp(t.id);setNewRespName("");}
                              else updateTask(t.id,"responsible",e.target.value);
                            }} style={{border:"1px solid #e5e7eb",borderRadius:6,padding:"2px 6px",fontSize:12,background:"#fff",cursor:"pointer",width:"100%",color:t.responsible?"#374151":"#9ca3af",fontWeight:t.responsible?500:400}}>
                              <option value="">— Select —</option>
                              {(responsibles||[]).map(r=>(<option key={r.id} value={r.name}>{r.name}</option>))}
                              <option value="__new__">＋ Add new person...</option>
                            </select>
                          )}
                        </td>
                        <td style={{padding:"4px 10px",minWidth:110}}><EditableCell value={t.start} type="date" onChange={val=>updateTask(t.id,"start",val)}/></td>
                        <td style={{padding:"4px 10px",minWidth:110}}>
                          <div style={{display:"flex",alignItems:"center",gap:4}}>
                            {overdue&&<span title="Overdue">🔴</span>}
                            <EditableCell value={t.deadline} type="date" onChange={val=>updateTask(t.id,"deadline",val)}/>
                          </div>
                        </td>
                        <td style={{padding:"4px 10px",minWidth:120}}>
                          <select value={t.taskStatus||"Not Started"} onChange={e=>updateTask(t.id,"taskStatus",e.target.value)}
                            style={{border:"1px solid #e5e7eb",borderRadius:6,padding:"2px 5px",fontSize:11,background:TASK_STATUS_CFG[t.taskStatus||"Not Started"]?.bg,color:TASK_STATUS_CFG[t.taskStatus||"Not Started"]?.color,fontWeight:600,cursor:"pointer"}}>
                            {TASK_STATUS.map(o=><option key={o} value={o}>{o}</option>)}
                          </select>
                        </td>
                        <td style={{padding:"4px 6px"}}><button onClick={()=>removeTask(t.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#e5e7eb",padding:3,borderRadius:4,display:"flex",alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.color="#ef4444"} onMouseLeave={e=>e.currentTarget.style.color="#e5e7eb"}><X size={12}/></button></td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              )}
              <button onClick={addTask} style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"1px dashed #fcd34d",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,color:"#b45309",fontWeight:600}} onMouseEnter={e=>e.currentTarget.style.background="#fef3c7"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                <Plus size={11}/> Add task
              </button>
            </div>
          </div>

          {/* ── Right: AI Discussion Topics ── */}
          <div style={{display:"flex",flexDirection:"column",background:"#fafbff",overflow:"hidden"}}>
            <div style={{padding:"12px 14px",borderBottom:"1px solid #e0e7ff",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              <div style={{width:22,height:22,borderRadius:6,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Sparkles size={11} color="#fff"/>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:"#1a1a1a"}}>AI Discussion Topics</div>
                <div style={{fontSize:9,color:"#9ca3af"}}>{record.country}</div>
              </div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"10px 12px"}}>
              {aiLoading ? (
                <div style={{display:"flex",flexDirection:"column",gap:8,paddingTop:4}}>
                  {[1,2,3,4].map(i=>(
                    <div key={i} style={{background:"#f0f0f8",borderRadius:8,padding:"10px 12px"}}>
                      <div style={{width:`${55+i*10}%`,height:8,background:"#e0e7ff",borderRadius:4,marginBottom:6}}/>
                      <div style={{width:"85%",height:6,background:"#e0e7ff",borderRadius:4}}/>
                    </div>
                  ))}
                  <p style={{textAlign:"center",fontSize:10,color:"#9ca3af",marginTop:2}}>Analisando…</p>
                </div>
              ) : !aiTopics || aiTopics.length===0 ? (
                <div style={{padding:"20px 8px",textAlign:"center",color:"#9ca3af",fontSize:12}}>
                  <Sparkles size={22} style={{opacity:.2,marginBottom:8,display:"block",margin:"0 auto 8px"}}/>
                  Adicione dados ou histórico para gerar tópicos.
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {aiTopics.map((t,i)=>{
                    const pCfg = PRIORITY_CFG[t.priority]||PRIORITY_CFG.medium;
                    const tCfg = TAG_CFG[t.tag]||TAG_CFG.Info;
                    return (
                      <div key={i} style={{background:"#fff",borderRadius:8,padding:"10px 12px",border:"1px solid #e0e7ff"}}>
                        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:6,marginBottom:4}}>
                          <span style={{fontSize:11,fontWeight:700,color:"#1a1a1a",lineHeight:1.3}}>{t.title}</span>
                          <div style={{display:"flex",gap:3,flexShrink:0}}>
                            <span style={{fontSize:8,fontWeight:700,padding:"2px 5px",borderRadius:8,background:tCfg.bg,color:tCfg.color}}>{t.tag}</span>
                            <span style={{fontSize:8,fontWeight:700,padding:"2px 5px",borderRadius:8,background:pCfg.bg,color:pCfg.color,textTransform:"uppercase"}}>{t.priority}</span>
                          </div>
                        </div>
                        <p style={{margin:0,fontSize:10,color:"#6b7280",lineHeight:1.5}}>{t.body}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── Continent Zoom Modal ───────────────────────────────────────
function ContinentModal({ continent, countries, history, onClose }) {
  const svgRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [features, setFeatures] = useState(null);
  const [topology, setTopology] = useState(null);
  const [aiTopics, setAiTopics] = useState(null);
  const [aiLoading, setAiLoading] = useState(true);
  const style = CONTINENT_STYLE[continent] || { stroke:"#818cf8", fill:"rgba(129,140,248,0.12)" };

  useEffect(() => {
    loadWorldFeatures((feats, topo) => { setFeatures(feats); setTopology(topo); setReady(true); });
  }, []);

  // Build AI context and call API
  useEffect(() => {
    const contCountries = countries.filter(c => COUNTRY_CONTINENT[c.country] === continent);
    const historyEntries = (history||[]).filter(h => !h.scope || h.scope === continent || contCountries.some(c => c.country === h.scope));

    const countryLines = contCountries.map(c => {
      const tasks = (c.tasks||[]).map(t => `    • [${t.taskStatus||"Not Started"}] ${t.name||"(unnamed)"} — resp: ${t.responsible||"?"}, deadline: ${t.deadline||"—"}`).join("\n");
      const hist  = (c.statusHistory||[]).slice(-3).map(h => `    ${h.date}: ${h.fromStatus||"—"} → ${h.toStatus}`).join("\n");
      return `${c.country} (${c.memberStatus})\n${hist ? `  Status history:\n${hist}` : ""}\n${tasks ? `  Tasks:\n${tasks}` : ""}`;
    }).join("\n\n");

    const histLines = historyEntries.slice(-10).map(h => `[${h.date}] ${h.scope||continent}: ${h.note}`).join("\n") || "No history entries yet.";

    const prompt = `You are a strategic advisor for the World Poker Federation (WPF). Analyze the following data about ${continent} and generate 4–6 concise discussion topics for the next regional meeting.

## Countries in ${continent}:
${countryLines || "No tracked countries yet."}

## Recent history notes:
${histLines}

Return a JSON array of objects. Each object must have:
- "title": short topic title (max 8 words)
- "body": 1–2 sentence explanation with specific countries/data
- "priority": "high" | "medium" | "low"
- "tag": one of "Risk" | "Opportunity" | "Follow-up" | "Action" | "Info"

Respond ONLY with the raw JSON array. No markdown, no explanation.`;

    setAiLoading(true);
    fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        model:"claude-sonnet-4-20250514",
        max_tokens:1000,
        messages:[{role:"user", content:prompt}]
      })
    })
    .then(r=>r.json())
    .then(d => {
      const text = d.content?.find(b=>b.type==="text")?.text || "[]";
      const clean = text.replace(/```json|```/g,"").trim();
      setAiTopics(JSON.parse(clean));
    })
    .catch(()=>setAiTopics([]))
    .finally(()=>setAiLoading(false));
  }, [continent, countries, history]);

  useEffect(() => {
    if (!ready || !features || !topology || !svgRef.current) return;
    const el = svgRef.current;
    const W = el.parentElement?.clientWidth || 460;
    const H = Math.round(W * 0.65);
    el.setAttribute("width", W); el.setAttribute("height", H);
    el.setAttribute("viewBox", `0 0 ${W} ${H}`);
    while (el.firstChild) el.removeChild(el.firstChild);

    const ns = "http://www.w3.org/2000/svg";
    const byIso = {};
    countries.forEach(c => { if (c.country && ISO_MAP[c.country]) byIso[ISO_MAP[c.country]] = c; });

    const contGeoms = topology.objects.countries.geometries.filter(g => ISO_TO_CONTINENT[+g.id] === continent);
    let contMerged = null;
    try { contMerged = window.topojson.merge(topology, contGeoms); } catch(e){}

    const proj = d3.geoNaturalEarth1();
    if (contMerged) {
      proj.fitExtent([[20, 20], [W-20, H-20]], contMerged);
    } else {
      proj.fitSize([W, H], { type:"Sphere" });
    }
    const path = d3.geoPath().projection(proj);

    const bg = document.createElementNS(ns,"rect");
    bg.setAttribute("width",W); bg.setAttribute("height",H);
    bg.setAttribute("fill","#e8ecf0"); bg.setAttribute("rx","10");
    el.appendChild(bg);

    features.forEach(f => {
      const isCont = ISO_TO_CONTINENT[+f.id] === continent;
      const c = byIso[+f.id];
      const d = path(f); if (!d) return;
      const p = document.createElementNS(ns,"path");
      p.setAttribute("d", d);
      if (isCont) {
        p.setAttribute("fill", c ? (STATUS_CFG[c.memberStatus]?.dot || "#6b7280") : "#8c95a0");
        p.setAttribute("stroke", "#fff");
        p.setAttribute("stroke-width","0.8");
        p.setAttribute("filter","drop-shadow(0 1px 2px rgba(0,0,0,0.18))");
      } else {
        p.setAttribute("fill","#cdd5dc");
        p.setAttribute("stroke","#bec7cf");
        p.setAttribute("stroke-width","0.25");
        p.setAttribute("opacity","0.45");
      }
      el.appendChild(p);
    });

    countries.filter(c => c.country && COUNTRY_CONTINENT[c.country] === continent && ISO_MAP[c.country]).forEach(c => {
      const feat = features.find(f => +f.id === ISO_MAP[c.country]); if (!feat) return;
      const cen = path.centroid(feat); if (!cen || isNaN(cen[0])) return;
      const lbl = document.createElementNS(ns,"text");
      lbl.setAttribute("x", cen[0]); lbl.setAttribute("y", cen[1]+3);
      lbl.setAttribute("text-anchor","middle"); lbl.setAttribute("font-size","9");
      lbl.setAttribute("font-weight","700"); lbl.setAttribute("fill","#fff");
      lbl.setAttribute("pointer-events","none");
      lbl.style.textShadow = "0 1px 3px rgba(0,0,0,0.6)";
      lbl.textContent = c.country.length > 10 ? c.country.slice(0,9)+"…" : c.country;
      el.appendChild(lbl);
    });
  }, [ready, features, topology, continent, countries]);

  const contCountries = countries.filter(c => COUNTRY_CONTINENT[c.country] === continent);
  const members = contCountries.filter(c => c.memberStatus === "Member").length;
  const statCounts = Object.keys(STATUS_CFG).map(s => ({
    s, count: contCountries.filter(c => c.memberStatus === s).length, ...STATUS_CFG[s]
  })).filter(x => x.count > 0);

  const PRIORITY_CFG = {
    high:   { bg:"#fee2e2", color:"#dc2626" },
    medium: { bg:"#fef3c7", color:"#b45309" },
    low:    { bg:"#f0fdf4", color:"#16a34a" },
  };
  const TAG_CFG = {
    Risk:        { bg:"#fee2e2", color:"#dc2626" },
    Opportunity: { bg:"#dcfce7", color:"#15803d" },
    "Follow-up": { bg:"#dbeafe", color:"#1d4ed8" },
    Action:      { bg:"#fef3c7", color:"#b45309" },
    Info:        { bg:"#f3f4f6", color:"#374151" },
  };

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1200,padding:16}}>
      <div style={{background:"#fff",borderRadius:18,width:1160,maxWidth:"100%",maxHeight:"92vh",display:"flex",flexDirection:"column",boxShadow:"0 32px 80px rgba(0,0,0,0.22)",overflow:"hidden"}}>

        {/* Header */}
        <div style={{padding:"16px 24px",borderBottom:"1px solid #f3f4f6",display:"flex",alignItems:"center",gap:14,flexShrink:0}}>
          <div style={{width:13,height:13,borderRadius:"50%",background:style.stroke,flexShrink:0}}/>
          <div style={{flex:1}}>
            <h2 style={{margin:0,fontSize:17,fontWeight:700,fontFamily:"'Inter',system-ui,sans-serif"}}>{continent}</h2>
            <p style={{margin:"2px 0 0",fontSize:11,color:"#9ca3af"}}>{contCountries.length} tracked · {members} members</p>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
            {statCounts.map(({s,count,color,bg,dot})=>(
              <span key={s} style={{display:"inline-flex",alignItems:"center",gap:4,background:bg,color,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700}}>
                <span style={{width:5,height:5,borderRadius:"50%",background:dot,flexShrink:0}}/>{s}: {count}
              </span>
            ))}
          </div>
          <button onClick={onClose} style={{background:"none",border:"1px solid #e5e7eb",borderRadius:"50%",width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#6b7280",flexShrink:0,marginLeft:8}}><X size={13}/></button>
        </div>

        {/* Body — map left, AI topics right */}
        <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 380px",overflow:"hidden"}}>

          {/* Map */}
          <div style={{padding:"16px 12px 16px 20px",background:"#f7f6f3",overflow:"hidden",display:"flex",alignItems:"center"}}>
            {!ready && <div style={{width:"100%",height:320,display:"flex",alignItems:"center",justifyContent:"center",color:"#9ca3af",fontSize:13}}>Carregando…</div>}
            <svg ref={svgRef} style={{width:"100%",display:ready?"block":"none",borderRadius:10,boxShadow:"0 2px 12px rgba(0,0,0,0.08)"}}/>
          </div>

          {/* AI Discussion Topics */}
          <div style={{borderLeft:"1px solid #f3f4f6",display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"14px 18px",borderBottom:"1px solid #f3f4f6",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              <div style={{width:26,height:26,borderRadius:8,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Sparkles size={13} color="#fff"/>
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:"#1a1a1a"}}>Discussion Topics</div>
                <div style={{fontSize:10,color:"#9ca3af"}}>Generated from regional data & history</div>
              </div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
              {aiLoading ? (
                <div style={{display:"flex",flexDirection:"column",gap:10,paddingTop:8}}>
                  {[1,2,3,4].map(i=>(
                    <div key={i} style={{background:"#f3f4f6",borderRadius:10,padding:"12px 14px",animation:"pulse 1.5s infinite"}}>
                      <div style={{width:`${60+i*8}%`,height:10,background:"#e5e7eb",borderRadius:4,marginBottom:8}}/>
                      <div style={{width:"90%",height:8,background:"#e5e7eb",borderRadius:4,marginBottom:4}}/>
                      <div style={{width:"70%",height:8,background:"#e5e7eb",borderRadius:4}}/>
                    </div>
                  ))}
                  <p style={{textAlign:"center",fontSize:11,color:"#9ca3af",marginTop:4}}>Analisando dados regionais…</p>
                </div>
              ) : !aiTopics || aiTopics.length === 0 ? (
                <div style={{padding:"32px 16px",textAlign:"center",color:"#9ca3af",fontSize:13}}>
                  <Sparkles size={28} style={{marginBottom:8,opacity:.3}}/>
                  <p style={{margin:0}}>Não foi possível gerar tópicos. Adicione histórico ou dados para esta região.</p>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {aiTopics.map((t,i)=>{
                    const pCfg = PRIORITY_CFG[t.priority] || PRIORITY_CFG.medium;
                    const tCfg = TAG_CFG[t.tag] || TAG_CFG.Info;
                    return (
                      <div key={i} style={{background:"#fafafa",borderRadius:10,padding:"12px 14px",border:"1px solid #f0f0f0"}}>
                        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:6}}>
                          <span style={{fontSize:12,fontWeight:700,color:"#1a1a1a",lineHeight:1.3}}>{t.title}</span>
                          <div style={{display:"flex",gap:4,flexShrink:0}}>
                            <span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:10,background:tCfg.bg,color:tCfg.color}}>{t.tag}</span>
                            <span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:10,background:pCfg.bg,color:pCfg.color,textTransform:"uppercase"}}>{t.priority}</span>
                          </div>
                        </div>
                        <p style={{margin:0,fontSize:11,color:"#6b7280",lineHeight:1.5}}>{t.body}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Tab ──────────────────────────────────────────────
function DashboardTab({ data, setData, goals = {}, responsibles = [], history = [] }) {
  const [kpiModal,   setKpiModal]   = useState(null);
  const [chartModal, setChartModal] = useState(null);
  const [stairModal, setStairModal] = useState(null);
  const [editModal,  setEditModal]  = useState(null);
  const [showTrophies, setShowTrophies] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [continentModal, setContinentModal] = useState(null);
  const [expandedCountry, setExpandedCountry] = useState(null);

  const named   = useMemo(()=>data.filter(c=>c.country),[data]);
  const chartData = useMemo(()=>buildChartData(data),[data]);

  const kpis = useMemo(()=>({
    total:    {val:named.length,rows:named},
    active:        {val:named.filter(c=>c.memberStatus==="Member").length,rows:named.filter(c=>c.memberStatus==="Member")},
    documentation: {val:named.filter(c=>c.memberStatus==="Documentation").length,rows:named.filter(c=>c.memberStatus==="Documentation")},
    expiring: {val:named.filter(c=>calcVig(c.inicio,c.fim).status==="Expiring").length,rows:named.filter(c=>calcVig(c.inicio,c.fim).status==="Expiring")},
    expired:  {val:named.filter(c=>calcVig(c.inicio,c.fim).status==="Expired").length,rows:named.filter(c=>calcVig(c.inicio,c.fim).status==="Expired")},
  }),[named]);

  const save=(updated)=>setData(p=>p.map(c=>c.id===updated.id?{
    ...updated,
    quarter: updated.inicio ? quarterFromDate(updated.inicio) : updated.quarter
  }:c));
  const addRow=()=>{
    const id=Date.now();
    const novo={id,country:"",continent:"",empresa:"",memberStatus:"Needed",quarter:"",inicio:"",fim:"",rep:"",email:"",tel:"",tournament:"",states:[],tasks:[],statusHistory:[]};
    setData(p=>[...p,novo]); setEditModal(novo);
  };

  const KPI_DEFS=[
    {key:"active",        icon:<Users size={20} color="#22c55e"/>,         label:"Active Members",       iconBg:"#dcfce7"},
    {key:"documentation", icon:<Database size={20} color="#3b82f6"/>,       label:"Documentation",        iconBg:"#dbeafe"},
    {key:"expiring", icon:<AlertTriangle size={20} color="#f59e0b"/>, label:"Expiring Memberships", iconBg:"#fef3c7"},
    {key:"expired",  icon:<XCircle size={20} color="#ef4444"/>,       label:"Expired Memberships",  iconBg:"#fee2e2"},
  ];
  const vigDot={"Active":"#22c55e","Expiring":"#f59e0b","Expired":"#ef4444"};

  if(expandedCountry) {
    const liveCountry = data.find(c=>c.id===expandedCountry.id)||expandedCountry;
    return <CountryStateMap country={liveCountry} states={liveCountry.states||[]} onBack={()=>setExpandedCountry(null)} onSaveStates={newStates=>setData(p=>p.map(c=>c.id===liveCountry.id?{...c,states:newStates}:c))}/>;
  }

  return (
    <div style={{maxWidth:1160,margin:"0 auto",padding:"32px 20px",background:"#f7f6f3"}}>
      <div style={{marginBottom:26}}>
        <h1 style={{fontSize:28,fontWeight:700,margin:"0 0 3px",fontFamily:"'Inter',system-ui,sans-serif"}}>Federations</h1>
        <p style={{fontSize:12,color:"#9ca3af",margin:0,textTransform:"uppercase",letterSpacing:"1.5px",fontWeight:500}}>World Poker Federation · Member tracking</p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        {KPI_DEFS.map(({key,icon,label,iconBg})=>(
          <button key={key} onClick={()=>setKpiModal({title:label,rows:kpis[key].rows,subtitle:`${kpis[key].val} countries`})}
            style={{background:"#fff",borderRadius:12,padding:"18px 20px",boxShadow:"0 1px 4px rgba(0,0,0,0.07)",display:"flex",alignItems:"center",gap:14,cursor:"pointer",border:"1.5px solid transparent",textAlign:"left",transition:"all 0.15s",width:"100%"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#e0e7ff";e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.10)";e.currentTarget.style.transform="translateY(-1px)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="transparent";e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.07)";e.currentTarget.style.transform="translateY(0)";}}>
            <div style={{padding:10,background:iconBg,borderRadius:10,flexShrink:0}}>{icon}</div>
            <div>
              <div style={{fontSize:30,fontWeight:600,lineHeight:1,color:"#1a1a1a",fontFamily:"'Inter',system-ui,sans-serif"}}>{kpis[key].val}</div>
              <div style={{fontSize:11,color:"#9ca3af",marginTop:3,fontWeight:500}}>{label}</div>
            </div>
          </button>
        ))}
      </div>

      <StaircaseBlock data={data} onStepClick={setStairModal} goals={goals}/>

      <div style={{background:"#fff",borderRadius:12,padding:22,marginBottom:18,boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <h2 style={{fontSize:14,fontWeight:700,margin:0,letterSpacing:1,textTransform:"uppercase"}}>Map</h2>
          <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
            {Object.entries(STATUS_CFG).map(([s,c])=>(
              <span key={s} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#6b7280"}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:c.dot,flexShrink:0}}/>{s}
              </span>
            ))}
            <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:11,color:showTrophies?"#1a1a1a":"#9ca3af",padding:"4px 10px",borderRadius:20,border:"1px solid",borderColor:showTrophies?"#d4af37":"#e5e7eb",background:showTrophies?"#fffbeb":"#fafafa",transition:"all .2s",userSelect:"none"}}>
              <input type="checkbox" checked={showTrophies} onChange={e=>setShowTrophies(e.target.checked)} style={{accentColor:"#d4af37",width:13,height:13,cursor:"pointer"}}/>
              Tournaments
            </label>
            <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:11,color:showTasks?"#1a1a1a":"#9ca3af",padding:"4px 10px",borderRadius:20,border:"1px solid",borderColor:showTasks?"#f59e0b":"#e5e7eb",background:showTasks?"#fff7ed":"#fafafa",transition:"all .2s",userSelect:"none"}}>
              <input type="checkbox" checked={showTasks} onChange={e=>setShowTasks(e.target.checked)} style={{accentColor:"#f59e0b",width:13,height:13,cursor:"pointer"}}/>
              Tasks
            </label>
          </div>
        </div>
        <p style={{fontSize:11,color:"#9ca3af",margin:"0 0 10px",display:"flex",alignItems:"center",gap:4}}>
          <span style={{fontSize:13}}>👆</span> Clique em uma região do mapa para ver o continente em detalhe
        </p>
        <WorldMap countries={named} onCountryClick={setEditModal} showTrophies={showTrophies} showTasks={showTasks} responsibles={responsibles} onContinentClick={setContinentModal}/>
      </div>

      <div style={{background:"#fff",borderRadius:12,padding:22,marginBottom:18,boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
        <div style={{marginBottom:14}}>
          <h2 style={{fontSize:14,fontWeight:700,margin:"0 0 2px",letterSpacing:1,textTransform:"uppercase"}}>Progression</h2>
          <p style={{fontSize:11,color:"#9ca3af",margin:0}}>Derived from status history · Click a month to see records</p>
        </div>
        {chartData.length===0
          ?<div style={{textAlign:"center",padding:"40px 0",color:"#9ca3af",fontSize:13}}>No status history data yet</div>
          :<ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData} margin={{top:5,right:10,left:-24,bottom:0}}
              onClick={d=>{if(d?.activeLabel) setChartModal({title:`Records — ${d.activeLabel}`,rows:named,subtitle:"All current records"});}}
              style={{cursor:"pointer"}}>
              <defs>
                {[["m","#22c55e"],["doc","#60a5fa"],["n","#f59e0b"],["nd","#ef4444"]].map(([id,c])=>(
                  <linearGradient key={id} id={`cg${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={c} stopOpacity={0.8}/><stop offset="95%" stopColor={c} stopOpacity={0.4}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="m" tick={{fontSize:11,fill:"#9ca3af"}}/>
              <YAxis tick={{fontSize:11,fill:"#9ca3af"}}/>
              <Tooltip contentStyle={{borderRadius:8,border:"1px solid #e5e7eb",fontSize:12}}/>
              <Legend wrapperStyle={{fontSize:11,paddingTop:10}}/>
              <Area type="monotone" dataKey="Member"        stackId="1" stroke="#22c55e" fill="url(#cgm)"   strokeWidth={2}/>
              <Area type="monotone" dataKey="Documentation" stackId="1" stroke="#60a5fa" fill="url(#cgdoc)" strokeWidth={2}/>
              <Area type="monotone" dataKey="Negotiating"   stackId="1" stroke="#f59e0b" fill="url(#cgn)"   strokeWidth={2}/>
              <Area type="monotone" dataKey="Needed"        stackId="1" stroke="#ef4444" fill="url(#cgnd)"  strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        }
      </div>

      {kpiModal   &&<RecordsModal {...kpiModal}   onClose={()=>setKpiModal(null)}   onEdit={r=>{setKpiModal(null);  setEditModal(r);}}/>}
      {stairModal &&<RecordsModal {...stairModal} onClose={()=>setStairModal(null)} onEdit={r=>{setStairModal(null);setEditModal(r);}}/>}
      {chartModal &&<RecordsModal {...chartModal} onClose={()=>setChartModal(null)} onEdit={r=>{setChartModal(null);setEditModal(r);}}/>}
      {editModal  &&<EditModal row={editModal} onClose={()=>setEditModal(null)} onSave={r=>{save(r);}} onExpandCountry={r=>{const saved={...r,quarter:r.inicio?quarterFromDate(r.inicio):r.quarter};setData(p=>p.map(c=>c.id===saved.id?saved:c));setExpandedCountry(saved);}}/>}
      {continentModal && <ContinentModal continent={continentModal} countries={named} history={history} onClose={()=>setContinentModal(null)}/>}
    </div>
  );
}

// ── Data Tab ───────────────────────────────────────────────────
function DataTab({ data, setData, responsibles, setResponsibles, history = [], goals = {}, setGoals }) {
  const [sfilt,  setSfilt]   = useState("All Status");
  const [cfilt,  setCfilt]   = useState("All Continents");
  const [search, setSearch]  = useState("");
  const [expanded, setExpanded] = useState(new Set());
  const [editModal, setEditModal] = useState(null);

  const filtered = useMemo(()=>data.filter(r=>{
    if(sfilt!=="All Status"&&r.memberStatus!==sfilt) return false;
    if(cfilt!=="All Continents"&&r.continent!==cfilt) return false;
    if(search){const q=search.toLowerCase();return [r.country,r.empresa,r.rep,r.email,r.continent,r.quarter].some(v=>v?.toLowerCase().includes(q));}
    return true;
  }),[data,sfilt,cfilt,search]);

  const save = (updated) => setData(p=>p.map(c=>c.id===updated.id?{
    ...updated,
    quarter: updated.inicio ? quarterFromDate(updated.inicio) : updated.quarter
  }:c));
  const del  = (id)      => setData(p=>p.filter(c=>c.id!==id));

  const toggleExpand = (id) => setExpanded(prev=>{
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const addRow = () => {
    const id=Date.now();
    const novo={id,country:"",continent:"",empresa:"",memberStatus:"Needed",quarter:"",inicio:"",fim:"",rep:"",email:"",tel:"",tournament:"",states:[],tasks:[],statusHistory:[]};
    setData(p=>[...p,novo]); setEditModal(novo);
  };

  // Fill Down: apply a value to all visible rows below a given row index
  const fillDown = (fromRowId, colKey, value) => {
    const visibleIds = filtered.map(r => r.id);
    const fromIdx = visibleIds.indexOf(fromRowId);
    if (fromIdx === -1) return;
    const toFill = visibleIds.slice(fromIdx + 1);
    setData(p => p.map(r => {
      if (!toFill.includes(r.id)) return r;
      const updated = {...r, [colKey]: value};
      if (colKey === "inicio") updated.quarter = quarterFromDate(value);
      return updated;
    }));
  };

  // Fill Selected: apply value to all currently selected rows
  const [selectedRows, setSelectedRows] = useState(new Set());
  const toggleSelect = (id) => setSelectedRows(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const selectAll = () => setSelectedRows(
    selectedRows.size === filtered.length ? new Set() : new Set(filtered.map(r=>r.id))
  );
  const fillSelected = (colKey, value) => {
    if (selectedRows.size === 0) return;
    setData(p => p.map(r => {
      if (!selectedRows.has(r.id)) return r;
      const updated = {...r, [colKey]: value};
      if (colKey === "inicio") updated.quarter = quarterFromDate(value);
      return updated;
    }));
  };

  const [bulkField, setBulkField] = useState("memberStatus");
  const [bulkValue, setBulkValue] = useState("");

  const [pasteModal, setPasteModal] = useState(false);
  const [pasteText,  setPasteText]  = useState("");
  const [pastePreview, setPastePreview] = useState([]);

  const parsePaste = (text) => {
    const lines = text.trim().split(/\r?\n/).filter(l=>l.trim());
    if (!lines.length) return [];
    // Detect if first row is a header (contains non-numeric, non-date text in country-like position)
    const rows = lines.map(line => line.split(/	/));
    // Map columns by position: Country, Continent, Company, Status, Quarter, Start, End, Rep, Email, Phone, Tournament
    const colKeys = ["country","continent","empresa","memberStatus","quarter","inicio","fim","rep","email","tel","tournament"];
    const VALID_STATUSES = ["Member","Negotiating","Documentation","Needed","Expired"];
    return rows.map(cells => {
      const obj = {id:Date.now()+Math.random(), states:[], tasks:[], statusHistory:[]};
      colKeys.forEach((k,i) => { if (cells[i] !== undefined) obj[k] = cells[i].trim(); });
      if (!VALID_STATUSES.includes(obj.memberStatus)) obj.memberStatus = "Needed";
      if (obj.inicio) obj.quarter = quarterFromDate(obj.inicio);
      return obj;
    }).filter(r => r.country);
  };

  const handlePasteImport = () => {
    const rows = parsePaste(pasteText);
    if (!rows.length) return;
    setData(p => [...p, ...rows]);
    setPasteModal(false);
    setPasteText("");
    setPastePreview([]);
  };

  const COLS=[
    {key:"country",      label:"Country",   w:120},
    {key:"continent",    label:"Continent", w:120},
    {key:"empresa",      label:"Company",   w:110},
    {key:"memberStatus", label:"Status",    w:120},
    {key:"quarter",      label:"Quarter",   w:80},
    {key:"inicio",       label:"Start",     w:95},
    {key:"fim",          label:"End",       w:95},
    {key:"rep",          label:"Rep.",      w:130},
    {key:"email",        label:"Email",     w:160},
    {key:"tel",          label:"Phone",     w:130},
    {key:"tournament",   label:"Tournament",w:180},
  ];
  const vigDot={"Active":"#22c55e","Expiring":"#f59e0b","Expired":"#ef4444"};

  return (
    <div style={{maxWidth:1400,margin:"0 auto",padding:"32px 20px"}}>
      <div style={{marginBottom:22}}>
        <h1 style={{fontSize:26,fontWeight:700,margin:"0 0 3px",fontFamily:"'Inter',system-ui,sans-serif"}}>Master Data</h1>
        <p style={{fontSize:12,color:"#9ca3af",margin:0,textTransform:"uppercase",letterSpacing:"1.5px",fontWeight:500}}>Complete database · expand any row to edit status history</p>
      </div>

      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:16,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search countries, companies, quarters..."
          style={{flex:1,minWidth:200,border:"1px solid #e5e7eb",borderRadius:8,padding:"7px 14px",fontSize:13,outline:"none"}}/>
        {[{val:sfilt,set:setSfilt,opts:STATUSES},{val:cfilt,set:setCfilt,opts:CONTINENTS}].map((sel,i)=>(
          <select key={i} value={sel.val} onChange={e=>sel.set(e.target.value)}
            style={{border:"1px solid #e5e7eb",borderRadius:8,padding:"7px 12px",fontSize:12,background:"#fff",cursor:"pointer"}}>
            {sel.opts.map(o=><option key={o}>{o}</option>)}
          </select>
        ))}
        <span style={{fontSize:11,color:"#9ca3af",background:"#f3f4f6",padding:"4px 10px",borderRadius:20}}>{filtered.length} records</span>
        <button onClick={addRow} style={{display:"flex",alignItems:"center",gap:6,background:"#1a1a1a",color:"#fff",border:"none",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:600}}>
          <Plus size={13}/> Add Country
        </button>
        <button onClick={()=>setPasteModal(true)} style={{display:"flex",alignItems:"center",gap:6,background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:600}}>
          <Plus size={13}/> Paste from Spreadsheet
        </button>
      </div>

      {selectedRows.size > 0 && (
        <div style={{background:"#1a1a1a",borderRadius:10,padding:"10px 16px",marginBottom:12,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <span style={{fontSize:12,fontWeight:700,color:"#fff"}}>{selectedRows.size} linha(s) selecionada(s)</span>
          <span style={{color:"#555",fontSize:12}}>—</span>
          <span style={{fontSize:12,color:"#9ca3af"}}>Preencher campo:</span>
          <select value={bulkField} onChange={e=>setBulkField(e.target.value)}
            style={{border:"none",borderRadius:6,padding:"4px 8px",fontSize:12,background:"#333",color:"#fff",outline:"none"}}>
            {COLS.filter(c=>c.key!=="country"&&c.key!=="quarter").map(c=>(
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
          {bulkField==="memberStatus"
            ?<select value={bulkValue} onChange={e=>setBulkValue(e.target.value)}
                style={{border:"none",borderRadius:6,padding:"4px 8px",fontSize:12,background:"#333",color:"#fff",outline:"none"}}>
                <option value="">-- selecione --</option>
                {Object.keys(STATUS_CFG).map(s=><option key={s}>{s}</option>)}
              </select>
            :bulkField==="continent"
            ?<select value={bulkValue} onChange={e=>setBulkValue(e.target.value)}
                style={{border:"none",borderRadius:6,padding:"4px 8px",fontSize:12,background:"#333",color:"#fff",outline:"none"}}>
                <option value="">-- selecione --</option>
                {CONTINENTS.slice(1).map(c=><option key={c}>{c}</option>)}
              </select>
            :<input value={bulkValue} onChange={e=>setBulkValue(e.target.value)}
                placeholder="Valor…"
                style={{border:"none",borderRadius:6,padding:"4px 8px",fontSize:12,background:"#333",color:"#fff",outline:"none",width:140}}
                type={bulkField==="inicio"||bulkField==="fim"?"date":"text"}/>
          }
          <button onClick={()=>{if(bulkValue)fillSelected(bulkField,bulkValue);}}
            disabled={!bulkValue}
            style={{background:bulkValue?"#6366f1":"#444",color:"#fff",border:"none",borderRadius:6,padding:"4px 14px",cursor:bulkValue?"pointer":"not-allowed",fontSize:12,fontWeight:700}}>
            Aplicar
          </button>
          <button onClick={()=>setSelectedRows(new Set())}
            style={{background:"none",border:"1px solid #444",color:"#9ca3af",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,marginLeft:"auto"}}>
            Limpar seleção
          </button>
        </div>
      )}

      {pasteModal && (
        <div onClick={e=>e.target===e.currentTarget&&setPasteModal(false)}
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:16}}>
          <div style={{background:"#fff",borderRadius:16,width:680,maxWidth:"100%",maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 64px rgba(0,0,0,0.18)"}}>
            <div style={{padding:"20px 24px",borderBottom:"1px solid #f3f4f6",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:"#1a1a1a"}}>Paste from Spreadsheet</div>
                <div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>Cole dados copiados do Excel ou Google Sheets · colunas: Country, Continent, Company, Status, Quarter, Start, End, Rep, Email, Phone, Tournament</div>
              </div>
              <button onClick={()=>setPasteModal(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#9ca3af",padding:4}}><X size={16}/></button>
            </div>
            <div style={{padding:"16px 24px",flex:1,overflowY:"auto"}}>
              <textarea
                value={pasteText}
                onChange={e=>{setPasteText(e.target.value);setPastePreview(parsePaste(e.target.value));}}
                placeholder="Cole aqui os dados copiados da planilha (Ctrl+V)..."
                style={{width:"100%",height:160,border:"1px solid #e5e7eb",borderRadius:8,padding:"10px 12px",fontSize:12,outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:"monospace",lineHeight:1.6}}
                autoFocus
              />
              {pastePreview.length > 0 && (
                <div style={{marginTop:12}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#16a34a",marginBottom:6}}>{pastePreview.length} registro(s) detectado(s):</div>
                  <div style={{overflowX:"auto",borderRadius:8,border:"1px solid #e5e7eb"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                      <thead>
                        <tr style={{background:"#f9fafb"}}>
                          {["Country","Continent","Company","Status","Start","End","Rep"].map(h=>(
                            <th key={h} style={{padding:"6px 10px",textAlign:"left",fontWeight:600,color:"#6b7280",borderBottom:"1px solid #e5e7eb",whiteSpace:"nowrap"}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pastePreview.slice(0,8).map((r,i)=>(
                          <tr key={i} style={{borderBottom:"1px solid #f3f4f6"}}>
                            {["country","continent","empresa","memberStatus","inicio","fim","rep"].map(k=>(
                              <td key={k} style={{padding:"5px 10px",color:"#374151",whiteSpace:"nowrap",maxWidth:120,overflow:"hidden",textOverflow:"ellipsis"}}>{r[k]||"—"}</td>
                            ))}
                          </tr>
                        ))}
                        {pastePreview.length > 8 && <tr><td colSpan={7} style={{padding:"5px 10px",color:"#9ca3af",fontSize:10}}>+{pastePreview.length-8} mais...</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div style={{padding:"14px 24px",borderTop:"1px solid #f3f4f6",display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setPasteModal(false)} style={{background:"none",border:"1px solid #e5e7eb",borderRadius:8,padding:"7px 18px",cursor:"pointer",fontSize:12,color:"#6b7280"}}>Cancelar</button>
              <button onClick={handlePasteImport} disabled={pastePreview.length===0}
                style={{background:pastePreview.length>0?"#16a34a":"#9ca3af",color:"#fff",border:"none",borderRadius:8,padding:"7px 18px",cursor:pastePreview.length>0?"pointer":"not-allowed",fontSize:12,fontWeight:700}}>
                Importar {pastePreview.length > 0 ? pastePreview.length+" registro(s)" : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{background:"#fff",borderRadius:12,boxShadow:"0 1px 4px rgba(0,0,0,0.07)",overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:"#fafafa",borderBottom:"2px solid #f3f4f6"}}>
                <th style={{width:36,padding:"11px 6px 11px 14px"}}>
                  <input type="checkbox"
                    checked={selectedRows.size===filtered.length && filtered.length>0}
                    onChange={selectAll}
                    style={{cursor:"pointer",accentColor:"#6366f1"}}/>
                </th>
                {COLS.map(c=>(
                  <th key={c.key} style={{textAlign:"left",padding:"11px 14px",fontSize:10,color:"#9ca3af",fontWeight:700,whiteSpace:"nowrap",textTransform:"uppercase",letterSpacing:.6,minWidth:c.w}}>{c.label}</th>
                ))}
                <th style={{padding:"11px 14px",fontSize:10,color:"#9ca3af",fontWeight:700,textTransform:"uppercase",letterSpacing:.6,minWidth:90}}>Vigência</th>
                <th style={{padding:"11px 14px",fontSize:10,color:"#9ca3af",fontWeight:700,textTransform:"uppercase",letterSpacing:.6,minWidth:60}}>History</th>
                <th style={{width:36}}/>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row,i)=>{
                const v=calcVig(row.inicio,row.fim);
                const isOpen=expanded.has(row.id);
                const histCount=(row.statusHistory||[]).length;
                return (
                  <>
                    <tr key={row.id} style={{borderBottom:isOpen?"none":"1px solid #f3f4f6",background:isOpen?"#f8faff":i%2===0?"#fff":"#fafbfc",transition:"background 0.1s"}}
                      onMouseEnter={e=>{if(!isOpen)e.currentTarget.style.background="#f0f7ff";}}
                      onMouseLeave={e=>{if(!isOpen)e.currentTarget.style.background=i%2===0?"#fff":"#fafbfc";}}>

                      <td style={{padding:"4px 6px 4px 14px",verticalAlign:"middle",textAlign:"center"}}>
                        <input type="checkbox"
                          checked={selectedRows.has(row.id)}
                          onChange={()=>toggleSelect(row.id)}
                          style={{cursor:"pointer",accentColor:"#6366f1"}}/>
                      </td>
                      <td style={{padding:"4px 6px 4px 14px",verticalAlign:"middle",textAlign:"center"}}>
                        <button onClick={()=>toggleExpand(row.id)}
                          style={{background:"none",border:"none",cursor:"pointer",color:isOpen?"#6366f1":"#9ca3af",padding:3,borderRadius:4,display:"flex",alignItems:"center"}}
                          title={isOpen?"Hide history":"Show history"}>
                          {isOpen?<ChevronDown size={14}/>:<ChevronRight size={14}/>}
                        </button>
                      </td>

                      {COLS.map(c=>(
                        <td key={c.key} style={{padding:"4px 14px",verticalAlign:"middle",position:"relative"}} onClick={e=>e.stopPropagation()}
                          onContextMenu={e=>{
                            e.preventDefault();
                            const val = row[c.key];
                            if (!val) return;
                            if (selectedRows.size > 1 && selectedRows.has(row.id)) {
                              if (window.confirm(`Aplicar "${val}" em ${selectedRows.size} linhas selecionadas (campo: ${c.label})?`))
                                fillSelected(c.key, val);
                            } else {
                              const below = filtered.length - filtered.findIndex(r=>r.id===row.id) - 1;
                              if (below > 0 && window.confirm(`Preencher "${val}" nas ${below} linha(s) abaixo (campo: ${c.label})?`))
                                fillDown(row.id, c.key, val);
                            }
                          }}>
                          {c.key==="memberStatus"
                            ?<EditableCell value={row[c.key]} type="select" opts={Object.keys(STATUS_CFG)} onChange={val=>save({...row,[c.key]:val})}/>
                            :c.key==="continent"
                            ?<EditableCell value={row[c.key]} type="select" opts={CONTINENTS.slice(1)} onChange={val=>save({...row,[c.key]:val})}/>
                            :c.key==="quarter"
                            ?<span style={{fontSize:12,fontWeight:700,color:row[c.key]?"#6366f1":"#d1d5db",padding:"3px 4px",display:"block"}}>{row[c.key]||"—"}</span>
                            :c.key==="inicio"||c.key==="fim"
                            ?<EditableCell value={row[c.key]} type="date" onChange={val=>save({...row,[c.key]:val})}/>
                            :c.key==="country"
                            ?<EditableCell value={row[c.key]} onChange={val=>{
                              const auto = continentFromCountry(val);
                              save({...row, country:val, ...(auto?{continent:auto}:{})});
                            }}/>
                            :<EditableCell value={row[c.key]} onChange={val=>save({...row,[c.key]:val})}/>
                          }
                        </td>
                      ))}

                      <td style={{padding:"4px 14px",verticalAlign:"middle"}}>
                        {v.status
                          ?<span style={{display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
                            <span style={{width:6,height:6,borderRadius:"50%",background:vigDot[v.status],flexShrink:0}}/>
                            <span style={{color:v.color,fontWeight:600,fontSize:11}}>{v.status}</span>
                          </span>
                          :<span style={{color:"#e5e7eb"}}>—</span>}
                      </td>

                      <td style={{padding:"4px 14px",verticalAlign:"middle"}}>
                        <button onClick={()=>toggleExpand(row.id)}
                          style={{display:"inline-flex",alignItems:"center",gap:4,background:isOpen?"#eef2ff":"#f3f4f6",
                            border:"none",borderRadius:20,padding:"3px 9px",cursor:"pointer",fontSize:11,fontWeight:600,
                            color:isOpen?"#6366f1":"#9ca3af"}}>
                          <History size={10}/>{histCount}
                        </button>
                      </td>

                      <td style={{padding:"4px 8px",verticalAlign:"middle",textAlign:"center"}}>
                        <button onClick={()=>del(row.id)}
                          style={{background:"none",border:"none",cursor:"pointer",color:"#e5e7eb",padding:4,borderRadius:6,display:"flex",alignItems:"center"}}
                          onMouseEnter={e=>e.currentTarget.style.color="#ef4444"}
                          onMouseLeave={e=>e.currentTarget.style.color="#e5e7eb"}>
                          <X size={13}/>
                        </button>
                      </td>
                    </tr>

                    {isOpen && (
                      <StatusHistoryEditor key={`hist-${row.id}`} record={row} onUpdate={save} responsibles={responsibles} setResponsibles={setResponsibles} history={history}/>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length===0&&<div style={{padding:40,textAlign:"center",color:"#9ca3af",fontSize:13}}>No records match the filters</div>}
      </div>

      {/* ── Goals & KPIs Block ── */}
      <GoalsKPIsBlock goals={goals} setGoals={setGoals} data={data}/>

      {editModal&&<EditModal row={editModal} onClose={()=>setEditModal(null)} onSave={save} onExpandCountry={null}/>}
    </div>
  );
}

// ── Responsible helpers ────────────────────────────────────────
function avatarColor(name) {
  const colors = ["#6366f1","#f59e0b","#22c55e","#ef4444","#3b82f6","#ec4899","#8b5cf6","#14b8a6","#f97316","#64748b"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0,2).toUpperCase();
  return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
}
function Avatar({ name, size=42, photo }) {
  const bg = avatarColor(name||"?");
  if (photo) return (
    <img src={photo} alt={name} style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:"2px solid #e0e7ff"}}/>
  );
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",
      color:"#fff",fontWeight:700,fontSize:size*0.36,flexShrink:0,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:".5px"}}>
      {initials(name)}
    </div>
  );
}

// ── Responsible Modal ──────────────────────────────────────────
function ResponsibleModal({ person, onClose, onPhotoChange }) {
  const { name, area, tasks } = person;
  const total    = tasks.length;
  const done     = tasks.filter(t => t.taskStatus === "Done").length;
  const overdue  = tasks.filter(t => t.taskStatus !== "Done" && t.deadline && new Date(t.deadline) < TODAY).length;
  const onTimePct   = total ? Math.round((done / total) * 100) : 0;
  const overduePct  = total ? Math.round((overdue / total) * 100) : 0;

  const sorted = [...tasks].sort((a, b) => {
    const aOv = a.taskStatus !== "Done" && a.deadline && new Date(a.deadline) < TODAY;
    const bOv = b.taskStatus !== "Done" && b.deadline && new Date(b.deadline) < TODAY;
    if (aOv && !bOv) return -1;
    if (!aOv && bOv) return 1;
    return ["Not Started","Doing","Done"].indexOf(a.taskStatus||"Not Started") - ["Not Started","Doing","Done"].indexOf(b.taskStatus||"Not Started");
  });

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1200,padding:16}}>
      <div style={{background:"#fff",borderRadius:20,width:680,maxWidth:"100%",maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 32px 80px rgba(0,0,0,0.22)"}}>
        <div style={{padding:"28px 28px 20px",borderBottom:"1px solid #f3f4f6",display:"flex",alignItems:"center",gap:18}}>
          <label style={{cursor:"pointer",position:"relative",flexShrink:0}} title="Click to change photo">
            <Avatar name={name} size={64} photo={person.photo}/>
            <div style={{position:"absolute",bottom:2,right:2,background:"#6366f1",color:"#fff",borderRadius:"50%",
              width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,
              fontWeight:700,border:"2px solid #fff",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}>✎</div>
            <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
              const file=e.target.files[0]; if(!file||!onPhotoChange) return;
              const reader=new FileReader();
              reader.onload=ev=>onPhotoChange(ev.target.result);
              reader.readAsDataURL(file);
            }}/>
          </label>
          <div style={{flex:1}}>
            <h2 style={{margin:"0 0 4px",fontSize:20,fontWeight:700,fontFamily:"'Inter',system-ui,sans-serif"}}>{name}</h2>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {area.map(a=>(
                <span key={a} style={{background:"#f3f4f6",color:"#374151",borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:600}}>{a}</span>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"1px solid #e5e7eb",borderRadius:"50%",width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#6b7280",flexShrink:0}}>
            <X size={13}/>
          </button>
        </div>
        <div style={{padding:"18px 28px",borderBottom:"1px solid #f3f4f6",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
          {[
            {label:"Total Tasks",    val:total,         color:"#6366f1", bg:"#eef2ff"},
            {label:"Done ✓",         val:`${done} (${onTimePct}%)`,  color:"#15803d", bg:"#dcfce7"},
            {label:"Overdue 🔴",     val:`${overdue} (${overduePct}%)`, color:"#dc2626", bg:"#fee2e2"},
          ].map(({label,val,color,bg})=>(
            <div key={label} style={{background:bg,borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:700,color,fontFamily:"'Inter',system-ui,sans-serif",lineHeight:1}}>{val}</div>
              <div style={{fontSize:11,color,opacity:.8,marginTop:4,fontWeight:600}}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{padding:"12px 28px 0"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <span style={{fontSize:11,color:"#9ca3af",fontWeight:600}}>Task Index</span>
            <span style={{fontSize:11,fontWeight:700,color:"#15803d"}}>{onTimePct}% done</span>
            {overduePct > 0 && <span style={{fontSize:11,fontWeight:700,color:"#dc2626"}}>{overduePct}% overdue</span>}
          </div>
          <div style={{height:6,background:"#f3f4f6",borderRadius:4,overflow:"hidden",display:"flex"}}>
            <div style={{width:`${onTimePct}%`,background:"#22c55e"}}/>
            <div style={{width:`${overduePct}%`,background:"#ef4444"}}/>
          </div>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"14px 0 0"}}>
          <div style={{padding:"0 28px 10px",fontSize:11,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:.8}}>Tasks ({total})</div>
          {sorted.length === 0 && <div style={{padding:"20px 28px",color:"#9ca3af",fontSize:13,fontStyle:"italic"}}>No tasks assigned.</div>}
          {sorted.map(t => {
            const isOverdue = t.taskStatus !== "Done" && t.deadline && new Date(t.deadline) < TODAY;
            const cfg = TASK_STATUS_CFG[t.taskStatus||"Not Started"];
            return (
              <div key={t.id} style={{padding:"10px 28px",borderBottom:"1px solid #f9fafb",display:"flex",alignItems:"center",gap:12,background:isOverdue?"#fff7f7":"transparent"}}>
                {isOverdue && <span style={{fontSize:14,flexShrink:0}}>🔴</span>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.name||"(unnamed task)"}</div>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    {t.country && <span style={{fontSize:10,color:"#6b7280",background:"#f3f4f6",borderRadius:10,padding:"1px 7px"}}>{t.country}</span>}
                    {t.start    && <span style={{fontSize:10,color:"#9ca3af"}}>Start: {fmt(t.start)}</span>}
                    {t.deadline && <span style={{fontSize:10,color:isOverdue?"#dc2626":"#9ca3af",fontWeight:isOverdue?700:400}}>Deadline: {fmt(t.deadline)}</span>}
                  </div>
                </div>
                <span style={{background:cfg.bg,color:cfg.color,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,flexShrink:0}}>{t.taskStatus||"Not Started"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Responsibles Tab ───────────────────────────────────────────
function ResponsiblesTab({ data, responsibles, setResponsibles }) {
  const [search, setSearch]   = useState("");
  const [selected, setSelected] = useState(null);
  const [newName, setNewName]   = useState("");
  const [newArea, setNewArea]   = useState("");
  const [newEmail, setNewEmail] = useState("");
  const newNameRef = useRef(null);

  const people = useMemo(() => {
    const map = {};
    (responsibles||[]).forEach(r => {
      map[r.name] = { name: r.name, area: r.area||"", tasks: [], rId: r.id, photo: r.photo||null, email: r.email||"" };
    });
    data.forEach(record => {
      (record.tasks||[]).forEach(t => {
        const name = (t.responsible||"").trim();
        if (!name) return;
        if (!map[name]) map[name] = { name, area:"", tasks:[], email:"", rId:null, photo:null };
        map[name].tasks.push({ ...t, country: record.country });
      });
    });
    return Object.values(map).sort((a,b) => a.name.localeCompare(b.name));
  }, [data, responsibles]);

  const filtered = useMemo(() => {
    if (!search) return people;
    const q = search.toLowerCase();
    return people.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.area||"").toLowerCase().includes(q) ||
      (p.email||"").toLowerCase().includes(q)
    );
  }, [people, search]);

  const addPerson = () => {
    const name = newName.trim();
    if (!name) return;
    if ((responsibles||[]).find(r => r.name.toLowerCase() === name.toLowerCase())) return;
    setResponsibles(p => [...p, { id:`r${Date.now()}`, name, area: newArea.trim(), email: newEmail.trim() }]);
    setNewName(""); setNewArea(""); setNewEmail("");
    setTimeout(() => newNameRef.current?.focus(), 50);
  };

  const removePerson  = (id)         => setResponsibles(p => p.filter(r => r.id !== id));
  const updateField   = (id, k, v)   => setResponsibles(p => p.map(r => r.id === id ? {...r, [k]: v} : r));
  const updatePhoto   = (id, photo)  => setResponsibles(p => p.map(r => r.id === id ? {...r, photo} : r));

  const inputStyle = (hasVal) => ({
    border: "none",
    borderBottom: `1.5px solid ${hasVal ? "#e5e7eb" : "#fca5a5"}`,
    background: "transparent",
    outline: "none",
    fontSize: 13,
    padding: "3px 0",
    width: "100%",
    color: hasVal ? "#1a1a1a" : "#ef4444",
    fontFamily: "'Inter',system-ui,sans-serif",
    transition: "border-color 0.15s",
  });

  return (
    <div style={{maxWidth:1060,margin:"0 auto",padding:"32px 20px"}}>

      {/* ── Header ── */}
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontSize:26,fontWeight:700,margin:"0 0 3px",fontFamily:"'Inter',system-ui,sans-serif"}}>Responsibles</h1>
          <p style={{fontSize:12,color:"#9ca3af",margin:0,textTransform:"uppercase",letterSpacing:"1.5px",fontWeight:500}}>
            {responsibles.length} {responsibles.length===1?"person":"people"} · edite direto na tabela · clique no nome para ver perfil
          </p>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar responsáveis..."
            style={{border:"1px solid #e5e7eb",borderRadius:8,padding:"7px 13px",fontSize:12,outline:"none",width:200}}/>
          <span style={{fontSize:11,color:"#9ca3af",background:"#f3f4f6",padding:"5px 11px",borderRadius:20,whiteSpace:"nowrap"}}>{filtered.length} results</span>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{background:"#fff",borderRadius:14,boxShadow:"0 1px 6px rgba(0,0,0,0.08)",overflow:"hidden",marginBottom:16}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:"#fafafa",borderBottom:"2px solid #f3f4f6"}}>
              {["","Name","Email","Area","Tasks","Done","Overdue",""].map((h,i) => (
                <th key={i} style={{textAlign:"left",fontSize:10,color:"#9ca3af",fontWeight:700,
                  padding: i===0?"12px 8px 12px 16px":i===7?"12px 16px":"12px 16px",
                  textTransform:"uppercase",letterSpacing:.6,whiteSpace:"nowrap"}}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{padding:"40px 20px",textAlign:"center",color:"#9ca3af",fontSize:13}}>
                {people.length===0 ? "Nenhum responsável ainda. Adicione abaixo ↓" : "Nenhum resultado."}
              </td></tr>
            )}
            {filtered.map((p, i) => {
              const resp    = (responsibles||[]).find(r => r.name === p.name);
              const total   = p.tasks.length;
              const done    = p.tasks.filter(t => t.taskStatus==="Done").length;
              const overdue = p.tasks.filter(t => t.taskStatus!=="Done" && t.deadline && new Date(t.deadline)<TODAY).length;
              const pct     = total ? Math.round((done/total)*100) : 0;
              const bg      = i%2===0 ? "#fff" : "#fafbfc";

              return (
                <tr key={p.name} style={{borderBottom:"1px solid #f3f4f6",background:bg,transition:"background .1s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#f0f7ff"}
                  onMouseLeave={e=>e.currentTarget.style.background=bg}>

                  {/* Avatar + photo upload */}
                  <td style={{padding:"10px 6px 10px 16px",width:44}}>
                    <label style={{cursor:"pointer",position:"relative",display:"block",width:36,height:36,flexShrink:0}} title="Trocar foto">
                      <Avatar name={p.name} size={36} photo={p.photo}/>
                      <div style={{position:"absolute",bottom:0,right:0,background:"#6366f1",color:"#fff",borderRadius:"50%",
                        width:13,height:13,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:700,border:"1.5px solid #fff"}}>✎</div>
                      <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
                        const file=e.target.files[0]; if(!file||!resp) return;
                        const reader=new FileReader();
                        reader.onload=ev=>updatePhoto(resp.id,ev.target.result);
                        reader.readAsDataURL(file);
                      }}/>
                    </label>
                  </td>

                  {/* Name — editable inline */}
                  <td style={{padding:"10px 16px",minWidth:130}} onClick={()=>setSelected(p)}>
                    {resp
                      ? <input
                          defaultValue={resp.name}
                          onBlur={e=>{ const v=e.target.value.trim(); if(v&&v!==resp.name) updateField(resp.id,"name",v); }}
                          onClick={e=>e.stopPropagation()}
                          style={{...inputStyle(true), fontWeight:700, fontSize:13, cursor:"text"}}/>
                      : <span style={{fontSize:13,fontWeight:700,color:"#6b7280",cursor:"pointer"}}>{p.name}</span>
                    }
                  </td>

                  {/* Email — editable inline */}
                  <td style={{padding:"10px 16px",minWidth:200}}>
                    {resp
                      ? <input
                          value={resp.email||""}
                          onChange={e=>updateField(resp.id,"email",e.target.value)}
                          placeholder="email@workspace.com"
                          style={{...inputStyle(!!resp.email), fontSize:12, color: resp.email?"#4f46e5":"#ef4444"}}/>
                      : <span style={{color:"#d1d5db",fontSize:12}}>—</span>
                    }
                  </td>

                  {/* Area — editable inline */}
                  <td style={{padding:"10px 16px",minWidth:120}}>
                    {resp
                      ? <input
                          value={resp.area||""}
                          onChange={e=>updateField(resp.id,"area",e.target.value)}
                          placeholder="área…"
                          style={{...inputStyle(true), fontSize:12, color:"#6b7280"}}/>
                      : <span style={{color:"#d1d5db",fontSize:12}}>—</span>
                    }
                  </td>

                  {/* Stats */}
                  <td style={{padding:"10px 16px",fontSize:13,fontWeight:700,color:"#6366f1",width:60}}>
                    {total || <span style={{color:"#d1d5db",fontWeight:400}}>0</span>}
                  </td>
                  <td style={{padding:"10px 16px",width:110}}>
                    {total > 0
                      ? <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontSize:12,fontWeight:700,color:"#15803d"}}>{done}</span>
                          <div style={{width:40,height:4,background:"#f3f4f6",borderRadius:2,overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${pct}%`,background:"#22c55e",borderRadius:2}}/>
                          </div>
                          <span style={{fontSize:10,color:"#9ca3af"}}>{pct}%</span>
                        </div>
                      : <span style={{color:"#d1d5db",fontSize:12}}>—</span>
                    }
                  </td>
                  <td style={{padding:"10px 16px",width:80}}>
                    {overdue > 0
                      ? <span style={{display:"flex",alignItems:"center",gap:4,fontSize:12,fontWeight:700,color:"#dc2626"}}>🔴 {overdue}</span>
                      : <span style={{color:"#d1d5db",fontSize:12}}>—</span>
                    }
                  </td>

                  {/* Actions */}
                  <td style={{padding:"10px 12px",textAlign:"right",whiteSpace:"nowrap"}}>
                    <button onClick={()=>setSelected(p)}
                      style={{fontSize:11,color:"#6366f1",fontWeight:600,background:"#eef2ff",border:"none",padding:"3px 10px",borderRadius:20,cursor:"pointer",marginRight:6}}>
                      Ver perfil →
                    </button>
                    {resp &&
                      <button onClick={()=>{ if(window.confirm(`Remover ${p.name}?`)) removePerson(resp.id); }}
                        style={{background:"none",border:"none",cursor:"pointer",color:"#d1d5db",padding:4,borderRadius:6,verticalAlign:"middle"}}
                        onMouseEnter={e=>e.currentTarget.style.color="#ef4444"}
                        onMouseLeave={e=>e.currentTarget.style.color="#d1d5db"}
                        title="Remover">
                        <X size={14}/>
                      </button>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Add new person row ── */}
      <div style={{background:"#fff",borderRadius:14,boxShadow:"0 1px 6px rgba(0,0,0,0.08)",padding:"16px 20px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <div style={{width:36,height:36,borderRadius:"50%",background:"#f3f4f6",border:"2px dashed #d1d5db",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Plus size={14} color="#9ca3af"/>
        </div>
        <input ref={newNameRef} value={newName} onChange={e=>setNewName(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&addPerson()}
          placeholder="Nome *"
          style={{flex:"1 1 120px",border:"1px solid #e5e7eb",borderRadius:8,padding:"7px 11px",fontSize:13,outline:"none",minWidth:100}}/>
        <input value={newEmail} onChange={e=>setNewEmail(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&addPerson()}
          placeholder="email@workspace.com"
          style={{flex:"2 1 200px",border:"1px solid #e5e7eb",borderRadius:8,padding:"7px 11px",fontSize:13,outline:"none",minWidth:160}}/>
        <input value={newArea} onChange={e=>setNewArea(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&addPerson()}
          placeholder="Área (opcional)"
          style={{flex:"1 1 130px",border:"1px solid #e5e7eb",borderRadius:8,padding:"7px 11px",fontSize:13,outline:"none",minWidth:100}}/>
        <button onClick={addPerson}
          style={{display:"flex",alignItems:"center",gap:6,background:"#1a1a1a",color:"#fff",border:"none",borderRadius:8,
            padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight:700,flexShrink:0,whiteSpace:"nowrap"}}>
          <Plus size={13}/> Adicionar
        </button>
      </div>

      {selected && (
        <ResponsibleModal person={selected} onClose={()=>setSelected(null)}
          onPhotoChange={photo => {
            const r = (responsibles||[]).find(r=>r.name===selected.name);
            if (r) { updatePhoto(r.id, photo); setSelected(prev=>({...prev, photo})); }
          }}/>
      )}
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────
const INIT_RESPONSIBLES = [
  {id:"r1", name:"Karina", area:"Operations", email:"karina@worldpokerfederation.org"},
];

// ── Google Docs Sync ───────────────────────────────────────────
const GOOGLE_DOC_ID  = "1RR63JwaLP-Kkg5kgqiVrNXc9GQMEM2YdZ7qQpq0XoII";
const GOOGLE_SHEET_ID = "1e05A1729p2XQHuzYsPFiCODRyZnGyac86lP4ccvs59Q";
// Paste your Apps Script Web App URL here after deploying:
let APPS_SCRIPT_URL = "";

function buildTasksPayload(data, responsibles) {
  // Group all tasks by responsible email
  const emailMap = {};
  (responsibles||[]).forEach(r => { if (r.email) emailMap[r.name] = r.email; });

  const byPerson = {};
  data.forEach(record => {
    (record.tasks||[]).forEach(t => {
      const name = (t.responsible||"").trim();
      if (!name) return;
      const email = emailMap[name] || null;
      if (!byPerson[name]) byPerson[name] = { name, email, tasks: [] };
      byPerson[name].tasks.push({
        taskName: t.name || "(unnamed)",
        country:  record.country || "",
        status:   t.taskStatus || "Not Started",
        start:    t.start    || "",
        deadline: t.deadline || "",
      });
    });
  });
  return Object.values(byPerson);
}


// ── Goals & KPIs Block (embedded in DataTab) ──────────────────
function GoalsKPIsBlock({ goals, setGoals, data }) {
  const members = data.filter(r => r.memberStatus === "Member" && r.country);
  const totalMembers = members.length;
  const qCounts = { Q1:0, Q2:0, Q3:0, Q4:0 };
  members.forEach(r => { if (r.quarter && qCounts[r.quarter] !== undefined) qCounts[r.quarter]++; });
  let cum = 0;

  const updateGoal = (field, value) => {
    setGoals(g => ({ ...g, [field]: isNaN(Number(value)) ? g[field] : Number(value) }));
  };
  const updateQ = (q, field, value) => {
    setGoals(g => ({ ...g, [q]: { ...g[q], [field]: field === "target" ? Number(value) : value } }));
  };
  const resetGoals = () => setGoals({
    total: 55,
    Q1: { target: 10, label: "Jan – Mar" },
    Q2: { target: 20, label: "Apr – Jun" },
    Q3: { target: 35, label: "Jul – Sep" },
    Q4: { target: 55, label: "Oct – Dec" },
  });

  const purpleQ = ["#94a3b8","#64748b","#475569","#1e293b"];
  const greenQ  = ["#86efac","#4ade80","#16a34a","#14532d"];
  let _cum = 0;
  const qOnTrack = {};
  ["Q1","Q2","Q3","Q4"].forEach((q,i) => {
    _cum += qCounts[q];
    qOnTrack[q] = _cum >= (goals[q]?.target ?? [10,20,35,55][i]);
  });
  const qColors = {
    Q1: qOnTrack.Q1 ? greenQ[0] : purpleQ[0],
    Q2: qOnTrack.Q2 ? greenQ[1] : purpleQ[1],
    Q3: qOnTrack.Q3 ? greenQ[2] : purpleQ[2],
    Q4: qOnTrack.Q4 ? greenQ[3] : purpleQ[3],
  };

  return (
    <div style={{marginTop:20}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,padding:"0 2px"}}>
        <div>
          <h2 style={{fontSize:16,fontWeight:700,margin:"0 0 2px",fontFamily:"'Inter',system-ui,sans-serif"}}>Goals & KPIs</h2>
          <p style={{fontSize:12,color:"#9ca3af",margin:0}}>Edit targets for the Path to Federations chart</p>
        </div>
        <button onClick={resetGoals}
          style={{background:"#f3f4f6",border:"1px solid #e5e7eb",borderRadius:8,padding:"7px 16px",fontSize:12,fontWeight:600,color:"#6b7280",cursor:"pointer"}}
          onMouseEnter={e=>e.currentTarget.style.background="#e5e7eb"}
          onMouseLeave={e=>e.currentTarget.style.background="#f3f4f6"}>
          ↺ Reset defaults
        </button>
      </div>

      {/* Overall Goal */}
      <div style={{background:"#fff",borderRadius:14,padding:"24px 28px",marginBottom:20,boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
        <h2 style={{fontSize:14,fontWeight:700,margin:"0 0 18px",color:"#1a1a1a"}}>Overall Target</h2>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20}}>
          <div>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:.8,marginBottom:8}}>Total Federation Goal</label>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <input type="number" value={goals.total || 55} min={1}
                onChange={e => updateGoal("total", e.target.value)}
                style={{border:"2px solid #6366f1",borderRadius:8,padding:"8px 12px",fontSize:20,fontWeight:700,color:"#6366f1",width:100,outline:"none",fontFamily:"'Inter',system-ui,sans-serif"}}/>
              <span style={{fontSize:12,color:"#9ca3af"}}>federations</span>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:16,padding:"0 20px",borderLeft:"1px solid #f3f4f6",borderRight:"1px solid #f3f4f6"}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:32,fontWeight:700,color:"#22c55e",fontFamily:"'Inter',system-ui,sans-serif",lineHeight:1}}>{totalMembers}</div>
              <div style={{fontSize:11,color:"#9ca3af",marginTop:4}}>current members</div>
            </div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:32,fontWeight:700,color:"#6366f1",fontFamily:"'Inter',system-ui,sans-serif",lineHeight:1}}>
              {Math.round((totalMembers / (goals.total||55)) * 100)}%
            </div>
            <div style={{fontSize:11,color:"#9ca3af",marginTop:4}}>of goal reached</div>
            <div style={{height:6,background:"#f3f4f6",borderRadius:4,marginTop:10,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${Math.min((totalMembers/(goals.total||55))*100,100)}%`,background:"linear-gradient(90deg,#22c55e,#60a5fa)",borderRadius:4}}/>
            </div>
          </div>
        </div>
      </div>

      {/* Quarterly Targets */}
      <div style={{background:"#fff",borderRadius:14,padding:"24px 28px",boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
        <h2 style={{fontSize:14,fontWeight:700,margin:"0 0 4px",color:"#1a1a1a"}}>Quarterly Targets</h2>
        <p style={{fontSize:12,color:"#9ca3af",margin:"0 0 20px"}}>Cumulative member target to be reached by end of each quarter</p>

        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{borderBottom:"2px solid #f3f4f6",background:"#fafafa"}}>
              {["Quarter","Period Label","Cumulative Target","Actual (so far)","Progress","Status"].map(h=>(
                <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:10,color:"#9ca3af",fontWeight:700,textTransform:"uppercase",letterSpacing:.7}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {["Q1","Q2","Q3","Q4"].map(q => {
              const qGoal = goals[q]?.target ?? 0;
              cum += qCounts[q];
              const actual = cum - qCounts[q]; // running total up to prev Q
              const thisCum = ["Q1","Q2","Q3","Q4"].slice(0,["Q1","Q2","Q3","Q4"].indexOf(q)+1).reduce((s,k)=>s+qCounts[k],0);
              const pct = Math.min((thisCum/qGoal)*100,100);
              const onTrack = thisCum >= qGoal;
              return (
                <tr key={q} style={{borderBottom:"1px solid #f3f4f6", background:onTrack?"#f0fdf4":"transparent"}}
                  onMouseEnter={e=>e.currentTarget.style.background=onTrack?"#dcfce7":"#f8faff"}
                  onMouseLeave={e=>e.currentTarget.style.background=onTrack?"#f0fdf4":"transparent"}>
                  <td style={{padding:"14px 14px"}}>
                    <span style={{fontWeight:800,fontSize:15,color:onTrack?"#16a34a":qColors[q],fontFamily:"'Inter',system-ui,sans-serif"}}>{q}</span>
                  </td>
                  <td style={{padding:"14px 14px"}}>
                    <input value={goals[q]?.label || ""} onChange={e=>updateQ(q,"label",e.target.value)}
                      style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"3px 0",fontSize:13,background:"transparent",outline:"none",width:120,color:"#374151"}}/>
                  </td>
                  <td style={{padding:"14px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <input type="number" min={1} value={qGoal}
                        onChange={e=>updateQ(q,"target",e.target.value)}
                        style={{border:`2px solid ${onTrack?"#16a34a":qColors[q]}`,borderRadius:8,padding:"6px 10px",fontSize:15,fontWeight:700,
                          color:onTrack?"#16a34a":qColors[q],width:72,outline:"none",fontFamily:"'Inter',system-ui,sans-serif",background:onTrack?"#f0fdf4":"#fff"}}/>
                      <span style={{fontSize:11,color:"#9ca3af"}}>members</span>
                    </div>
                  </td>
                  <td style={{padding:"14px 14px"}}>
                    <span style={{fontSize:16,fontWeight:700,color:"#1a1a1a",fontFamily:"'Inter',system-ui,sans-serif"}}>{thisCum}</span>
                  </td>
                  <td style={{padding:"14px 14px",minWidth:140}}>
                    <div style={{height:6,background:"#f3f4f6",borderRadius:4,overflow:"hidden",width:120}}>
                      <div style={{height:"100%",width:`${pct}%`,background:onTrack?"#16a34a":qColors[q],borderRadius:4,transition:"width .4s"}}/>
                    </div>
                    <div style={{fontSize:10,color:"#9ca3af",marginTop:4}}>{Math.round(pct)}%</div>
                  </td>
                  <td style={{padding:"14px 14px"}}>
                    <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,
                      background:onTrack?"#dcfce7":"#fee2e2",color:onTrack?"#16a34a":"#dc2626"}}>
                      {onTrack?"On track":"Behind"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── History Tab ────────────────────────────────────────────────
const HISTORY_TYPES = ["Meeting","Update","Note","Decision","Alert"];
const HISTORY_TYPE_CFG = {
  Meeting:  { bg:"#dbeafe", color:"#1d4ed8", icon:"📅" },
  Update:   { bg:"#dcfce7", color:"#15803d", icon:"📊" },
  Note:     { bg:"#f3f4f6", color:"#374151", icon:"📝" },
  Decision: { bg:"#fef3c7", color:"#b45309", icon:"⚡" },
  Alert:    { bg:"#fee2e2", color:"#dc2626", icon:"🚨" },
};

function HistoryTab({ data, history, setHistory, responsibles=[] }) {
  const allCountries = data.filter(c=>c.country).map(c=>c.country);
  const allContinents = [...new Set(data.filter(c=>c.continent).map(c=>c.continent))];
  const scopeOptions = ["Global", ...allContinents, ...allCountries.sort()];

  const [note, setNote]   = useState("");
  const [scope, setScope] = useState("Global");
  const [type, setType]   = useState("Note");
  const [date, setDate]   = useState(new Date().toISOString().slice(0,10));
  const [responsible, setResponsible] = useState("");
  const [filterScope, setFilterScope] = useState("All");
  const [filterType,  setFilterType]  = useState("All");
  const [search, setSearch] = useState("");

  const addEntry = () => {
    const n = note.trim(); if (!n) return;
    setHistory(p => [{id:`hist_${Date.now()}`, date, scope, type, note:n, responsible:responsible}, ...p]);
    setNote("");
  };

  const removeEntry = id => setHistory(p => p.filter(e => e.id !== id));

  const filtered = useMemo(() => {
    return (history||[]).filter(e => {
      if (filterScope !== "All" && e.scope !== filterScope) return false;
      if (filterType  !== "All" && e.type  !== filterType)  return false;
      if (search) { const q=search.toLowerCase(); return e.note.toLowerCase().includes(q)||e.scope?.toLowerCase().includes(q)||e.responsible?.toLowerCase().includes(q); }
      return true;
    });
  }, [history, filterScope, filterType, search]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(e => { (map[e.date] = map[e.date]||[]).push(e); });
    return Object.entries(map).sort((a,b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  return (
    <div style={{maxWidth:900,margin:"0 auto",padding:"32px 20px"}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:26,fontWeight:700,margin:"0 0 3px",fontFamily:"'Inter',system-ui,sans-serif"}}>History</h1>
        <p style={{fontSize:12,color:"#9ca3af",margin:0,textTransform:"uppercase",letterSpacing:"1.5px",fontWeight:500}}>
          Regional log · used by AI to generate discussion topics
        </p>
      </div>

      {/* Add entry */}
      <div style={{background:"#fff",borderRadius:12,padding:"18px 20px",marginBottom:20,boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
        <div style={{fontSize:11,fontWeight:700,color:"#6366f1",textTransform:"uppercase",letterSpacing:.8,marginBottom:12}}>New Entry</div>
        <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            style={{border:"1px solid #e5e7eb",borderRadius:8,padding:"6px 10px",fontSize:12,outline:"none"}}/>
          <select value={scope} onChange={e=>setScope(e.target.value)}
            style={{border:"1px solid #e5e7eb",borderRadius:8,padding:"6px 10px",fontSize:12,background:"#fff",outline:"none",minWidth:160}}>
            {scopeOptions.map(o=><option key={o}>{o}</option>)}
          </select>
          <select value={type} onChange={e=>setType(e.target.value)}
            style={{border:"1px solid #e5e7eb",borderRadius:8,padding:"6px 10px",fontSize:12,background:"#fff",outline:"none"}}>
            {HISTORY_TYPES.map(t=><option key={t}>{t}</option>)}
          </select>
          <select value={responsible} onChange={e=>setResponsible(e.target.value)}
            style={{border:"1px solid #e5e7eb",borderRadius:8,padding:"6px 10px",fontSize:12,background:"#fff",outline:"none",minWidth:160}}>
            <option value="">Responsible</option>
            {responsibles.map(r=><option key={r.id} value={r.name}>{r.name}</option>)}
          </select>
        </div>
        <div style={{display:"flex",gap:8}}>
          <textarea value={note} onChange={e=>setNote(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&(e.metaKey||e.ctrlKey)) addEntry();}}
            placeholder="Write your note here… (Cmd+Enter to save)"
            style={{flex:1,border:"1px solid #e5e7eb",borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",resize:"vertical",minHeight:72,fontFamily:"'Inter',system-ui,sans-serif"}}/>
          <button onClick={addEntry}
            style={{background:"#1a1a1a",color:"#fff",border:"none",borderRadius:8,padding:"0 18px",cursor:"pointer",fontSize:12,fontWeight:600,alignSelf:"stretch"}}>
            <Plus size={14} style={{display:"block",margin:"0 auto 2px"}}/>Save
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search notes…"
          style={{flex:1,minWidth:180,border:"1px solid #e5e7eb",borderRadius:8,padding:"6px 12px",fontSize:12,outline:"none"}}/>
        <select value={filterScope} onChange={e=>setFilterScope(e.target.value)}
          style={{border:"1px solid #e5e7eb",borderRadius:8,padding:"6px 10px",fontSize:12,background:"#fff",outline:"none"}}>
          <option>All</option>
          {scopeOptions.map(o=><option key={o}>{o}</option>)}
        </select>
        <select value={filterType} onChange={e=>setFilterType(e.target.value)}
          style={{border:"1px solid #e5e7eb",borderRadius:8,padding:"6px 10px",fontSize:12,background:"#fff",outline:"none"}}>
          <option>All</option>
          {HISTORY_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
        <span style={{fontSize:11,color:"#9ca3af",background:"#f3f4f6",padding:"4px 10px",borderRadius:20}}>{filtered.length} entries</span>
      </div>

      {/* Timeline */}
      {grouped.length === 0
        ? <div style={{background:"#fff",borderRadius:12,padding:48,textAlign:"center",color:"#9ca3af",fontSize:13,boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
            <BookOpen size={32} style={{opacity:.2,marginBottom:10,display:"block",margin:"0 auto 12px"}}/>
            No history entries yet. Start adding notes above.
          </div>
        : grouped.map(([d, entries]) => (
          <div key={d} style={{marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
              <span style={{flex:1,height:1,background:"#f3f4f6",display:"inline-block"}}/>
              {new Date(d+"T00:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"})}
              <span style={{flex:1,height:1,background:"#f3f4f6",display:"inline-block"}}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {entries.map(e => {
                const cfg = HISTORY_TYPE_CFG[e.type] || HISTORY_TYPE_CFG.Note;
                return (
                  <div key={e.id} style={{background:"#fff",borderRadius:10,padding:"12px 16px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)",display:"flex",alignItems:"flex-start",gap:12,border:"1px solid #f3f4f6"}}
                    onMouseEnter={e2=>e2.currentTarget.style.borderColor="#e0e7ff"}
                    onMouseLeave={e2=>e2.currentTarget.style.borderColor="#f3f4f6"}>
                    <span style={{fontSize:18,flexShrink:0,marginTop:1}}>{cfg.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4,flexWrap:"wrap"}}>
                        <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:10,background:cfg.bg,color:cfg.color}}>{e.type}</span>
                        <span style={{fontSize:11,background:"#f3f4f6",color:"#374151",borderRadius:10,padding:"2px 8px",fontWeight:500}}>{e.scope}</span>
                        {e.responsible && <span style={{fontSize:11,background:"#ede9fe",color:"#6d28d9",borderRadius:10,padding:"2px 8px",fontWeight:500}}>{e.responsible}</span>}
                      </div>
                      <p style={{margin:0,fontSize:13,color:"#1a1a1a",lineHeight:1.5}}>{e.note}</p>
                    </div>
                    <button onClick={()=>removeEntry(e.id)}
                      style={{background:"none",border:"none",cursor:"pointer",color:"#e5e7eb",padding:3,borderRadius:4,flexShrink:0,display:"flex",alignItems:"center"}}
                      onMouseEnter={e2=>e2.currentTarget.style.color="#ef4444"}
                      onMouseLeave={e2=>e2.currentTarget.style.color="#e5e7eb"}>
                      <X size={13}/>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      }
    </div>
  );
}

const DEFAULT_GOALS = {
  total: 55,
  Q1: { target: 10, label: "Jan – Mar" },
  Q2: { target: 20, label: "Apr – Jun" },
  Q3: { target: 35, label: "Jul – Sep" },
  Q4: { target: 55, label: "Oct – Dec" },
};

// ── Sync Modal ─────────────────────────────────────────────────
function SyncModal({ data, responsibles, onClose }) {
  const [scriptUrl, setScriptUrl] = useState(APPS_SCRIPT_URL || "");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error | no_url
  const [log, setLog] = useState([]);
  const payload = buildTasksPayload(data, responsibles);

  const totalTasks = payload.reduce((s,p)=>s+p.tasks.length,0);

  const doSync = () => {
    const url = scriptUrl.trim();
    if (!url) { setStatus("no_url"); return; }
    APPS_SCRIPT_URL = url;
    setStatus("loading");
    setLog([]);

    // Build GET URL with payload as query param
    const encoded = encodeURIComponent(JSON.stringify({ sheetId: GOOGLE_SHEET_ID, people: payload }));
    const getUrl  = url + "?data=" + encoded;

    // Open in a new tab — only method that reliably bypasses CORS for Apps Script
    // The script runs server-side; the tab can be closed immediately
    const win = window.open(getUrl, "_blank");

    // After 4s assume script ran and update UI
    setTimeout(() => {
      try { if (win && !win.closed) win.close(); } catch(_) {}
      setStatus("success");
      setLog(payload.map(p => p.name + " (" + (p.email || "sem email") + ") — " + p.tasks.length + " task(s)"));
    }, 4000);
  };

  const statusColors = { idle:"#6366f1", loading:"#f59e0b", success:"#16a34a", error:"#dc2626", no_url:"#dc2626" };

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:16}}>
      <div style={{background:"#fff",borderRadius:20,width:600,maxWidth:"100%",maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 32px 80px rgba(0,0,0,0.22)"}}>

        {/* Header */}
        <div style={{padding:"24px 28px 18px",borderBottom:"1px solid #f3f4f6",display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#4285f4,#34a853)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <ExternalLink size={16} color="#fff"/>
          </div>
          <div style={{flex:1}}>
            <h2 style={{margin:0,fontSize:17,fontWeight:700,fontFamily:"'Inter',system-ui,sans-serif"}}>Sync Tasks → Google Sheets</h2>
            <p style={{margin:"2px 0 0",fontSize:12,color:"#9ca3af"}}>
              {payload.length} responsáveis · {totalTasks} tasks no total
            </p>
          </div>
          <button onClick={onClose} style={{background:"none",border:"1px solid #e5e7eb",borderRadius:"50%",width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#6b7280"}}>
            <X size={13}/>
          </button>
        </div>

        <div style={{overflowY:"auto",flex:1,padding:"20px 28px"}}>

          {/* Preview */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:.8,marginBottom:10}}>Preview das tasks</div>
            {payload.length === 0
              ? <div style={{fontSize:13,color:"#9ca3af",fontStyle:"italic"}}>Nenhuma task encontrada nos dados.</div>
              : payload.map(p=>(
                <div key={p.name} style={{marginBottom:12,background:"#f8faff",borderRadius:10,padding:"12px 14px",border:"1px solid #e0e7ff"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:avatarColor(p.name),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:700,flexShrink:0}}>{initials(p.name)}</div>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>{p.name}</div>
                      <div style={{fontSize:11,color:p.email?"#6366f1":"#ef4444"}}>{p.email||"sem email — adicione em Responsibles"}</div>
                    </div>
                    <span style={{marginLeft:"auto",background:"#eef2ff",color:"#6366f1",borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:700}}>{p.tasks.length} tasks</span>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:3,paddingLeft:36}}>
                    {p.tasks.map((t,i)=>(
                      <div key={i} style={{fontSize:12,color:"#374151",display:"flex",alignItems:"center",gap:6}}>
                        <span style={{color: t.status==="Done"?"#22c55e": t.status==="Doing"?"#f59e0b":"#9ca3af",fontSize:10,fontWeight:700}}>●</span>
                        <span style={{fontWeight:600}}>{t.taskName}</span>
                        {t.country&&<span style={{fontSize:10,color:"#9ca3af",background:"#f3f4f6",borderRadius:8,padding:"1px 6px"}}>{t.country}</span>}
                        {t.deadline&&<span style={{fontSize:10,color:"#9ca3af"}}>até {t.deadline}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            }
          </div>

          {/* Apps Script URL */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:.8,marginBottom:8}}>Apps Script Web App URL</div>
            <input
              value={scriptUrl}
              onChange={e=>setScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/…/exec"
              style={{width:"100%",border:"1px solid #e5e7eb",borderRadius:8,padding:"8px 12px",fontSize:12,outline:"none",boxSizing:"border-box",
                borderColor: status==="no_url"?"#ef4444":"#e5e7eb"}}
            />
            {status==="no_url" && <div style={{fontSize:11,color:"#ef4444",marginTop:4}}>Cole a URL do Apps Script antes de sincronizar.</div>}
            <div style={{fontSize:11,color:"#9ca3af",marginTop:6,lineHeight:1.6}}>
              Ainda não tem? Siga o guia abaixo para criar o script no Google Sheets.
            </div>
          </div>

          {/* How-to guide */}
          <details style={{marginBottom:20}}>
            <summary style={{fontSize:12,fontWeight:700,color:"#6366f1",cursor:"pointer",marginBottom:8}}>Como configurar o Apps Script (passo a passo)</summary>
            <div style={{fontSize:12,color:"#374151",lineHeight:1.8,background:"#f8faff",borderRadius:10,padding:"12px 14px",border:"1px solid #e0e7ff",marginTop:8}}>
              <b>1.</b> Abra a Google Planilha: <a href={`https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit`} target="_blank" rel="noreferrer" style={{color:"#4285f4"}}>clique aqui ↗</a><br/>
              <b>2.</b> Menu <b>Extensões → Apps Script</b><br/>
              <b>3.</b> Apague o código existente e cole o script fornecido abaixo<br/>
              <b>4.</b> Salve (💾) e clique em <b>Implantar → Nova implantação</b><br/>
              <b>5.</b> Tipo: <b>App da Web</b> · Executar como: <b>Eu</b> · Acesso: <b>Qualquer pessoa do domínio</b><br/>
              <b>6.</b> Copie a URL gerada e cole no campo acima<br/>
              <b>7.</b> Clique em <b>Sincronizar agora</b> abaixo ✅
            </div>
          </details>

          {/* Status log */}
          {log.length > 0 && (
            <div style={{background: status==="success"?"#f0fdf4":"#fff7f7",borderRadius:10,padding:"12px 14px",border:`1px solid ${status==="success"?"#bbf7d0":"#fecaca"}`,marginBottom:16}}>
              {log.map((l,i)=><div key={i} style={{fontSize:12,color: status==="success"?"#15803d":"#dc2626",lineHeight:1.7}}>{l}</div>)}
            </div>
          )}
          {status==="loading" && (
            <div style={{background:"#fffbeb",borderRadius:10,padding:"12px 14px",border:"1px solid #fcd34d",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
              
              <div style={{fontSize:13,color:"#b45309",fontWeight:600}}>
                Uma nova aba foi aberta para executar o script no Google. Ela fechará automaticamente em instantes…
              </div>
            </div>
          )}
          {status==="success" && (
            <div style={{background:"#f0fdf4",borderRadius:10,padding:"12px 14px",border:"1px solid #bbf7d0",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
              
              <div style={{fontSize:13,color:"#15803d",fontWeight:600}}>
                Planilha atualizada! Abra a planilha e clique em WPF Tasks → Atribuir Tasks para criar as tasks no Google Tasks.
                <a href={`https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit`} target="_blank" rel="noreferrer"
                  style={{display:"block",fontSize:11,color:"#4285f4",marginTop:4}}>Abrir Planilha ↗</a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{padding:"16px 28px",borderTop:"1px solid #f3f4f6",display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{background:"none",border:"1px solid #e5e7eb",borderRadius:8,padding:"8px 18px",cursor:"pointer",fontSize:13,color:"#6b7280",fontWeight:500}}>
            Fechar
          </button>
          <button onClick={doSync} disabled={status==="loading"||payload.length===0}
            style={{display:"flex",alignItems:"center",gap:7,background: status==="loading"?"#9ca3af":"linear-gradient(135deg,#4285f4,#34a853)",color:"#fff",border:"none",borderRadius:8,padding:"8px 22px",cursor:status==="loading"?"not-allowed":"pointer",fontSize:13,fontWeight:700,boxShadow:"0 2px 8px rgba(66,133,244,0.3)"}}>
            {status==="loading"
              ? <><span style={{display:"inline-block",width:12,height:12,border:"2px solid #fff",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/> Executando…</>
              : <><ExternalLink size={13}/> Sincronizar agora</>
            }
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function App() {
  const [data,setData]=useState(INIT);
  const [tab,setTab]=useState("dashboard");
  const [responsibles, setResponsibles] = useState(INIT_RESPONSIBLES);
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [history, setHistory] = useState([]);
  const [showSync, setShowSync] = useState(false);

  return (
    <div style={{background:"#f7f6f3",minHeight:"100vh",fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{background:"#fff",borderBottom:"1px solid #ede9e3",padding:"0 20px",position:"sticky",top:0,zIndex:100,display:"flex",alignItems:"center",gap:4}}>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"12px 0",marginRight:24}}>
          <div style={{width:28,height:28,background:"#1a1a1a",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Globe size={15} color="#fff"/>
          </div>
          <span style={{fontSize:14,fontWeight:700,color:"#1a1a1a",fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:".2px"}}>WPF</span>
        </div>
        {[
          {id:"dashboard",    label:"Dashboard",    icon:<LayoutDashboard size={14}/>},
          {id:"data",         label:"Master Data",  icon:<Database size={14}/>},
          {id:"responsibles", label:"Responsibles", icon:<Users size={14}/>},
          {id:"history",      label:"History",      icon:<BookOpen size={14}/>},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"14px 14px",background:"none",border:"none",cursor:"pointer",
              fontSize:13,fontWeight:tab===t.id?600:400,color:tab===t.id?"#1a1a1a":"#9ca3af",fontFamily:"'Inter',system-ui,sans-serif",
              borderBottom:tab===t.id?"2px solid #1a1a1a":"2px solid transparent",transition:"all 0.15s",marginBottom:"-1px"}}>
            {t.icon}{t.label}
          </button>
        ))}
<div style={{marginLeft:"auto"}}>        </div>
      </div>
      {tab==="dashboard"    && <DashboardTab     data={data} setData={setData} goals={goals} responsibles={responsibles} history={history}/>}
      {tab==="data"         && <DataTab          data={data} setData={setData} responsibles={responsibles} setResponsibles={setResponsibles} history={history} goals={goals} setGoals={setGoals}/>}
      {tab==="responsibles" && <ResponsiblesTab  data={data} responsibles={responsibles} setResponsibles={setResponsibles}/>}
      {tab==="history"      && <HistoryTab       data={data} history={history} setHistory={setHistory} responsibles={responsibles}/>}
      {showSync && <SyncModal data={data} responsibles={responsibles} onClose={()=>setShowSync(false)}/>}
    </div>
  );
}
