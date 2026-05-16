const SUPABASE_URL="https://wukndecvayhuygpxtzcn.supabase.co";
const SUPABASE_ANON_KEY="PASTE_YOUR_PUBLISHABLE_KEY_HERE";
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const CREATE_EMPLOYEE_FUNCTION = `${SUPABASE_URL}/functions/v1/create-employee`;

let currentUser={id:null,name:"",role:"cashier",branch_id:1};
let state={page:"dashboard",branchId:1,products:[],employees:[],cart:[]};

const modules=[
 ["dashboard","📊","داشبۆرد",["admin","manager","cashier","warehouse"]],
 ["pos","🧾","فرۆشتن",["admin","manager","cashier"]],
 ["products","📦","کاڵاکان",["admin","manager","warehouse"]],
 ["customers","👥","کڕیاران",["admin","manager","cashier"]],
 ["suppliers","🚚","کڕین/دابینکەر",["admin","manager","warehouse"]],
 ["inventory","🔁","گواستنەوەی کۆگا",["admin","manager","warehouse"]],
 ["employees","🧑‍💼","مۆظەفەکان",["admin"]],
 ["cash","💵","سندوق",["admin","manager","cashier"]],
 ["tables","🪑","مێزەکان",["admin","manager","cashier"]],
 ["reports","📈","ڕاپۆرت",["admin","manager"]],
 ["settings","⚙️","ڕێکخستن",["admin"]]
];

function val(id){return document.getElementById(id)?.value?.trim()||""}
function clear(ids){ids.forEach(id=>{const el=document.getElementById(id); if(el) el.value=""})}
function money(v){return Number(v||0).toLocaleString("en-US")+" IQD"}
function toast(msg){const t=document.getElementById("toast"); if(!t) return alert(msg); t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),3200)}
function toggleMenu(){document.getElementById("sidebar")?.classList.toggle("collapsed")}
function setLang(v){localStorage.setItem("lang",v)}
function normalizeLogin(input){const v=input.trim(); return v.includes("@")?v:`${v}@nargile.local`}

