const $ = (id) => document.getElementById(id);
const form = $("estimateForm");
const wasteType = $("wasteType");
const quantity = $("quantity");
const yieldRate = $("yieldRate");
const formMessage = $("formMessage");
let estimates = [];

function selectedYield() {
  return Number(wasteType.options[wasteType.selectedIndex].dataset.yield);
}
function formatNumber(value, digits = 3) {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: digits, maximumFractionDigits: digits
  });
}
function updatePreview() {
  const rate = selectedYield();
  const qty = Math.max(0, Number(quantity.value) || 0);
  yieldRate.textContent = `${rate.toFixed(2)} m³/kg`;
  $("resultValue").textContent = formatNumber(qty * rate);
  $("resultWaste").textContent = wasteType.value;
  $("resultQuantity").textContent = `${formatNumber(qty, 1)} kg`;
  $("resultYield").textContent = `${rate.toFixed(2)} m³/kg`;
}
wasteType.addEventListener("change", updatePreview);
quantity.addEventListener("input", updatePreview);

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Something went wrong.");
  return body;
}

function renderStats() {
  $("totalRecords").textContent = estimates.length.toLocaleString("en-IN");
  $("totalWaste").textContent = formatNumber(
    estimates.reduce((sum, item) => sum + Number(item.quantity_kg), 0), 1
  );
  $("totalGas").textContent = formatNumber(
    estimates.reduce((sum, item) => sum + Number(item.estimated_biogas_m3), 3), 3
  );
}

function renderHistory() {
  const body = $("historyBody");
  if (!estimates.length) {
    body.innerHTML = '<tr><td colspan="6" class="empty-state">No estimates saved yet. Calculate your first estimate above.</td></tr>';
    renderStats();
    return;
  }
  body.innerHTML = estimates.map(item => {
    const date = item.created_at ? new Date(item.created_at).toLocaleDateString("en-IN") : "—";
    return `<tr>
      <td>${escapeHtml(item.waste_type)}</td>
      <td>${formatNumber(item.quantity_kg, 1)} kg</td>
      <td>${formatNumber(item.yield_m3_per_kg, 2)} m³/kg</td>
      <td><span class="gas-pill">${formatNumber(item.estimated_biogas_m3)} m³</span></td>
      <td>${date}</td>
      <td><button class="delete-btn" data-delete="${escapeHtml(item.id)}" type="button">Delete</button></td>
    </tr>`;
  }).join("");
  renderStats();
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

async function loadEstimates() {
  $("historyBody").innerHTML = '<tr><td colspan="6" class="empty-state">Loading your records…</td></tr>';
  try {
    estimates = await api("/api/estimates");
    renderHistory();
  } catch (error) {
    estimates = [];
    renderStats();
    $("historyBody").innerHTML = `<tr><td colspan="6" class="empty-state">${escapeHtml(error.message)}<br><br>Configure Supabase in backend/.env and run database/schema.sql.</td></tr>`;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const qty = Number(quantity.value);
  if (!Number.isFinite(qty) || qty <= 0) {
    formMessage.textContent = "Please enter a quantity greater than zero.";
    return;
  }
  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  button.textContent = "Saving…";
  formMessage.textContent = "";
  try {
    const saved = await api("/api/estimates", {
      method: "POST",
      body: JSON.stringify({
        waste_type: wasteType.value,
        quantity_kg: qty,
        yield_m3_per_kg: selectedYield()
      })
    });
    formMessage.textContent = `Saved! Estimated output: ${formatNumber(saved.estimated_biogas_m3)} m³.`;
    quantity.value = "";
    updatePreview();
    await loadEstimates();
  } catch (error) {
    formMessage.textContent = error.message;
  } finally {
    button.disabled = false;
    button.innerHTML = 'Calculate &amp; save <span>→</span>';
  }
});

$("historyBody").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-delete]");
  if (!button) return;
  if (!confirm("Delete this estimate?")) return;
  button.disabled = true;
  try {
    await api(`/api/estimates/${encodeURIComponent(button.dataset.delete)}`, { method: "DELETE" });
    await loadEstimates();
  } catch (error) {
    alert(error.message);
    button.disabled = false;
  }
});
$("refreshBtn").addEventListener("click", loadEstimates);
updatePreview();
loadEstimates();
