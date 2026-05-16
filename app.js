const SUPABASE_URL="https://wukndecvayhuygpxtzcn.supabase.co";
const SUPABASE_ANON_KEY="";
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const CREATE_EMPLOYEE_FUNCTION = `${SUPABASE_URL}/functions/v1/create-employee`;


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

   if(!session?.access_token){
     toast("پێویستە Admin login بێت");
     return;
   }

   const res = await fetch(CREATE_EMPLOYEE_FUNCTION, {
     method: "POST",
     headers: {
       "Content-Type": "application/json",
       "Authorization": `Bearer ${session.access_token}`
     },
     body: JSON.stringify({ name, email, password, role, branch_id })
   });

   const result = await res.json().catch(()=>({}));

   if(!res.ok || result.error){
     toast(result.error || "Employee Auth create failed");
     console.error("create-employee error:", result);
     return;
   }

   clear(["empName","empEmail","empPassword"]);
   toast("مۆظەف و Login بەخۆکار دروست کرا ✅");
   await loadAll();
 }catch(err){
   console.error(err);
   toast("هەڵە لە پەیوەندی بە Edge Function");
 }
}