async function signIn(){
 const email=normalizeLogin(val("email")), password=val("password");
 if(!email||!password) return toast("Username/password پێویستە");
 const {data,error}=await sb.auth.signInWithPassword({email,password});
 if(error) return toast("Login failed: "+error.message);
 await loadProfile(data.user); startApp();
}
async function loadProfile(user){
 const {data}=await sb.from("profiles").select("*").eq("id",user.id).maybeSingle();
 if(data){currentUser={id:user.id,name:data.full_name||data.username||user.email,role:data.role||"cashier",branch_id:data.branch_id||1}}
 else{currentUser={id:user.id,name:user.email,role:"cashier",branch_id:1}}
 state.branchId=currentUser.role==="admin"?Number(localStorage.getItem("branchId")||currentUser.branch_id||1):Number(currentUser.branch_id||1);
 const bs=document.getElementById("branchSelect"); if(bs){bs.value=String(state.branchId); bs.disabled=currentUser.role!=="admin"}
}
async function signOut(){await sb.auth.signOut(); location.reload()}
function startApp(){document.getElementById("authScreen").classList.add("hidden");document.getElementById("app").classList.remove("hidden");document.getElementById("profileName").textContent=currentUser.name;document.getElementById("profileRole").textContent=currentUser.role;renderNav();loadAll()}
function renderNav(){const nav=document.getElementById("nav");nav.innerHTML=modules.filter(m=>m[3].includes(currentUser.role)).map(m=>`<button class="nav ${state.page===m[0]?'active':''}" onclick="showPage('${m[0]}')"><span>${m[1]}</span><b>${m[2]}</b></button>`).join("")}
function showPage(p){state.page=p;document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));document.getElementById(p)?.classList.add("active");document.getElementById("pageTitle").textContent=modules.find(m=>m[0]===p)?.[2]||p;renderNav(); if(innerWidth<920) toggleMenu()}
async function loadAll(){await Promise.all([loadProducts(),loadEmployees()]);renderAll()}
async function loadProducts(){const {data}=await sb.from("products").select("*").eq("branch_id",state.branchId).order("id",{ascending:false});state.products=data||[]}
async function loadEmployees(){const {data}=await sb.from("employees").select("*").order("id",{ascending:false});state.employees=data||[]}
function renderAll(){renderProducts();renderEmployees();renderStats()}
function renderStats(){document.getElementById("statProducts").textContent=state.products.length;document.getElementById("statEmployees").textContent=state.employees.length}
function renderProducts(){const list=document.getElementById("productsList"); if(list) list.innerHTML=state.products.map(p=>`<div class="item"><b>${p.name}</b><span>${money(p.price)}</span></div>`).join("")||"<p>کاڵا نییە</p>"; const grid=document.getElementById("productGrid"); if(grid) grid.innerHTML=state.products.map(p=>`<div class="product-card"><b>${p.name}</b><p>${money(p.price)}</p><button class="primary" onclick="addToCart(${p.id})">زیادکردن</button></div>`).join("")}
function renderEmployees(){const el=document.getElementById("employeesList"); if(el) el.innerHTML=state.employees.map(e=>`<div class="item"><div><b>${e.name}</b><br><small>${e.email||""}</small></div><div><b>${e.role}</b><br><small>لقی ${e.branch_id}</small></div></div>`).join("")||"<p>مۆظەف نییە</p>"}
async function addProduct(){const name=val("pName"),price=Number(val("pPrice")),cost=Number(val("pCost")),stock=Number(val("pStock")); if(!name) return toast("ناوی کاڵا پێویستە"); await sb.from("products").insert({branch_id:state.branchId,name,price,cost,stock});clear(["pName","pPrice","pCost","pStock"]);toast("کاڵا زیاد کرا");loadAll()}
function addToCart(id){const p=state.products.find(x=>x.id===id); if(!p)return; state.cart.push(p); renderCart()}
function renderCart(){const el=document.getElementById("cartList"); if(el) el.innerHTML=state.cart.map(p=>`<div class="item"><b>${p.name}</b><span>${money(p.price)}</span></div>`).join(""); const total=state.cart.reduce((s,p)=>s+Number(p.price||0),0); document.getElementById("cartTotal").textContent=money(total)}
async function checkout(){toast("Invoice saved"); state.cart=[]; renderCart()}
function switchBranch(){if(currentUser.role!=="admin")return toast("تەنیا Admin دەتوانێت لق بگۆڕێت");state.branchId=Number(val("branchSelect"));localStorage.setItem("branchId",state.branchId);loadAll()}
async function addEmployee(){
 if(currentUser.role!=="admin") return toast("تەنیا Admin دەتوانێت مۆظەف زیاد بکات");
 const name=val("empName");
 const email=val("empEmail").toLowerCase();
 const password=val("empPassword");
 const role=val("empRole");
 const branch_id=Number(val("empBranch"));
 if(!name||!email||!password) return toast("ناو، email و password پێویستە");
 if(password.length < 6) return toast("Password پێویستە لانیکەم ٦ پیت بێت");
 try{
   const {data:{session}} = await sb.auth.getSession();
   if(!session?.access_token){toast("پێویستە Admin login بێت");return;}
   const res = await fetch(CREATE_EMPLOYEE_FUNCTION,{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${session.access_token}`},body:JSON.stringify({name,email,password,role,branch_id})});
   const result=await res.json().catch(()=>({}));
   if(!res.ok||result.error){toast(result.error||"Employee Auth create failed");return;}
   clear(["empName","empEmail","empPassword"]);
   toast("مۆظەف و Login بەخۆکار دروست کرا ✅");
   await loadAll();
 }catch(err){console.error(err);toast("هەڵە لە Edge Function")}
}
document.addEventListener("DOMContentLoaded",async()=>{document.getElementById("sidebar")?.classList.add("collapsed");const {data}=await sb.auth.getUser();if(data?.user){await loadProfile(data.user);startApp()}else{renderNav()}});
