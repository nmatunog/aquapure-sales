import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken,
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  deleteDoc,
  writeBatch,
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  limit 
} from 'firebase/firestore';
import { 
  BookOpen, Calculator, BarChart3, Droplets, Building2, Factory, 
  CheckCircle, Save, Briefcase, LogOut, TrendingUp, FileText, 
  ArrowRight, ChevronDown, ChevronUp, Download, Trash2, RefreshCw,
  Info
} from 'lucide-react';

// --- Firebase Configuration & Initialization ---

// 1. Production Config (Hardcoded for Netlify/Deployment)
const productionConfig = {
  apiKey: "AIzaSyAMGHG5kEngAt2f3_bWathmuqJCpw4Oga0",
  authDomain: "aquapure-sales.firebaseapp.com",
  projectId: "aquapure-sales",
  storageBucket: "aquapure-sales.firebasestorage.app",
  messagingSenderId: "605090906668",
  appId: "1:605090906668:web:0b1b5703a8811b5789c789",
  measurementId: "G-MWBZKS1Z1P"
};

// 2. Hybrid Logic: Use AI Environment if available, otherwise use Production Config
let firebaseConfig;
let appId = 'aquapure-production'; // Default/Production App ID

try {
  if (typeof __firebase_config !== 'undefined') {
    // We are in the AI Preview Environment
    firebaseConfig = JSON.parse(__firebase_config);
    appId = typeof __app_id !== 'undefined' ? __app_id : appId;
  } else {
    // We are in Production (Netlify, Vercel, Localhost)
    firebaseConfig = productionConfig;
  }
} catch (e) {
  console.warn("Using production config due to environment check failure.");
  firebaseConfig = productionConfig;
}

