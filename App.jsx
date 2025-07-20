import { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:4000';

// Styled payment icons by method
const methodIcons = {
  UPI: "💸", PayPal: "🅿️", Cash: "💵", 'Bank Transfer': "🏦",
  GPay: "🟢", PhonePe: "🟣", Paytm: "🔵", "None": "❓"
};
const paymentMethods = ["UPI","PayPal","Cash","Bank Transfer","GPay","PhonePe","Paytm"];

// ------- Components -------
function Login({setToken}) {
  const [username, setUsername] = useState(''), [pw, setPw] = useState(''), [isLogin, setIsLogin] = useState(true), [err, setErr]=useState('');
  async function submit(e){
    e.preventDefault();
    try {
      let route = isLogin ? 'login' : 'signup';
      const {data} = await axios.post(API + '/' + route, {username, password:pw});
      setToken(data.token); setErr('');
    } catch(e) { setErr(e?.response?.data || "Error"); }
  }
  return (
    <div className="flex flex-col items-center mt-20">
      <h1 className="text-3xl font-semibold mb-4">{isLogin?'Login':'Sign Up'}</h1>
      <form onSubmit={submit} className="bg-slate-800 p-8 rounded-lg shadow-lg w-80 flex flex-col gap-5">
        <input required placeholder="Username" className="py-2 px-3 bg-slate-700 rounded" value={username} onChange={e=>setUsername(e.target.value)}/>
        <input required placeholder="Password" type="password" className="py-2 px-3 bg-slate-700 rounded" value={pw} onChange={e=>setPw(e.target.value)}/>
        <button className="bg-gradient-to-r from-cyan-400 to-violet-500 font-bold py-2 rounded shadow hover:from-cyan-300 hover:to-violet-400 transition">Continue</button>
        <span className="text-sm text-gray-300 cursor-pointer hover:underline" onClick={()=>setIsLogin(x=>!x)}>{isLogin ? "New user? Sign up" : "Already have account? Login"}</span>
        {err && <span className="text-red-400">{err}</span>}
      </form>
    </div>
  );
}

// Participant list and method selection
function ParticipantManager({participants, setParticipants}) {
  function add() { setParticipants([...participants, {name:'', methods:[]}]); }
  function updateName(i, name) {
    setParticipants(participants.map((p, idx) => idx===i?{...p,name}:p));
  }
  function toggleMethod(i, method){
    setParticipants(participants.map((p,idx)=>
      idx===i
        ? {...p,methods: (p.methods.includes(method) ? p.methods.filter(m=>m!==method) : [...p.methods,method])}
        : p
    ));
  }
  function remove(i){ setParticipants(participants.filter((_,idx)=>idx!==i)); }
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <div className="font-semibold text-lg">Participants</div>
        <button className="bg-cyan-600 text-white px-3 py-1 rounded" onClick={add}>+ Add</button>
      </div>
      {participants.map((p,i) => (
        <div className="flex items-center gap-3 mb-2 bg-slate-700 rounded p-2" key={i}>
          <input required className="bg-slate-600 rounded px-2" placeholder="Name" value={p.name} onChange={e=>updateName(i,e.target.value)}/>
          <div className="flex gap-1">
            {paymentMethods.map(m=>(
              <span title={m} key={m}
                className={`
                  px-1.5 text-xl cursor-pointer transition
                  ${p.methods.includes(m)?'border-b-4 border-cyan-400 brightness-125':'text-gray-400'}
                `}
                style={{filter: p.methods.includes(m)? '':'grayscale()'}}
                onClick={()=>toggleMethod(i,m)}
              >{methodIcons[m]}</span>
            ))}
          </div>
          <button className="text-red-400 font-bold ml-2" onClick={()=>remove(i)}>&times;</button>
        </div>
      ))}
    </div>
  );
}

