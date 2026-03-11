async function api(path, opts = {}) {
  const r = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...opts
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(data.error || "API_ERROR");
    err.data = data;
    throw err;
  }
  return data;
}

function qs(id){ return document.getElementById(id); }

async function loadMe() {
  try {
    return await api("/api/me");
  } catch {
    return null;
  }
}

function setBrand(brand){
  if (!brand) return;
  const logo = document.querySelector("[data-logo]");
  const t1 = document.querySelector("[data-server]");
  const t2 = document.querySelector("[data-system]");
  if (logo) logo.src = brand.logoUrl;
  if (t1) t1.textContent = brand.serverName;
  if (t2) t2.textContent = brand.systemName;
}

async function logout(){
  await fetch("/auth/logout", { method:"POST" });
  location.href = "/";
}