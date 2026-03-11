require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    name: "mk5sid",
    secret: process.env.SESSION_SECRET || "mk5_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax" }
  })
);

app.use(express.static("public"));

const PORT = Number(process.env.PORT || 3000);

// ===== Discord IDs =====
const GUILD_ID = "1114320874057760818";
const ACTIVATED_ROLE = "1363249951475499269";

// ===== Webhook =====
const WEBHOOK_URL =
  process.env.WEBHOOK_URL ||
  "https://canary.discord.com/api/webhooks/1476987893896712425/pYIdKT9uQZCn9-_p7eRfgzjP3pqTmUCFIAIGagmBjk2-9XJ5MhIJ_nxoBpnsiXAciTYI";

// ===== Cooldown =====
const COOLDOWN_FILE = path.join(__dirname, "cooldowns.json");
const FAIL_COOLDOWN_MS = 5 * 60 * 1000;

// ===== Sectors =====
const SECTORS = [
  { key: "patrol", name: "قـطـاع الادارة الـعـامـة لـدوريـات الامـن", roleId: "1363249807522529370", image: "/img/sector-patrol.png" },
  { key: "traffic", name: "قـطـاع الادارة الـعـامـة لـلـمـرور", roleId: "1363249828599169186", image: "/img/sector-traffic.png" },
  { key: "roads", name: "قـطـاع الادارة الـعـامـة لأمـن الـطـرق", roleId: "1363249837830832198", image: "/img/sector-roads.png" },
  { key: "governorates", name: "الـمـديـريـة الـعـامـة لـشـرطة الـمـحـافـظـات", roleId: "1363249856335839552", image: "/img/sector-governorates.png" }
];

// ===== Quiz (10 Questions) =====
const QUIZ = [
  { q: "هـل يـحـق لـقـطـاع الادارة الـعـامـة لـلـمـرور والـدوريات الـخـروج خـارج الـريـاض :", options: ["يـمـكـنـنـي فـي كـلا الاحـوال الـتـوجـه فـي اي وقـت واي مـطـاردة هـنـاك","فـي حـال كـانـت مـنـطـقـة الـلـعـب هـنـاك","لايـمـكـنـنـي الـتـوجـه هـناك قـطـعا فـي كـلا الاحـوال"], correct: 1 },
  { q: "الاصـطـفـاف الـعـسـكـري يـتـم فـي احـد الـمـراكـز الـعـسـكـريـة ويـكـون مـن رتـبـة :", options: ["رئـيـس رقـبـاء واعـلـى","مـسـؤول افـراد واعـلـى","رتـبـة مـلازم وأعـلـى مـن ذالـك","اي عـسـكـري يـسـتـطـيـع القـيـام بـ اصـطـفـاف عـسـكري"], correct: 2 },
  { q: "هـل يـحـق لـقـطـاع امـن الـطـرق وشـرطـة الـمـحـافـظـات الـخـروج مـن الـدمـام وجـدة :", options: ["يـمـكـنـنـي فـي كـلا الاحـوال الـتـوجـه فـي اي وقـت واي مـطـاردة هـنـاك","فـي حـال كـانـت مـنـطـقـة الـلـعـب هـنـاك","لايـمـكـنـنـي الـتـوجـه هـناك قـطـعا فـي كـلا الاحـوال"], correct: 1 },
  { q: "هـل يـحـق قـطـع بـلاغ عـسـكـري اخـر لـغـرض الاهـمـيـة :", options: ["لايـمـكـنـنـي نـهـائـيـا يـجـب عـلـي انـظـار انـتـهـاء بـلاغ زمـيـلـي كـامـلا ثـم تـمـريـر بـلاغـي","نـعـم ولـكـن بـ انـتـظـام وبـدء الـبـلاغ بـ الاعـتـذار عـن الـمـقـاطـعـة وتـمـريـر بـلاغـك فـي حـال كـن بـلاغـك اهـم"], correct: 1 },
  { q: "ماهو تعريف الـ RDM :", options: ["الـصـدم الـعـشـوائـي","الـقـتـل الـعـشـوائـي"], correct: 1 },
  { q: "ماهو تعريف الـ VDM :", options: ["الـصـدم الـعـشـوائـي","الـقـتـل الـعـشـوائـي"], correct: 0 },
  { q: "هـل يـسـمـح لـك مـعـارضـة امـر ضـابـط :", options: ["يـسـمـح بـسـبـب وجـود وجـه نـظـر مـنـطـقـيـة وصـارمـة","يـجـب عـلـي عـدم مـعـارضـة امـر الـضـبـاط نـهـائيـا وانـفـذ امـره ولـو كأن لـدي وجـه نـظـر اسـتـطـيـع طـرحـهـا عـلـيـه لاحـقـا"], correct: 1 },
  { q: "ماهي المدة المطلوبة للصدم الاحترافي :", options: ["اسـتـطـيـع صـدمـة فـورا فـي حـال كـان الـشـخـص مـطـلـوبـا او مـهـربـا","بـعـد ثـلاث دقـائـق مـن ابـتـداء الـمـطـاردة","بـعـد خـمـس دقـائـق مـن ابـتـداء الـمـطـاردة","بـعـد عـشـر دقـائـق مـن ابـتـداء الـمـطـاردة"], correct: 2 },
  { q: "كـيـف تـتـم عـمـلـيـة الاسـتـيـقـاف الـجـنـائـي :", options: ["يـكـون اسـتـيـقـاف الـمـخـالـف مـن خـلـف مـركـبـة الـمـخـالـف","يـكـون اسـتـيـقـاف الـمـخـالـف مـن امـام مـركـبـة الـمـخـالـف"], correct: 1 },
  { q: "كـيـف تـتـم عـمـلـيـة الاسـتـيـقـاف الـمـروري :", options: ["يـكـون اسـتـيـقـاف الـمـخـالـف مـن خـلـف مـركـبـة الـمـخـالـف","يـكـون اسـتـيـقـاف الـمـخـالـف مـن امـام مـركـبـة الـمـخـالـف"], correct: 0 },
];