// Transactions entry w/ person selectors
function TransactionsManager({participants, transactions, setTransactions}) {
  const [from,setFrom]=useState(''), [to,setTo]=useState(''), [amount,setAmount]=useState(''), [desc,setDesc]=useState('');
  function addTx(){
    if(from&&to&&from!==to&&amount>0)
      setTransactions([...transactions,{from,to,amount:Number(amount),desc}]);
    setFrom('');setTo('');setAmount('');setDesc('');
  }
  function remove(i){ setTransactions(transactions.filter((_,idx)=>idx!==i)); }
  return (
    <div className="mb-8">
      <div className="font-semibold text-lg mb-2 text-violet-300">Transactions</div>
      <div className="flex gap-2">
        <select className="bg-slate-700 px-2 rounded" value={from} onChange={e=>setFrom(e.target.value)}>
          <option value="">From</option>
          {participants.map(p=><option key={p.name}>{p.name}</option>)}
        </select>
        <span>→</span>
        <select className="bg-slate-700 px-2 rounded" value={to} onChange={e=>setTo(e.target.value)}>
          <option value="">To</option>
          {participants.map(p=><option key={p.name}>{p.name}</option>)}
        </select>
        <input className="bg-slate-700 w-20 px-2 rounded" placeholder="₹" type="number" min={1} value={amount} onChange={e=>setAmount(e.target.value)}/>
        <input className="bg-slate-700 px-2 w-40 rounded" placeholder="Notes" value={desc} onChange={e=>setDesc(e.target.value)}/>
        <button className="bg-cyan-700 rounded px-2 py-1 text-white" onClick={addTx}>Add</button>
      </div>
      <div>
        {transactions.map((tx,i)=>(
          <div key={i} className="flex items-center gap-2 bg-slate-600 my-2 px-2 py-1 rounded">
            <span>{tx.from} <span className="font-mono">→</span> {tx.to} <span className="text-cyan-300">₹{tx.amount}</span></span>
            <span className="text-gray-300 text-xs">{tx.desc}</span>
            <button className="text-violet-400" onClick={()=>remove(i)}>&times;</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function computeMinimization(participants, transactions) {
  // Calculate net for each
  let names = participants.map(p=>p.name);
  let nets = Array(names.length).fill(0);
  transactions.forEach(({from,to,amount})=>{
    let ifrom=names.indexOf(from), ito=names.indexOf(to);
    if(ifrom<0||ito<0) return;
    nets[ifrom] -= amount;
    nets[ito]   += amount;
  });
  // Find settlement with only compatible payment methods for each (greedy)
  let result = [];
  function settle(net){
    let maxI=net.reduce((a,v,i,arr)=>arr[i]>arr[a]?i:a,0), minI=net.reduce((a,v,i,arr)=>arr[i]<arr[a]?i:a,0);
    if(Math.abs(net[maxI])<1e-2 && Math.abs(net[minI])<1e-2) return;
    let amt = Math.min(-net[minI],net[maxI]);
    // Find intersection of payment methods
    let pa = participants[maxI].methods, pb = participants[minI].methods;
    let inter = pa.filter(x=>pb.includes(x));
    let method = inter.length ? inter[0] : 'None';
    result.push({from: names[minI], to: names[maxI], amount:Math.round(amt*100)/100, method});
    net[maxI] -= amt; net[minI] += amt;
    settle(net);
  } settle([...nets]);
  return result;
}

function MinimizeButton({participants, transactions, onResult}) {
  const [loading, setLoading] = useState(false);
  function compute(){
    setLoading(true);
    let out = computeMinimization(participants, transactions);
    setTimeout(()=>{ // fake delay for UX polish
      setLoading(false); onResult(out);
    }, 400);
  }
  return (
    <button
      className="bg-gradient-to-tr from-cyan-400 to-violet-500 py-2 px-8 rounded-xl font-semibold mt-2 shadow-lg hover:ring-2 ring-cyan-400 transition"
      onClick={compute}
      disabled={loading}
    >{loading?'Computing...':'Minimize Transactions'}</button>
  );
}

function MinimizedResult({result}) {
  if(!result?.length) return null;
  return (
    <div className="bg-slate-800 p-4 mt-4 rounded-2xl shadow-xl animate-fadein">
      <div className="font-bold text-lg mb-2 text-cyan-300">Settlement Plan</div>
      {result.map((tx,i)=>
        <div key={i}
          className={`flex items-center gap-2 py-1 text-md 
            ${tx.method==='None'?'text-red-400':'text-cyan-200'}`}>
            <span>{tx.from} <span className="font-mono">→</span> {tx.to}</span>
            <span className="font-semibold">₹{tx.amount}</span>
            <span className="text-2xl">{methodIcons[tx.method]}</span>
            <span className="text-gray-400">{tx.method==='None'?'No common method!':tx.method}</span>
        </div>
      )}
    </div>
  );
}

// ------ Main App ------
export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [participants, setParticipants] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [result, setResult] = useState(null);

  useEffect(()=>{
    if(token) localStorage.setItem('token',token);
  },[token]);

  if(!token) return <Login setToken={setToken}/>;

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-900 via-slate-800 to-cyan-950 p-0 text-white flex flex-col items-center">
      <div className="w-full max-w-2xl my-10 bg-slate-900/70 rounded-3xl shadow-2xl backdrop-blur p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-extrabold text-2xl text-violet-300 tracking-wide drop-shadow">Transaction Minimizer</h1>
          <button onClick={()=>{setToken(null);localStorage.removeItem('token')}} className="text-cyan-300 font-bold text-lg">Logout</button>
        </div>
        <ParticipantManager participants={participants} setParticipants={setParticipants}/>
        <TransactionsManager participants={participants} transactions={transactions} setTransactions={setTransactions}/>
        <MinimizeButton participants={participants} transactions={transactions} onResult={setResult}/>
        <MinimizedResult result={result}/>
      </div>
    </div>
  );
}

