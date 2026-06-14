const {Pool} = require("pg");
const p = new Pool({
  host: process.env.PGHOST || "db",
  user: process.env.PGUSER || "findmydr",
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || "findmydr"
});
(async () => {
  try {
    let r = await p.query("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = $1 ORDER BY table_name, ordinal_position", ["dmd"]);
    console.log("=== dmd schema ===");
    console.log(r.rows.map(c => c.table_name + "." + c.column_name + " (" + c.data_type + ")").join("\n"));
    let r2 = await p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position", ["public", "physicians"]);
    console.log("=== physicians columns ===");
    console.log(r2.rows.map(c => "physicians." + c.column_name + " (" + c.data_type + ")").join("\n"));
  } catch(e) { console.error(e.message); }
  await p.end();
})();
