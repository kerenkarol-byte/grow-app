export const FILTER_OPTIONS = {
  category: ["relationships", "stress", "career", "finance", "parenting", "productivity"],
  method:    ["mindfulness", "NLP", "coaching", "therapy"],
  priceType: ["free", "paid"],
};

export const CATEGORY_META = {
  relationships: {
    emoji: "🤝",
    color: "#F5EAD8",
    description: "Build deeper connections, set healthy boundaries, and improve how you communicate with the people who matter most.",
  },
  stress: {
    emoji: "🧘",
    color: "#EEE8DC",
    description: "Find calm, manage anxiety, and recover from burnout with evidence-based mindfulness and therapy tools.",
  },
  career: {
    emoji: "💼",
    color: "#F0E8D8",
    description: "Navigate career transitions, grow your confidence at work, and find a path that feels meaningful.",
  },
  finance: {
    emoji: "💰",
    color: "#EDE4D0",
    description: "Break money blocks, build better financial habits, and take control of your relationship with money.",
  },
  parenting: {
    emoji: "👨‍👩‍👧",
    color: "#F2EAE0",
    description: "Raise emotionally healthy children and grow as a parent with expert-backed, compassionate guidance.",
  },
  productivity: {
    emoji: "⚡",
    color: "#EDE8DC",
    description: "Master focus, build lasting habits, and do your best work — without burning out.",
  },
};

export const SUBTOPIC_META = {
  // Relationships
  communication: {
    emoji: "🗣️",
    description: "Express yourself clearly and listen in ways that actually make people feel heard.",
  },
  boundaries: {
    emoji: "🛑",
    description: "Learn to say no, spot unhealthy patterns, and protect your energy with confidence.",
  },
  "emotional intimacy": {
    emoji: "💞",
    description: "Deepen trust, vulnerability, and closeness in romantic and platonic relationships.",
  },
  "self-worth": {
    emoji: "🪞",
    description: "Build a secure sense of identity and heal the wounds that affect how you relate to others.",
  },
  "conflict resolution": {
    emoji: "🤲",
    description: "Navigate disagreements constructively and repair ruptures with compassion.",
  },

  // Stress
  "burnout recovery": {
    emoji: "🔋",
    description: "Rebuild energy reserves and address the root causes of chronic exhaustion.",
  },
  "sleep & anxiety": {
    emoji: "🌙",
    description: "Calm an overactive mind, improve sleep hygiene, and break the anxiety-insomnia loop.",
  },
  "anxiety & worry": {
    emoji: "🌀",
    description: "CBT, mindfulness, and somatic tools to interrupt anxious thought patterns.",
  },
  "everyday stress": {
    emoji: "🌿",
    description: "Quick, sustainable habits for managing daily tension and nervous system regulation.",
  },
  "resilience building": {
    emoji: "🏔️",
    description: "Develop the mental and emotional strength to bounce back from setbacks.",
  },

  // Career
  "career change": {
    emoji: "🔄",
    description: "Identify transferable skills and navigate a move into a more fulfilling role.",
  },
  "confidence & assertiveness": {
    emoji: "🦁",
    description: "Own your voice, overcome imposter syndrome, and command respect at work.",
  },
  "job search & interviews": {
    emoji: "📋",
    description: "CVs, LinkedIn strategy, interview techniques, and standing out in a crowded market.",
  },
  "leadership & management": {
    emoji: "🧭",
    description: "Build influence, manage teams effectively, and grow into senior roles.",
  },
  "work-life balance": {
    emoji: "⚖️",
    description: "Sustainable boundaries between professional ambition and personal wellbeing.",
  },

  // Finance
  "financial anxiety": {
    emoji: "😰",
    description: "Address the emotional and psychological roots of money stress and avoidance.",
  },
  "budgeting & saving": {
    emoji: "🗂️",
    description: "Practical systems for tracking spending, cutting waste, and building an emergency fund.",
  },
  "investing & stocks": {
    emoji: "📈",
    description: "Index funds, ETFs, compounding, and long-term wealth-building strategies made simple.",
  },
  "real estate": {
    emoji: "🏠",
    description: "Buying your first home, understanding mortgages, and property as an investment vehicle.",
  },
  "debt & credit": {
    emoji: "💳",
    description: "Debt payoff strategies, improving your credit score, and breaking the debt cycle.",
  },

  // Parenting
  "toddler behaviour": {
    emoji: "🧸",
    description: "Gentle, science-backed approaches to tantrums, boundaries, and big emotions in young children.",
  },
  "teen years": {
    emoji: "🎧",
    description: "Stay connected through adolescence and support identity, independence, and mental health.",
  },
  "school & learning": {
    emoji: "📚",
    description: "Support academic confidence, manage screen time, and nurture a love of learning.",
  },
  "parent wellbeing": {
    emoji: "🫶",
    description: "Manage parental guilt, avoid burnout, and fill your own cup to show up better.",
  },
  "family dynamics": {
    emoji: "🏡",
    description: "Navigate co-parenting, sibling rivalry, blended families, and intergenerational patterns.",
  },

  // Productivity
  "focus & flow": {
    emoji: "🎯",
    description: "Achieve deep work states, minimise distractions, and enter the zone consistently.",
  },
  "time management": {
    emoji: "⏱️",
    description: "Prioritisation frameworks, calendar design, and escaping the busyness trap.",
  },
  "habit building": {
    emoji: "🔗",
    description: "Design systems that make good behaviour automatic and lasting.",
  },
  "procrastination & motivation": {
    emoji: "🚀",
    description: "Tackle avoidance at its root, reignite your purpose, and build real momentum.",
  },
  "digital minimalism": {
    emoji: "📵",
    description: "Reclaim your attention from apps, notifications, and the always-on culture.",
  },
};

export const CONTENT_TYPES = [
  { type: "podcast",  emoji: "🎙️", label: "Podcasts",  color: "#EDE4D4", textColor: "#7B4E28" },
  { type: "course",   emoji: "🎓", label: "Courses",   color: "#EBE4D0", textColor: "#6B4A20" },
  { type: "coach",    emoji: "👤", label: "Coaches",   color: "#EDE0D0", textColor: "#8B5230" },
  { type: "workshop", emoji: "🛠️", label: "Workshops", color: "#F0DDD0", textColor: "#9B4828" },
  { type: "retreat",  emoji: "🏕️", label: "Retreats",  color: "#EAE0D0", textColor: "#8B4E2A" },
  { type: "book",     emoji: "📖", label: "Books",     color: "#EDE2C8", textColor: "#7A4828" },
  { type: "app",      emoji: "📱", label: "Apps",      color: "#E8E2D8", textColor: "#5A4530" },
  { type: "event",    emoji: "📅", label: "Events",    color: "#EAE0CC", textColor: "#6B5020" },
  { type: "video",    emoji: "▶️",  label: "Videos",   color: "#EAE0F0", textColor: "#5C3878" },
];
