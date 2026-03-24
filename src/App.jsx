import { useState, useMemo, useEffect } from "react";
import { FILTER_OPTIONS, CATEGORY_META, SUBTOPIC_META, CONTENT_TYPES } from "./data";
import "./App.css";

const TYPE_COLORS = {
  podcast:  { background: "#EDE4D4", color: "#7B4E28" },
  course:   { background: "#EBE4D0", color: "#6B4A20" },
  coach:    { background: "#EDE0D0", color: "#8B5230" },
  workshop: { background: "#F0DDD0", color: "#9B4828" },
  retreat:  { background: "#EAE0D0", color: "#8B4E2A" },
  book:     { background: "#EDE2C8", color: "#7A4828" },
  app:      { background: "#E8E2D8", color: "#5A4530" },
  event:    { background: "#EAE0CC", color: "#6B5020" },
  video:    { background: "#EAE0F0", color: "#5C3878" },
};

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const fmtCount = (n) => {
  if (!n) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
};

// Format ISO date string for display, e.g. "May 3, 2026"
const fmtDate = (iso) =>
  new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// ─── SVG icon library (thin stroke, zen aesthetic) ────────────────────────────
const S = { // shared SVG props
  viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round",
};

const CATEGORY_ICONS = {
  relationships: <svg {...S}><circle cx="8.5" cy="12" r="5.5"/><circle cx="15.5" cy="12" r="5.5"/></svg>,
  stress:        <svg {...S}><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93" x2="7.05" y2="7.05"/><line x1="16.95" y1="16.95" x2="19.07" y2="19.07"/><line x1="4.93" y1="19.07" x2="7.05" y2="16.95"/><line x1="16.95" y1="7.05" x2="19.07" y2="4.93"/></svg>,
  career:        <svg {...S}><circle cx="12" cy="12" r="10"/><polyline points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
  finance:       <svg {...S}><line x1="12" y1="3" x2="12" y2="21"/><path d="M5 21h14"/><path d="M3 9l9-6 9 6"/><path d="M3 9c0 2.8 2 5 4.5 5S12 11.8 12 9"/><path d="M12 9c0 2.8 2 5 4.5 5S21 11.8 21 9"/></svg>,
  parenting:     <svg {...S}><path d="M2 20L12 4l10 16H2z"/><path d="M2 20h20"/><path d="M10 20v-5h4v5"/></svg>,
  productivity:  <svg {...S}><path d="M5 3h14"/><path d="M5 21h14"/><path d="M7 3l5 8 5-8"/><path d="M7 21l5-8 5 8"/></svg>,
};

const TYPE_ICONS = {
  podcast:  <svg {...S}><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>,
  course:   <svg {...S}><path d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>,
  coach:    <svg {...S}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  workshop: <svg {...S}><path d="M12 2c0 6-6 7-6 13a6 6 0 0 0 12 0c0-6-6-7-6-13z"/><path d="M12 12c0 3-2 4-2 6a2 2 0 0 0 4 0c0-2-2-3-2-6z"/></svg>,
  retreat:  <svg {...S}><path d="M3 20L9 8l4 6 3-4 5 10H3z"/></svg>,
  book:     <svg {...S}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  app:      <svg {...S}><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
  event:    <svg {...S}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  video:    <svg {...S}><polygon points="5 3 19 12 5 21 5 3"/></svg>,
};

// ─── Cache layer ──────────────────────────────────────────────────────────────
// Results are stored in localStorage with a timestamp.
// On the next load, if the cache is still fresh, all API calls are skipped entirely.
// TTL is 24 hours — a reasonable balance between freshness and quota conservation.
// Google Books unauthenticated quota: 1,000 req/day.
// With 5 queries per load and no cache, that's only ~200 loads/day before 429s.
// With 24h cache, each browser makes at most 5 requests per day regardless of reloads.
const CACHE_TTL              = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_TTL_EVENTS       =  6 * 60 * 60 * 1000; //  6 hours — events update more often
const CACHE_TTL_SPOTIFY_TOKEN = 50 * 60 * 1000;      // 50 min — Spotify tokens expire after 1h
const CACHE_KEYS = {
  books:         "grow-books-v5",
  podcasts:      "grow-podcasts-v5",
  events:        "grow-events-v5",
  videos:        "grow-videos-v5",
  spotifyShows:  "grow-spotify-shows-v5",
  spotifyToken:  "grow-spotify-token-v5",
};

function readCache(key, ttl = CACHE_TTL) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts < ttl) return data;
    localStorage.removeItem(key); // expired — clean up
  } catch {}
  return null;
}

function writeCache(key, data) {
  try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); }
  catch {} // storage full or private mode — fail silently, keep working
}

// ─── Google Books API ─────────────────────────────────────────────────────────
// These queries fetch a broad set of personal-growth books across categories.
// All requests are client-side fetch() to the public Google Books API (no key needed for basic use).
const BOOKS_QUERIES = [
  "self development personal growth",
  "mindfulness meditation anxiety",
  "productivity habits deep work",
  "emotional intelligence relationships",
  "career leadership success",
];

// Map a Google Books volume's text to one of our app categories
function mapBookCategory(info) {
  const text = [info.title, info.description, ...(info.categories || [])].join(" ").toLowerCase();
  if (/relat|love|attach|communicat|partner|marriage|dating|interpersonal/.test(text)) return "relationships";
  if (/anxi|stress|mindful|meditati|calm|worry|depress|trauma|emotion/.test(text)) return "stress";
  if (/career|leadership|success|business|profession|entrepren|negotiat/.test(text)) return "career";
  if (/money|financ|wealth|invest|rich|budget|debt/.test(text)) return "finance";
  if (/parent|child|family|mother|father|kid|teen|adolesc/.test(text)) return "parenting";
  return "productivity";
}

// Map to one of the existing SUBTOPIC_META keys for the given category
function mapBookSubcategory(info, category) {
  const text = [info.title, info.description, ...(info.categories || [])].join(" ").toLowerCase();
  const maps = {
    relationships: [
      ["communication",     /communicat/],
      ["boundaries",        /boundar/],
      ["emotional intimacy",/intimac|vulnerab|trust/],
      ["self-worth",        /self-worth|self-esteem|self.worth/],
      ["conflict resolution",/conflict|disagree/],
    ],
    stress: [
      ["anxiety & worry",   /anxi|worry|panic/],
      ["burnout recovery",  /burnout|exhaust|recover/],
      ["sleep & anxiety",   /sleep|insomnia/],
      ["resilience building",/resilien|bounce/],
      ["everyday stress",   /stress|calm/],
    ],
    career: [
      ["leadership & management", /leader|manag/],
      ["confidence & assertiveness", /confiden|assert|imposter/],
      ["career change",     /career change|transition|pivot/],
      ["work-life balance", /work.life|balance/],
      ["job search & interviews", /interview|job search|resume/],
    ],
    finance: [
      ["investing & stocks", /invest|stock|fund/],
      ["budgeting & saving", /budget|sav|spend/],
      ["debt & credit",      /debt|credit|loan/],
      ["financial anxiety",  /financ.*anxi|money.*stress/],
      ["real estate",        /real estate|property|mortgage/],
    ],
    parenting: [
      ["toddler behaviour",  /toddler|tantrum/],
      ["teen years",         /teen|adolesc/],
      ["parent wellbeing",   /parent.*burnout/],
      ["family dynamics",    /family|co-parent|sibling/],
      ["school & learning",  /school|learn|academ/],
    ],
    productivity: [
      ["habit building",             /habit/],
      ["focus & flow",               /focus|deep work|flow/],
      ["procrastination & motivation",/motivat|procrastinat/],
      ["time management",            /time manag/],
      ["digital minimalism",         /digital|screen|attention/],
    ],
  };
  const candidates = maps[category] || maps.productivity;
  const match = candidates.find(([, re]) => re.test(text));
  return match ? match[0] : candidates[0][0];
}

