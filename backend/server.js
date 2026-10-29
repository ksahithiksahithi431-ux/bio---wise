require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "50kb" }));
app.use(express.static(path.join(__dirname, "..", "frontend")));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (supabaseUrl && supabaseKey &&
  !supabaseUrl.includes("YOUR_PROJECT_ID") &&
  !supabaseKey.includes("PASTE_YOUR"))
  ? createClient(supabaseUrl, supabaseKey)
  : null;

function databaseReady(res) {
  if (!supabase) {
    res.status(503).json({
      error: "Database is not configured. Add your Supabase URL and server key to backend/.env."
    });
    return false;
  }
  return true;
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", databaseConfigured: Boolean(supabase) });
});

app.get("/api/estimates", async (_req, res) => {
  if (!databaseReady(res)) return;
  const { data, error } = await supabase
    .from("biogas_estimates")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/estimates", async (req, res) => {
  if (!databaseReady(res)) return;
  const { waste_type, quantity_kg, yield_m3_per_kg } = req.body || {};
  const quantity = Number(quantity_kg);
  const yieldRate = Number(yield_m3_per_kg);

  if (typeof waste_type !== "string" || !waste_type.trim() ||
      !Number.isFinite(quantity) || quantity <= 0 ||
      !Number.isFinite(yieldRate) || yieldRate <= 0 || yieldRate > 10) {
    return res.status(400).json({
      error: "Enter a waste type, a quantity greater than zero, and a valid yield rate."
    });
  }

  const estimated = Number((quantity * yieldRate).toFixed(3));
  const { data, error } = await supabase
    .from("biogas_estimates")
    .insert([{
      waste_type: waste_type.trim().slice(0, 80),
      quantity_kg: quantity,
      yield_m3_per_kg: yieldRate,
      estimated_biogas_m3: estimated
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.delete("/api/estimates/:id", async (req, res) => {
  if (!databaseReady(res)) return;
  const { data, error } = await supabase
    .from("biogas_estimates")
    .delete()
    .eq("id", req.params.id)
    .select("id")
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Estimate not found." });
  res.json({ message: "Estimate deleted." });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Bio Wise is running at http://localhost:${PORT}`);
  if (!supabase) console.log("Supabase is not configured yet. Edit backend/.env.");
});