// ================= Helpers =================

function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: "NOT_LOGGED_IN" });
  next();
}

function ensureCooldownFile() {
  if (!fs.existsSync(COOLDOWN_FILE)) fs.writeFileSync(COOLDOWN_FILE, JSON.stringify({}), "utf8");
}

function readCooldowns() {
  ensureCooldownFile();
  try {
    return JSON.parse(fs.readFileSync(COOLDOWN_FILE, "utf8") || "{}");
  } catch {
    return {};
  }
}

function writeCooldowns(obj) {
  fs.writeFileSync(COOLDOWN_FILE, JSON.stringify(obj, null, 2), "utf8");
}

function getCooldownRemainingMs(userId) {
  const c = readCooldowns();
  const until = Number(c[userId] || 0);
  const now = Date.now();
  return until > now ? (until - now) : 0;
}

function setCooldown(userId, ms) {
  const c = readCooldowns();
  c[userId] = Date.now() + ms;
  writeCooldowns(c);
}

function containsAbu(text) {
  if (!text) return false;
  const t = String(text).toLowerCase().replace(/\s+/g, "");
  // ابو / أبو
  return t.includes("ابو") 
  || t.includes("أبو") 
  || t.includes("كس") 
  || t.includes("مجلخ") 
  || t.includes("العراب") 
  || t.includes("نايكم") 
  || t.includes("الزق") 
  || t.includes("زق") 
  || t.includes("تبن") 
  || t.includes("التبن") 
  || t.includes("حيوان") 
  || t.includes("الحيوان") 
  || t.includes("الفيمبوي") 
  || t.includes("الديوث") 
  || t.includes("المكسكس") 
  || t.includes("المزبزب") 
  || t.includes("اه") 
  || t.includes("عاهرة") 
  || t.includes("عاهره") 
  || t.includes("الحيوان")
  || t.includes("ـ")  
  || t.includes("عرابكم");
}

function msToReadable(ms) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}دقـائـق و ${s} ثـانـيـة` : `${s} ثـانـيـة`;
}

function buildAvatarUrl(id, avatar) {
  if (!avatar) return "";
  return `https://cdn.discordapp.com/avatars/${id}/${avatar}.png?size=256`;
}

// ================= Discord API =================

async function discordTokenExchange(code) {
  const body = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    client_secret: process.env.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.DISCORD_REDIRECT_URI
  });

  const r = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!r.ok) throw new Error("TOKEN_EXCHANGE_FAILED");
  return r.json();
}

async function discordFetchUser(accessToken) {
  const r = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!r.ok) throw new Error("FETCH_USER_FAILED");
  return r.json();
}

