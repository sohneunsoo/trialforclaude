// Project data — top row is dark/reserved; projects 01-08 fill rows 2-3.

export const PROJECTS = [
  // ── TOP ROW (dark, mostly empty — slot 2 = GATCHA direct link) ──────────
  {
    id: 1,
    code: "—",
    title: "—",
    titleEn: "COMING SOON",
    tags: "—",
    tone: "#0d0d0d",
    accent: "#ffffff",
    year: "—", role: "—", status: "—",
    desc1: "", desc2: "",
    dark: true
  },
  {
    id: 2,
    code: "—",
    title: "GATCHA",
    titleEn: "GATCHA",
    tags: "게임 · 인터랙티브",
    tone: "#0d0d0d",
    accent: "#ffffff",
    year: "2026", role: "—", status: "Live",
    desc1: "", desc2: "",
    dark: true,
    url: "https://gatcha-six.vercel.app/"
  },
  {
    id: 3,
    code: "—",
    title: "—",
    titleEn: "COMING SOON",
    tags: "—",
    tone: "#0d0d0d",
    accent: "#ffffff",
    year: "—", role: "—", status: "—",
    desc1: "", desc2: "",
    dark: true
  },
  {
    id: 4,
    code: "—",
    title: "—",
    titleEn: "COMING SOON",
    tags: "—",
    tone: "#0d0d0d",
    accent: "#ffffff",
    year: "—", role: "—", status: "—",
    desc1: "", desc2: "",
    dark: true
  },

  // ── AI ROW (row 2 — AI content pages + 2 empty slots) ──────────────────
  {
    id: 13,
    code: "AI·1",
    title: "AI 제작 툴 도감",
    titleEn: "AI TOOL MAP",
    tags: "리소스 · AI · 툴",
    tone: "#0a1a3a",
    accent: "#7ab8ff",
    year: "2026",
    role: "Researcher · Editor",
    status: "Live",
    desc1: "AI 툴은 모델명으로 외우는 것보다 작업 목적별로 분류해서 쓰는 것이 중요합니다.",
    desc2: "영상·오디오·3D·디자인·코딩·오픈소스까지 작업별로 찾아보는 AI 툴 맵.",
    url: "./ai-tool-map.html"
  },
  {
    id: 14,
    code: "AI·2",
    title: "AI 작업자 생존 가이드",
    titleEn: "AI CREATOR GUIDE",
    tags: "가이드 · AI · 워크플로우",
    tone: "#1a0a2e",
    accent: "#ffb3d9",
    year: "2026",
    role: "Writer · Researcher",
    status: "Live",
    desc1: "AI를 잘 쓰는 사람은 프롬프트를 많이 아는 사람이 아닙니다.",
    desc2: "작업을 나누고, 검증하고, 실패를 기록하고, 다시 쓸 수 있게 축적하는 사람입니다.",
    url: "./ai-creator-guide.html"
  },
  {
    id: 15,
    code: "—",
    title: "—",
    titleEn: "COMING SOON",
    tags: "—",
    tone: "#e9e5dd",
    accent: "#aaaaaa",
    year: "—", role: "—", status: "—",
    desc1: "", desc2: ""
  },
  {
    id: 16,
    code: "—",
    title: "—",
    titleEn: "COMING SOON",
    tags: "—",
    tone: "#e9e5dd",
    accent: "#aaaaaa",
    year: "—", role: "—", status: "—",
    desc1: "", desc2: ""
  },

  // ── MIDDLE ROW (projects 01 – 04) ────────────────────────────────────────
  {
    id: 5,
    code: "01",
    title: "고립로봇 청년 이모션",
    titleEn: "GOLIPROBOT — YOUTH EMOTION",
    tags: "기획 · 전시 · AI",
    tone: "#d8d2c4",
    accent: "#8a6e54",
    year: "2025",
    role: "Curation · Direction",
    status: "Exhibited",
    desc1: "An exhibition exploring the inner emotional life of isolated youth, mediated through AI-generated character studies and large-scale printed portraits.",
    desc2: "Visitors walked between thirty robot-portraits, each with a recorded inner monologue triggered as they approached."
  },
  {
    id: 6,
    code: "02",
    title: "GENERATIVE AGENT GAME",
    titleEn: "GENERATIVE AGENT GAME",
    tags: "AI · 게임 · 개발",
    tone: "#1c2434",
    accent: "#5b78b8",
    year: "2025",
    role: "Concept · Build",
    status: "Prototype",
    desc1: "A small simulation where each NPC carries its own memory and motivations, written by a generative model in the loop.",
    desc2: "The player is the only human in a town of agents. Conversations branch indefinitely; nothing is scripted."
  },
  {
    id: 7,
    code: "03",
    title: "MY BOOK WITH AI",
    titleEn: "MY BOOK WITH AI",
    tags: "출판 · 만화 · AI",
    tone: "#ecebe6",
    accent: "#2a2a2a",
    year: "2024",
    role: "Author · Illustrator",
    status: "Published",
    desc1: "A short graphic novel co-written with a language model — the model proposed sentences, the author refused most of them.",
    desc2: "What remains is a strange dialogue between two writing styles, printed on uncoated stock with photocopied insets."
  },
  {
    id: 8,
    code: "04",
    title: "STORY BOOK",
    titleEn: "STORY BOOK",
    tags: "스토리 · 기획 · 일러스트",
    tone: "#c6d3b1",
    accent: "#4f6b3a",
    year: "2024",
    role: "Writer · Illustrator",
    status: "Series",
    desc1: "A picture-book series following a small house and the seasons that pass through it.",
    desc2: "Each spread is hand-painted in gouache, scanned, and laid out alongside a single sentence."
  },

  // ── FRONT ROW (projects 05 – 08) ─────────────────────────────────────────
  {
    id: 9,
    code: "05",
    title: "BENNY'S ROOM BRANDING",
    titleEn: "BENNY'S ROOM",
    tags: "브랜딩 · 디자인",
    tone: "#1f3a2a",
    accent: "#d8c98a",
    year: "2024",
    role: "Brand Direction",
    status: "Live",
    desc1: "Branding system for a small café-bookstore — wordmark, signage, menus, paper goods, and a recurring window installation.",
    desc2: "The identity leans into warm green and brass, photographed at night through the storefront glass."
  },
  {
    id: 10,
    code: "06",
    title: "EMOTICON",
    titleEn: "EMOTICON",
    tags: "이모티콘 · 캐릭터",
    tone: "#e2d8c8",
    accent: "#8c6a44",
    year: "2023",
    role: "Character Design",
    status: "Released",
    desc1: "A set of wooden-bear emoticons designed for a messaging platform. Three siblings, twenty-four moods.",
    desc2: "Modeled in clay first, then redrawn as flat vector. The proofs were soft enough to look photographed."
  },
  {
    id: 11,
    code: "07",
    title: "COMMISSIONED ART & WORKS",
    titleEn: "COMMISSIONED ART",
    tags: "일러스트 · 영상 · 작업",
    tone: "#3b2a3a",
    accent: "#c69ec0",
    year: "2022 –",
    role: "Illustrator",
    status: "Ongoing",
    desc1: "An archive of commissioned portraits, editorial illustrations, and short motion pieces for clients in publishing and music.",
    desc2: "Selected works only. Each piece is its own world."
  },
  {
    id: 12,
    code: "08",
    title: "ANIMATION",
    titleEn: "ANIMATION",
    tags: "애니메이션 · 영상",
    tone: "#9bbcde",
    accent: "#2a5582",
    year: "2023",
    role: "Director · Animator",
    status: "Short Film",
    desc1: "A four-minute hand-drawn animation about a girl, a small white dog, and the bridge between two cities.",
    desc2: "Screened at three festivals; the score is built from field recordings of the same bridge in different weather."
  }
];
