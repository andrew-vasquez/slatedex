export type UpdateEntry = {
  slug: string;
  title: string;
  summary: string;
  date: string;
  readTime: string;
  category: string;
  eyebrow: string;
  author: string;
  sections: Array<{
    title: string;
    paragraphs: string[];
  }>;
};

export const updates: UpdateEntry[] = [
  {
    slug: "devlog-001-building-slatedex-in-public",
    title: "Devlog 001: Building Slatedex in Public",
    summary:
      "A quick first devlog about why I made Slatedex, what I have been improving lately, and why I want to keep it free while building it with player feedback.",
    date: "2026-04-11",
    readTime: "4 min read",
    category: "Devlog",
    eyebrow: "First entry",
    author: "Andrew Vasquez",
    sections: [
      {
        title: "Why start an updates section?",
        paragraphs: [
          "Slatedex is still very much a side project, but it has reached the point where I am shipping enough things that I wanted a place to actually talk about them. Instead of burying every change in my head or random notes, this gives me a simple place to share what is new and what I am working on.",
          "I also did not want this to feel like a super formal company blog. I would rather use it like a running devlog: what changed, what is going well, what is still rough, and what people want to see next.",
        ],
      },
      {
        title: "Why I made Slatedex",
        paragraphs: [
          "I made Slatedex because I wanted a Pokemon team builder that felt more useful than just filling six slots and calling it done. I wanted something that helps you think through weaknesses, coverage, matchups, and game-specific options without needing a bunch of tabs open at once.",
          "The goal is not to make the most bloated builder possible. It is to make something fast, clear, and genuinely helpful whether you are casually planning a team or getting more serious about optimizing one.",
        ],
      },
      {
        title: "What shipped recently",
        paragraphs: [
          "A lot of the recent work has been polish and reliability work. I integrated Sentry on the frontend, got source maps uploading, and added a custom feedback modal so bugs and feature ideas can come straight from people using the app.",
          "I also cleaned up some rough edges around the public experience: better footer coverage, improved route stability in development, more consistent feedback entry points, and a few quality-of-life UI fixes along the way.",
        ],
      },
      {
        title: "Tell me what you want from it",
        paragraphs: [
          "If you have tried Slatedex already, I really do want to hear what feels useful, what feels annoying, and what you wish existed. That kind of feedback is way more valuable right now than pretending I already know exactly what the perfect roadmap looks like.",
          "So that is the plan for this devlog section too: keep shipping, keep improving the app, and keep sharing the process without making it feel overly serious. If you have opinions, I want them.",
        ],
      },
    ],
  },
];

export function getUpdateBySlug(slug: string) {
  return updates.find((entry) => entry.slug === slug);
}