// FIX: Sanitize appId to prevent "Invalid document reference" errors.
if (appId) {
  appId = appId.replace(/\//g, '_');
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- CSS STYLES ---
const styles = `
  * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body { margin: 0; padding: 0; background-color: #f8fafc; color: #334155; }
  
  /* Layout Utilities */
  .container { max-width: 900px; margin: 0 auto; padding: 1rem; padding-bottom: 6rem; }
  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .justify-center { justify-content: center; }
  .justify-end { justify-content: flex-end; }
  .gap-2 { gap: 0.5rem; }
  .gap-3 { gap: 0.75rem; }
  .gap-4 { gap: 1rem; }
  .grid { display: grid; }
  .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
  .w-full { width: 100%; }
  .relative { position: relative; }
  
  /* Responsive Grid */
  @media (min-width: 768px) {
    .md-grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  /* Spacing */
  .mb-1 { margin-bottom: 0.25rem; }
  .mb-2 { margin-bottom: 0.5rem; }
  .mb-4 { margin-bottom: 1rem; }
  .mb-6 { margin-bottom: 1.5rem; }
  .mt-4 { margin-top: 1rem; }
  .p-4 { padding: 1rem; }
  .p-6 { padding: 1.5rem; }
  
  /* Components */
  .card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; overflow: hidden; transition: box-shadow 0.2s; }
  .card:hover { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
  
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; font-size: 0.9rem; height: 40px; padding: 0 16px; }
  .btn-sm { height: 32px; padding: 0 12px; font-size: 0.8rem; }
  .btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn:active { transform: scale(0.98); }
  
  .btn-primary { background-color: #2563eb; color: white; }
  .btn-primary:hover { background-color: #1d4ed8; }
  
  .btn-secondary { background-color: white; color: #334155; border: 1px solid #cbd5e1; }
  .btn-secondary:hover { background-color: #f1f5f9; border-color: #94a3b8; }

  .btn-danger { background-color: #fee2e2; color: #ef4444; border: 1px solid #fecaca; }
  .btn-danger:hover { background-color: #fca5a5; color: #7f1d1d; }

  .btn-indigo { background-color: #4f46e5; color: white; }
  .btn-slate { background-color: #475569; color: white; }
  
  .input { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; outline: none; transition: all 0.2s; }
  .input:focus { border-color: #2563eb; ring: 2px solid #bfdbfe; }
  
  .label { display: block; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 6px; letter-spacing: 0.5px; }

  /* Toast */
  .toast {
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    background: #1e293b; color: white; padding: 12px 24px;
    border-radius: 99px; font-size: 0.9rem; font-weight: 500;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    z-index: 9999; animation: slideUp 0.3s ease-out;
    display: flex; align-items: center; gap: 8px;
  }
  @keyframes slideUp { from { transform: translate(-50%, 20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
  
  /* Typography */
  .text-xs { font-size: 0.75rem; }
  .text-sm { font-size: 0.875rem; }
  .text-lg { font-size: 1.125rem; }
  .text-xl { font-size: 1.25rem; }
  .text-2xl { font-size: 1.5rem; }
  .text-3xl { font-size: 1.875rem; }
  .text-4xl { font-size: 2.25rem; }
  .font-bold { font-weight: 700; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .text-slate-400 { color: #94a3b8; }
  .text-slate-500 { color: #64748b; }
  .text-slate-700 { color: #334155; }
  .text-slate-800 { color: #1e293b; }
  .text-slate-900 { color: #0f172a; }
  .text-blue-600 { color: #2563eb; }
  .text-green-500 { color: #22c55e; }
  .text-green-400 { color: #4ade80; }
  .text-red-500 { color: #ef4444; }
  .text-red-400 { color: #f87171; }
  .text-white { color: white; }
  
  /* Navigation */
  .nav-bar { position: sticky; top: 0; background: white; border-bottom: 1px solid #e2e8f0; z-index: 50; }
  .nav-item { flex: 1; display: flex; flexDirection: column; align-items: center; justify-content: center; padding: 12px 0; color: #94a3b8; background: none; border: none; border-bottom: 3px solid transparent; cursor: pointer; transition: all 0.2s; }
  .nav-item:hover { background-color: #f8fafc; color: #64748b; }
  .nav-item.active { color: #2563eb; border-bottom-color: #2563eb; background-color: #eff6ff; }
  
  .toggle-container { background: #e2e8f0; padding: 4px; border-radius: 10px; display: flex; }
  .toggle-btn { flex: 1; padding: 8px; border-radius: 8px; border: none; font-size: 0.9rem; font-weight: 600; color: #64748b; background: transparent; cursor: pointer; transition: all 0.2s; }
  .toggle-btn.active { background: white; color: #2563eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

  /* --- Print / Infographic Mode --- */
  @media print {
    body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .container { max-width: 100%; padding: 0; margin: 0; }
    .no-print { display: none !important; }
    .card { break-inside: avoid; border: 1px solid #e2e8f0; box-shadow: none; margin-bottom: 1rem; }
    .print-header { display: block !important; margin-bottom: 2rem; border-bottom: 2px solid #2563eb; padding-bottom: 1rem; }
    .print-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    
    /* Enhance colors for print */
    .bg-blue-100 { background-color: #dbeafe !important; }
    .bg-indigo-100 { background-color: #e0e7ff !important; }
  }
  .print-header { display: none; }
`;

// --- Components ---

const Card = ({ children, className = "", style = {} }) => (
  <div className={`card ${className}`} style={style}>
    {children}
  </div>
);

const Button = ({ children, onClick, className = "", disabled = false, style = {}, variant = "primary", size = "normal" }) => {
  const baseClass = `btn ${variant === 'secondary' ? 'btn-secondary' : variant === 'danger' ? 'btn-danger' : 'btn-primary'} ${size === 'sm' ? 'btn-sm' : ''} ${className}`;
  return (
    <button onClick={onClick} className={baseClass} disabled={disabled} style={style}>
      {children}
    </button>
  );
};

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  return (
    <div className="toast">
      <Info size={16} />
      {message}
    </div>
  );
};

// --- Login View ---
const LoginView = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('Cebu / Visayas');
  const [customTeam, setCustomTeam] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const finalTeam = selectedTeam === 'Others' ? customTeam : selectedTeam;
    if (!finalTeam.trim()) return;
    setLoading(true);
    onLogin({ name, team: finalTeam });
  };

  return (
    <div className="flex items-center justify-center" style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      <Card className="p-8" style={{ width: '100%', maxWidth: '400px', borderTop: '4px solid #2563eb' }}>
        <div className="text-center mb-6">
          <div style={{ background: '#dbeafe', width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Droplets size={32} color="#2563eb" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Aquapure Sales</h1>
          <p className="text-slate-500">Consultative Selling Portal</p>
        </div>
        <form onSubmit={handleLogin} className="flex-col gap-4 flex">
          <div>
            <label className="label">Agent Name</label>
            <input className="input" type="text" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Sales Team</label>
            <select className="input" value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}>
              <option>Cebu / Visayas</option>
              <option>Metro Manila North</option>
              <option>Metro Manila South</option>
              <option>Central Luzon</option>
              <option>Mindanao</option>
              <option>Others</option>
            </select>
            {selectedTeam === 'Others' && (
              <input className="input mt-2" type="text" placeholder="Enter Team Name" value={customTeam} onChange={e => setCustomTeam(e.target.value)} autoFocus required />
            )}
          </div>
          <Button className="w-full" disabled={loading} style={{height: '48px', fontSize: '1rem'}}>
            {loading ? 'Accessing...' : 'Start Session'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

// --- Calculator Components ---
const DealerCalc = ({ dealer, setDealer, saveAudit, saving }) => {
  const totalOpEx = (Number(dealer.electricity)||0) + (Number(dealer.rent)||0) + (Number(dealer.labor)||0) + (Number(dealer.maint)||0);
  const netProfit = (dealer.dailyOutput * dealer.daysOpen * dealer.sellingPrice) - totalOpEx;
  return (
    <div className="grid grid-cols-1 md-grid-cols-2 gap-6">
      <div className="flex-col gap-4 flex">
         <div>
            <label className="label">Client Name / Business</label>
            <input type="text" className="input" placeholder="e.g. Crystal Clear" value={dealer.clientName} onChange={e=>setDealer({...dealer, clientName: e.target.value})} />
         </div>
         <div className="grid grid-cols-2 gap-4">
           <div><label className="label">Daily Output (5gal)</label><input type="number" className="input" value={dealer.dailyOutput} onChange={e=>setDealer({...dealer, dailyOutput: +e.target.value})} /></div>
           <div><label className="label">Selling Price</label><input type="number" className="input" value={dealer.sellingPrice} onChange={e=>setDealer({...dealer, sellingPrice: +e.target.value})} /></div>
         </div>
         <div className="card p-4" style={{ background: '#f8fafc' }}>
           <span className="label">Monthly Expenses</span>
           <div className="grid grid-cols-2 gap-3 mt-2">
              <div><label className="label" style={{fontSize: '0.7rem'}}>Electricity</label><input type="number" className="input" style={{padding: '6px'}} value={dealer.electricity} onChange={e=>setDealer({...dealer, electricity: +e.target.value})} /></div>
              <div><label className="label" style={{fontSize: '0.7rem'}}>Rent</label><input type="number" className="input" style={{padding: '6px'}} value={dealer.rent} onChange={e=>setDealer({...dealer, rent: +e.target.value})} /></div>
              <div><label className="label" style={{fontSize: '0.7rem'}}>Labor</label><input type="number" className="input" style={{padding: '6px'}} value={dealer.labor} onChange={e=>setDealer({...dealer, labor: +e.target.value})} /></div>
              <div><label className="label" style={{fontSize: '0.7rem'}}>Maint</label><input type="number" className="input" style={{padding: '6px'}} value={dealer.maint} onChange={e=>setDealer({...dealer, maint: +e.target.value})} /></div>
           </div>
           <div className="text-right mt-3 text-red-500 font-bold text-sm">Total OpEx: ₱{totalOpEx.toLocaleString()}</div>
         </div>
      </div>
      <div className="card p-6 flex flex-col justify-between" style={{ background: '#0f172a', color: 'white', borderColor: '#0f172a' }}>
        <div>
          <h3 className="text-sm font-bold uppercase text-slate-400 mb-2">Net Profit Projection</h3>
          <div className="text-4xl font-bold text-green-400 mb-1">₱{netProfit.toLocaleString()}</div>
          <div className="text-sm text-slate-400">per month</div>
        </div>
        <div className="mt-8">
            <Button onClick={() => saveAudit({ ...dealer, netProfit }, 'Dealer')} disabled={saving} className="w-full" style={{backgroundColor: '#2563eb', color: 'white'}}>
            <Save size={18} /> {saving ? 'Saving...' : 'Save Calculation'}
            </Button>
        </div>
      </div>
    </div>
  );
};

const HOACalc = ({ hoa, setHoa, saveAudit, saving }) => (
  <div className="grid grid-cols-1 md-grid-cols-2 gap-6">
     <div className="flex-col gap-4 flex">
        <div><label className="label">Property Name</label><input type="text" className="input" placeholder="Condo Name" value={hoa.clientName} onChange={e=>setHoa({...hoa, clientName: e.target.value})} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Total Units</label><input type="number" className="input" value={hoa.units} onChange={e=>setHoa({...hoa, units: +e.target.value})} /></div>
          <div><label className="label">Deliveries/Unit</label><input type="number" className="input" value={hoa.deliveriesPerUnit} onChange={e=>setHoa({...hoa, deliveriesPerUnit: +e.target.value})} /></div>
        </div>
     </div>
     <div className="card p-6 flex flex-col justify-between" style={{ background: '#312e81', color: 'white', borderColor: '#312e81' }}>
        <div>
          <h3 className="text-sm font-bold uppercase" style={{color: '#a5b4fc'}}>Stranger Traffic Volume</h3>
          <div className="text-4xl font-bold mt-2 text-white">{(hoa.units * hoa.deliveriesPerUnit).toLocaleString()}</div>
          <div className="text-sm mt-1" style={{color: '#c7d2fe'}}>delivery entries / month</div>
        </div>
        <div className="mt-8">
            <Button onClick={() => saveAudit(hoa, 'HOA')} disabled={saving} className="w-full" style={{backgroundColor: '#4f46e5', color: 'white'}}>
            <Save size={18} /> {saving ? 'Saving...' : 'Save Survey'}
            </Button>
        </div>
     </div>
  </div>
);

const IndCalc = ({ indInputs, setIndInputs, saveAudit, saving }) => {
  const risk = (indInputs.reliability === 'Low' ? 6 : indInputs.reliability === 'Medium' ? 3 : 1) * (indInputs.downtimeCost * indInputs.repairTime);
  return (
  <div className="grid grid-cols-1 md-grid-cols-2 gap-6">
     <div className="flex-col gap-4 flex">
        <div><label className="label">Company Name</label><input type="text" className="input" placeholder="Factory Name" value={indInputs.clientName} onChange={e=>setIndInputs({...indInputs, clientName: e.target.value})} /></div>
        <div>
           <label className="label">Industry Type</label>
           <select className="input" value={indInputs.type} onChange={e=>setIndInputs({...indInputs, type: e.target.value})}>
              <option>Ice Plant</option><option>Hotel</option><option>Food Proc</option>
           </select>
        </div>
        <div><label className="label">Downtime Cost (₱/hr)</label><input type="number" className="input" value={indInputs.downtimeCost} onChange={e=>setIndInputs({...indInputs, downtimeCost: +e.target.value})} /></div>
        <div>
           <label className="label">Reliability</label>
           <div className="flex gap-2">
              {['Low', 'Medium', 'High'].map(r => (
                <button key={r} onClick={()=>setIndInputs({...indInputs, reliability: r})} className={`btn flex-1 py-2 ${indInputs.reliability === r ? 'btn-slate' : 'btn-secondary'}`}>{r}</button>
              ))}
           </div>
        </div>
     </div>
     <div className="card p-6 flex flex-col justify-between" style={{ background: '#0f172a', color: 'white', borderColor: '#0f172a' }}>
        <div>
          <h3 className="text-sm font-bold uppercase text-slate-400">Est. Annual Risk Exposure</h3>
          <div className="text-4xl font-bold text-red-400 mt-2">₱{risk.toLocaleString()}</div>
          <div className="text-sm text-slate-400 mt-1">potential loss per year</div>
        </div>
        <div className="mt-8">
            <Button onClick={() => saveAudit({ ...indInputs, risk }, 'Industrial')} disabled={saving} className="w-full" style={{backgroundColor: '#475569', color: 'white', border: '1px solid #64748b'}}>
            <Save size={18} /> {saving ? 'Saving...' : 'Save Risk Analysis'}
            </Button>
        </div>
     </div>
  </div>
  )
};

const AuditTools = ({ user, showToast }) => {
  const [clientType, setClientType] = useState('dealer');
  const [saving, setSaving] = useState(false);
  const [dealer, setDealer] = useState({ clientName: '', dailyOutput: 50, sellingPrice: 25, electricity: 2500, rent: 5000, labor: 12000, maint: 3000, daysOpen: 26 });
  const [hoa, setHoa] = useState({ clientName: '', units: 100, deliveryRisk: 'High', waterSource: 'delivery', wastePerUnit: 4, deliveriesPerUnit: 4, complaints: 3 });
  const [indInputs, setIndInputs] = useState({ clientName: '', type: 'Ice Plant', downtimeCost: 50000, reliability: 'Medium', repairTime: 4 });

  const saveAudit = async (data, type) => {
    if (!user) return;
    if (!data.clientName || data.clientName.trim() === '') { alert('Please enter a Client Name before saving.'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'saved_audits'), { type, data, timestamp: serverTimestamp(), summary: type });
      showToast('Audit saved successfully!');
    } catch (error) { console.error(error); }
    setSaving(false);
  };

  return (
    <div className="container">
      <div className="toggle-container mb-6">
        {[ {id:'dealer', l:'Dealer'}, {id:'hoa', l:'HOA'}, {id:'industrial', l:'Comm-Ind'} ].map(t => (
          <button key={t.id} onClick={()=>setClientType(t.id)} className={`toggle-btn ${clientType === t.id ? 'active' : ''}`}>{t.l}</button>
        ))}
      </div>
      {clientType === 'dealer' && <DealerCalc dealer={dealer} setDealer={setDealer} saveAudit={saveAudit} saving={saving} />}
      {clientType === 'hoa' && <HOACalc hoa={hoa} setHoa={setHoa} saveAudit={saveAudit} saving={saving} />}
      {clientType === 'industrial' && <IndCalc indInputs={indInputs} setIndInputs={setIndInputs} saveAudit={saveAudit} saving={saving} />}
    </div>
  );
};

// --- Workshop Module ---
const WorkshopView = () => {
  const [expanded, setExpanded] = useState(null);
  const items = [
    { 
      id: 'dealer', 
      icon: <Droplets color="white"/>, 
      bg: '#2563eb', 
      title: "Water Dealers", 
      from: "Price per Liter", 
      to: "Zero Maintenance", 
      strategy: "The Hunter", 
      desc: (
        <div>
          <p className="mb-4"><strong style={{color: '#2563eb'}}>The Pivot:</strong> Move away from competing on price per liter. Instead, position your water refill station as a <strong>zero-maintenance profit center</strong> that eliminates operational headaches and maximizes dealer profitability.</p>
          <div className="mb-4">
            <strong className="block mb-2 text-slate-900">Key Value Propositions:</strong>
            <ul style={{listStyle: 'disc', paddingLeft: '1.25rem', margin: 0}}>
              <li className="mb-1"><strong>Eliminate Maintenance Costs:</strong> No more filter replacements, equipment repairs, or technical expertise needed.</li>
              <li className="mb-1"><strong>Reduce Labor Overhead:</strong> Automated system means less staff time managing water quality.</li>
              <li className="mb-1"><strong>Increase Profit Margins:</strong> Higher selling price without the operational complexity.</li>
              <li><strong>Reliability Guarantee:</strong> Consistent water quality builds customer trust and repeat business.</li>
            </ul>
          </div>
          <p><strong style={{color: '#2563eb'}}>The Hunter Approach:</strong> Focus on dealers who are <strong>actively struggling</strong> with maintenance costs, equipment downtime, or quality complaints.</p>
        </div>
      )
    },
    { 
      id: 'hoa', 
      icon: <Building2 color="white"/>, 
      bg: '#4f46e5', 
      title: "HOAs & Condos", 
      from: "Water Delivery", 
      to: "Community Amenity", 
      strategy: "The Developer", 
      desc: (
        <div>
          <p className="mb-4"><strong style={{color: '#4f46e5'}}>The Pivot:</strong> Transform water from a logistical burden into a premium community amenity that enhances property value and resident satisfaction.</p>
          <div className="mb-4">
            <strong className="block mb-2 text-slate-900">Key Value Propositions:</strong>
            <ul style={{listStyle: 'disc', paddingLeft: '1.25rem', margin: 0}}>
              <li className="mb-1"><strong>Reduce Security Risks:</strong> Eliminate frequent delivery truck entries and reduce unauthorized access points</li>
              <li className="mb-1"><strong>Enhance Property Value:</strong> On-site water refill station becomes a selling point for new residents</li>
              <li className="mb-1"><strong>Convenience for Residents:</strong> 24/7 access to purified water without leaving the property</li>
              <li><strong>Lower HOA Costs:</strong> Reduce delivery coordination, security concerns, and resident complaints</li>
            </ul>
          </div>
          <p><strong style={{color: '#4f46e5'}}>The Developer Approach:</strong> Position the water refill station as part of a long-term community development strategy.</p>
        </div>
      )
    },
    { 
      id: 'ind', 
      icon: <Factory color="white"/>, 
      bg: '#7c3aed', 
      title: "Commercial-Ind", 
      from: "Commodity", 
      to: "Ingredient Integrity", 
      strategy: "The Partner", 
      desc: (
        <div>
          <p className="mb-4"><strong style={{color: '#7c3aed'}}>The Pivot:</strong> Water is a raw material. Sell <strong>Supply Chain Reliability</strong> and redundancy.</p>
          <div className="mb-4">
            <strong className="block mb-2 text-slate-900">Key Value Propositions:</strong>
            <ul style={{listStyle: 'disc', paddingLeft: '1.25rem', margin: 0}}>
              <li className="mb-1"><strong>Prevent production halts</strong></li>
              <li className="mb-1"><strong>Certified safety standards</strong></li>
              <li className="mb-1"><strong>Volume consistency</strong></li>
              <li><strong>Redundancy planning</strong></li>
            </ul>
          </div>
          <p><strong style={{color: '#7c3aed'}}>The Partner Approach:</strong> Act as a risk consultant. Calculate the cost of their current water supply failing.</p>
        </div>
      )
    }
  ];

  return (
    <div className="container">
      <div className="mb-6"><h3 className="text-xl font-bold">The Concept Pivot</h3><p className="text-slate-500 text-sm">Tap a card to view strategy.</p></div>
      <div className="flex-col gap-4 flex">
        {items.map((item) => (
          <Card key={item.id} style={{ borderLeft: `4px solid ${item.bg}` }}>
            <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
              <div style={{ background: item.bg, padding: '8px', borderRadius: '8px' }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div className="flex justify-between">
                  <h4 className="font-bold text-lg">{item.title}</h4>
                  {expanded === item.id ? <ChevronUp size={20} color="#94a3b8"/> : <ChevronDown size={20} color="#94a3b8"/>}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>{item.from}</span> <ArrowRight size={14}/> <span style={{ color: item.bg, fontWeight: 'bold' }}>{item.to}</span>
                </div>
              </div>
            </div>
            {expanded === item.id && (
              <div style={{ background: '#f8fafc', padding: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
                <div style={{display:'inline-block', padding:'2px 8px', borderRadius:'99px', background:'white', border:'1px solid #cbd5e1', fontSize:'10px', fontWeight:'bold', textTransform:'uppercase', marginBottom:'8px'}}>Persona: {item.strategy}</div>
                <div className="text-sm text-slate-700 leading-relaxed">{item.desc}</div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

// --- Scorecard ---
const Scorecard = ({ user, profile, showToast }) => {
  const [data, setData] = useState({});
  useEffect(() => {
    if(!user) return;
    return onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'weekly_metrics', 'current'), d => setData(d.exists() ? d.data() : {}));
  }, [user]);

  const update = async (k, v) => {
    if(!user) return;
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'weekly_metrics', 'current'), { ...data, [k]: Math.max(0, (data[k]||0)+v) }, { merge: true });
  };

  const handleReset = async () => {
    if(!user || !confirm("Are you sure you want to reset all scorecard metrics to zero?")) return;
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'weekly_metrics', 'current'), {});
    showToast('Scorecard reset successfully.');
  };

  const handlePrint = () => {
    showToast("Opening Print Dialog... (If blocked, press Ctrl+P)");
    setTimeout(() => {
       window.focus();
       window.print();
    }, 500);
  };

  const MetricRow = ({ label, k, target, color }) => (
    <div className="card p-4 mb-3 flex items-center justify-between no-print-shadow">
      <div style={{flex: 1}}>
        <h4 className="text-sm font-bold text-slate-700">{label}</h4>
        <div style={{width:'100%', height:'8px', background:'#f1f5f9', borderRadius:'99px', marginTop:'8px', maxWidth:'140px'}}>
          <div style={{height:'100%', width:`${Math.min(100, ((data[k]||0)/target)*100)}%`, background: color, borderRadius:'99px', transition:'width 0.3s'}}></div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-2xl font-bold text-slate-800">{data[k]||0}</span>
        <div className="flex gap-1 no-print">
          <button onClick={()=>update(k, -1)} className="btn btn-secondary" style={{width:'36px', height:'36px', padding:0}}>-</button>
          <button onClick={()=>update(k, 1)} className="btn" style={{width:'36px', height:'36px', padding:0, background: color, color:'white'}}>+</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container">
      {/* Print Header */}
      <div className="print-header">
         <div className="flex items-center gap-2 mb-2">
            <Droplets size={24} color="#2563eb" />
            <h1 className="text-2xl font-bold text-slate-900">Aquapure Sales Scorecard</h1>
         </div>
         <p className="text-slate-500">Weekly Performance Report</p>
      </div>

      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold no-print">Scorecard</h2>
          <div className="text-sm text-slate-500 mt-1">Agent: <b>{profile?.name}</b> • {new Date().toLocaleDateString()}</div>
        </div>
        <div className="flex gap-2 no-print">
            <Button variant="danger" size="sm" onClick={handleReset}><RefreshCw size={14}/> Reset</Button>
            <Button variant="secondary" onClick={handlePrint}><Download size={16}/> Download Report</Button>
        </div>
      </div>
      
      <div className="print-grid md:grid md:grid-cols-2 md:gap-8">
        <div>
            <h3 className="text-xs font-bold uppercase text-slate-400 mb-3 border-b pb-2">Activity Metrics</h3>
            <MetricRow label="Dealer Profit Audits" k="dealerAudits" target={5} color="#2563eb" />
            <MetricRow label="HOA Site Surveys" k="hoaSurveys" target={3} color="#4f46e5" />
            <MetricRow label="Ind. Risk Consults" k="industrialMeetings" target={2} color="#7c3aed" />
        </div>
        <div className="mt-6 md:mt-0">
            <h3 className="text-xs font-bold uppercase text-slate-400 mb-3 border-b pb-2">Sales Results</h3>
            <MetricRow label="Dealer Conversions" k="dealerConversions" target={1} color="#22c55e" />
            <MetricRow label="Stations Installed" k="newRefillStations" target={1} color="#14b8a6" />
            <MetricRow label="Bulk Contracts" k="bulkContracts" target={1} color="#059669" />
        </div>
      </div>
    </div>
  );
};

// --- Reports ---
const ReportsView = ({ user, showToast }) => {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    if(!user) return;
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'saved_audits'), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(q, s => setLogs(s.docs.map(d => ({id: d.id, ...d.data()}))));
  }, [user]);

  const handleClearHistory = async () => {
    if(!user || !confirm("This will delete all saved reports history. This cannot be undone. Continue?")) return;
    
    // Batch delete
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'saved_audits'));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    showToast('History cleared.');
  };

  const handlePrint = () => {
    showToast("Opening Print Dialog... (If blocked, press Ctrl+P)");
    setTimeout(() => {
       window.focus();
       window.print();
    }, 500);
  };

  return (
    <div className="container">
      {/* Print Header */}
      <div className="print-header">
         <div className="flex items-center gap-2 mb-2">
            <Droplets size={24} color="#2563eb" />
            <h1 className="text-2xl font-bold text-slate-900">Pipeline History</h1>
         </div>
         <p className="text-slate-500">Generated on {new Date().toLocaleDateString()}</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold no-print">Pipeline History</h2>
        <div className="flex gap-2 no-print">
             <Button variant="danger" size="sm" onClick={handleClearHistory} disabled={logs.length === 0}><Trash2 size={14}/> Clear Data</Button>
             <Button variant="secondary" onClick={handlePrint}><Download size={16}/> Download Summary</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {logs.map((l, i) => (
          <Card key={i} className="p-4" style={{borderLeft: `4px solid ${l.type==='Dealer'?'#2563eb':l.type==='HOA'?'#4f46e5':'#7c3aed'}`}}>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span style={{fontSize:'10px', fontWeight:'bold', textTransform:'uppercase', background:'#f1f5f9', padding:'2px 6px', borderRadius:'4px', color: '#64748b'}}>{l.type}</span>
                  <span className="text-xs text-slate-500">{l.timestamp?.seconds ? new Date(l.timestamp.seconds*1000).toLocaleDateString() : 'Just now'}</span>
                </div>
                <div className="font-bold text-base text-slate-800">{l.data?.clientName || 'Unknown Client'}</div>
                <div className="text-sm text-slate-500 mt-1">{l.summary}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg text-slate-700">
                  {l.type === 'Dealer' && `₱${l.data.netProfit?.toLocaleString()}`}
                  {l.type === 'HOA' && `${(l.data.units * l.data.deliveriesPerUnit).toLocaleString()}`}
                  {l.type === 'Industrial' && `₱${l.data.risk?.toLocaleString()}`}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                    {l.type === 'Dealer' ? 'Monthly Profit' : l.type === 'HOA' ? 'Monthly Entries' : 'Annual Risk'}
                </div>
              </div>
            </div>
          </Card>
        ))}
        {logs.length === 0 && <div className="text-center text-slate-400 py-12 border-2 border-dashed border-slate-200 rounded-xl">No records found. Start using the Tools to generate data.</div>}
      </div>
    </div>
  );
};

// --- App Shell ---
const App = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState('workshop');
  const [init, setInit] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
  };

  useEffect(() => {
    // 3. Updated Auth Init Logic (Hybrid)
    const runAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          // Note: In production, we might wait for explicit login action, 
          // but for now we allow anonymous sign-in to check for existing sessions.
          // If you want to force login screen on every refresh, remove this auto-signin
          // and only call signInAnonymously in handleLogin.
          // However, standard app behavior is to persist session.
          // The fix below in handleLogout handles the "exit" correctly.
        }
      } catch (e) {
        console.error("Auth init error:", e);
      }
    };
    runAuth();
    
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if(u) {
        const s = await getDoc(doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'main'));
        if(s.exists()) setProfile(s.data());
      } else {
        setProfile(null);
      }
      setInit(false);
    });
  }, []);

  const handleLogin = async (d) => {
    // Ensure we have a user. If not (fresh load without auto-login), sign in now.
    let currentUser = user;
    if (!currentUser) {
        try {
            const result = await signInAnonymously(auth);
            currentUser = result.user;
            setUser(currentUser);
        } catch (e) {
            console.error("Login failed", e);
            return;
        }
    }
    
    if(!currentUser) return;
    await setDoc(doc(db, 'artifacts', appId, 'users', currentUser.uid, 'profile', 'main'), d);
    setProfile(d);
  };

  const handleLogout = async () => {
    // FIX: Actually sign out of Firebase to prevent auto-login on refresh
    try {
        await signOut(auth);
        setProfile(null);
        setUser(null);
    } catch (e) {
        console.error("Logout error", e);
    }
  };

  if(init) return <div style={{display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', color:'#2563eb', fontWeight:'bold'}}>Loading...</div>;
  
  // Inject CSS directly to bypass Tailwind build issues
  return (
    <>
      <style>{styles}</style>
      {!profile ? <LoginView onLogin={handleLogin} /> : (
        <div className="flex-col flex" style={{minHeight:'100vh'}}>
          <div className="nav-bar no-print">
            <div className="flex justify-between items-center px-4 py-3" style={{borderBottom:'1px solid #f1f5f9'}}>
              <div className="flex items-center gap-2">
                <div style={{background:'#2563eb', padding:'6px', borderRadius:'8px'}}><Droplets size={20} color="white"/></div>
                <span className="font-bold text-lg">Aquapure</span>
              </div>
              <button onClick={handleLogout} style={{background:'none', border:'none', cursor:'pointer', color:'#94a3b8'}}><LogOut size={20}/></button>
            </div>
            <div className="flex justify-between px-2">
              {[ {id:'workshop', i:<BookOpen size={20}/>, l:'Pivot'}, {id:'audit', i:<Calculator size={20}/>, l:'Tools'}, {id:'scorecard', i:<BarChart3 size={20}/>, l:'Score'}, {id:'reports', i:<Briefcase size={20}/>, l:'History'} ].map(n => (
                <button key={n.id} onClick={()=>setView(n.id)} className={`nav-item ${view===n.id?'active':''}`}>
                  {n.i} <span style={{fontSize:'10px', marginTop:'4px', fontWeight:'600'}}>{n.l}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{flex:1}}>
            {view === 'workshop' && <WorkshopView />}
            {view === 'audit' && <AuditTools user={user} showToast={showToast} />}
            {view === 'scorecard' && <Scorecard user={user} profile={profile} showToast={showToast} />}
            {view === 'reports' && <ReportsView user={user} showToast={showToast} />}
          </div>
          <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
        </div>
      )}
    </>
  );
};

export default App;