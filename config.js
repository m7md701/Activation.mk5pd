module.exports = {
  brand: {
    serverName: "MK5 Police Mod",
    systemName: "نـظـام الـتـفـعـيـل",
    logoUrl: "/img/logo.png",
    inviteUrl: "https://discord.gg/mk5" // حط دعوة سيرفرك
  },

  discord: {
    guildId: "1114320874057760818",
    activatedRoleId: "1363249951475499269",

    // ✅ حط رولات القطاعات هنا (4 قطاعات)
    sectors: [
      {
        key: "patrol",
        name: "الدوريات الأمنية",
        image: "/img/sector-patrol.png",
        roleId: "1363249807522529370"
      },
      {
        key: "traffic",
        name: "المرور",
        image: "/img/sector-traffic.png",
        roleId: "1363249828599169186"
      },
      {
        key: "highway",
        name: "أمن الطرق",
        image: "/img/sector-highway.png",
        roleId: "1363249837830832198"
      },
      {
        key: "narcotics",
        name: "شرطة المحافظات",
        image: "/img/sector-narcotics.png",
        roleId: "1363249856335839552"
      }
    ]
  },

  // ✅ نظام النجاح/الرسوب
  quiz: {
    totalQuestions: 10,
    passMinCorrect: 4
  }
};