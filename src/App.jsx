import { useState, useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Globe, Users, AlertTriangle, XCircle, X, Plus, Database, LayoutDashboard, Target, ChevronDown, ChevronRight, History, ExternalLink, ArrowLeft, Map } from "lucide-react";

// ── Fonts ──────────────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("wpf-fonts")) {
  const l = document.createElement("link");
  l.id = "wpf-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
}

// ── Constants ──────────────────────────────────────────────────
const STATUS_CFG = {
  Member:        { color:"#15803d", bg:"#dcfce7", dot:"#22c55e" },
  Negotiating:   { color:"#b45309", bg:"#fef3c7", dot:"#f59e0b" },
  Documentation: { color:"#1d4ed8", bg:"#dbeafe", dot:"#60a5fa" },
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
const GEO_STATES = {
  "Brazil": {"type":"FeatureCollection","features":[
    {"type":"Feature","properties":{"name":"Roraima"},"geometry":{"type":"Polygon","coordinates":[[[-64.4,5.27],[-61.3,5.27],[-59.85,4.5],[-59.4,2.68],[-60.2,1.9],[-62.1,1.9],[-63.4,2.2],[-64.0,1.3],[-64.8,0.8],[-64.8,2.5],[-63.5,3.8],[-64.4,5.27]]]}},
    {"type":"Feature","properties":{"name":"Amapá"},"geometry":{"type":"Polygon","coordinates":[[[-54.07,4.38],[-51.22,4.38],[-50.44,3.2],[-50.77,1.58],[-51.79,0.62],[-52.38,0.05],[-54.07,0.5],[-54.07,4.38]]]}},
    {"type":"Feature","properties":{"name":"Pará"},"geometry":{"type":"Polygon","coordinates":[[[-54.07,4.38],[-54.07,0.5],[-56.0,1.5],[-57.5,2.0],[-60.5,2.0],[-60.5,-0.5],[-60.0,-2.0],[-57.5,-4.0],[-56.5,-4.0],[-52.5,-8.0],[-50.7,-5.2],[-47.0,-5.2],[-46.0,-3.5],[-46.0,-0.5],[-47.5,0.5],[-49.5,1.2],[-50.8,2.5],[-51.22,4.38],[-54.07,4.38]]]}},
    {"type":"Feature","properties":{"name":"Amazonas"},"geometry":{"type":"Polygon","coordinates":[[[-74.0,2.2],[-74.0,-7.5],[-66.8,-7.9],[-60.5,-7.9],[-60.5,2.0],[-57.5,2.0],[-56.0,1.5],[-54.07,0.5],[-54.07,4.38],[-57.5,4.5],[-60.0,4.0],[-62.0,4.2],[-64.4,5.27],[-64.8,0.8],[-64.0,1.3],[-63.4,2.2],[-62.1,1.9],[-60.2,1.9],[-59.4,2.68],[-59.85,4.5],[-61.3,5.27],[-64.4,5.27],[-68.0,2.2],[-74.0,2.2]]]}},
    {"type":"Feature","properties":{"name":"Acre"},"geometry":{"type":"Polygon","coordinates":[[[-74.0,-7.5],[-66.8,-7.9],[-65.3,-10.0],[-67.3,-10.3],[-68.0,-11.0],[-70.5,-11.0],[-72.5,-9.5],[-74.0,-7.5]]]}},
    {"type":"Feature","properties":{"name":"Rondônia"},"geometry":{"type":"Polygon","coordinates":[[[-66.8,-7.9],[-60.5,-7.9],[-60.5,-9.8],[-63.0,-10.0],[-65.3,-10.0],[-66.8,-7.9]]]}},
    {"type":"Feature","properties":{"name":"Tocantins"},"geometry":{"type":"Polygon","coordinates":[[[-50.7,-5.2],[-47.0,-5.2],[-46.0,-7.0],[-46.0,-10.5],[-48.5,-13.4],[-50.7,-13.4],[-52.5,-11.0],[-52.5,-8.0],[-50.7,-5.2]]]}},
    {"type":"Feature","properties":{"name":"Maranhão"},"geometry":{"type":"Polygon","coordinates":[[[-48.8,-1.0],[-44.5,-1.0],[-43.0,-2.5],[-41.4,-2.8],[-41.4,-7.9],[-43.5,-9.5],[-46.0,-10.5],[-46.0,-7.0],[-47.0,-5.2],[-48.8,-3.5],[-48.8,-1.0]]]}},
    {"type":"Feature","properties":{"name":"Piauí"},"geometry":{"type":"Polygon","coordinates":[[[-41.4,-2.8],[-43.0,-2.5],[-44.5,-1.0],[-45.9,-3.0],[-45.9,-9.5],[-43.5,-9.5],[-41.4,-7.9],[-41.4,-2.8]]]}},
    {"type":"Feature","properties":{"name":"Ceará"},"geometry":{"type":"Polygon","coordinates":[[[-41.4,-2.8],[-37.3,-2.8],[-34.9,-4.8],[-37.3,-6.5],[-38.6,-6.9],[-41.4,-7.9],[-41.4,-2.8]]]}},
    {"type":"Feature","properties":{"name":"Rio Grande do Norte"},"geometry":{"type":"Polygon","coordinates":[[[-38.6,-4.8],[-34.9,-4.8],[-35.0,-6.0],[-37.3,-6.5],[-38.6,-4.8]]]}},
    {"type":"Feature","properties":{"name":"Paraíba"},"geometry":{"type":"Polygon","coordinates":[[[-38.8,-6.0],[-35.0,-6.0],[-34.8,-7.2],[-36.5,-7.2],[-38.8,-7.5],[-38.8,-6.0]]]}},
    {"type":"Feature","properties":{"name":"Pernambuco"},"geometry":{"type":"Polygon","coordinates":[[[-41.4,-7.9],[-38.6,-6.9],[-37.3,-6.5],[-35.0,-6.0],[-34.8,-7.2],[-34.8,-9.0],[-37.5,-9.5],[-40.0,-9.5],[-41.4,-9.5],[-41.4,-7.9]]]}},
    {"type":"Feature","properties":{"name":"Alagoas"},"geometry":{"type":"Polygon","coordinates":[[[-38.0,-9.0],[-35.0,-9.0],[-35.2,-10.5],[-37.0,-10.5],[-38.2,-10.0],[-38.0,-9.0]]]}},
    {"type":"Feature","properties":{"name":"Sergipe"},"geometry":{"type":"Polygon","coordinates":[[[-38.2,-9.5],[-37.0,-10.5],[-35.2,-10.5],[-35.2,-11.5],[-37.0,-11.5],[-38.2,-10.5],[-38.2,-9.5]]]}},
    {"type":"Feature","properties":{"name":"Bahia"},"geometry":{"type":"Polygon","coordinates":[[[-45.9,-9.5],[-40.0,-9.5],[-37.5,-9.5],[-34.8,-9.0],[-35.2,-11.5],[-37.0,-11.5],[-38.2,-10.5],[-39.5,-14.5],[-39.5,-18.4],[-40.5,-19.0],[-42.5,-18.4],[-44.5,-17.5],[-46.5,-15.5],[-47.5,-14.0],[-46.0,-10.5],[-45.9,-9.5]]]}},
    {"type":"Feature","properties":{"name":"Mato Grosso"},"geometry":{"type":"Polygon","coordinates":[[[-61.6,-7.5],[-57.5,-7.5],[-52.5,-8.0],[-52.5,-11.0],[-50.7,-13.4],[-51.5,-14.5],[-53.5,-17.5],[-58.2,-17.5],[-61.6,-14.0],[-61.6,-7.5]]]}},
    {"type":"Feature","properties":{"name":"Goiás"},"geometry":{"type":"Polygon","coordinates":[[[-53.5,-11.5],[-47.5,-11.5],[-47.5,-14.0],[-46.5,-15.5],[-48.0,-17.5],[-50.0,-19.5],[-51.5,-18.5],[-53.5,-17.5],[-51.5,-14.5],[-50.7,-13.4],[-52.5,-11.0],[-52.5,-8.0],[-53.5,-11.5]]]}},
    {"type":"Feature","properties":{"name":"Distrito Federal"},"geometry":{"type":"Polygon","coordinates":[[[-48.3,-15.5],[-47.3,-15.5],[-47.3,-16.1],[-48.3,-16.1],[-48.3,-15.5]]]}},
    {"type":"Feature","properties":{"name":"Mato Grosso do Sul"},"geometry":{"type":"Polygon","coordinates":[[[-58.2,-17.5],[-53.5,-17.5],[-51.5,-18.5],[-50.0,-19.5],[-50.0,-22.5],[-51.0,-22.5],[-54.6,-22.5],[-58.2,-24.1],[-58.2,-17.5]]]}},
    {"type":"Feature","properties":{"name":"Minas Gerais"},"geometry":{"type":"Polygon","coordinates":[[[-51.0,-14.2],[-47.5,-14.0],[-46.5,-15.5],[-44.5,-17.5],[-42.5,-18.4],[-40.5,-19.0],[-39.5,-18.4],[-39.5,-21.3],[-41.9,-21.3],[-44.9,-23.0],[-46.5,-23.5],[-48.0,-23.0],[-50.0,-22.5],[-51.0,-22.5],[-51.0,-14.2]]]}},
    {"type":"Feature","properties":{"name":"Espírito Santo"},"geometry":{"type":"Polygon","coordinates":[[[-41.9,-17.9],[-39.5,-17.9],[-39.5,-21.3],[-41.9,-21.3],[-41.9,-17.9]]]}},
    {"type":"Feature","properties":{"name":"Rio de Janeiro"},"geometry":{"type":"Polygon","coordinates":[[[-44.9,-21.0],[-41.9,-21.3],[-41.0,-23.4],[-43.5,-23.4],[-44.9,-23.0],[-46.5,-23.5],[-44.9,-21.0]]]}},
    {"type":"Feature","properties":{"name":"São Paulo"},"geometry":{"type":"Polygon","coordinates":[[[-53.1,-20.0],[-51.0,-19.8],[-48.0,-23.0],[-46.5,-23.5],[-44.9,-23.0],[-44.9,-24.0],[-47.5,-24.5],[-50.0,-24.5],[-51.0,-25.5],[-53.1,-25.0],[-53.1,-20.0]]]}},
    {"type":"Feature","properties":{"name":"Paraná"},"geometry":{"type":"Polygon","coordinates":[[[-54.6,-22.5],[-51.0,-22.5],[-50.0,-22.5],[-50.0,-24.5],[-51.0,-25.5],[-53.1,-25.0],[-54.6,-25.5],[-54.6,-22.5]]]}},
    {"type":"Feature","properties":{"name":"Santa Catarina"},"geometry":{"type":"Polygon","coordinates":[[[-53.9,-25.9],[-51.0,-25.5],[-48.5,-26.5],[-48.4,-29.4],[-51.5,-29.4],[-53.9,-29.4],[-53.9,-25.9]]]}},
    {"type":"Feature","properties":{"name":"Rio Grande do Sul"},"geometry":{"type":"Polygon","coordinates":[[[-57.6,-27.1],[-53.9,-27.1],[-51.5,-29.4],[-53.5,-33.8],[-57.6,-33.8],[-57.6,-27.1]]]}},
  ]},
};

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
    quarter:"Q1", inicio:"2026-03-04", fim:"2026-07-29", rep:"João Silva", email:"joao@cbth.com", tel:"+55 11 9999-0001", tournament:"WPF South America Open 2026",
    states:[
      {id:"s1a", name:"São Paulo", federation:"FPSP", memberStatus:"Member", inicio:"2026-01-01", fim:"2026-12-31", rep:"Carlos Motta", email:"carlos@fpsp.com.br", tel:"+55 11 3000-0001"},
      {id:"s1b", name:"Rio de Janeiro", federation:"FPRJ", memberStatus:"Member", inicio:"2026-02-01", fim:"2026-12-31", rep:"Ana Lima", email:"ana@fprj.com.br", tel:"+55 21 3000-0002"},
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
      const purpleColors = ["#c4b5fd","#a78bfa","#7c3aed","#4c1d95"];
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
            <Target size={15} color="#6366f1"/>
            <h2 style={{fontSize:14,fontWeight:700,margin:0}}>Path to {goalTotal} Federations</h2>
          </div>
          <p style={{fontSize:11,color:"#9ca3af",margin:0}}>Quarterly member acquisition target · Click a step to see records</p>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:28,fontWeight:700,color:"#1a1a1a",lineHeight:1,fontFamily:"'Playfair Display',Georgia,serif"}}>
            {totalMembers}<span style={{fontSize:14,color:"#9ca3af",fontWeight:400,marginLeft:4}}>/ {goalTotal}</span>
          </div>
          <div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{Math.round(pct)}% of goal</div>
        </div>
      </div>
      <div style={{height:4,background:"#f3f4f6",borderRadius:4,marginBottom:22,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background: pct >= 100 ? "linear-gradient(90deg,#16a34a,#4ade80)" : "linear-gradient(90deg,#c4b5fd,#7c3aed)",borderRadius:4,transition:"width 0.6s ease"}}/>
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
                <div style={{fontSize:22,fontWeight:700,lineHeight:1,fontFamily:"'Playfair Display',Georgia,serif",color:step.onTrack?"#16a34a":"#7c3aed"}}>{step.qGoal}</div>
                <div style={{fontSize:9,fontWeight:700,marginTop:3,color:step.onTrack?"#22c55e":"#ef4444"}}>
                  {step.onTrack?"✓ on track":"✗ behind"}
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
                  border:`2px solid ${isActive?step.color:"#e5e7eb"}`,
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
            <div style={{fontSize:22,fontWeight:700,lineHeight:1,fontFamily:"'Playfair Display',Georgia,serif",color:"#7c3aed"}}>{goalTotal}</div>
          </div>
          <div style={{width:48,height:BASE_H+STEP_INC*5,background:"linear-gradient(180deg,#f5f3ff,#ede9fe)",border:"2px dashed #7c3aed",borderRadius:"10px 10px 0 0",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Target size={16} color="#7c3aed"/>
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
            <h2 style={{margin:0,fontSize:17,fontWeight:700,fontFamily:"'Playfair Display',Georgia,serif"}}>{title}</h2>
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
          <h2 style={{fontSize:18,fontWeight:700,margin:0,fontFamily:"'Playfair Display',Georgia,serif"}}>{f.country||"New Country"}</h2>
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

// ── World Map ──────────────────────────────────────────────────
// Uses topojson-client imported via npm (no dynamic script injection)
function WorldMap({ countries, onCountryClick, showTrophies, showTasks }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    let cancelled = false;

    const byIso = {};
    countries.forEach(c => { if (c.country && ISO_MAP[c.country]) byIso[ISO_MAP[c.country]] = c; });

    const render = (world) => {
      if (cancelled || !containerRef.current) return;
      // ✅ Rule 1: Read width inside async callback — DOM is painted by now
      const W = el.clientWidth || 900;
      const H = Math.round(W * 0.52);

      d3.select(el).selectAll("*").remove();
      const svg = d3.select(el).append("svg")
        .attr("width","100%").attr("height",H)
        .attr("viewBox",`0 0 ${W} ${H}`);
      svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f1f5f9").attr("rx",8);

      // ✅ Rule 2: geoNaturalEarth1 + Sphere for world maps
      const proj = d3.geoNaturalEarth1().fitSize([W, H], { type:"Sphere" });
      const path = d3.geoPath().projection(proj);
      const features = window.topojson.feature(world, world.objects.countries).features;

      svg.selectAll("path").data(features).enter().append("path")
        .attr("d", path)
        .attr("fill", d => { const c = byIso[+d.id]; return c ? (STATUS_CFG[c.memberStatus]?.dot || "#cbd5e1") : "#dde3ea"; })
        .attr("stroke","#fff")
        .attr("stroke-width", d => byIso[+d.id] ? 1 : 0.4)
        .style("cursor", d => byIso[+d.id] ? "pointer" : "default")
        .on("mouseenter", function(e,d) { if (byIso[+d.id]) d3.select(this).attr("opacity",0.72); })
        .on("mouseleave", function(e,d) { d3.select(this).attr("opacity",1); })
        .on("click", (e,d) => { const c = byIso[+d.id]; if(c) onCountryClick(c); });

      Object.entries(byIso).forEach(([iso,c]) => {
        const feat = features.find(f => +f.id === +iso); if (!feat) return;
        const cen = path.centroid(feat); if (!cen || isNaN(cen[0]) || isNaN(cen[1])) return;

        const hasTrophy = showTrophies && c.tournament;
        const tasks = c.tasks || [];
        const openTasks = tasks.filter(t => t.taskStatus !== "Done");
        const overdueTasks = openTasks.filter(t => t.deadline && new Date(t.deadline) < new Date());
        const taskEmoji = showTasks && openTasks.length > 0 ? (overdueTasks.length > 0 ? "🔴" : "⚠️") : null;
        const hasExtra = hasTrophy || taskEmoji;

        svg.append("text").attr("x",cen[0]).attr("y",cen[1]+(hasExtra?10:2))
          .attr("text-anchor","middle").attr("font-size","9").attr("font-weight","700")
          .attr("fill","#1e293b").attr("pointer-events","none")
          .style("text-shadow","0 1px 2px rgba(255,255,255,0.9)").text(c.country);

        if (hasTrophy) {
          svg.append("text").attr("x",cen[0]-(taskEmoji?7:0)).attr("y",cen[1]-2)
            .attr("text-anchor","middle").attr("font-size","12").attr("pointer-events","none")
            .style("filter","drop-shadow(0 1px 2px rgba(0,0,0,0.3))").text("🏆");
        }
        if (taskEmoji) {
          svg.append("text").attr("x",cen[0]+(hasTrophy?7:0)).attr("y",cen[1]-2)
            .attr("text-anchor","middle").attr("font-size","12").attr("pointer-events","none")
            .style("filter","drop-shadow(0 1px 2px rgba(0,0,0,0.3))").text(taskEmoji);
        }
      });
    };

    const loadAndRender = () => {
      fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
        .then(r => r.json())
        .then(world => { if (!cancelled) render(world); })
        .catch(() => {
          if (!cancelled && containerRef.current)
            containerRef.current.innerHTML = '<p style="text-align:center;padding:60px;color:#9ca3af;font-size:13px">Map unavailable</p>';
        });
    };

    // ✅ Load topojson parser dynamically (no npm needed)
    if (window.topojson) {
      loadAndRender();
    } else {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js";
      s.onload = () => { if (!cancelled) loadAndRender(); };
      s.onerror = () => {
        if (!cancelled && containerRef.current)
          containerRef.current.innerHTML = '<p style="text-align:center;padding:60px;color:#9ca3af;font-size:13px">Map unavailable</p>';
      };
      document.head.appendChild(s);
    }

    return () => { cancelled = true; };
  }, [countries, showTrophies, showTasks]);

  return <div ref={containerRef} style={{width:"100%",minHeight:460,borderRadius:8,overflow:"hidden"}}/>;
}

