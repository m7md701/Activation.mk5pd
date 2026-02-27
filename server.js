const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = 3000;
const JWT_SECRET = "mk5_super_secure_key";

// =============================
// Middlewares
// =============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// =============================
// تأكد وجود مجلد الصور
// =============================
if (!fs.existsSync("public/uploads")) {
  fs.mkdirSync("public/uploads", { recursive: true });
}

// =============================
// إعداد رفع الصور
// =============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads"),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.random().toString(36).substr(2, 9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// =============================
// ملف البيانات
// =============================
const DATA_FILE = "data.json";

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({
    admin: {
      username: "sx_t",
      password: bcrypt.hashSync("hhH624112600", 10)
    },
    staff: []
  }, null, 2));
}

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// =============================
// تسجيل دخول المسؤول
// =============================
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const data = readData();

  if (username !== data.admin.username)
    return res.status(401).json({ error: "بيانات غير صحيحة" });

  if (!bcrypt.compareSync(password, data.admin.password))
    return res.status(401).json({ error: "بيانات غير صحيحة" });

  const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "8h" });
  res.json({ token });
});

// =============================
// تحقق من التوكن
// =============================
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.sendStatus(401);

  try {
    jwt.verify(header.split(" ")[1], JWT_SECRET);
    next();
  } catch {
    res.sendStatus(401);
  }
}

// =============================
// إضافة إداري
// =============================
app.post("/api/staff", auth, upload.single("image"), (req, res) => {
  const { name, rank, discord_id } = req.body;

  if (!name || !rank || !discord_id)
    return res.status(400).json({ error: "البيانات ناقصة" });

  const image = req.file ? "/uploads/" + req.file.filename : null;

  const data = readData();

  data.staff.push({
    id: Date.now(),
    name,
    rank,
    discord_id,
    image,
    ratings: []
  });

  saveData(data);

  res.json({ success: true });
});

// =============================
// عرض جميع الإداريين
// =============================
app.get("/api/staff", (req, res) => {
  const data = readData();
  res.json(data.staff);
});

// =============================
// إرسال تقييم
// =============================
app.post("/api/rate/:id", (req, res) => {
  const { rating, note } = req.body;

  if (!rating)
    return res.status(400).json({ error: "يجب اختيار تقييم" });

  const data = readData();
  const staff = data.staff.find(s => s.id == req.params.id);

  if (!staff)
    return res.status(404).json({ error: "الإداري غير موجود" });

  staff.ratings.push({
    rating: Number(rating),
    note: note || "",
    date: new Date().toLocaleString()
  });

  saveData(data);

  res.json({ success: true });
});

// =============================
// حذف إداري (اختياري للمستقبل)
// =============================
app.delete("/api/staff/:id", auth, (req, res) => {
  const data = readData();
  data.staff = data.staff.filter(s => s.id != req.params.id);
  saveData(data);
  res.json({ success: true });
});

// =============================
// تشغيل السيرفر
// =============================
app.listen(PORT, () => {
  console.log("🔥 MK5 Rating Site running on http://localhost:" + PORT);
});