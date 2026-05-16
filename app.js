const SUPABASE_URL="https://wukndecvayhuygpxtzcn.supabase.co";
const SUPABASE_ANON_KEY="sb_publishable_CmFZBp44Ql4THLVIAkYkUg_pP4R_Wws";
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

let deferredPrompt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e});

const i18n={
 ku:{appName:"Nargile POS V6",subtitle:"سیستەمی POS کڵاودی پیشەیی",login:"چوونەژوورەوە",logout:"چوونەدەرەوە"},
 en:{appName:"Nargile POS V6",subtitle:"Ultimate Enterprise Cloud POS",login:"Login",logout:"Logout"},
 ar:{appName:"Nargile POS V6",subtitle:"نظام نقاط بيع سحابي",login:"دخول",logout:"خروج"}
};
let lang=localStorage.getItem("lang")||"ku";
let currentUser={id:null,name:"",role:"cashier",branch_id:1};
let state={branchId:Number(localStorage.getItem("branchId")||1),page:"dashboard",cart:[],products:[],customers:[],sales:[],saleItems:[],expenses:[],suppliers:[],transfers:[],employees:[],attendance:[],cash:[],tables:[],activity:[]};

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

document.addEventListener("DOMContentLoaded",async ()=>{
 setLang(lang);
 document.getElementById("branchSelect").value=state.branchId;
 renderNav();
 const {data}=await sb.auth.getUser();
 if(data?.user){await loadProfile(data.user); startApp();}
});

function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
function money(v){return Number(v||0).toLocaleString("en-US") + " IQD"}
function val(id){return document.getElementById(id).value.trim()}
function num(id){return Number(document.getElementById(id).value||0)}
function clear(ids){ids.forEach(id=>document.getElementById(id).value="")}

function setLang(l){lang=l;localStorage.setItem("lang",l);document.documentElement.lang=l;document.documentElement.dir=l==="en"?"ltr":"rtl";document.querySelectorAll("[data-i18n]").forEach(el=>el.textContent=i18n[l][el.dataset.i18n]||el.textContent)}
function renderNav(){
 const nav=document.getElementById("nav");
 nav.innerHTML=modules
  .filter(m=>m[3].includes(currentUser.role))
  .map(m=>`<button class="nav ${state.page===m[0]?'active':''}" onclick="showPage('${m[0]}')"><span>${m[1]}</span><b>${m[2]}</b></button>`)
  .join("");
}

function normalizeLogin(input){
 const v = input.trim();
 if(v.includes("@")) return v;
 return `${v}@nargile.local`;
}

async function signIn(){
 const loginInput=val("email"), password=val("password");
 if(!loginInput||!password) return toast("Username/password پێویستە");
 const email = normalizeLogin(loginInput);
 const {data,error}=await sb.auth.signInWithPassword({email,password});
 if(error){toast("Login failed: user لە Supabase Auth دروست بکە"); return;}
 await loadProfile(data.user);
 startApp();
}

async function loadProfile(user){
 const {data,error}=await sb.from("profiles").select("*").eq("id",user.id).maybeSingle();
 if(data){
   currentUser={id:user.id,name:data.full_name||data.username||user.email,role:data.role||"cashier",branch_id:data.branch_id||1};
 }else{
   const username = user.email.split("@")[0];
   const profile={id:user.id,email:user.email,username,full_name:username,role:username==="zana"?"admin":"cashier",branch_id:1};
   await sb.from("profiles").insert(profile);
   currentUser={id:user.id,name:profile.full_name,role:profile.role,branch_id:profile.branch_id};
 }
 state.branchId = currentUser.role==="admin" ? Number(localStorage.getItem("branchId")||currentUser.branch_id||1) : Number(currentUser.branch_id||1);
 localStorage.setItem("branchId", state.branchId);
 document.getElementById("branchSelect").value=String(state.branchId);
 document.getElementById("branchSelect").disabled = currentUser.role!=="admin";
}