async function discordGetMember(userId) {
  const r = await fetch(
    `https://discord.com/api/guilds/${GUILD_ID}/members/${userId}`,
    { headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` } }
  );
  if (!r.ok) return null;
  return r.json();
}

async function discordMemberHasRole(userId, roleId) {
  const member = await discordGetMember(userId);
  if (!member || !member.roles) return false;
  return member.roles.includes(roleId);
}

async function discordAddRole(userId, roleId) {
  const r = await fetch(
    `https://discord.com/api/guilds/${GUILD_ID}/members/${userId}/roles/${roleId}`,
    { method: "PUT", headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` } }
  );
  if (!r.ok) throw new Error("ADD_ROLE_FAILED");
}

async function sendWebhookLog({ userId, username, avatarUrl, fullName, sectorName, scorePct, correct, timeTakenText }) {
  if (!WEBHOOK_URL) return;

await fetch(WEBHOOK_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "MK5 Activation Log",
    content: "**@everyone | @here**",
    embeds: [
      {
      title: "هـنـاك مـتـفـعـل نـاجـح وجـديـد ┆ ✅",
      color: 0x27b7ff,
      thumbnail: avatarUrl ? { url: avatarUrl } : undefined,
     fields: [

  {
    name: "\u200B",
    value: `**الـمـتـفـعّـل :** <@${userId}>`,
    inline: false
  },

  {
    name: "\u200B",
    value: `**الاسـم الـثـنـائـي :** ${fullName || "—"}`,
    inline: false
  },

  {
    name: "\u200B",
    value: `**قـطـاع الـمـتـفـعـل :** ${sectorName || "—"}`,
    inline: false
  },

  {
    name: "\u200B",
    value: `**الـنـسـبـة الـمـئـويـة :** ${scorePct}% | ${correct}/10`,
    inline: false
  },

  {
    name: "\u200B",
    value: `**الـوقـت الـمـسـتـغـرق :** ${timeTakenText || "—"}`,
    inline: false
  }

],
      footer: { text: "سـلـم الـكـود الـعـسـكـري لـ اسـم الـمـتـفـعـل اعـلاه واتـبـع الـتـعـلـيـمـات" }
      }
    ]
  })
}).catch(() => {});
}

// ================= AUTH =================

app.get("/auth/login", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify"
  });
  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

app.get("/auth/callback", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.redirect("/?e=no_code");

    const token = await discordTokenExchange(code);
    const user = await discordFetchUser(token.access_token);

    req.session.user = {
      id: user.id,
      username: user.username,
      global_name: user.global_name || "",
      avatar: user.avatar || "",
      avatarUrl: buildAvatarUrl(user.id, user.avatar || "")
    };

    // نبدأ الفلو من لحظة تسجيل الدخول
    req.session.flow = {
      startedAt: Date.now(),
      quizDone: false,
      passed: false,
      correct: 0,
      score: 0,
      sectorKey: null,
      sectorName: null,
      fullName: null,
      finishedAt: null
    };

    res.redirect("/");
  } catch (e) {
    res.redirect("/?e=auth_failed");
  }
});

app.post("/auth/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// ================= API =================

app.get("/api/me", requireLogin, async (req, res) => {
  const cd = getCooldownRemainingMs(req.session.user.id);

  // هل هو مفعل مسبقاً؟
  const hasActivatedRole = await discordMemberHasRole(req.session.user.id, ACTIVATED_ROLE);

  res.json({
    user: req.session.user,
    flow: req.session.flow || null,
    hasActivatedRole,
    cooldownRemainingMs: cd,
    cooldownRemainingText: cd ? msToReadable(cd) : "",
    sectors: SECTORS.map(s => ({ key: s.key, name: s.name, image: s.image }))
  });
});

app.get("/api/quiz", requireLogin, (req, res) => {
  const cd = getCooldownRemainingMs(req.session.user.id);
  if (cd > 0) {
    return res.status(429).json({
      error: "COOLDOWN",
      cooldownMs: cd,
      cooldownText: msToReadable(cd),
      redirect: `/?cooldown=1&wait=${encodeURIComponent(msToReadable(cd))}`
    });
  }

  res.json({
    total: QUIZ.length,
    questions: QUIZ.map(q => ({ q: q.q, options: q.options }))
  });
});

app.post("/api/quiz/submit", requireLogin, async (req, res) => {
  // لو عليه كولداون
  const cdNow = getCooldownRemainingMs(req.session.user.id);
  if (cdNow > 0) {
    return res.status(429).json({
      error: "COOLDOWN",
      cooldownMs: cdNow,
      cooldownText: msToReadable(cdNow),
      redirect: `/?cooldown=1&wait=${encodeURIComponent(msToReadable(cdNow))}`
    });
  }

  const { answers } = req.body;
  if (!Array.isArray(answers) || answers.length !== QUIZ.length) {
    return res.status(400).json({ error: "BAD_ANSWERS" });
  }

  let correct = 0;
  answers.forEach((a, i) => {
    if (Number(a) === Number(QUIZ[i].correct)) correct++;
  });

  const score = correct * 10;

  // ✅ النجاح من 5/10
  const passed = correct >= 5;

  req.session.flow = req.session.flow || {};
  req.session.flow.quizDone = true;
  req.session.flow.correct = correct;
  req.session.flow.score = score;
  req.session.flow.passed = passed;

  // ❌ رسوب: أقل من 4 صح = كولداون 5 دقائق + يرجعه الرئيسية مع رسالة
  if (correct < 4) {
    setCooldown(req.session.user.id, FAIL_COOLDOWN_MS);
    const cd = getCooldownRemainingMs(req.session.user.id);

    return res.json({
      redirect: `/?failed=1&cooldown=1&wait=${encodeURIComponent(msToReadable(cd))}`
    });
  }

  // رسوب عادي (4 صح بالضبط) بدون كولداون (تقدر تغيّرها لو تبي)
  if (!passed) {
    return res.json({ redirect: "/result.html" });
  }

  // نجاح
  return res.json({ redirect: "/sector.html" });
});

app.post("/api/sector/select", requireLogin, async (req, res) => {
  const flow = req.session.flow || {};

  if (!flow.quizDone || !flow.passed) {
    return res.status(403).json({ error: "QUIZ_REQUIRED" });
  }

  if (flow.sectorKey) {
    return res.status(409).json({ error: "SECTOR_ALREADY_SELECTED" });
  }

  const { sectorKey } = req.body;
  const sector = SECTORS.find(s => s.key === sectorKey);
  if (!sector) return res.status(400).json({ error: "BAD_SECTOR" });

  await discordAddRole(req.session.user.id, sector.roleId);

  flow.sectorKey = sector.key;
  flow.sectorName = sector.name;
  req.session.flow = flow;

  req.session.save(() => res.json({ redirect: "/name.html" }));
});

app.post("/api/name/submit", requireLogin, async (req, res) => {
  const flow = req.session.flow || {};
  if (!flow.quizDone || !flow.passed) return res.status(403).json({ error: "QUIZ_REQUIRED" });
  if (!flow.sectorKey) return res.status(403).json({ error: "SECTOR_REQUIRED" });

  const { firstName, lastName } = req.body;

  const fn = String(firstName || "").trim();
  const ln = String(lastName || "").trim();

  if (!fn || !ln) return res.status(400).json({ error: "NAME_REQUIRED" });
  if (containsAbu(fn) || containsAbu(ln)) return res.status(400).json({ error: "ABU_BLOCKED" });

  const fullName = `${fn} ${ln}`.trim();

  flow.fullName = fullName;
  flow.finishedAt = Date.now();
  req.session.flow = flow;

  const elapsedMs = (flow.finishedAt - (flow.startedAt || flow.finishedAt));
  const timeTakenText = msToReadable(elapsedMs);

  // هنا فقط نعطي رول التفعيل النهائي
  await discordAddRole(req.session.user.id, ACTIVATED_ROLE);

  await sendWebhookLog({
    userId: req.session.user.id,
    username: req.session.user.username,
    avatarUrl: req.session.user.avatarUrl,
    fullName,
    sectorName: flow.sectorName,
    scorePct: flow.score || 0,
    correct: flow.correct || 0,
    timeTakenText
  });

  req.session.save(() => res.json({ redirect: "/result.html" }));
});

app.get("/api/report", requireLogin, (req, res) => {
  const f = req.session.flow || {};
  const startedAt = f.startedAt || Date.now();
  const finishedAt = f.finishedAt || Date.now();
  const elapsedMs = Math.max(0, finishedAt - startedAt);

  res.json({
    user: req.session.user,
    fullName: f.fullName || "",
    sectorName: f.sectorName || "",
    score: Number(f.score || 0),
    correct: Number(f.correct || 0),
    timeTakenMs: elapsedMs,
    timeTakenText: msToReadable(elapsedMs),
    passed: !!f.passed
  });
});

app.listen(PORT, () => {
  console.log(`MK5 Activation running on http://localhost:${PORT}`);
});