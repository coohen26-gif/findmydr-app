const {Pool}=require("pg");
const p=new Pool({host:process.env.PGHOST||"db",user:process.env.PGUSER||"findmydr",password:process.env.PGPASSWORD,database:process.env.PGDATABASE||"findmydr"});
(async()=>{
try{
  console.log("physicians columns:");
  let r=await p.query("SELECT column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='physicians' ORDER BY ordinal_position");
  r.rows.forEach(c=>console.log("  "+c.column_name+" ("+c.data_type+")"));
  console.log("---");
  console.log("professional (all columns):");
  let r2=await p.query("SELECT column_name,data_type FROM information_schema.columns WHERE table_schema='dmd' AND table_name='professional' ORDER BY ordinal_position");
  r2.rows.forEach(c=>console.log("  "+c.column_name+" ("+c.data_type+")"));
}catch(e){console.error(e.message)}
await p.end()})();
