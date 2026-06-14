const {Pool}=require("pg");
const p=new Pool({host:process.env.PGHOST||"db",user:process.env.PGUSER||"findmydr",password:process.env.PGPASSWORD,database:process.env.PGDATABASE||"findmydr"});
(async()=>{
try{
  let r=await p.query("SELECT p.id, p.name, pr.is_dha_verified, pr.profile_picture_url, pr.dha_unique_id FROM public.physicians p LEFT JOIN dmd.professional pr ON p.id::text = pr.dha_unique_id LIMIT 5");
  console.log(JSON.stringify(r.rows,null,2));
  console.log("---");
  let r2=await p.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_dha_verified=true) as verified FROM dmd.professional");
  console.log(JSON.stringify(r2.rows[0]));
}catch(e){console.error(e.message)}
await p.end()})();
