// ===== Config =====
const DATA_SOURCE = "json"; // usamos el JSON local
const JSON_URL = "tracking.json"; // archivo en tu repo

// ===== Util =====
const $ = (q) => document.querySelector(q);
const yearEl = $("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ===== Función simple para formatear fechas =====
function formatDate(val) {
  if (!val) return "—";
  try {
    const d = new Date(val);
    if (!isNaN(d)) {
      return d.getDate().toString().padStart(2,"0") + "/" +
             (d.getMonth()+1).toString().padStart(2,"0") + "/" +
             d.getFullYear();
    }
    return val;
  } catch {
    return val;
  }
}

// ===== Rutas =====
const ROUTES = {
  "iq_lpz_pisiga": { name: "Iquique → La Paz (Colchane–Pisiga)", stops: ["Iquique","Alto Hospicio","Huara","Colchane","Pisiga","Sabaya","Oruro","Caracollo","Sica Sica","La Paz"] },
  "iq_lpz_tambo": { name: "Iquique → La Paz (Chungará–Tambo Quemado)", stops: ["Iquique","Ruta 5 Norte","Arica","Ruta 11-CH","Chungará","Tambo Quemado","Patacamaya","La Paz"] },
  "iq_cbba_pisiga": { name: "Iquique → Cochabamba (Colchane–Pisiga)", stops: ["Iquique","Huara","Colchane","Pisiga","Sabaya","Oruro","Vinto","Cochabamba"] },
  "iq_cbba_tambo": { name: "Iquique → Cochabamba (Chungará–Tambo Quemado)", stops: ["Iquique","Arica","Chungará","Tambo Quemado","Patacamaya","La Paz","Oruro","Cochabamba"] },
  "iq_scz_pisiga": { name: "Iquique → Santa Cruz (Colchane–Pisiga)", stops: ["Iquique","Colchane","Pisiga","Oruro","Cochabamba","Villa Tunari","Montero","Santa Cruz"] },
  "iq_scz_tambo": { name: "Iquique → Santa Cruz (Chungará–Tambo Quemado)", stops: ["Iquique","Arica","Chungará","Tambo Quemado","La Paz","Oruro","Cochabamba","Santa Cruz"] },
  "ari_lpz_tambo": { name: "Arica → La Paz (Chungará–Tambo Quemado)", stops: ["Arica","Ruta 11-CH","Chungará","Tambo Quemado","Patacamaya","La Paz"] },
  "ari_lpz_pisiga": { name: "Arica → La Paz (vía sur Colchane–Pisiga)", stops: ["Arica","Ruta 5 Sur","Iquique","Huara","Colchane","Pisiga","Oruro","La Paz"] },
  "ari_cbba_tambo": { name: "Arica → Cochabamba (Chungará–Tambo Quemado)", stops: ["Arica","Chungará","Tambo Quemado","La Paz","Oruro","Cochabamba"] },
  "ari_cbba_pisiga": { name: "Arica → Cochabamba (Colchane–Pisiga)", stops: ["Arica","Iquique","Colchane","Pisiga","Oruro","Cochabamba"] },
  "ari_scz_tambo": { name: "Arica → Santa Cruz (Chungará–Tambo Quemado)", stops: ["Arica","Chungará","Tambo Quemado","La Paz","Cochabamba","Santa Cruz"] },
  "ari_scz_pisiga": { name: "Arica → Santa Cruz (Colchane–Pisiga)", stops: ["Arica","Iquique","Colchane","Pisiga","Oruro","Cochabamba","Santa Cruz"] },
  // ===== Nuevas rutas Bolivia → Chile =====
  "lpz_iqq_pisiga": { 
    name: "La Paz → Iquique (Pisiga–Colchane)", 
    stops: ["La Paz","Sica Sica","Caracollo","Oruro","Sabaya","Pisiga","Colchane","Huara","Alto Hospicio","Iquique"] 
  },
  "lpz_iqq_tambo": { 
    name: "La Paz → Iquique (Tambo Quemado–Chungará)", 
    stops: ["La Paz","Patacamaya","Tambo Quemado","Chungará","Arica","Ruta 5 Norte","Iquique"] 
  },
  "cbba_iqq_pisiga": { 
    name: "Cochabamba → Iquique (Pisiga–Colchane)", 
    stops: ["Cochabamba","Vinto","Oruro","Sabaya","Pisiga","Colchane","Huara","Iquique"] 
  },
  "scz_iqq_pisiga": { 
    name: "Santa Cruz → Iquique (Pisiga–Colchane)", 
    stops: ["Santa Cruz","Montero","Villa Tunari","Cochabamba","Oruro","Pisiga","Colchane","Huara","Iquique"] 
  },
  "scz_iqq_tambo": { 
    name: "Santa Cruz → Iquique (Tambo Quemado–Chungará)", 
    stops: ["Santa Cruz","Montero","Villa Tunari","Cochabamba","Oruro","La Paz","Patacamaya","Tambo Quemado","Chungará","Arica","Ruta 5 Norte","Iquique"] 
  },
  "cbba_iqq_tambo": { 
    name: "Cochabamba → Iquique (Tambo Quemado–Chungará)", 
    stops: ["Cochabamba","Oruro","La Paz","Patacamaya","Tambo Quemado","Chungará","Arica","Ruta 5 Norte","Iquique"] 
  }
};

// ===== Render =====
function renderResult(code, envio, rutaDef){
  const res = $("#resultado");
  if(!rutaDef){
    res.innerHTML = `<p class="warn">No se encontró la definición de ruta (<code>${envio.ruta_id}</code>), pero mostramos los datos básicos.</p>`;
  }

  let timelineHtml = "";
  if (rutaDef){
    const idx = rutaDef.stops.findIndex(s => s.toLowerCase() === (envio.ultima_ubicacion||"").toLowerCase());
    timelineHtml = `<div class="timeline">` + rutaDef.stops.map((stop, i) => {
      const klass = i < idx ? "step done" : (i === idx ? "step current" : "step");
      return `<span class="${klass}">${stop}</span>`;
    }).join("") + `</div>`;
  }

  let historialHtml = "";
  if (envio.historial && envio.historial.length){
    historialHtml = `
      <div class="kv" style="margin-top:.5rem">
        <div><strong>Historial</strong></div><div></div>
        ${envio.historial.map(ev => `<div>${formatDate(ev.fecha)||""}</div><div>${ev.ubicacion||""} – ${ev.nota||""}</div>`).join("")}
      </div>
    `;
  }

  res.innerHTML = `
    <div class="card" style="padding:1rem">
      <div class="kv">
        <div><strong>Código</strong></div><div>${code}</div>
        <div><strong>Estado</strong></div><div><span class="badge">${envio.estado}</span></div>
        <div><strong>Última ubicación</strong></div><div>${envio.ultima_ubicacion||"—"}</div>
        <div><strong>Fecha estimada</strong></div><div>${formatDate(envio.fecha_estimada)||"Variable según mercancía"}</div>
        <div><strong>Ruta</strong></div><div>${rutaDef ? rutaDef.name : (envio.ruta_id||"—")}</div>
        <div><strong>Origen → Destino</strong></div><div>${envio.origen||"—"} → ${envio.destino||"—"}</div>
        <div><strong>Actualizado</strong></div><div>${formatDate(envio.actualizado)||"—"}</div>
      </div>
      ${timelineHtml}
      ${historialHtml}
    </div>
  `;
}

// ===== Búsqueda =====
async function fetchData(){
  if (DATA_SOURCE === "json"){
    const r = await fetch(JSON_URL, {cache:"no-store"});
    return await r.json();
  } else {
    if(!SHEETS_URL) throw new Error("Configura SHEETS_URL para usar Google Sheets");
    const r = await fetch(SHEETS_URL, {cache:"no-store"});
    return await r.json();
  }
}

async function buscar(){
  const input = $("#codigo");
  const codeRaw = (input.value||"").trim().toUpperCase();
  const res = $("#resultado");
  if(!codeRaw){ res.innerHTML = `<p class="warn">Ingresa tu código (ej: CL-BOL-001).</p>`; input.focus(); return; }
  res.innerHTML = `<p>Cargando…</p>`;

  try{
    const data = await fetchData();
    const envio = data[codeRaw];
    if(!envio){ res.innerHTML = `<p class="warn">Código no encontrado. Verifica y vuelve a intentar.</p>`; return; }
    const rutaDef = ROUTES[envio.ruta_id];
    renderResult(codeRaw, envio, rutaDef);
  }catch(err){
    console.error(err);
    res.innerHTML = `<p class="warn">No se pudo obtener la información de rastreo. Intente nuevamente.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", ()=>{
  $("#btnBuscar")?.addEventListener("click", buscar);
  $("#codigo")?.addEventListener("keydown", (e)=>{ if(e.key==="Enter"){ e.preventDefault(); buscar(); }});
});

// ===== Formulario de contacto (Formspree con AJAX) =====
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("contact-form");
  const msgBox = document.getElementById("contact-msg");

  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando…";
    msgBox.textContent = "";

    const formData = new FormData(form);

    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        msgBox.style.color = "green";
        msgBox.style.marginTop = "1rem";
        msgBox.textContent = "✅ Gracias, tu mensaje fue enviado correctamente.";
        form.reset();
      } else {
        msgBox.style.color = "darkred";
        msgBox.style.marginTop = "1rem";
        msgBox.textContent =
          "⚠️ Ocurrió un error al enviar. Intenta nuevamente.";
      }
    } catch (err) {
      msgBox.style.color = "darkred";
      msgBox.style.marginTop = "1rem";
      msgBox.textContent =
        "⚠️ No se pudo conectar con el servidor. Revisa tu conexión.";
      console.error(err);
    }

    submitBtn.disabled = false;
    submitBtn.textContent = "Enviar";
  });
});