async function signOut(){try{await sb.auth.signOut()}catch(e){};document.getElementById("app").classList.add("hidden");document.getElementById("authScreen").classList.remove("hidden")}
async function startApp(){document.getElementById("authScreen").classList.add("hidden");document.getElementById("app").classList.remove("hidden");document.getElementById("profileName").textContent=currentUser.name;document.getElementById("profileRole").textContent=currentUser.role;renderNav();await ensureSetup();await loadAll();subscribeRealtime();}

async function ensureSetup(){
 await sb.from("branches").upsert([{id:1,name:"Branch 1"},{id:2,name:"Branch 2"}],{onConflict:"id"});
}
async function q(table){const {data,error}=await sb.from(table).select("*").eq("branch_id",state.branchId).order("id",{ascending:false}); if(error){console.warn(table,error); return []} return data||[]}
async function loadAll(){
 const [products,customers,sales,saleItems,expenses,suppliers,transfers,employees,attendance,cash,tables,activity]=await Promise.all([
  q("products"),q("customers"),q("sales"),q("sale_items"),q("expenses"),q("suppliers"),q("stock_transfers"),q("employees"),q("attendance"),q("cash_drawers"),q("reservations"),q("activity_logs")
 ]);
 Object.assign(state,{products,customers,sales,saleItems,expenses,suppliers,transfers,employees,attendance,cash,tables,activity});
 renderCurrent();
}
function subscribeRealtime(){
 sb.channel("pos-live").on("postgres_changes",{event:"*",schema:"public"},()=>loadAll()).subscribe();
}

function showPage(p){state.page=p;document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));document.getElementById(p).classList.add("active");document.getElementById("pageTitle").textContent=modules.find(m=>m[0]===p)?.[2]||p;renderNav();renderCurrent()}
function switchBranch(){
 if(currentUser.role!=="admin"){document.getElementById("branchSelect").value=String(currentUser.branch_id); return toast("تەنیا Admin دەتوانێت لق بگۆڕێت");}
 state.branchId=Number(val("branchSelect"));localStorage.setItem("branchId",state.branchId);state.cart=[];loadAll();toast("Branch switched")
}
function renderCurrent(){renderDashboard();renderPOS();renderProducts();renderCustomers();renderSuppliers();renderTransfers();renderEmployees();renderCash();renderTables();renderReports();renderSelects()}

function renderDashboard(){
 const sales=state.sales.reduce((s,x)=>s+Number(x.total||0),0);
 const cost=state.saleItems.reduce((s,i)=>s+Number(i.cost_price||0)*Number(i.quantity||0),0);
 const profit=sales-cost-state.expenses.reduce((s,x)=>s+Number(x.amount||0),0);
 const low=state.products.filter(p=>Number(p.stock||0)<=Number(p.low_stock||5)).length;
 ["dashSales","rSales"].forEach(id=>document.getElementById(id)&&(document.getElementById(id).textContent=money(sales)));
 ["dashProfit","rProfit"].forEach(id=>document.getElementById(id)&&(document.getElementById(id).textContent=money(profit)));
 document.getElementById("dashProducts").textContent=state.products.length; document.getElementById("dashLow").textContent=low;
 document.getElementById("activityList").innerHTML=state.activity.slice(0,8).map(a=>`<div class="item"><div><b>${a.action}</b><br><small>${a.created_at||""}</small></div></div>`).join("")||"<p>No activity</p>";
 drawChart();
}
let chart;
function drawChart(){const c=document.getElementById("salesChart"); if(!c) return; const days=[...Array(7)].map((_,i)=>"D"+(i+1)); const data=[...Array(7)].map((_,i)=>state.sales.filter((s,idx)=>idx%7===i).reduce((a,b)=>a+Number(b.total||0),0)); if(chart)chart.destroy(); chart=new Chart(c,{type:"line",data:{labels:days,datasets:[{label:"Sales",data}]},options:{responsive:true}})}