// ── Country State Map ──────────────────────────────────────────
// Uses Natural Earth / geoBoundaries GeoJSON fetched from CDN
// Falls back to embedded simplified polygons for Brazil
function CountryStateMap({ country, states, onBack, onSaveStates }) {
  const svgRef = useRef(null);
  const [localStates, setLocalStates] = useState(states || []);
  const [showTrophies, setShowTrophies] = useState(true);
  const [tooltip, setTooltip] = useState(null); // {name, x, y, status, federation}
  const [geoData, setGeoData] = useState(null);
  const [geoLoading, setGeoLoading] = useState(true);

  useEffect(() => { setLocalStates(states || []); }, [states]);

  // Load GeoJSON for country states/provinces
  useEffect(() => {
    setGeoLoading(true);
    const iso3 = COUNTRY_ISO3[country.country];
    if (!iso3) {
      // use embedded fallback
      const emb = GEO_STATES[country.country];
      setGeoData(emb || null);
      setGeoLoading(false);
      return;
    }
    // Try geoBoundaries via jsDelivr CDN
    const url = `https://cdn.jsdelivr.net/gh/wmgeolab/geoBoundaries@main/releaseData/gbOpen/${iso3}/ADM1/geoBoundaries-${iso3}-ADM1_simplified.geojson`;
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(geo => { setGeoData(geo); setGeoLoading(false); })
      .catch(() => {
        const emb = GEO_STATES[country.country];
        setGeoData(emb || null);
        setGeoLoading(false);
      });
  }, [country.country]);

  // Render SVG map whenever geoData or states change
  useEffect(() => {
    const el = svgRef.current;
    if (!el || !geoData || geoLoading) return;

    const STATUS_COLOR = {
      Member:"#22c55e", Negotiating:"#f59e0b",
      Documentation:"#60a5fa", Needed:"#ef4444",
    };

    const statesByName = {};
    localStates.forEach(s => { if (s.name) statesByName[s.name.toLowerCase()] = s; });

    const W = el.parentElement?.clientWidth || 700;
    const H = Math.round(W * 0.6);

    d3.select(el).attr("width", W).attr("height", H).attr("viewBox", `0 0 ${W} ${H}`);
    d3.select(el).selectAll("*").remove();

    // background
    d3.select(el).append("rect").attr("width", W).attr("height", H).attr("fill", "#f1f5f9").attr("rx", 10);

    const features = geoData.features || [];
    if (!features.length) {
      d3.select(el).append("text").attr("x", W/2).attr("y", H/2)
        .attr("text-anchor","middle").attr("fill","#9ca3af").attr("font-size","13")
        .text("No state boundaries available for this country yet.");
      return;
    }

    const nameKey = ["shapeName","name","NAME_1","NAME","shapenam"]
      .find(k => features[0]?.properties?.[k] !== undefined)
      || Object.keys(features[0]?.properties || {})[0] || "name";

    const collection = { type:"FeatureCollection", features };
    const proj = d3.geoMercator().fitSize([W - 10, H - 10], collection).translate(
      [d3.geoMercator().fitSize([W - 10, H - 10], collection).translate()[0] + 5,
       d3.geoMercator().fitSize([W - 10, H - 10], collection).translate()[1] + 5]
    );
    const path = d3.geoPath().projection(proj);

    const g = d3.select(el).append("g");

    g.selectAll("path").data(features).enter().append("path")
      .attr("d", path)
      .attr("fill", d => {
        const name = (d.properties[nameKey] || "").toLowerCase();
        const st = statesByName[name];
        return st ? (STATUS_COLOR[st.memberStatus] || "#22c55e") : "#dde3ea";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", d => statesByName[(d.properties[nameKey]||"").toLowerCase()] ? 1.5 : 0.6)
      .style("cursor", "pointer")
      .on("mouseenter", function(e, d) {
        d3.select(this).attr("opacity", 0.75);
        const name = d.properties[nameKey] || "";
        const st = statesByName[name.toLowerCase()];
        const rect = el.getBoundingClientRect();
        setTooltip({ name, st, x: e.clientX - rect.left, y: e.clientY - rect.top });
      })
      .on("mousemove", function(e) {
        const rect = el.getBoundingClientRect();
        setTooltip(prev => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : prev);
      })
      .on("mouseleave", function() {
        d3.select(this).attr("opacity", 1);
        setTooltip(null);
      });

    // State name labels
    features.forEach(d => {
      const name = d.properties[nameKey] || "";
      const st = statesByName[name.toLowerCase()];
      const cen = path.centroid(d);
      if (!cen || isNaN(cen[0]) || isNaN(cen[1])) return;
      const hasTrophy = showTrophies && st?.tournament;
      const short = name.length > 14 ? name.slice(0, 12) + "…" : name;
      d3.select(el).append("text")
        .attr("x", cen[0]).attr("y", cen[1] + (hasTrophy ? 6 : 1))
        .attr("text-anchor","middle").attr("font-size","8").attr("font-weight","700")
        .attr("fill", st ? "#fff" : "#6b7280").attr("pointer-events","none")
        .style("text-shadow", st ? "0 1px 3px rgba(0,0,0,0.6)" : "0 1px 2px rgba(255,255,255,0.9)")
        .text(short);
      if (hasTrophy) {
        d3.select(el).append("text")
          .attr("x", cen[0]).attr("y", cen[1] - 6)
          .attr("text-anchor","middle").attr("font-size","11").attr("pointer-events","none")
          .style("filter","drop-shadow(0 1px 2px rgba(0,0,0,0.3))").text("🏆");
      }
    });
  }, [geoData, geoLoading, localStates, showTrophies]);

  const addState = () => {
    const s = {id:`s${Date.now()}`, name:"", federation:"", memberStatus:"Member", tournament:"", inicio:"", fim:"", rep:"", email:"", tel:""};
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

  const addState = () => {
    const s = {id:`s${Date.now()}`, name:"", federation:"", memberStatus:"Member", tournament:"", inicio:"", fim:"", rep:"", email:"", tel:""};
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

  return (
    <div style={{minHeight:"100vh",background:"#f7f6f3",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
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
        <span style={{fontSize:15,fontWeight:700,fontFamily:"'Playfair Display',Georgia,serif"}}>
          {country.country} — State Map
        </span>
        <div style={{marginLeft:"auto",display:"flex",gap:6,flexWrap:"wrap"}}>
          {Object.entries(STATUS_CFG).map(([s,c])=>(
            <span key={s} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:700,color:c.color,background:c.bg,padding:"3px 10px",borderRadius:20}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:c.dot,display:"inline-block"}}/>{s}
            </span>
          ))}
        </div>
      </div>

      <div style={{maxWidth:1200,margin:"0 auto",padding:"28px 24px"}}>
        {/* ── KPI Cards ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14,marginBottom:22}}>
          <div style={{background:"#fff",borderRadius:14,padding:"20px 16px",boxShadow:"0 1px 4px rgba(0,0,0,0.07)",textAlign:"center",border:"1px solid #f3f4f6"}}>
            <div style={{fontSize:11,color:"#9ca3af",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Total States</div>
            <div style={{fontSize:36,fontWeight:700,color:"#1a1a1a",fontFamily:"'Playfair Display',Georgia,serif",lineHeight:1}}>{localStates.length}</div>
          </div>
          {Object.entries(STATUS_CFG).map(([s,c])=>(
            <div key={s} style={{background:"#fff",borderRadius:14,padding:"20px 16px",boxShadow:"0 1px 4px rgba(0,0,0,0.07)",textAlign:"center",border:`1px solid ${c.bg}`}}>
              <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8,color:c.color}}>{s}</div>
              <div style={{fontSize:36,fontWeight:700,color:c.color,fontFamily:"'Playfair Display',Georgia,serif",lineHeight:1}}>{kpiCounts[s]}</div>
            </div>
          ))}
        </div>

        {/* ── Map Card ── */}
        <div style={{background:"#fff",borderRadius:16,padding:"22px 24px",marginBottom:22,boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <h2 style={{fontSize:15,fontWeight:700,margin:0,fontFamily:"'Playfair Display',Georgia,serif"}}>
              {country.country} — States by Status
            </h2>
            <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:12,color:"#6b7280",userSelect:"none",background:"#fffbeb",border:"1px solid #fcd34d",borderRadius:20,padding:"4px 12px"}}>
              <input type="checkbox" checked={showTrophies} onChange={e=>setShowTrophies(e.target.checked)} style={{accentColor:"#f59e0b",cursor:"pointer"}}/>
              🏆 Tournaments
            </label>
          </div>
          <div style={{width:"100%",borderRadius:10,overflow:"hidden",minHeight:420,position:"relative",background:"#f8fafc"}}>
            {geoLoading && (
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#9ca3af",fontSize:13}}>
                Loading map…
              </div>
            )}
            <svg ref={svgRef} style={{width:"100%",display:"block"}}/>
            {tooltip && (
              <div style={{position:"absolute",left:tooltip.x+14,top:tooltip.y-40,background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,padding:"10px 14px",fontSize:12,boxShadow:"0 4px 16px rgba(0,0,0,.12)",pointerEvents:"none",maxWidth:220,zIndex:10}}>
                <div style={{fontWeight:700,marginBottom:4,color:"#1a1a1a"}}>
                  {tooltip.name}{showTrophies && tooltip.st?.tournament ? " 🏆" : ""}
                </div>
                {tooltip.st ? (
                  <div style={{lineHeight:1.8}}>
                    <span style={{color:STATUS_CFG[tooltip.st.memberStatus]?.color,fontWeight:700,background:STATUS_CFG[tooltip.st.memberStatus]?.bg,padding:"1px 8px",borderRadius:10,fontSize:11}}>{tooltip.st.memberStatus}</span>
                    {tooltip.st.federation && <div style={{color:"#16a34a",fontWeight:600,marginTop:3}}>{tooltip.st.federation}</div>}
                    {tooltip.st.rep && <div style={{color:"#9ca3af",marginTop:2}}>{tooltip.st.rep}</div>}
                  </div>
                ) : (
                  <div style={{color:"#9ca3af",fontStyle:"italic",fontSize:11}}>No federation registered</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── States Table ── */}
        <div style={{background:"#fff",borderRadius:16,padding:"22px 24px",boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <h2 style={{fontSize:15,fontWeight:700,margin:0,fontFamily:"'Playfair Display',Georgia,serif"}}>Registered States & Federations</h2>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{background:"#f3f4f6",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:600,color:"#6b7280"}}>{localStates.length} states</span>
              <button onClick={addState}
                style={{display:"flex",alignItems:"center",gap:4,background:"#f0fdf4",border:"1px solid #86efac",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,color:"#16a34a",fontWeight:600}}
                onMouseEnter={e=>e.currentTarget.style.background="#dcfce7"}
                onMouseLeave={e=>e.currentTarget.style.background="#f0fdf4"}>
                <Plus size={12}/> Add State
              </button>
            </div>
          </div>
          {localStates.length===0
            ?<div style={{padding:"40px 0",textAlign:"center",color:"#c4c9d4",fontSize:13,fontStyle:"italic"}}>No states registered yet. Click "Add State" to begin.</div>
            :<div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{borderBottom:"2px solid #f3f4f6",background:"#fafafa"}}>
                    {["State / Province","Status","Tournament 🏆","Federation","Entry Date","Exit Date","Representative","Email","Phone",""].map(h=>(
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
                        <input value={st.name||""} onChange={e=>updateState(st.id,"name",e.target.value)} placeholder="State name"
                          style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:12,fontWeight:600,background:"transparent",outline:"none",width:"100%",minWidth:100}}/>
                      </td>
                      <td style={{padding:"9px 12px",minWidth:130}}>
                        <select value={st.memberStatus||"Member"} onChange={e=>updateState(st.id,"memberStatus",e.target.value)}
                          style={{border:"1px solid #e5e7eb",borderRadius:6,padding:"3px 8px",fontSize:11,background:"#fff",cursor:"pointer",
                            color:STATUS_CFG[st.memberStatus||"Member"]?.color,fontWeight:700}}>
                          {Object.keys(STATUS_CFG).map(o=><option key={o} value={o}>{o}</option>)}
                        </select>
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

function StatusHistoryEditor({ record, onUpdate, responsibles, setResponsibles }) {
  const hist = useMemo(()=>[...(record.statusHistory||[])].sort((a,b)=>a.date.localeCompare(b.date)),[record.statusHistory]);
  const statesList = record.states||[];
  const tasksList  = record.tasks||[];
  const [addingResp, setAddingResp] = useState(null);
  const [newRespName, setNewRespName] = useState("");

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
    const s = {id:`s${Date.now()}`, name:"", federation:"", memberStatus:"Member", inicio:"", fim:"", rep:"", email:"", tel:""};
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

  return (
    <tr>
      <td colSpan={12} style={{padding:"0 0 0 48px",background:"#f8faff",borderBottom:"2px solid #e0e7ff"}}>
        <div style={{padding:"14px 16px 14px 0"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <History size={13} color="#6366f1"/>
            <span style={{fontSize:11,fontWeight:700,color:"#6366f1",textTransform:"uppercase",letterSpacing:.8}}>
              Status History — {record.country||"(no name)"}
            </span>
            <span style={{fontSize:10,color:"#9ca3af",background:"#eef2ff",padding:"1px 7px",borderRadius:10}}>{hist.length} entries</span>
          </div>

          {hist.length === 0 && (
            <div style={{fontSize:12,color:"#9ca3af",padding:"8px 0",fontStyle:"italic"}}>No status changes recorded yet.</div>
          )}

          {hist.length > 0 && (
            <table style={{width:"100%",borderCollapse:"collapse",marginBottom:8}}>
              <thead>
                <tr>
                  {["Date","From Status","→  To Status",""].map(h=>(
                    <th key={h} style={{textAlign:"left",fontSize:10,color:"#9ca3af",fontWeight:600,padding:"4px 10px",borderBottom:"1px solid #e0e7ff",textTransform:"uppercase",letterSpacing:.5}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hist.map(h=>(
                  <tr key={h.id} style={{borderBottom:"1px solid #eef2ff"}}>
                    <td style={{padding:"5px 10px",minWidth:110}}><EditableCell value={h.date} type="date" onChange={val=>updateEntry(h.id,"date",val)}/></td>
                    <td style={{padding:"5px 10px",minWidth:130}}><EditableCell value={h.fromStatus} type="select" opts={ALL_STATUSES} onChange={val=>updateEntry(h.id,"fromStatus",val)}/></td>
                    <td style={{padding:"5px 10px",minWidth:130}}><EditableCell value={h.toStatus} type="select" opts={ALL_STATUSES.slice(1)} onChange={val=>updateEntry(h.id,"toStatus",val)}/></td>
                    <td style={{padding:"5px 6px",textAlign:"center"}}>
                      <button onClick={()=>removeEntry(h.id)}
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
          )}

          <button onClick={addEntry}
            style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"1px dashed #a5b4fc",borderRadius:6,
              padding:"4px 10px",cursor:"pointer",fontSize:11,color:"#6366f1",fontWeight:600,marginBottom:20}}
            onMouseEnter={e=>e.currentTarget.style.background="#eef2ff"}
            onMouseLeave={e=>e.currentTarget.style.background="none"}>
            <Plus size={11}/> Add status change
          </button>

          {/* States */}
          <div style={{borderTop:"1px solid #e0e7ff",paddingTop:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <Map size={13} color="#16a34a"/>
              <span style={{fontSize:11,fontWeight:700,color:"#16a34a",textTransform:"uppercase",letterSpacing:.8}}>States & Federations</span>
              <span style={{fontSize:10,color:"#9ca3af",background:"#dcfce7",padding:"1px 7px",borderRadius:10}}>{statesList.length} states</span>
            </div>
            {statesList.length === 0 && <div style={{fontSize:12,color:"#9ca3af",padding:"4px 0 10px",fontStyle:"italic"}}>No states added yet.</div>}
            {statesList.length > 0 && (
              <table style={{width:"100%",borderCollapse:"collapse",marginBottom:8}}>
                <thead><tr>{["State","Status","Federation","Entry","Exit","Rep","Email","Phone",""].map(h=>(
                  <th key={h} style={{textAlign:"left",fontSize:10,color:"#9ca3af",fontWeight:600,padding:"4px 10px",borderBottom:"1px solid #dcfce7",textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap"}}>{h}</th>
                ))}</tr></thead>
                <tbody>
                  {statesList.map(st=>(
                    <tr key={st.id} style={{borderBottom:"1px solid #f0fdf4"}}>
                      <td style={{padding:"4px 10px",minWidth:100}}><input value={st.name||""} onChange={e=>updateState(st.id,"name",e.target.value)} placeholder="State" style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:12,fontWeight:600,background:"transparent",outline:"none",width:"100%"}}/></td>
                      <td style={{padding:"4px 10px",minWidth:120}}>
                        <select value={st.memberStatus||"Member"} onChange={e=>updateState(st.id,"memberStatus",e.target.value)}
                          style={{border:"1px solid #e5e7eb",borderRadius:6,padding:"2px 5px",fontSize:11,background:"#fff",cursor:"pointer",color:STATUS_CFG[st.memberStatus||"Member"]?.color,fontWeight:600}}>
                          {Object.keys(STATUS_CFG).map(o=><option key={o} value={o}>{o}</option>)}
                        </select>
                      </td>
                      <td style={{padding:"4px 10px",minWidth:90}}><input value={st.federation||""} onChange={e=>updateState(st.id,"federation",e.target.value)} placeholder="Federation" style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:12,color:"#16a34a",fontWeight:600,background:"transparent",outline:"none",width:"100%"}}/></td>
                      <td style={{padding:"4px 10px",minWidth:110}}><EditableCell value={st.inicio} type="date" onChange={val=>updateState(st.id,"inicio",val)}/></td>
                      <td style={{padding:"4px 10px",minWidth:110}}><EditableCell value={st.fim} type="date" onChange={val=>updateState(st.id,"fim",val)}/></td>
                      <td style={{padding:"4px 10px",minWidth:120}}><input value={st.rep||""} onChange={e=>updateState(st.id,"rep",e.target.value)} placeholder="Rep." style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:12,background:"transparent",outline:"none",width:"100%"}}/></td>
                      <td style={{padding:"4px 10px",minWidth:140}}><input value={st.email||""} onChange={e=>updateState(st.id,"email",e.target.value)} placeholder="Email" style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:12,background:"transparent",outline:"none",width:"100%"}}/></td>
                      <td style={{padding:"4px 10px",minWidth:110}}><input value={st.tel||""} onChange={e=>updateState(st.id,"tel",e.target.value)} placeholder="Phone" style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"2px 0",fontSize:12,background:"transparent",outline:"none",width:"100%"}}/></td>
                      <td style={{padding:"4px 6px",textAlign:"center"}}>
                        <button onClick={()=>removeState(st.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#e5e7eb",padding:3,borderRadius:4,display:"flex",alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.color="#ef4444"} onMouseLeave={e=>e.currentTarget.style.color="#e5e7eb"}><X size={12}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button onClick={addState} style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"1px dashed #86efac",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,color:"#16a34a",fontWeight:600}} onMouseEnter={e=>e.currentTarget.style.background="#dcfce7"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
              <Plus size={11}/> Add state
            </button>
          </div>

          {/* Tasks */}
          <div style={{borderTop:"1px solid #e0e7ff",paddingTop:14,marginTop:4}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <Target size={13} color="#f59e0b"/>
              <span style={{fontSize:11,fontWeight:700,color:"#b45309",textTransform:"uppercase",letterSpacing:.8}}>Tasks — {record.country||"(no name)"}</span>
              <span style={{fontSize:10,color:"#9ca3af",background:"#fef3c7",padding:"1px 7px",borderRadius:10}}>{tasksList.length} tasks</span>
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
                      <td style={{padding:"4px 6px",textAlign:"center"}}>
                        <button onClick={()=>removeTask(t.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#e5e7eb",padding:3,borderRadius:4,display:"flex",alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.color="#ef4444"} onMouseLeave={e=>e.currentTarget.style.color="#e5e7eb"}><X size={12}/></button>
                      </td>
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
      </td>
    </tr>
  );
}

// ── Dashboard Tab ──────────────────────────────────────────────
function DashboardTab({ data, setData, goals = {} }) {
  const [kpiModal,   setKpiModal]   = useState(null);
  const [chartModal, setChartModal] = useState(null);
  const [stairModal, setStairModal] = useState(null);
  const [editModal,  setEditModal]  = useState(null);
  const [sfilt, setSfilt] = useState("All Status");
  const [cfilt, setCfilt] = useState("All Continents");
  const [showTrophies, setShowTrophies] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [expandedCountry, setExpandedCountry] = useState(null);

  const named   = useMemo(()=>data.filter(c=>c.country),[data]);
  const chartData = useMemo(()=>buildChartData(data),[data]);

  const kpis = useMemo(()=>({
    total:    {val:named.length,rows:named},
    active:   {val:named.filter(c=>c.memberStatus==="Member").length,rows:named.filter(c=>c.memberStatus==="Member")},
    expiring: {val:named.filter(c=>calcVig(c.inicio,c.fim).status==="Expiring").length,rows:named.filter(c=>calcVig(c.inicio,c.fim).status==="Expiring")},
    expired:  {val:named.filter(c=>calcVig(c.inicio,c.fim).status==="Expired").length,rows:named.filter(c=>calcVig(c.inicio,c.fim).status==="Expired")},
  }),[named]);

  const filtered = useMemo(()=>data.filter(c=>{
    if(sfilt!=="All Status"&&c.memberStatus!==sfilt) return false;
    if(cfilt!=="All Continents"&&c.continent!==cfilt) return false;
    return true;
  }),[data,sfilt,cfilt]);

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
    {key:"active",   icon:<Users size={20} color="#22c55e"/>,         label:"Active Members",       iconBg:"#dcfce7"},
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
        <h1 style={{fontSize:28,fontWeight:700,margin:"0 0 3px",fontFamily:"'Playfair Display',Georgia,serif"}}>WPF Member Nations</h1>
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
              <div style={{fontSize:30,fontWeight:600,lineHeight:1,color:"#1a1a1a",fontFamily:"'Playfair Display',Georgia,serif"}}>{kpis[key].val}</div>
              <div style={{fontSize:11,color:"#9ca3af",marginTop:3,fontWeight:500}}>{label}</div>
            </div>
          </button>
        ))}
      </div>

      <StaircaseBlock data={data} onStepClick={setStairModal} goals={goals}/>

      <div style={{background:"#fff",borderRadius:12,padding:22,marginBottom:18,boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <h2 style={{fontSize:14,fontWeight:700,margin:0}}>Member Map</h2>
          <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
            {Object.entries(STATUS_CFG).map(([s,c])=>(
              <span key={s} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#6b7280"}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:c.dot,flexShrink:0}}/>{s}
              </span>
            ))}
            <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:11,color:showTrophies?"#1a1a1a":"#9ca3af",padding:"4px 10px",borderRadius:20,border:"1px solid",borderColor:showTrophies?"#d4af37":"#e5e7eb",background:showTrophies?"#fffbeb":"#fafafa",transition:"all .2s",userSelect:"none"}}>
              <input type="checkbox" checked={showTrophies} onChange={e=>setShowTrophies(e.target.checked)} style={{accentColor:"#d4af37",width:13,height:13,cursor:"pointer"}}/>
              🏆 Tournaments
            </label>
            <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:11,color:showTasks?"#1a1a1a":"#9ca3af",padding:"4px 10px",borderRadius:20,border:"1px solid",borderColor:showTasks?"#f59e0b":"#e5e7eb",background:showTasks?"#fff7ed":"#fafafa",transition:"all .2s",userSelect:"none"}}>
              <input type="checkbox" checked={showTasks} onChange={e=>setShowTasks(e.target.checked)} style={{accentColor:"#f59e0b",width:13,height:13,cursor:"pointer"}}/>
              ⚠️ Tasks
            </label>
          </div>
        </div>
        <WorldMap countries={named} onCountryClick={setEditModal} showTrophies={showTrophies} showTasks={showTasks}/>
      </div>

      <div style={{background:"#fff",borderRadius:12,padding:22,marginBottom:18,boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
        <div style={{marginBottom:14}}>
          <h2 style={{fontSize:14,fontWeight:700,margin:"0 0 2px"}}>Monthly Status Progression</h2>
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

      <div style={{background:"#fff",borderRadius:12,padding:22,boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <h2 style={{fontSize:14,fontWeight:700,margin:0}}>Countries</h2>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{background:"#f3f4f6",padding:"3px 10px",borderRadius:20,fontSize:11,color:"#9ca3af"}}>{filtered.length} of {data.length}</span>
            {[{val:sfilt,set:setSfilt,opts:STATUSES},{val:cfilt,set:setCfilt,opts:CONTINENTS}].map((sel,i)=>(
              <select key={i} value={sel.val} onChange={e=>sel.set(e.target.value)}
                style={{border:"1px solid #e5e7eb",borderRadius:8,padding:"5px 10px",fontSize:11,color:"#374151",background:"#fff",cursor:"pointer"}}>
                {sel.opts.map(o=><option key={o}>{o}</option>)}
              </select>
            ))}
          </div>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{borderBottom:"2px solid #f3f4f6"}}>
                {["Country","Continent","Company","Quarter","Status","Start","End","Vigência","Days","Tournament"].map(h=>(
                  <th key={h} style={{textAlign:"left",fontSize:10,color:"#9ca3af",fontWeight:600,padding:"8px 12px",whiteSpace:"nowrap",textTransform:"uppercase",letterSpacing:.5}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c=>{
                const v=calcVig(c.inicio,c.fim);
                return (
                  <tr key={c.id} onClick={()=>setEditModal(c)} style={{borderBottom:"1px solid #f9fafb",cursor:"pointer"}}
                    onMouseEnter={e=>e.currentTarget.style.background="#f8faff"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"10px 12px",fontSize:13,fontWeight:600,color:c.country?"#111827":"#d1d5db"}}>{c.country||"—"}</td>
                    <td style={{padding:"10px 12px"}}>{c.continent?<span style={{background:"#f3f4f6",borderRadius:20,padding:"2px 9px",fontSize:11,color:"#374151"}}>{c.continent}</span>:<span style={{color:"#d1d5db"}}>—</span>}</td>
                    <td style={{padding:"10px 12px",fontSize:12,color:c.empresa?"#374151":"#d1d5db"}}>{c.empresa||"—"}</td>
                    <td style={{padding:"10px 12px"}}>{c.quarter?<span style={{fontSize:12,fontWeight:700,color:"#6366f1"}}>{c.quarter}</span>:<span style={{color:"#d1d5db",fontSize:12}}>—</span>}</td>
                    <td style={{padding:"10px 12px"}}><Badge status={c.memberStatus}/></td>
                    <td style={{padding:"10px 12px",fontSize:12,color:"#6b7280"}}>{fmt(c.inicio)}</td>
                    <td style={{padding:"10px 12px",fontSize:12,color:"#6b7280"}}>{fmt(c.fim)}</td>
                    <td style={{padding:"10px 12px"}}>{v.status?<span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:6,height:6,borderRadius:"50%",background:vigDot[v.status],flexShrink:0}}/><span style={{fontSize:12,color:v.color,fontWeight:600}}>{v.status}</span></span>:<span style={{color:"#d1d5db"}}>—</span>}</td>
                    <td style={{padding:"10px 12px",fontSize:12,fontWeight:600,color:v.color||"#9ca3af"}}>{v.label||"—"}</td>
                    <td style={{padding:"10px 12px",fontSize:12,color:c.tournament?"#374151":"#d1d5db",maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {c.tournament?<span style={{display:"flex",alignItems:"center",gap:5}}>🏆 {c.tournament}</span>:"—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button onClick={addRow} style={{marginTop:12,display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#9ca3af",padding:"5px 4px"}}>
          <Plus size={13}/> New country
        </button>
      </div>

      {kpiModal   &&<RecordsModal {...kpiModal}   onClose={()=>setKpiModal(null)}   onEdit={r=>{setKpiModal(null);  setEditModal(r);}}/>}
      {stairModal &&<RecordsModal {...stairModal} onClose={()=>setStairModal(null)} onEdit={r=>{setStairModal(null);setEditModal(r);}}/>}
      {chartModal &&<RecordsModal {...chartModal} onClose={()=>setChartModal(null)} onEdit={r=>{setChartModal(null);setEditModal(r);}}/>}
      {editModal  &&<EditModal row={editModal} onClose={()=>setEditModal(null)} onSave={r=>{save(r);}} onExpandCountry={r=>{const saved={...r,quarter:r.inicio?quarterFromDate(r.inicio):r.quarter};setData(p=>p.map(c=>c.id===saved.id?saved:c));setExpandedCountry(saved);}}/>}
    </div>
  );
}

// ── Data Tab ───────────────────────────────────────────────────
function DataTab({ data, setData, responsibles, setResponsibles }) {
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
        <h1 style={{fontSize:26,fontWeight:700,margin:"0 0 3px",fontFamily:"'Playfair Display',Georgia,serif"}}>Master Data</h1>
        <p style={{fontSize:12,color:"#9ca3af",margin:0,textTransform:"uppercase",letterSpacing:"1.5px",fontWeight:500}}>Complete database · expand any row to edit status history</p>
      </div>

      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:16,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search countries, companies, quarters..."
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
      </div>

      <div style={{background:"#fff",borderRadius:12,boxShadow:"0 1px 4px rgba(0,0,0,0.07)",overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:"#fafafa",borderBottom:"2px solid #f3f4f6"}}>
                <th style={{width:36,padding:"11px 6px 11px 14px"}}/>
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
                        <button onClick={()=>toggleExpand(row.id)}
                          style={{background:"none",border:"none",cursor:"pointer",color:isOpen?"#6366f1":"#9ca3af",padding:3,borderRadius:4,display:"flex",alignItems:"center"}}
                          title={isOpen?"Hide history":"Show history"}>
                          {isOpen?<ChevronDown size={14}/>:<ChevronRight size={14}/>}
                        </button>
                      </td>

                      {COLS.map(c=>(
                        <td key={c.key} style={{padding:"4px 14px",verticalAlign:"middle"}} onClick={e=>e.stopPropagation()}>
                          {c.key==="memberStatus"
                            ?<EditableCell value={row[c.key]} type="select" opts={Object.keys(STATUS_CFG)} onChange={val=>save({...row,[c.key]:val})}/>
                            :c.key==="continent"
                            ?<EditableCell value={row[c.key]} type="select" opts={CONTINENTS.slice(1)} onChange={val=>save({...row,[c.key]:val})}/>
                            :c.key==="quarter"
                            ?<span style={{fontSize:12,fontWeight:700,color:row[c.key]?"#6366f1":"#d1d5db",padding:"3px 4px",display:"block"}}>{row[c.key]||"—"}</span>
                            :c.key==="inicio"||c.key==="fim"
                            ?<EditableCell value={row[c.key]} type="date" onChange={val=>save({...row,[c.key]:val})}/>
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
                      <StatusHistoryEditor key={`hist-${row.id}`} record={row} onUpdate={save} responsibles={responsibles} setResponsibles={setResponsibles}/>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length===0&&<div style={{padding:40,textAlign:"center",color:"#9ca3af",fontSize:13}}>No records match the filters</div>}
      </div>
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
function Avatar({ name, size=42 }) {
  const bg = avatarColor(name||"?");
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",
      color:"#fff",fontWeight:700,fontSize:size*0.36,flexShrink:0,fontFamily:"'DM Sans',system-ui,sans-serif",letterSpacing:".5px"}}>
      {initials(name)}
    </div>
  );
}

// ── Responsible Modal ──────────────────────────────────────────
function ResponsibleModal({ person, onClose }) {
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
          <Avatar name={name} size={64}/>
          <div style={{flex:1}}>
            <h2 style={{margin:"0 0 4px",fontSize:20,fontWeight:700,fontFamily:"'Playfair Display',Georgia,serif"}}>{name}</h2>
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
              <div style={{fontSize:22,fontWeight:700,color,fontFamily:"'Playfair Display',Georgia,serif",lineHeight:1}}>{val}</div>
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
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [managing, setManaging] = useState(false);
  const [newName, setNewName] = useState("");
  const [newArea, setNewArea] = useState("");

  const people = useMemo(() => {
    const map = {};
    (responsibles||[]).forEach(r => {
      map[r.name] = { name: r.name, area: r.area ? [r.area] : [], tasks: [], rId: r.id };
    });
    data.forEach(record => {
      (record.tasks||[]).forEach(t => {
        const name = (t.responsible||"").trim();
        if (!name) return;
        if (!map[name]) map[name] = { name, area: [], tasks: [] };
        map[name].tasks.push({ ...t, country: record.country });
      });
    });
    return Object.values(map).sort((a,b) => a.name.localeCompare(b.name));
  }, [data, responsibles]);

  const filtered = useMemo(() => {
    if (!search) return people;
    const q = search.toLowerCase();
    return people.filter(p => p.name.toLowerCase().includes(q) || p.area.some(a => a.toLowerCase().includes(q)));
  }, [people, search]);

  const addPerson = () => {
    const name = newName.trim();
    if (!name) return;
    if ((responsibles||[]).find(r=>r.name.toLowerCase()===name.toLowerCase())) return;
    setResponsibles(p=>[...p, {id:`r${Date.now()}`, name, area: newArea.trim()}]);
    setNewName(""); setNewArea("");
  };
  const removePerson = (id) => setResponsibles(p=>p.filter(r=>r.id!==id));
  const updateArea   = (id, area) => setResponsibles(p=>p.map(r=>r.id===id?{...r,area}:r));

  return (
    <div style={{maxWidth:1000,margin:"0 auto",padding:"32px 20px"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:22,flexWrap:"wrap",gap:10}}>
        <div>
          <h1 style={{fontSize:26,fontWeight:700,margin:"0 0 3px",fontFamily:"'Playfair Display',Georgia,serif"}}>Responsibles</h1>
          <p style={{fontSize:12,color:"#9ca3af",margin:0,textTransform:"uppercase",letterSpacing:"1.5px",fontWeight:500}}>Task owners · click a name to see full profile</p>
        </div>
        <button onClick={()=>setManaging(m=>!m)}
          style={{display:"flex",alignItems:"center",gap:6,background:managing?"#1a1a1a":"#f3f4f6",color:managing?"#fff":"#374151",border:"none",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:600}}>
          <Users size={13}/> {managing ? "Close" : "Manage People"}
        </button>
      </div>

      {managing && (
        <div style={{background:"#fff",borderRadius:12,padding:"18px 20px",marginBottom:18,boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#6366f1",textTransform:"uppercase",letterSpacing:.8,marginBottom:12}}>People List</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
            {(responsibles||[]).map(r=>(
              <div key={r.id} style={{display:"flex",alignItems:"center",gap:6,background:"#f8faff",border:"1px solid #e0e7ff",borderRadius:20,padding:"4px 8px 4px 10px"}}>
                <Avatar name={r.name} size={20}/>
                <span style={{fontSize:12,fontWeight:600,color:"#1a1a1a"}}>{r.name}</span>
                <input value={r.area||""} onChange={e=>updateArea(r.id,e.target.value)} placeholder="area"
                  style={{border:"none",borderBottom:"1px solid #c7d2fe",background:"transparent",outline:"none",fontSize:11,color:"#6366f1",width:80,padding:"1px 0"}}/>
                <button onClick={()=>removePerson(r.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#d1d5db",padding:2,display:"flex",alignItems:"center",borderRadius:4}} onMouseEnter={e=>e.currentTarget.style.color="#ef4444"} onMouseLeave={e=>e.currentTarget.style.color="#d1d5db"}><X size={11}/></button>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Name" onKeyDown={e=>e.key==="Enter"&&addPerson()} style={{border:"1px solid #e5e7eb",borderRadius:8,padding:"6px 12px",fontSize:12,outline:"none",width:160}}/>
            <input value={newArea} onChange={e=>setNewArea(e.target.value)} placeholder="Area (optional)" onKeyDown={e=>e.key==="Enter"&&addPerson()} style={{border:"1px solid #e5e7eb",borderRadius:8,padding:"6px 12px",fontSize:12,outline:"none",width:180}}/>
            <button onClick={addPerson} style={{display:"flex",alignItems:"center",gap:5,background:"#1a1a1a",color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:12,fontWeight:600}}><Plus size={12}/> Add</button>
          </div>
        </div>
      )}

      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:16}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search by name or area..."
          style={{flex:1,border:"1px solid #e5e7eb",borderRadius:8,padding:"7px 14px",fontSize:13,outline:"none"}}/>
        <span style={{fontSize:11,color:"#9ca3af",background:"#f3f4f6",padding:"4px 10px",borderRadius:20}}>{filtered.length} people</span>
      </div>

      <div style={{background:"#fff",borderRadius:12,boxShadow:"0 1px 4px rgba(0,0,0,0.07)",overflow:"hidden"}}>
        {filtered.length === 0 ? (
          <div style={{padding:48,textAlign:"center",color:"#9ca3af",fontSize:14}}>
            {people.length === 0 ? "No responsibles yet. Use 'Manage People' to add them." : "No results found."}
          </div>
        ) : (
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead style={{background:"#fafafa",borderBottom:"2px solid #f3f4f6"}}>
              <tr>
                {["Responsible","Area","Total","Done","Overdue",""].map(h=>(
                  <th key={h} style={{textAlign:"left",fontSize:10,color:"#9ca3af",fontWeight:700,padding:"12px 16px",textTransform:"uppercase",letterSpacing:.6,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p,i) => {
                const total   = p.tasks.length;
                const done    = p.tasks.filter(t => t.taskStatus === "Done").length;
                const overdue = p.tasks.filter(t => t.taskStatus !== "Done" && t.deadline && new Date(t.deadline) < TODAY).length;
                const pct = total ? Math.round((done/total)*100) : 0;
                return (
                  <tr key={p.name} style={{borderBottom:"1px solid #f3f4f6",background:i%2===0?"#fff":"#fafbfc",cursor:"pointer"}}
                    onMouseEnter={e=>e.currentTarget.style.background="#f0f7ff"}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"#fff":"#fafbfc"}
                    onClick={()=>setSelected(p)}>
                    <td style={{padding:"12px 16px"}}><div style={{display:"flex",alignItems:"center",gap:10}}><Avatar name={p.name} size={34}/><span style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>{p.name}</span></div></td>
                    <td style={{padding:"12px 16px"}}>{p.area.length > 0 ? <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{p.area.map(a=>(<span key={a} style={{background:"#f3f4f6",color:"#374151",borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:500}}>{a}</span>))}</div> : <span style={{color:"#d1d5db",fontSize:12}}>—</span>}</td>
                    <td style={{padding:"12px 16px",fontSize:13,fontWeight:700,color:"#6366f1"}}>{total||<span style={{color:"#d1d5db"}}>0</span>}</td>
                    <td style={{padding:"12px 16px"}}>{total > 0 ? <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:13,fontWeight:700,color:"#15803d"}}>{done}</span><div style={{width:48,height:4,background:"#f3f4f6",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:"#22c55e",borderRadius:2}}/></div><span style={{fontSize:10,color:"#9ca3af"}}>{pct}%</span></div> : <span style={{color:"#d1d5db",fontSize:12}}>—</span>}</td>
                    <td style={{padding:"12px 16px"}}>{overdue > 0 ? <span style={{display:"flex",alignItems:"center",gap:5,fontSize:13,fontWeight:700,color:"#dc2626"}}>🔴 {overdue}</span> : <span style={{color:"#d1d5db",fontSize:13}}>—</span>}</td>
                    <td style={{padding:"12px 16px",textAlign:"right"}}><span style={{fontSize:11,color:"#6366f1",fontWeight:600,background:"#eef2ff",padding:"3px 10px",borderRadius:20}}>Ver perfil →</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && <ResponsibleModal person={selected} onClose={()=>setSelected(null)}/>}
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────
const INIT_RESPONSIBLES = [
  {id:"r1", name:"Karina", area:"Operations"},
  {id:"r2", name:"João Silva", area:"South America"},
];


// ── Goals & KPIs Tab ──────────────────────────────────────────
function GoalsTab({ goals, setGoals, data }) {
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

  const purpleQ = ["#c4b5fd","#a78bfa","#7c3aed","#4c1d95"];
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
    <div style={{maxWidth:900,margin:"0 auto",padding:"32px 24px",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,margin:"0 0 4px",fontFamily:"'Playfair Display',Georgia,serif"}}>Goals & KPIs</h1>
          <p style={{fontSize:13,color:"#9ca3af",margin:0}}>Edit targets for the Path to Federations chart</p>
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
                style={{border:"2px solid #6366f1",borderRadius:8,padding:"8px 12px",fontSize:20,fontWeight:700,color:"#6366f1",width:100,outline:"none",fontFamily:"'Playfair Display',Georgia,serif"}}/>
              <span style={{fontSize:12,color:"#9ca3af"}}>federations</span>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:16,padding:"0 20px",borderLeft:"1px solid #f3f4f6",borderRight:"1px solid #f3f4f6"}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:32,fontWeight:700,color:"#22c55e",fontFamily:"'Playfair Display',Georgia,serif",lineHeight:1}}>{totalMembers}</div>
              <div style={{fontSize:11,color:"#9ca3af",marginTop:4}}>current members</div>
            </div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:32,fontWeight:700,color:"#6366f1",fontFamily:"'Playfair Display',Georgia,serif",lineHeight:1}}>
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
                <tr key={q} style={{borderBottom:"1px solid #f3f4f6"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#f8faff"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"14px 14px"}}>
                    <span style={{fontWeight:800,fontSize:15,color:qColors[q],fontFamily:"'Playfair Display',Georgia,serif"}}>{q}</span>
                  </td>
                  <td style={{padding:"14px 14px"}}>
                    <input value={goals[q]?.label || ""} onChange={e=>updateQ(q,"label",e.target.value)}
                      style={{border:"none",borderBottom:"1px solid #e5e7eb",padding:"3px 0",fontSize:13,background:"transparent",outline:"none",width:120,color:"#374151"}}/>
                  </td>
                  <td style={{padding:"14px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <input type="number" min={1} value={qGoal}
                        onChange={e=>updateQ(q,"target",e.target.value)}
                        style={{border:`2px solid ${qColors[q]}`,borderRadius:8,padding:"6px 10px",fontSize:15,fontWeight:700,
                          color:qColors[q],width:72,outline:"none",fontFamily:"'Playfair Display',Georgia,serif",background:"#fff"}}/>
                      <span style={{fontSize:11,color:"#9ca3af"}}>members</span>
                    </div>
                  </td>
                  <td style={{padding:"14px 14px"}}>
                    <span style={{fontSize:16,fontWeight:700,color:"#1a1a1a",fontFamily:"'Playfair Display',Georgia,serif"}}>{thisCum}</span>
                  </td>
                  <td style={{padding:"14px 14px",minWidth:140}}>
                    <div style={{height:6,background:"#f3f4f6",borderRadius:4,overflow:"hidden",width:120}}>
                      <div style={{height:"100%",width:`${pct}%`,background:qColors[q],borderRadius:4,transition:"width .4s"}}/>
                    </div>
                    <div style={{fontSize:10,color:"#9ca3af",marginTop:4}}>{Math.round(pct)}%</div>
                  </td>
                  <td style={{padding:"14px 14px"}}>
                    <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,
                      background:onTrack?"#dcfce7":"#fee2e2",color:onTrack?"#16a34a":"#dc2626"}}>
                      {onTrack?"✓ On track":"✗ Behind"}
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

const DEFAULT_GOALS = {
  total: 55,
  Q1: { target: 10, label: "Jan – Mar" },
  Q2: { target: 20, label: "Apr – Jun" },
  Q3: { target: 35, label: "Jul – Sep" },
  Q4: { target: 55, label: "Oct – Dec" },
};

export default function App() {
  const [data,setData]=useState(INIT);
  const [tab,setTab]=useState("dashboard");
  const [responsibles, setResponsibles] = useState(INIT_RESPONSIBLES);
  const [goals, setGoals] = useState(DEFAULT_GOALS);

  return (
    <div style={{background:"#f7f6f3",minHeight:"100vh",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <div style={{background:"#fff",borderBottom:"1px solid #ede9e3",padding:"0 20px",position:"sticky",top:0,zIndex:100,display:"flex",alignItems:"center",gap:4}}>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"12px 0",marginRight:24}}>
          <div style={{width:28,height:28,background:"#1a1a1a",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Globe size={15} color="#fff"/>
          </div>
          <span style={{fontSize:14,fontWeight:700,color:"#1a1a1a",fontFamily:"'Playfair Display',Georgia,serif",letterSpacing:".2px"}}>WPF</span>
        </div>
        {[
          {id:"dashboard",    label:"Dashboard",    icon:<LayoutDashboard size={14}/>},
          {id:"data",         label:"Master Data",  icon:<Database size={14}/>},
          {id:"responsibles", label:"Responsibles", icon:<Users size={14}/>},
          {id:"goals",        label:"Goals & KPIs", icon:<Target size={14}/>},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"14px 14px",background:"none",border:"none",cursor:"pointer",
              fontSize:13,fontWeight:tab===t.id?600:400,color:tab===t.id?"#1a1a1a":"#9ca3af",fontFamily:"'DM Sans',system-ui,sans-serif",
              borderBottom:tab===t.id?"2px solid #1a1a1a":"2px solid transparent",transition:"all 0.15s",marginBottom:"-1px"}}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>
      {tab==="dashboard"    && <DashboardTab     data={data} setData={setData} goals={goals}/>}
      {tab==="data"         && <DataTab          data={data} setData={setData} responsibles={responsibles} setResponsibles={setResponsibles}/>}
      {tab==="responsibles" && <ResponsiblesTab  data={data} responsibles={responsibles} setResponsibles={setResponsibles}/>}
      {tab==="goals"        && <GoalsTab         goals={goals} setGoals={setGoals} data={data}/>}
    </div>
  );
}
