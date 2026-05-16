
window.addEventListener("error", (e) => {
  try { toast("JavaScript error: " + (e.message || "unknown")); } catch(_) { alert("JavaScript error: " + (e.message || "unknown")); }
});
window.addEventListener("unhandledrejection", (e) => {
  try { toast("Error: " + (e.reason?.message || e.reason || "unknown")); } catch(_) { alert("Error: " + (e.reason?.message || e.reason || "unknown")); }
});


function openMenu(){
 const s=document.getElementById("sidebar");
 const o=document.getElementById("menuOverlay");
 if(s) s.classList.remove("collapsed");
 if(o) o.classList.add("show");
}
function closeMenu(){
 const s=document.getElementById("sidebar");
 const o=document.getElementById("menuOverlay");
 if(s) s.classList.add("collapsed");
 if(o) o.classList.remove("show");
}
function toggleMenu(){
 const s=document.getElementById("sidebar");
 if(!s) return;
 if(s.classList.contains("collapsed")) openMenu(); else closeMenu();
}

const SUPABASE_URL="https://wukndecvayhuygpxtzcn.supabase.co";
const SUPABASE_ANON_KEY="sb_publishable_CmFZBp44Ql4THLVIAkYkUg_pP4R_Wws";
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

function setLang(v){localStorage.setItem("lang",v)}
function normalizeLogin(input){const v=input.trim(); return v.includes("@")?v:`${v}@nargile.local`}@nargile.local`}

async function signIn(){
 try{
   const loginInput = val("email");
   const password = val("password");

   if(!loginInput || !password){
     toast("تکایە username/email و password بنوسە");
     return;
   }

   toast("Login دەکرێت...");

   const email = normalizeLogin(loginInput);

   const {data,error} = await sb.auth.signInWithPassword({ email, password });

   if(error){
     toast("Login failed: " + error.message);
     return;
   }

   if(!data?.user){
     toast("Login failed: user نەدۆزرایەوە");
     return;
   }

   await loadProfile(data.user);
   startApp();
   toast("بە سەرکەوتوویی چوویتە ژوورەوە ✅");
 }catch(err){
   console.error(err);
   toast("Login error: " + (err.message || err));
 }
}
async function loadProfile(user){
 const {data,error}=await sb.from("profiles").select("*").eq("id",user.id).maybeSingle();

 if(data){
   currentUser={
     id:user.id,
     name:data.full_name||data.username||user.email,
     role:data.role||"cashier",
     branch_id:data.branch_id||1
   };
 }else{
   const username=(user.email||"user").split("@")[0];
   const meta=user.user_metadata||{};
   const profile={
     id:user.id,
     email:user.email,
     username,
     full_name:meta.full_name||meta.name||username,
     role:meta.role||"cashier",
     branch_id:Number(meta.branch_id||1)
   };
   await sb.from("profiles").upsert(profile,{onConflict:"id"});
   currentUser={id:user.id,name:profile.full_name,role:profile.role,branch_id:profile.branch_id};
 }

 state.branchId=currentUser.role==="admin"
   ? Number(localStorage.getItem("branchId")||currentUser.branch_id||1)
   : Number(currentUser.branch_id||1);

 const bs=document.getElementById("branchSelect");
 if(bs){
   bs.value=String(state.branchId);
   bs.disabled=currentUser.role!=="admin";
 }
}
async function signOut(){await sb.auth.signOut(); location.reload()}
function startApp(){document.getElementById("authScreen").classList.add("hidden");document.getElementById("app").classList.remove("hidden");document.getElementById("profileName").textContent=currentUser.name;document.getElementById("profileRole").textContent=currentUser.role;renderNav();loadAll()}
function renderNav(){const nav=document.getElementById("nav");nav.innerHTML=modules.filter(m=>m[3].includes(currentUser.role)).map(m=>`<button class="nav ${state.page===m[0]?'active':''}" onclick="showPage('${m[0]}')"><span>${m[1]}</span><b>${m[2]}</b></button>`).join("")}
function showPage(p){
 state.page=p;
 document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
 document.getElementById(p)?.classList.add("active");
 const title=document.getElementById("pageTitle");
 if(title) title.textContent=modules.find(m=>m[0]===p)?.[2]||p;
 renderNav();
 if(window.innerWidth<921) closeMenu();
}
document.addEventListener("DOMContentLoaded",async()=>{document.getElementById("sidebar")?.classList.add("collapsed");const {data}=await sb.auth.getUser();if(data?.user){await loadProfile(data.user);startApp()}else{renderNav()}});


document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("loginBtn");
  if(btn){
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      signIn();
    });
  }

  const pass = document.getElementById("password");
  if(pass){
    pass.addEventListener("keydown", (e) => {
      if(e.key === "Enter"){
        e.preventDefault();
        signIn();
      }
    });
  }

  window.signIn = signIn;
  window.signOut = signOut;
  window.toggleMenu = toggleMenu;
  window.closeMenu = closeMenu;
  window.openMenu = openMenu;
  window.addEmployee = addEmployee;
});