async function uploadImage(file){
 if(!file) return "";
 const path=`products/${Date.now()}-${file.name}`;
 const {error}=await sb.storage.from("pos-images").upload(path,file,{upsert:true});
 if(error){toast("Image upload failed؛ bucket pos-images دروست بکە"); return ""}
 const {data}=sb.storage.from("pos-images").getPublicUrl(path);
 return data.publicUrl;
}
async function addProduct(){
 let image_url=await uploadImage(document.getElementById("pImage").files[0]);
 const row={branch_id:state.branchId,name:val("pName"),barcode:val("pBarcode"),category:val("pCategory"),unit_type:val("pUnit"),cost_price:num("pCost"),sale_price:num("pPrice"),stock:num("pStock"),low_stock:num("pLow")||5,image_url};
 if(!row.name||!row.sale_price) return toast("Name and price required");
 const {error}=await sb.from("products").insert(row); if(error)return toast(error.message);
 await log("add_product",row.name); clear(["pName","pBarcode","pCategory","pCost","pPrice","pStock","pLow"]); await loadAll();
}
function renderProducts(){
 const q=val("globalSearch").toLowerCase();
 document.getElementById("productsTable").innerHTML=state.products.filter(p=>p.name.toLowerCase().includes(q)||String(p.barcode||"").includes(q)).map(p=>`<tr><td>${p.name}</td><td>${p.barcode||""}</td><td>${money(p.sale_price)}</td><td>${p.stock}</td><td><button onclick="deleteRow('products',${p.id})">Delete</button></td></tr>`).join("");
}
async function deleteRow(table,id){if(!confirm("Delete?"))return;await sb.from(table).delete().eq("id",id);await log("delete_"+table,id);loadAll()}

function renderPOS(){
 const q=(document.getElementById("posSearch")?.value||"").toLowerCase();
 document.getElementById("posProducts").innerHTML=state.products.filter(p=>p.name.toLowerCase().includes(q)||String(p.barcode||"").toLowerCase().includes(q)).map(p=>`<div class="product-card" onclick="addToCart(${p.id})">${p.image_url?`<img src="${p.image_url}">`:""}<b>${p.name}</b><br><small>${p.barcode||""}</small><h3>${money(p.sale_price)}</h3><small>Stock: ${p.stock}</small></div>`).join("");
 document.getElementById("cart").innerHTML=state.cart.map(i=>`<div class="cart-row"><span>${i.name} × ${i.qty}</span><div><b>${money(i.qty*i.price)}</b><button onclick="removeCart(${i.id})">✕</button></div></div>`).join("")||"<p>Cart empty</p>";
 document.getElementById("cartTotal").textContent=money(state.cart.reduce((s,i)=>s+i.qty*i.price,0));
}
function addToCart(id){const p=state.products.find(x=>x.id===id); if(!p)return; const ex=state.cart.find(x=>x.id===id); if(ex)ex.qty++; else state.cart.push({id:p.id,name:p.name,price:Number(p.sale_price),cost:Number(p.cost_price),qty:1}); renderPOS()}
function removeCart(id){state.cart=state.cart.filter(x=>x.id!==id);renderPOS()}
async function completeSale(){
 if(!state.cart.length)return toast("Cart empty");
 const total=state.cart.reduce((s,i)=>s+i.qty*i.price,0);
 const {data,error}=await sb.from("sales").insert({branch_id:state.branchId,customer_id:Number(val("saleCustomer"))||null,total,payment_method:val("paymentMethod"),user_id:currentUser.id}).select().single();
 if(error)return toast(error.message);
 const items=state.cart.map(i=>({branch_id:state.branchId,sale_id:data.id,product_id:i.id,product_name:i.name,quantity:i.qty,unit_price:i.price,cost_price:i.cost,total:i.qty*i.price}));
 await sb.from("sale_items").insert(items);
 for(const i of state.cart){const p=state.products.find(x=>x.id===i.id); await sb.from("products").update({stock:Number(p.stock||0)-i.qty}).eq("id",i.id)}
 state.cart=[]; await log("complete_sale",money(total)); notify("Sale completed",money(total)); await loadAll();
}

