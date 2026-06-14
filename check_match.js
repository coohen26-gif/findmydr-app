const {Pool}=require("pg");
const p=new Pool({host:process.env.PGHOST||"db",user:process.env.PGUSER||"findmydr",password:process.env.PGPASSWORD,database:process.env.PGDATABASE||"findmydr"});
(async()=>{
try{
  // Check if names overlap
  let r=await p.query("SELECT COUNT(*) as match_count FROM public.physicians p WHERE EXISTS (SELECT 1 FROM dmd.professional pr WHERE pr.full_name = p.name)");
  console.log("Exact name matches:", JSON.stringify(r.rows[0]));
  let r2=await p.query("SELECT COUNT(*) as total_phys FROM public.physicians");
  console.log("Total physicians:", JSON.stringify(r2.rows[0]));
  // Try normalized match
  let r3=await p.query("SELECT COUNT(*) as fuzzy FROM public.physicians p WHERE EXISTS (SELECT 1 FROM dmd.professional pr WHERE LOWER(REPLACE(pr.full_name, ' ', '')) = LOWER(REPLACE(p.name, ' ', '')))");
  console.log("Fuzzy name matches:", JSON.stringify(r3.rows[0]));
}catch(e){console.error(e.message)}
await p.end()})();