// Extract a numeric price from strings like "$14.99" or "USD 25.00". Returns null if unparseable.
function parsePrice(str) {
  if (!str) return null;
  const n = parseFloat(str.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? null : n;
}

// Convert a raw Google Books volume object into our app's item shape
function googleBookToItem(vol) {
  const info = vol.volumeInfo || {};
  const sale = vol.saleInfo || {};
  const category = mapBookCategory(info);
  const desc = info.description || "";
  return {
    id: `gb-${vol.id}`,
    title: info.title || "Untitled",
    type: "book",
    category,
    subcategory: mapBookSubcategory(info, category),
    method: "coaching",
    priceType: sale.saleability === "FOR_SALE" ? "paid" : "free",
    price: sale.retailPrice?.amount ? `$${sale.retailPrice.amount.toFixed(2)}` : null,
    rating: info.averageRating ? Math.round(info.averageRating * 10) / 10 : 4.0,
    ratingCount: info.ratingsCount || null,
    publishedDate: info.publishedDate || null,
    link: info.infoLink?.replace("http://", "https://") || null,
    description: desc.length > 320 ? desc.slice(0, 317) + "…" : desc || "No description available.",
    thumbnail: info.imageLinks?.thumbnail?.replace("http://", "https://") || null,
    source: "Google Books",
  };
}

// Checks localStorage cache first. Only hits the API if cache is missing or older than 24h.
// maxResults bumped to 40 (Google Books max) to get better coverage per request.
function useBooks() {
  const [books, setBooks]   = useState(() => readCache(CACHE_KEYS.books) ?? []);
  const [loading, setLoading] = useState(() => readCache(CACHE_KEYS.books) === null);

  useEffect(() => {
    if (books.length > 0) return; // cache hit — skip all network requests
    let cancelled = false;
    Promise.all(
      BOOKS_QUERIES.map((q) =>
        fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=40&langRestrict=en&printType=books`
        )
          .then((r) => r.json())
          .catch(() => ({ items: [] }))
      )
    ).then((results) => {
      if (cancelled) return;
      const seen = new Set();
      const mapped = [];
      results.forEach((res) => {
        (res.items || []).forEach((vol) => {
          if (!seen.has(vol.id) && vol.volumeInfo?.title) {
            seen.add(vol.id);
            mapped.push(googleBookToItem(vol));
          }
        });
      });
      writeCache(CACHE_KEYS.books, mapped);
      setBooks(mapped);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { books, loading };
}

// ─── iTunes Podcasts API ──────────────────────────────────────────────────────
// Uses the public iTunes Search API — no key needed, CORS-enabled.
const PODCAST_QUERIES = [
  "self improvement personal development",
  "mindfulness meditation",
  "productivity habits",
  "relationships communication",
  "mental health anxiety",
];

function mapPodcastCategory(podcast) {
  const text = [podcast.collectionName, podcast.primaryGenreName, ...(podcast.genres || [])].join(" ").toLowerCase();
  if (/relat|love|attach|communicat|partner|marriage|dating/.test(text)) return "relationships";
  if (/anxi|stress|mindful|meditati|calm|worry|mental health|depress|emotion/.test(text)) return "stress";
  if (/career|leadership|success|business|entrepren|negotiat/.test(text)) return "career";
  if (/money|financ|wealth|invest|rich|budget/.test(text)) return "finance";
  if (/parent|child|family|mother|father|kid|teen/.test(text)) return "parenting";
  return "productivity";
}

function mapPodcastSubcategory(podcast, category) {
  const text = [podcast.collectionName, podcast.primaryGenreName, ...(podcast.genres || [])].join(" ").toLowerCase();
  const maps = {
    relationships: [
      ["communication",      /communicat/],
      ["boundaries",         /boundar/],
      ["emotional intimacy", /intimac|vulnerab|trust/],
      ["self-worth",         /self-worth|self-esteem/],
      ["conflict resolution",/conflict|disagree/],
    ],
    stress: [
      ["anxiety & worry",    /anxi|worry|panic/],
      ["burnout recovery",   /burnout|exhaust/],
      ["sleep & anxiety",    /sleep|insomnia/],
      ["resilience building",/resilien/],
      ["everyday stress",    /stress|calm|mindful/],
    ],
    career: [
      ["leadership & management",    /leader|manag/],
      ["confidence & assertiveness", /confiden|assert/],
      ["career change",              /career change|transition/],
      ["work-life balance",          /work.life|balance/],
      ["job search & interviews",    /interview|job/],
    ],
    finance: [
      ["investing & stocks", /invest|stock/],
      ["budgeting & saving", /budget|sav/],
      ["debt & credit",      /debt|credit/],
      ["financial anxiety",  /money.*stress/],
    ],
    parenting: [
      ["family dynamics",   /family|co-parent/],
      ["teen years",        /teen|adolesc/],
      ["parent wellbeing",  /parent.*wellbeing/],
      ["school & learning", /school|learn/],
    ],
    productivity: [
      ["habit building",              /habit/],
      ["focus & flow",                /focus|deep work/],
      ["procrastination & motivation",/motivat|procrastinat/],
      ["time management",             /time manag/],
      ["digital minimalism",          /digital|screen/],
    ],
  };
  const candidates = maps[category] || maps.productivity;
  const match = candidates.find(([, re]) => re.test(text));
  return match ? match[0] : candidates[0][0];
}

function mapPodcastMethod(podcast) {
  const text = [podcast.collectionName, podcast.primaryGenreName].join(" ").toLowerCase();
  if (/mindful|meditati|yoga|breath/.test(text)) return "mindfulness";
  if (/nlp|neuro-linguistic/.test(text)) return "NLP";
  if (/therap|clinical|psychol/.test(text)) return "therapy";
  return "coaching";
}

function itunesPodcastToItem(podcast) {
  const category = mapPodcastCategory(podcast);
  const desc = podcast.collectionName && podcast.artistName
    ? `${podcast.collectionName} is a podcast hosted by ${podcast.artistName}.${podcast.primaryGenreName ? ` Genre: ${podcast.primaryGenreName}.` : ""}`
    : "No description available.";
  return {
    id: `itunes-${podcast.collectionId}`,
    title: podcast.collectionName || "Untitled Podcast",
    type: "podcast",
    category,
    subcategory: mapPodcastSubcategory(podcast, category),
    method: mapPodcastMethod(podcast),
    priceType: "free",
    rating: podcast.averageUserRating ? Math.round(podcast.averageUserRating * 10) / 10 : 4.2,
    ratingCount: podcast.userRatingCount || null,
    releaseDate: podcast.releaseDate || null,
    link: podcast.collectionViewUrl || podcast.trackViewUrl || null,
    spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(podcast.collectionName || "")}`,
    description: desc,
    thumbnail: podcast.artworkUrl600 || podcast.artworkUrl100 || null,
    source: "Apple",
  };
}

// Checks localStorage cache first. Only hits iTunes if cache is missing or older than 24h.
function usePodcasts() {
  const [podcasts, setPodcasts] = useState(() => readCache(CACHE_KEYS.podcasts) ?? []);
  const [loading, setLoading]   = useState(() => readCache(CACHE_KEYS.podcasts) === null);

  useEffect(() => {
    if (podcasts.length > 0) return; // cache hit — skip all network requests
    let cancelled = false;
    Promise.all(
      PODCAST_QUERIES.map((q) =>
        fetch(
          `https://itunes.apple.com/search?media=podcast&entity=podcast&term=${encodeURIComponent(q)}&limit=20`
        )
          .then((r) => r.json())
          .catch(() => ({ results: [] }))
      )
    ).then((results) => {
      if (cancelled) return;
      const seen = new Set();
      const mapped = [];
      results.forEach((res) => {
        (res.results || []).forEach((podcast) => {
          if (!seen.has(podcast.collectionId) && podcast.collectionName) {
            seen.add(podcast.collectionId);
            mapped.push(itunesPodcastToItem(podcast));
          }
        });
      });
      writeCache(CACHE_KEYS.podcasts, mapped);
      setPodcasts(mapped);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { podcasts, loading };
}

// ─── Spotify Podcasts API ─────────────────────────────────────────────────────
// Requires VITE_SPOTIFY_CLIENT_ID + VITE_SPOTIFY_CLIENT_SECRET in .env.local.
// Uses Client Credentials flow — no user login needed, just app-level access.
// Note: like other API keys in this app, credentials are visible in network
// requests; use a server-side proxy for production.
async function getSpotifyToken(clientId, clientSecret) {
  const cached = readCache(CACHE_KEYS.spotifyToken, CACHE_TTL_SPOTIFY_TOKEN);
  if (cached) return cached;
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) return null;
  const { access_token } = await res.json();
  if (access_token) writeCache(CACHE_KEYS.spotifyToken, access_token);
  return access_token || null;
}

const SPOTIFY_QUERIES = [
  "personal development self improvement",
  "mindfulness meditation mental health",
  "productivity habits coaching",
  "relationships communication therapy",
  "career leadership business",
  "financial wellness money",
];

function spotifyShowToItem(show) {
  const text = `${show.name} ${show.description}`;
  const category = mapEventCategory(text);
  const desc = show.description || "";
  return {
    id:          `sp-${show.id}`,
    title:       show.name || "Untitled Podcast",
    type:        "podcast",
    category,
    subcategory: mapEventSubcategory(text, category),
    method:      mapEventMethod(text),
    priceType:   "free",
    rating:      4.3,
    ratingCount: null,
    link:        show.external_urls?.spotify || null,
    appleUrl:    `https://podcasts.apple.com/search?term=${encodeURIComponent(show.name || "")}`,
    description: desc.length > 320 ? desc.slice(0, 317) + "…" : desc || "No description available.",
    thumbnail:   show.images?.[0]?.url || null,
    source:      "Spotify",
  };
}

function useSpotifyPodcasts() {
  const clientId     = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
  const hasCreds = !!(clientId && clientSecret);

  const [shows, setShows]     = useState(() => hasCreds ? (readCache(CACHE_KEYS.spotifyShows) ?? []) : []);
  const [loading, setLoading] = useState(() => hasCreds && readCache(CACHE_KEYS.spotifyShows) === null);

  useEffect(() => {
    if (!hasCreds || shows.length > 0) return;
    let cancelled = false;
    getSpotifyToken(clientId, clientSecret)
      .then((token) => {
        if (!token || cancelled) { setLoading(false); return null; }
        return Promise.all(
          SPOTIFY_QUERIES.map((q) =>
            fetch(
              `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=show&market=US&limit=20`,
              { headers: { Authorization: `Bearer ${token}` } }
            )
              .then((r) => r.json())
              .catch(() => ({ shows: { items: [] } }))
          )
        );
      })
      .then((results) => {
        if (!results || cancelled) return;
        const seen = new Set();
        const mapped = [];
        results.forEach((res) => {
          (res.shows?.items || []).forEach((show) => {
            if (!seen.has(show.id) && show.name) {
              seen.add(show.id);
              mapped.push(spotifyShowToItem(show));
            }
          });
        });
        writeCache(CACHE_KEYS.spotifyShows, mapped);
        setShows(mapped);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { shows, loading };
}

// ─── Eventbrite API ───────────────────────────────────────────────────────────
// Token is read from the VITE_EVENTBRITE_TOKEN environment variable.
// Add it to a .env.local file at the project root — see README or inline docs.
// Results are cached for 6h (events change faster than books/podcasts).
//
// Eventbrite search endpoint:
//   GET https://www.eventbriteapi.com/v3/events/search/
//   Authorization: Bearer {token}
const EVENTS_QUERIES = [
  "personal growth mindfulness retreat",
  "stress burnout wellness workshop",
  "relationships communication workshop",
  "career leadership coaching workshop",
  "productivity habits workshop",
  "financial wellness money workshop",
];

function mapEventCategory(text) {
  const t = text.toLowerCase();
  if (/relat|couple|communicat|partner|love|attachment/.test(t)) return "relationships";
  if (/anxi|stress|mindful|meditati|burnout|breath|calm|retreat/.test(t)) return "stress";
  if (/career|leadership|success|profession|business|job/.test(t)) return "career";
  if (/money|financ|wealth|invest|budget/.test(t)) return "finance";
  if (/parent|child|family|mother|father|kid|teen/.test(t)) return "parenting";
  return "productivity";
}

function mapEventSubcategory(text, category) {
  const t = text.toLowerCase();
  const maps = {
    relationships: [
      ["communication",      /communicat/],
      ["boundaries",         /boundar/],
      ["emotional intimacy", /intimac|vulnerab|trust/],
      ["self-worth",         /self.worth|self.esteem/],
      ["conflict resolution",/conflict|disagree/],
    ],
    stress: [
      ["anxiety & worry",    /anxi|worry|panic/],
      ["burnout recovery",   /burnout|exhaust/],
      ["sleep & anxiety",    /sleep|insomnia/],
      ["resilience building",/resilien/],
      ["everyday stress",    /stress|calm|mindful|breath|meditat/],
    ],
    career: [
      ["leadership & management",    /leader|manag/],
      ["confidence & assertiveness", /confiden|assert/],
      ["career change",              /career change|transition|pivot/],
      ["work-life balance",          /work.life|balance/],
      ["job search & interviews",    /interview|job search/],
    ],
    finance: [
      ["investing & stocks", /invest|stock/],
      ["budgeting & saving", /budget|sav/],
      ["debt & credit",      /debt|credit/],
      ["financial anxiety",  /money.*stress|financ.*anxi/],
    ],
    parenting: [
      ["family dynamics",   /family|co.parent/],
      ["toddler behaviour", /toddler|tantrum/],
      ["teen years",        /teen|adolesc/],
      ["parent wellbeing",  /parent.*burnout/],
    ],
    productivity: [
      ["habit building",              /habit/],
      ["focus & flow",                /focus|deep work|flow/],
      ["procrastination & motivation",/motivat|procrastinat/],
      ["time management",             /time manag/],
      ["digital minimalism",          /digital|screen/],
    ],
  };
  const candidates = maps[category] || maps.productivity;
  const match = candidates.find(([, re]) => re.test(t));
  return match ? match[0] : candidates[0][0];
}

function mapEventMethod(text) {
  const t = text.toLowerCase();
  if (/mindful|meditati|yoga|breath|zen|vipassana/.test(t)) return "mindfulness";
  if (/therap|clinical|psychol|cbt|trauma/.test(t))         return "therapy";
  if (/nlp|neuro.linguistic/.test(t))                       return "NLP";
  return "coaching";
}

function eventbriteToItem(ev) {
  const name = ev.name?.text || "";
  const desc = ev.description?.text || "";
  const text = `${name} ${desc}`;
  const category = mapEventCategory(text);

  // Build a readable location string from the venue expand
  const venue = ev.venue;
  let location = null;
  if (ev.online_event) {
    location = "Online";
  } else if (venue) {
    const parts = [venue.address?.city, venue.address?.region].filter(Boolean);
    location = parts.length ? parts.join(", ") : venue.name || null;
  }

  // Prefer the high-res original image if available
  const thumbnail = ev.logo?.original?.url || ev.logo?.url || null;

  // Minimum ticket price if the event is paid
  const priceDisplay = ev.ticket_availability?.minimum_ticket_price?.display || null;

  return {
    id:          `eb-${ev.id}`,
    title:       name || "Untitled Event",
    type:        "event",
    category,
    subcategory: mapEventSubcategory(text, category),
    method:      mapEventMethod(text),
    priceType:   ev.is_free ? "free" : "paid",
    price:       priceDisplay,
    rating:      4.5,      // Eventbrite doesn't expose ratings
    ratingCount: null,
    date:        ev.start?.local?.split("T")[0] || null,
    location,
    description: desc.length > 320 ? desc.slice(0, 317) + "…" : desc || "No description available.",
    thumbnail,
    link:        ev.url || null,
    source:      "Eventbrite",
  };
}

// Fetches upcoming personal-growth events from Eventbrite.
// Requires VITE_EVENTBRITE_TOKEN in .env.local.
// Returns { events, loading } — same shape as useBooks / usePodcasts.
function useEvents() {
  const token = import.meta.env.VITE_EVENTBRITE_TOKEN;

  const [events, setEvents]   = useState(() =>
    token ? (readCache(CACHE_KEYS.events, CACHE_TTL_EVENTS) ?? []) : []
  );
  const [loading, setLoading] = useState(() =>
    !!token && readCache(CACHE_KEYS.events, CACHE_TTL_EVENTS) === null
  );

  useEffect(() => {
    if (!token) return;          // no token → stay empty, no loading state
    if (events.length > 0) return; // cache hit

    let cancelled = false;
    const now = new Date().toISOString();

    Promise.all(
      EVENTS_QUERIES.map((q) =>
        fetch(
          `https://www.eventbriteapi.com/v3/events/search/` +
          `?q=${encodeURIComponent(q)}` +
          `&expand=venue,ticket_availability` +
          `&start_date.range_start=${encodeURIComponent(now)}` +
          `&sort_by=date` +
          `&page_size=20`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
          .then((r) => r.json())
          .catch(() => ({ events: [] }))
      )
    ).then((results) => {
      if (cancelled) return;
      const seen   = new Set();
      const mapped = [];
      results.forEach((res) => {
        (res.events || []).forEach((ev) => {
          if (!seen.has(ev.id) && ev.name?.text) {
            seen.add(ev.id);
            mapped.push(eventbriteToItem(ev));
          }
        });
      });
      writeCache(CACHE_KEYS.events, mapped);
      setEvents(mapped);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [token]);

  return { events, loading };
}

// ─── YouTube Data API ─────────────────────────────────────────────────────────
// Token: VITE_YOUTUBE_API_KEY in .env.local
// Quota: 10,000 units/day on the free tier; each search costs 100 units.
// 6 queries × 100 = 600 units per full refresh. 24h cache keeps daily cost low.
const YOUTUBE_QUERIES = [
  "mindfulness meditation stress relief",
  "personal growth productivity habits",
  "relationship communication tips",
  "career leadership coaching",
  "financial wellness money tips",
  "parenting family wellbeing",
];

// Infer a structured subtype from the video title + description text.
function mapVideoSubtype(text) {
  const t = text.toLowerCase();
  if (/\bcourse\b|full course|complete course/.test(t)) return "course";
  if (/\bpodcast\b|\binterview\b/.test(t))             return "podcast";
  if (/\btalk\b|\blecture\b/.test(t))                  return "lecture";
  if (/\bcoach\b|coaching|\btips\b|how[\s-]?to/.test(t)) return "coaching";
  return "coaching";
}

// Map a raw YouTube search result item into the app's unified item shape.
// Category/subcategory/method reuse the event text-based mappers.
function youtubeToItem(video) {
  const snippet = video.snippet || {};
  const title   = snippet.title       || "";
  const desc    = snippet.description || "";
  const text    = `${title} ${desc}`;
  const category = mapEventCategory(text);

  return {
    id:           `yt-${video.id.videoId}`,
    title:        title || "Untitled Video",
    type:         "video",
    subtype:      mapVideoSubtype(text),
    category,
    subcategory:  mapEventSubcategory(text, category),
    method:       mapEventMethod(text),
    priceType:    "free",
    rating:       4.3,   // YouTube Data API v3 does not expose ratings
    ratingCount:  null,
    publishedDate: snippet.publishedAt?.split("T")[0] || null,
    link:         `https://www.youtube.com/watch?v=${video.id.videoId}`,
    description:  desc.length > 320 ? desc.slice(0, 317) + "…" : desc || "No description available.",
    thumbnail:    snippet.thumbnails?.high?.url
                  || snippet.thumbnails?.medium?.url
                  || snippet.thumbnails?.default?.url
                  || null,
    source:       "YouTube",
  };
}

function useVideos() {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;

  const [videos, setVideos]   = useState(() =>
    apiKey ? (readCache(CACHE_KEYS.videos) ?? []) : []
  );
  const [loading, setLoading] = useState(() =>
    !!apiKey && readCache(CACHE_KEYS.videos) === null
  );
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!apiKey) return;           // no key → stay empty, no spinner
    if (videos.length > 0) return; // cache hit

    let cancelled = false;

    Promise.all(
      YOUTUBE_QUERIES.map((q) =>
        fetch(
          `https://www.googleapis.com/youtube/v3/search` +
          `?part=snippet&type=video&q=${encodeURIComponent(q)}` +
          `&maxResults=20&relevanceLanguage=en&key=${apiKey}`
        )
          .then((r) => r.json())
          .catch(() => ({ items: [] }))
      )
    ).then((results) => {
      if (cancelled) return;
      const seen   = new Set();
      const mapped = [];
      results.forEach((res) => {
        if (res.error) { setError(res.error.message); return; }
        (res.items || []).forEach((video) => {
          const videoId = video.id?.videoId;
          if (videoId && !seen.has(videoId) && video.snippet?.title) {
            seen.add(videoId);
            mapped.push(youtubeToItem(video));
          }
        });
      });
      writeCache(CACHE_KEYS.videos, mapped);
      setVideos(mapped);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [apiKey]);

  return { videos, loading, error };
}

// ─── Recommendation engine ────────────────────────────────────────────────────
// Scores every item against signals extracted from favorites + viewed history.
// No ML — just weighted category/subcategory/method matching plus a rating nudge.
//
// Weights:
//   category match from a favorited item    → +3
//   subcategory match from a favorited item → +2
//   method match from a favorited item      → +1
//   category match from a viewed item       → +2
//   subcategory match from a viewed item    → +1
//   method match from a viewed item         → +0.5
//   rating boost                            → (rating − 3) × 0.3  (0–0.6 range)
//
// Items already favorited or viewed are excluded from results.
// interests: string[] of categories chosen during onboarding  → +1.5 per match
// This is the weakest signal (cold-start), so it yields recs even before
// the user has any favorites or viewed history.
function useRecommendations(allItems, favorites, viewedItems, interests) {
  return useMemo(() => {
    const interestSet = new Set(interests);
    const hasSignals  = favorites.size > 0 || viewedItems.size > 0 || interestSet.size > 0;
    if (!hasSignals) return [];

    const favArr  = allItems.filter((i) => favorites.has(i.id));
    const viewArr = allItems.filter((i) => viewedItems.has(i.id));

    const favCategories    = new Set(favArr.map((i) => i.category));
    const favSubcategories = new Set(favArr.map((i) => i.subcategory));
    const favMethods       = new Set(favArr.map((i) => i.method));
    const viewCategories    = new Set(viewArr.map((i) => i.category));
    const viewSubcategories = new Set(viewArr.map((i) => i.subcategory));
    const viewMethods       = new Set(viewArr.map((i) => i.method));

    return allItems
      .filter((i) => !favorites.has(i.id) && !viewedItems.has(i.id))
      .map((item) => {
        let score = 0;
        if (interestSet.has(item.category))         score += 1.5;
        if (favCategories.has(item.category))       score += 3;
        if (favSubcategories.has(item.subcategory)) score += 2;
        if (favMethods.has(item.method))            score += 1;
        if (viewCategories.has(item.category))      score += 2;
        if (viewSubcategories.has(item.subcategory)) score += 1;
        if (viewMethods.has(item.method))           score += 0.5;
        score += (item.rating - 3) * 0.3;
        return { item, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || b.item.rating - a.item.rating)
      .slice(0, 10)
      .map(({ item }) => item);
  }, [allItems, favorites, viewedItems, interests]);
}

// ─── Sort dropdown (compact icon button) ─────────────────────────────────────
const SORT_OPTIONS = [
  { value: "relevant", label: "Most relevant" },
  { value: "rating",   label: "Highest rated" },
  { value: "newest",   label: "Newest"        },
];

function SortDropdown({ value, onChange, isOpen, onToggle }) {
  const active = value !== "relevant";
  const label  = SORT_OPTIONS.find((o) => o.value === value)?.label ?? "Sort";
  return (
    <div className="dropdown-wrapper sort-compact">
      <button className={`sort-icon-btn${active ? " active" : ""}`}
        onClick={onToggle} title={label} aria-label={`Sort: ${label}`}>
        <svg width="15" height="13" viewBox="0 0 15 13" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="0" y1="1.5" x2="15" y2="1.5"/>
          <line x1="0" y1="6.5" x2="10" y2="6.5"/>
          <line x1="0" y1="11.5" x2="5" y2="11.5"/>
        </svg>
        {active && <span className="sort-active-label">{label}</span>}
      </button>
      {isOpen && (
        <div className="dropdown-menu dropdown-menu--right">
          {SORT_OPTIONS.map((opt) => (
            <button key={opt.value}
              className={`rating-option${value === opt.value ? " selected" : ""}`}
              onClick={() => onChange(opt.value)}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Rating dropdown (single-select) ─────────────────────────────────────────
const RATING_OPTIONS = [
  { value: 3,   label: "3+ ★" },
  { value: 4,   label: "4+ ★" },
  { value: 4.5, label: "4.5+ ★" },
];

function RatingDropdown({ value, onChange, isOpen, onToggle }) {
  return (
    <div className="dropdown-wrapper">
      <button className={`dropdown-trigger${value !== null ? " active" : ""}`} onClick={onToggle}>
        {value !== null ? `${value}+ ★` : "Rating"}
        <span className="chevron">{isOpen ? "▲" : "▼"}</span>
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          {RATING_OPTIONS.map((opt) => (
            <button key={opt.value} className={`rating-option${value === opt.value ? " selected" : ""}`}
              onClick={() => onChange(value === opt.value ? null : opt.value)}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Price dropdown (Free/Paid/All tabs + max-price slider) ───────────────────
const PRICE_TABS = [
  { value: "all",  label: "All"  },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
];

function PriceDropdown({ priceType, maxPrice, onPriceType, onMaxPrice, isOpen, onToggle }) {
  const isActive = priceType !== "all" || maxPrice !== null;
  const label = priceType === "free" ? "Free"
    : maxPrice !== null ? `≤ $${maxPrice}`
    : priceType === "paid" ? "Paid"
    : "Price";
  return (
    <div className="dropdown-wrapper">
      <button className={`dropdown-trigger${isActive ? " active" : ""}`} onClick={onToggle}>
        {isActive ? label : "Price"}
        <span className="chevron">{isOpen ? "▲" : "▼"}</span>
      </button>
      {isOpen && (
        <div className="dropdown-menu price-menu">
          <div className="price-tabs">
            {PRICE_TABS.map((tab) => (
              <button key={tab.value}
                className={`price-tab${priceType === tab.value ? " active" : ""}`}
                onClick={() => onPriceType(tab.value)}>
                {tab.label}
              </button>
            ))}
          </div>
          {priceType !== "free" && (
            <div className="price-range-wrap">
              <div className="price-range-labels">
                <span>$0</span>
                <span className="price-range-val">{maxPrice !== null ? `$${maxPrice}` : "Any"}</span>
              </div>
              <input type="range" min={0} max={200} step={5}
                value={maxPrice ?? 200}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onMaxPrice(v >= 200 ? null : v);
                }}
                className="price-slider" />
              <p className="price-range-hint">Max price for paid items</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Multi-select dropdown ────────────────────────────────────────────────────
function MultiSelectDropdown({ label, options, selected, onChange, isOpen, onToggle, labelMap = {} }) {
  const toggle = (val) =>
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);

  return (
    <div className="dropdown-wrapper">
      <button className={`dropdown-trigger${selected.length > 0 ? " active" : ""}`} onClick={onToggle}>
        {label}
        {selected.length > 0 && <span className="badge">{selected.length}</span>}
        <span className="chevron">{isOpen ? "▲" : "▼"}</span>
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          {options.map((opt) => (
            <label key={opt} className="dropdown-option">
              <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} />
              <span>{labelMap[opt] ?? opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Item card ────────────────────────────────────────────────────────────────
function ItemCard({ item, onClick, favorites, toggleFavorite }) {
  const colors = TYPE_COLORS[item.type] || { background: "#eee", color: "#333" };
  const saved = favorites.has(item.id);
  return (
    <article className="card" onClick={() => onClick(item)} tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick(item)} role="button">
      <div className="card-body">
        <div className="card-main">
          <div className="card-header">
            <span className="type-badge" style={colors}>{item.type}</span>
            <span className="price-badge" data-price={item.priceType}>
              {item.priceType === "free" ? "Free" : item.price || "Paid"}
            </span>
            {item.source && <span className="source-badge">{item.source}</span>}
          </div>
          <h2 className="card-title">{item.title}</h2>
          {(item.location || item.date) && (
            <p className="card-event-meta">
              {item.location && <span>📍 {item.location}</span>}
              {item.location && item.date && <span className="card-event-sep"> · </span>}
              {item.date && <span>🗓 {fmtDate(item.date)}</span>}
            </p>
          )}
          <p className="card-meta">{item.category} · {item.subcategory}</p>
          <p className="card-method">{item.subtype ?? item.method}</p>
          <div className="card-rating">
            <span className="stars">{"★".repeat(Math.round(item.rating))}{"☆".repeat(5 - Math.round(item.rating))}</span>
            <span className="rating-num">{item.rating}</span>
            {item.ratingCount && <span className="rating-count">({fmtCount(item.ratingCount)})</span>}
          </div>
        </div>
        <div className="card-right">
          <button className={`heart-btn${saved ? " saved" : ""}`}
            onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
            aria-label={saved ? "Remove from saved" : "Save"}>
            {saved ? "♥" : "♡"}
          </button>
          {item.thumbnail && (
            <img className="card-thumb" src={item.thumbnail} alt="" loading="lazy" />
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Recommendation strip ─────────────────────────────────────────────────────
function RecCard({ item, onClick, favorites, toggleFavorite }) {
  const colors = TYPE_COLORS[item.type] || { background: "#eee", color: "#333" };
  const saved = favorites.has(item.id);
  return (
    <div className="rec-card" onClick={() => onClick(item)} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick(item)}>
      <div className="rec-card-img-wrap">
        {item.thumbnail
          ? <img src={item.thumbnail} alt="" className="rec-card-img" loading="lazy" />
          : <div className="rec-card-img-placeholder" />}
        <button className={`rec-heart${saved ? " saved" : ""}`}
          onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
          aria-label={saved ? "Remove from saved" : "Save"}>
          {saved ? "♥" : "♡"}
        </button>
      </div>
      <div className="rec-card-body">
        <span className="type-badge rec-type-badge" style={colors}>{item.type}</span>
        <p className="rec-card-title">{item.title}</p>
        <div className="rec-card-rating">
          <span className="stars rec-stars">
            {"★".repeat(Math.round(item.rating))}{"☆".repeat(5 - Math.round(item.rating))}
          </span>
          <span className="rec-card-rating-num">{item.rating}</span>
        </div>
      </div>
    </div>
  );
}

function RecsStrip({ items, onSelectItem, favorites, toggleFavorite }) {
  if (items.length === 0) return null;
  return (
    <div className="recs-strip">
      <div className="recs-header">
        <span className="recs-label">Recommended for you</span>
        <span className="recs-sublabel">Based on your activity</span>
      </div>
      <div className="recs-scroll">
        {items.map((item) => (
          <RecCard key={item.id} item={item} onClick={onSelectItem}
            favorites={favorites} toggleFavorite={toggleFavorite} />
        ))}
      </div>
    </div>
  );
}

// ─── Detail view ──────────────────────────────────────────────────────────────
function DetailView({ item, onBack, favorites, toggleFavorite }) {
  const colors = TYPE_COLORS[item.type] || { background: "#eee", color: "#333" };
  const saved = favorites.has(item.id);
  return (
    <div className="detail-view">
      <div className="detail-topbar">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <button className={`save-btn${saved ? " saved" : ""}`} onClick={() => toggleFavorite(item.id)}>
          {saved ? "♥ Saved" : "♡ Save"}
        </button>
      </div>
      <div className="detail-header">
        <span className="type-badge type-badge--lg" style={colors}>{item.type}</span>
        <span className="price-badge price-badge--lg" data-price={item.priceType}>
          {item.priceType === "free" ? "Free" : item.price || "Paid"}
        </span>
      </div>
      {item.thumbnail && (
        <img className="detail-thumb" src={item.thumbnail} alt="" />
      )}
      <h1 className="detail-title">{item.title}</h1>
      <div className="detail-rating">
        <span className="stars stars--lg">{"★".repeat(Math.round(item.rating))}{"☆".repeat(5 - Math.round(item.rating))}</span>
        <span className="rating-num">{item.rating} / 5</span>
        {item.ratingCount && <span className="rating-count">· {fmtCount(item.ratingCount)} ratings</span>}
      </div>
      {item.type === "podcast" ? (
        <div className="podcast-links">
          {item.link && (
            <a className="platform-btn platform-btn--apple" href={item.link}
              target="_blank" rel="noopener noreferrer">
              Apple →
            </a>
          )}
          {item.spotifyUrl && (
            <a className="platform-btn platform-btn--spotify" href={item.spotifyUrl}
              target="_blank" rel="noopener noreferrer">
              Spotify →
            </a>
          )}
          {item.appleUrl && (
            <a className="platform-btn platform-btn--apple" href={item.appleUrl}
              target="_blank" rel="noopener noreferrer">
              Apple →
            </a>
          )}
        </div>
      ) : item.link && (
        <a className="visit-btn" href={item.link} target="_blank" rel="noopener noreferrer">
          Visit →
        </a>
      )}
      <div className="detail-fields">
        {[
          ["Category", item.category],
          ["Subcategory", item.subcategory],
          ...(item.subtype  ? [["Subtype",  item.subtype]]       : []),
          ...(item.location ? [["Location", item.location]]      : []),
          ...(item.date     ? [["Date",     fmtDate(item.date)]] : []),
          ["Method", item.method],
          ["Price",  item.price ?? (item.priceType === "paid" ? "Paid" : "Free")],
          ...(item.source ? [["Source", item.source]] : []),
        ].map(([label, value]) => (
          <div className="field-row" key={label}>
            <span className="field-label">{label}</span>
            <span className="field-value">{value}</span>
          </div>
        ))}
      </div>
      <p className="detail-description">{item.description}</p>
    </div>
  );
}

// ─── Onboarding screen ────────────────────────────────────────────────────────
// Shown once on first launch (until grow-interests exists in localStorage).
// Lets the user pick categories so recommendations have a cold-start signal.
function OnboardingScreen({ onFinish }) {
  const [selected, setSelected] = useState(new Set());

  const toggle = (cat) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });

  return (
    <div className="onboarding">
      <div className="onboarding-hero">
        <h1 className="onboarding-title">What do you want<br />to work on?</h1>
        <p className="onboarding-subtitle">Pick the areas you'd like to focus on</p>
      </div>

      <div className="onboarding-grid">
        {FILTER_OPTIONS.category.map((cat) => {
          const meta   = CATEGORY_META[cat];
          const active = selected.has(cat);
          return (
            <button key={cat}
              className={`onboarding-tile${active ? " selected" : ""}`}
              style={active ? { background: meta.color } : undefined}
              onClick={() => toggle(cat)}>
              <span className="onboarding-tile-check" aria-hidden="true">
                {active ? "✓" : ""}
              </span>
              <span className="onboarding-tile-icon">{CATEGORY_ICONS[cat]}</span>
              <span className="onboarding-tile-name">{cat}</span>
              <p className="onboarding-tile-desc">{meta.description}</p>
            </button>
          );
        })}
      </div>

      <div className="onboarding-footer">
        <button className="onboarding-cta"
          disabled={selected.size === 0}
          onClick={() => onFinish([...selected])}>
          Get started →
        </button>
        <button className="onboarding-skip" onClick={() => onFinish([])}>
          Skip for now
        </button>
      </div>
    </div>
  );
}

// ─── Landing page ─────────────────────────────────────────────────────────────
// allItems is passed from App so category counts reflect the live data (API + static)
function LandingPage({ onSelectCategory, onSearch, onSelectType, allItems }) {
  const [searchText, setSearchText] = useState("");
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: "Grow", text: "Discover tools for your personal growth journey", url }); }
      catch { /* user dismissed */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const categoryCounts = useMemo(() => {
    const counts = {};
    allItems.forEach((item) => { counts[item.category] = (counts[item.category] || 0) + 1; });
    return counts;
  }, [allItems]);

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchText.trim());
  };

  return (
    <div className="landing">
      <header className="landing-hero">
        <h1 className="landing-title">Grow</h1>
        <p className="landing-subtitle">Discover the right tools for your personal growth journey</p>
        <form className="landing-search-form" onSubmit={handleSearch}>
          <input className="search-input" type="search"
            placeholder="Search across all topics…"
            value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          <button type="submit" className="landing-search-btn">Search</button>
        </form>
      </header>

      {/* Content types explainer */}
      <div className="content-types-section">
        <p className="content-types-label">What you'll find here</p>
        <div className="content-types-row">
          {CONTENT_TYPES.map(({ type, label, color, textColor }) => (
            <button key={type} className="content-type-pill" style={{ background: color, color: textColor }}
              onClick={() => onSelectType(type)}>
              <span className="pill-icon">{TYPE_ICONS[type]}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      <section className="category-section">
        <h2 className="category-section-title">Where do you want to focus?</h2>
        <div className="category-grid">
          {FILTER_OPTIONS.category.map((cat) => {
            const meta = CATEGORY_META[cat];
            const count = categoryCounts[cat] || 0;
            return (
              <button key={cat} className="category-card" style={{ background: meta.color }}
                onClick={() => onSelectCategory(cat)}>
                <span className="category-icon">{CATEGORY_ICONS[cat]}</span>
                <span className="category-name">{cat}</span>
                <p className="category-desc">{meta.description}</p>
                <span className="category-count">{count} resource{count !== 1 ? "s" : ""}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="landing-footer">
        <button className="share-btn" onClick={handleShare}>
          {copied ? "✓ Copied!" : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Share this app
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Subtopics page ───────────────────────────────────────────────────────────
function SubtopicsPage({ category, onSelectSubtopic, onSelectAll, onGoBack, allItems }) {
  const subtopics = useMemo(() => {
    const usedKeys = new Set(allItems.filter((i) => i.category === category).map((i) => i.subcategory));
    return Object.entries(SUBTOPIC_META)
      .filter(([key]) => usedKeys.has(key))
      .map(([key, val]) => ({ key, ...val }));
  }, [category, allItems]);

  const counts = useMemo(() => {
    const c = {};
    allItems.forEach((i) => { if (i.category === category) c[i.subcategory] = (c[i.subcategory] || 0) + 1; });
    return c;
  }, [category, allItems]);

  const total = allItems.filter((i) => i.category === category).length;

  return (
    <div className="subtopics-page">
      <div className="app-header">
        <button className="home-back-btn" onClick={onGoBack}>← Topics</button>
        <h1 className="app-title">{cap(category)}</h1>
      </div>

      <div className="subtopics-list">
        <button className="subtopic-row subtopic-row--all" onClick={onSelectAll}>
          <div className="subtopic-row-left">
            <span className="subtopic-accent subtopic-accent--all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </span>
            <div>
              <span className="subtopic-name">All {cap(category)}</span>
              <p className="subtopic-desc">Browse every resource in this topic</p>
            </div>
          </div>
          <div className="subtopic-row-right">
            <span className="subtopic-count">{total}</span>
            <span className="subtopic-arrow">›</span>
          </div>
        </button>

        <p className="subtopics-divider-label">Browse by subtopic</p>

        {subtopics.map(({ key, description }) => (
          <button key={key} className="subtopic-row" onClick={() => onSelectSubtopic(key)}>
            <div className="subtopic-row-left">
              <span className="subtopic-accent">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><circle cx="12" cy="12" r="3"/></svg>
              </span>
              <div>
                <span className="subtopic-name">{cap(key)}</span>
                <p className="subtopic-desc">{description}</p>
              </div>
            </div>
            <div className="subtopic-row-right">
              <span className="subtopic-count">{counts[key] || 0}</span>
              <span className="subtopic-arrow">›</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Home view ────────────────────────────────────────────────────────────────
function HomeView({ onSelectItem, favorites, toggleFavorite, onGoBack, allItems, liveLoading,
  viewedItems, interests, initialSearch = "", initialCategory = null, initialSubcategory = null, initialType = null }) {

  const [searchText, setSearchText]     = useState(initialSearch);
  const [filters, setFilters]           = useState({
    category: initialCategory ? [initialCategory] : [],
    type: [],
    method: [],
    priceType: "all",
    maxPrice: null,
    minRating: null,
  });
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("relevant");

  const toggleDropdown = (key) => setOpenDropdown((prev) => (prev === key ? null : key));
  const setFilter = (key) => (vals) => setFilters((prev) => ({ ...prev, [key]: vals }));

  const clearAll = () => {
    setSearchText("");
    setFilters({ category: initialCategory ? [initialCategory] : [], type: [], method: [], priceType: "all", maxPrice: null, minRating: null });
    setOpenDropdown(null);
    setShowSavedOnly(false);
  };

  const hasActiveFilters =
    searchText.trim() !== "" ||
    filters.type.length > 0 || filters.method.length > 0 || filters.priceType !== "all" || filters.maxPrice !== null ||
    filters.minRating !== null ||
    showSavedOnly;

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return allItems.filter((item) => {
      if (initialSubcategory && item.subcategory !== initialSubcategory) return false;
      if (initialType && item.type !== initialType) return false;
      if (showSavedOnly && !favorites.has(item.id)) return false;
      if (q && ![
        item.title, item.category, item.subcategory,
        item.type, item.method, item.description,
      ].some((field) => field?.toLowerCase().includes(q))) return false;
      if (filters.category.length  > 0 && !filters.category.includes(item.category))   return false;
      if (filters.type.length      > 0 && !filters.type.includes(item.type))           return false;
      if (filters.method.length    > 0 && !filters.method.includes(item.method))        return false;
      if (filters.priceType === "free" && item.priceType !== "free") return false;
      if (filters.priceType === "paid" && item.priceType !== "paid") return false;
      if (filters.maxPrice !== null && item.priceType === "paid") {
        const p = parsePrice(item.price);
        if (p !== null && p > filters.maxPrice) return false;
      }
      if (filters.minRating !== null && item.rating < filters.minRating)               return false;
      return true;
    });
  }, [searchText, filters, showSavedOnly, favorites, initialSubcategory, initialType, allItems]);

  const sorted = useMemo(() => {
    if (sortBy === "relevant") return filtered;
    const arr = [...filtered];
    if (sortBy === "rating") {
      arr.sort((a, b) => b.rating - a.rating || (b.ratingCount ?? 0) - (a.ratingCount ?? 0));
    } else if (sortBy === "newest") {
      arr.sort((a, b) => {
        // Each item type exposes its date under a different field name
        const da = a.publishedDate || a.releaseDate || a.date || "";
        const db = b.publishedDate || b.releaseDate || b.date || "";
        if (!da && !db) return 0;
        if (!da) return 1;  // undated items sink to the bottom
        if (!db) return -1;
        return db.localeCompare(da); // ISO / YYYY strings sort correctly lexicographically
      });
    }
    return arr;
  }, [filtered, sortBy]);

  const recs = useRecommendations(allItems, favorites, viewedItems, interests);

  // Types that actually have items in the current category context
  const availableTypes = useMemo(() => {
    const base = initialCategory
      ? allItems.filter((i) => i.category === initialCategory)
      : allItems;
    const typeSet = new Set(base.map((i) => i.type));
    return CONTENT_TYPES.filter((ct) => typeSet.has(ct.type));
  }, [allItems, initialCategory]);

  const headerTitle = initialSubcategory
    ? cap(initialSubcategory)
    : initialCategory
    ? cap(initialCategory)
    : initialType
    ? `${cap(initialType)}s`
    : "All Resources";

  // Show loading indicator when viewing live-fetched content types
  const liveTypes = new Set(["book", "podcast", "event", "video"]);
  const showLiveLoader = liveLoading && (!initialType || liveTypes.has(initialType));

  return (
    <div className="home-view" onClick={() => openDropdown && setOpenDropdown(null)}>
      <header className="app-header">
        <button className="home-back-btn" onClick={onGoBack}>
          {initialCategory ? `← ${cap(initialCategory)}` : "← Topics"}
        </button>
        <h1 className="app-title">{headerTitle}</h1>
      </header>

      <div className="search-bar-wrapper">
        <input className="search-input" type="search"
          placeholder="Search by title, category…"
          value={searchText} onChange={(e) => setSearchText(e.target.value)} />
      </div>

      <div className="filters-row" onClick={(e) => e.stopPropagation()}>
        {!initialCategory && (
          <MultiSelectDropdown label="Category" options={FILTER_OPTIONS.category}
            selected={filters.category} onChange={setFilter("category")}
            isOpen={openDropdown === "category"} onToggle={() => toggleDropdown("category")} />
        )}
        {availableTypes.length > 1 && (
          <MultiSelectDropdown label="Type"
            options={availableTypes.map((ct) => ct.type)}
            labelMap={Object.fromEntries(availableTypes.map((ct) => [ct.type, ct.label]))}
            selected={filters.type} onChange={setFilter("type")}
            isOpen={openDropdown === "type"} onToggle={() => toggleDropdown("type")} />
        )}
        <MultiSelectDropdown label="Method" options={FILTER_OPTIONS.method}
          selected={filters.method} onChange={setFilter("method")}
          isOpen={openDropdown === "method"} onToggle={() => toggleDropdown("method")} />
        <PriceDropdown
          priceType={filters.priceType} maxPrice={filters.maxPrice}
          onPriceType={(val) => setFilters((prev) => ({ ...prev, priceType: val }))}
          onMaxPrice={(val) => setFilters((prev) => ({ ...prev, maxPrice: val }))}
          isOpen={openDropdown === "price"} onToggle={() => toggleDropdown("price")} />
        <RatingDropdown
          value={filters.minRating}
          onChange={(val) => setFilters((prev) => ({ ...prev, minRating: val }))}
          isOpen={openDropdown === "rating"} onToggle={() => toggleDropdown("rating")} />
        <button className={`saved-toggle${showSavedOnly ? " active" : ""}`}
          onClick={() => setShowSavedOnly((v) => !v)}>
          {showSavedOnly ? "♥" : "♡"} Saved
          {favorites.size > 0 && <span className="badge">{favorites.size}</span>}
        </button>
        {hasActiveFilters && <button className="clear-btn" onClick={clearAll}>Clear</button>}
      </div>

      <RecsStrip items={recs} onSelectItem={onSelectItem}
        favorites={favorites} toggleFavorite={toggleFavorite} />

      {showLiveLoader && (
        <p className="loading-books">Loading live content…</p>
      )}

      <div className="results-bar" onClick={(e) => e.stopPropagation()}>
        <p className="results-count">{sorted.length} result{sorted.length !== 1 ? "s" : ""}</p>
        <SortDropdown value={sortBy} onChange={setSortBy}
          isOpen={openDropdown === "sort"} onToggle={() => toggleDropdown("sort")} />
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">No results found. Try adjusting your filters.</div>
      ) : (
        <div className="cards-list">
          {sorted.map((item) => (
            <ItemCard key={item.id} item={item} onClick={onSelectItem}
              favorites={favorites} toggleFavorite={toggleFavorite} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  // Show onboarding on first ever launch; skip it once grow-interests is set.
  const [view, setView] = useState(() =>
    localStorage.getItem("grow-interests") !== null ? "landing" : "onboarding"
  );
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [homeConfig, setHomeConfig]     = useState({ search: "", category: null, subcategory: null, type: null });

  const [interests, setInterests] = useState(() => {
    try { return JSON.parse(localStorage.getItem("grow-interests") || "null") ?? []; }
    catch { return []; }
  });

  const finishOnboarding = (selected) => {
    localStorage.setItem("grow-interests", JSON.stringify(selected));
    setInterests(selected);
    setView("landing");
  };

  const [favorites, setFavorites] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("grow-favorites") || "[]")); }
    catch { return new Set(); }
  });

  const [viewedItems, setViewedItems] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("grow-viewed") || "[]")); }
    catch { return new Set(); }
  });

  const trackViewed = (id) => {
    setViewedItems((prev) => {
      if (prev.has(id)) return prev;
      const arr = [...prev, id].slice(-50); // keep last 50
      localStorage.setItem("grow-viewed", JSON.stringify(arr));
      return new Set(arr);
    });
  };

  // Fetch live content from external APIs.
  const { books: apiBooks, loading: booksLoading }          = useBooks();
  const { podcasts: apiPodcasts, loading: podcastsLoading } = usePodcasts();
  const { shows: apiSpotify, loading: spotifyLoading }      = useSpotifyPodcasts();
  const { events: apiEvents, loading: eventsLoading }       = useEvents();
  const { videos: apiVideos, loading: videosLoading }       = useVideos();
  const liveLoading = booksLoading || podcastsLoading || spotifyLoading || eventsLoading || videosLoading;

  // Merge all real API data. Each source is empty while its fetch is in flight.
  const allItems = useMemo(() => {
    const books    = booksLoading    ? [] : apiBooks;
    const podcasts = podcastsLoading ? [] : apiPodcasts;
    const spotify  = spotifyLoading  ? [] : apiSpotify;
    const events   = eventsLoading   ? [] : apiEvents;
    const videos   = videosLoading   ? [] : apiVideos;
    return [...books, ...podcasts, ...spotify, ...events, ...videos];
  }, [apiBooks, booksLoading, apiPodcasts, podcastsLoading,
      apiSpotify, spotifyLoading, apiEvents, eventsLoading, apiVideos, videosLoading]);

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem("grow-favorites", JSON.stringify([...next]));
      return next;
    });
  };

  const goToSubtopics = (category) => { setSelectedCategory(category); setView("subtopics"); };

  const goToHome = (config = {}) => {
    setHomeConfig({ search: config.search || "", category: config.category || null, subcategory: config.subcategory || null, type: config.type || null });
    setView("home");
  };

  const backFromHome = () => {
    if (homeConfig.category) { setSelectedCategory(homeConfig.category); setView("subtopics"); }
    else setView("landing");
  };

  return (
    <div className="app-container">
      {view === "onboarding" ? (
        <OnboardingScreen onFinish={finishOnboarding} />
      ) : view === "detail" && selectedItem ? (
        <DetailView item={selectedItem} onBack={() => setView("home")}
          favorites={favorites} toggleFavorite={toggleFavorite} />
      ) : view === "home" ? (
        <HomeView
          onSelectItem={(item) => { trackViewed(item.id); setSelectedItem(item); setView("detail"); }}
          favorites={favorites} toggleFavorite={toggleFavorite}
          onGoBack={backFromHome}
          allItems={allItems}
          liveLoading={liveLoading}
          viewedItems={viewedItems}
          interests={interests}
          initialSearch={homeConfig.search}
          initialCategory={homeConfig.category}
          initialSubcategory={homeConfig.subcategory}
          initialType={homeConfig.type}
        />
      ) : view === "subtopics" && selectedCategory ? (
        <SubtopicsPage
          category={selectedCategory}
          allItems={allItems}
          onSelectSubtopic={(sub) => goToHome({ category: selectedCategory, subcategory: sub })}
          onSelectAll={() => goToHome({ category: selectedCategory })}
          onGoBack={() => setView("landing")}
        />
      ) : (
        <LandingPage
          allItems={allItems}
          onSelectCategory={goToSubtopics}
          onSearch={(q) => goToHome({ search: q })}
          onSelectType={(t) => goToHome({ type: t })}
        />
      )}
    </div>
  );
}