function renderSelects(){
 document.getElementById("saleCustomer").innerHTML='<option value="">No customer</option>'+state.customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
 document.getElementById("transferProduct").innerHTML=state.products.map(p=>`<option value="${p.id}">${p.name}</option>`).join("");
}
async function addCustomer(){const r={branch_id:state.branchId,name:val("cName"),phone:val("cPhone"),debt:num("cDebt")};if(!r.name)return toast("Name required");await sb.from("customers").insert(r);clear(["cName","cPhone","cDebt"]);await log("add_customer",r.name);loadAll()}
function renderCustomers(){document.getElementById("customersList").innerHTML=state.customers.map(c=>`<div class="item"><div><b>${c.name}</b><br><small>${c.phone||""}</small></div><b>${money(c.debt)}</b></div>`).join("")||"<p>No customers</p>"}

async function addSupplierPurchase(){const s={branch_id:state.branchId,name:val("sName"),phone:val("sPhone")};const {data}=await sb.from("suppliers").insert(s).select().single();await sb.from("purchases").insert({branch_id:state.branchId,supplier_id:data?.id,title:val("purchaseTitle"),amount:num("purchaseAmount")});clear(["sName","sPhone","purchaseTitle","purchaseAmount"]);await log("purchase",s.name);loadAll()}
function renderSuppliers(){document.getElementById("suppliersList").innerHTML=state.suppliers.map(s=>`<div class="item"><b>${s.name}</b><small>${s.phone||""}</small></div>`).join("")||"<p>No suppliers</p>"}

async function requestTransfer(){const product_id=Number(val("transferProduct"));const to_branch=Number(val("transferTo"));const product=state.products.find(p=>p.id===product_id);await sb.from("stock_transfers").insert({branch_id:state.branchId,from_branch:state.branchId,to_branch,product_id,product_name:product?.name,quantity:num("transferQty"),status:"pending"});await log("transfer_request",product?.name);loadAll()}
async function approveTransfer(id){await sb.from("stock_transfers").update({status:"approved"}).eq("id",id);await log("transfer_approved",id);loadAll()}
function renderTransfers(){document.getElementById("transfersList").innerHTML=state.transfers.map(t=>`<div class="item"><div><b>${t.product_name}</b><br><small>${t.quantity} | ${t.status}</small></div><button onclick="approveTransfer(${t.id})">Approve</button></div>`).join("")||"<p>No transfers</p>"}

async function addEmployee(){
 if(currentUser.role!=="admin") return toast("تەنیا Admin دەتوانێت مۆظەف زیاد بکات");
 const name=val("empName"), email=val("empEmail"), password=val("empPassword"), role=val("empRole"), branch_id=Number(val("empBranch"));
 if(!name||!email||!password) return toast("ناو، email و password پێویستە");
 await sb.from("employees").insert({branch_id,name,role,email});
 await sb.from("activity_logs").insert({branch_id:state.branchId,user_id:currentUser.id,action:"add_employee",details:`${name} / ${email} / ${role} / branch ${branch_id}`});
 clear(["empName","empEmail","empPassword"]);
 toast("مۆظەف زیاد کرا. ئێستا لە Supabase Auth user بە هەمان email/password دروست بکە.");
 await loadAll();
}
async function clockIn(){await sb.from("attendance").insert({branch_id:state.branchId,user_id:currentUser.id,employee_name:currentUser.name,type:"clock"});await log("attendance","clock");loadAll()}
function renderEmployees(){
 document.getElementById("employeesList").innerHTML=state.employees.map(e=>`
  <div class="item">
   <div><b>${e.name}</b><br><small>${e.email||""}</small></div>
   <div><b>${e.role}</b><br><small>لقی ${e.branch_id}</small></div>
  </div>`).join("")||"<p>هێشتا مۆظەف نییە</p>"
}

async function openCashDrawer(){await sb.from("cash_drawers").insert({branch_id:state.branchId,user_id:currentUser.id,opening_cash:num("openingCash"),status:"open"});await log("cash_open",num("openingCash"));loadAll()}
async function closeCashDrawer(){const latest=state.cash.find(c=>c.status==="open"); if(!latest)return toast("No open drawer"); await sb.from("cash_drawers").update({closing_cash:num("closingCash"),status:"closed",closed_at:new Date().toISOString()}).eq("id",latest.id);await log("cash_close",num("closingCash"));loadAll()}
function renderCash(){document.getElementById("cashList").innerHTML=state.cash.map(c=>`<div class="item"><b>${c.status}</b><small>Open ${money(c.opening_cash)} / Close ${money(c.closing_cash)}</small></div>`).join("")||"<p>No drawer</p>"}

async function reserveTable(){await sb.from("reservations").insert({branch_id:state.branchId,table_no:val("tableNo"),customer_name:val("tableCustomer"),reserved_at:val("tableTime"),status:"reserved"});await log("reserve_table",val("tableNo"));loadAll()}
function renderTables(){document.getElementById("tablesList").innerHTML=state.tables.map(t=>`<div class="table-card"><b>Table ${t.table_no}</b><br><small>${t.customer_name}</small><br><small>${t.reserved_at||""}</small></div>`).join("")||"<p>No reservations</p>"}

function renderReports(){const sales=state.sales.reduce((s,x)=>s+Number(x.total||0),0), expenses=state.expenses.reduce((s,x)=>s+Number(x.amount||0),0), debt=state.customers.reduce((s,x)=>s+Number(x.debt||0),0), cost=state.saleItems.reduce((s,i)=>s+Number(i.cost_price||0)*Number(i.quantity||0),0);document.getElementById("rSales").textContent=money(sales);document.getElementById("rExpenses").textContent=money(expenses);document.getElementById("rDebt").textContent=money(debt);document.getElementById("rProfit").textContent=money(sales-cost-expenses)}
function exportExcel(type){let data=state[type]||[]; const ws=XLSX.utils.json_to_sheet(data); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,type); XLSX.writeFile(wb,`nargile-${type}.xlsx`)}
function dailyReportPDF(){const {jsPDF}=window.jspdf; const doc=new jsPDF(); doc.text("Nargile POS Daily Report",20,20); doc.text("Sales: "+document.getElementById("rSales").textContent,20,35); doc.text("Profit: "+document.getElementById("rProfit").textContent,20,50); doc.save("daily-report.pdf")}
function downloadInvoicePDF(){const {jsPDF}=window.jspdf; const doc=new jsPDF(); doc.text("Nargile POS Invoice",20,20); let y=35; state.cart.forEach(i=>{doc.text(`${i.name} x ${i.qty} = ${money(i.qty*i.price)}`,20,y); y+=10}); doc.text("Total: "+document.getElementById("cartTotal").textContent,20,y+10); doc.save("invoice.pdf")}
function printThermal(){let html="<h3>Nargile POS</h3>"+state.cart.map(i=>`${i.name} x ${i.qty} = ${money(i.qty*i.price)}<br>`).join("")+"<hr>Total: "+document.getElementById("cartTotal").textContent;let w=open("","_blank","width=300");w.document.write(`<body style="font-family:monospace;width:58mm">${html}<script>print()<\/script></body>`)}

async function addExpense(title,amount){await sb.from("expenses").insert({branch_id:state.branchId,title,amount});loadAll()}
async function log(action,details){await sb.from("activity_logs").insert({branch_id:state.branchId,user_id:currentUser.id,action,details:String(details||"")})}
function requestNotificationPermission(){Notification?.requestPermission?.().then(()=>toast("Notifications enabled"))}
function notify(title,body){if(Notification?.permission==="granted")new Notification(title,{body})}
function autoBackup(){const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="nargile-auto-backup.json";a.click()}
function installPWA(){if(deferredPrompt){deferredPrompt.prompt()}else toast("لە مۆبایل browser menu → Add to Home Screen بکە")}
function toggleTheme(){document.body.classList.toggle("dark")}
async function startScanner(){const el=document.getElementById("scanner");el.classList.remove("hidden");const qr=new Html5Qrcode("scanner");try{await qr.start({facingMode:"environment"},{fps:10,qrbox:220},txt=>{document.getElementById("posSearch").value=txt;renderPOS();qr.stop();el.classList.add("hidden")})}catch(e){toast("Camera scanner supported only on HTTPS/live site")}}
