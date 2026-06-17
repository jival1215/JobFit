export type JobMatch = {
  id: string;
  company: string;
  title: string;
  location: string;
  type: "Internship" | "Co-op" | "New Grad";
  score: number;
  recommendation: "Apply" | "Maybe" | "Skip";
  source: string;
  posted: string;
  matchedSkills: string[];
  missingSkills: string[];
  summary: string;
  improvements: string[];
};

export const stats = [
  { label: "Jobs scanned", value: "428", detail: "Across SimplifyJobs sources" },
  { label: "Apply-first matches", value: "37", detail: "Strong fit for your resume" },
  { label: "Avg top score", value: "84", detail: "Top 10 recruiter-fit score" },
  { label: "Saved jobs", value: "12", detail: "Tracked locally" }
];

export const jobMatches: JobMatch[] = [
  {
    id: "pfizer-ai-docs",
    company: "Pfizer",
    title: "AI Data Science Intern",
    location: "New York, NY",
    type: "Internship",
    score: 93,
    recommendation: "Apply",
    source: "Summer internships",
    posted: "2d ago",
    matchedSkills: ["Python", "SQL", "ML", "RAG", "dashboards", "document intelligence"],
    missingSkills: ["Azure", "clinical data"],
    summary:
      "Strong overlap with AI document intelligence, Python analytics, and healthcare-adjacent project experience.",
    improvements: [
      "Lead with the Pfizer AI document intelligence project.",
      "Add one bullet that mentions retrieval, OCR, or document workflows.",
      "Quantify model or dashboard impact where possible."
    ]
  },
  {
    id: "jpm-data-analyst",
    company: "JPMorgan Chase",
    title: "Data Analyst Intern",
    location: "Jersey City, NJ",
    type: "Internship",
    score: 88,
    recommendation: "Apply",
    source: "Summer internships",
    posted: "1d ago",
    matchedSkills: ["SQL", "Python", "Power BI", "analytics", "reporting"],
    missingSkills: ["risk systems"],
    summary:
      "Recruiter-fit is high because the role maps to SQL, reporting, dashboards, and financial analysis.",
    improvements: [
      "Move SQL and dashboard bullets higher on the resume.",
      "Mention RiskLens ML dashboard if the team is risk or finance oriented.",
      "Add business impact language to analytics bullets."
    ]
  },
  {
    id: "databricks-de",
    company: "Databricks",
    title: "Data Engineering Intern",
    location: "Remote, US",
    type: "Internship",
    score: 81,
    recommendation: "Apply",
    source: "Summer internships",
    posted: "4d ago",
    matchedSkills: ["Python", "SQL", "ETL", "APIs", "databases"],
    missingSkills: ["Spark", "Databricks"],
    summary:
      "Good data project alignment through FlightTracker, APIs, SQL databases, and pipeline-style work.",
    improvements: [
      "Emphasize FlightTracker as a data pipeline project.",
      "Add a small Spark or Databricks learning project if truthful.",
      "Use words like ingestion, transformation, and schema."
    ]
  },
  {
    id: "adobe-ai-solutions",
    company: "Adobe",
    title: "AI Solutions Engineer Intern",
    location: "San Jose, CA",
    type: "Internship",
    score: 78,
    recommendation: "Apply",
    source: "Fall internships",
    posted: "6d ago",
    matchedSkills: ["Python", "LLM", "RAG", "APIs", "customer-facing"],
    missingSkills: ["cloud deployment"],
    summary:
      "Strong fit for AI tooling and customer-oriented technical explanation, with a small cloud gap.",
    improvements: [
      "Highlight AI/RAG tools and API integration.",
      "Add a bullet about explaining technical outputs to stakeholders.",
      "Mention any deployment or demo experience."
    ]
  }
];

export const features = [
  {
    title: "Recruiter-style matching",
    description:
      "Scores roles by related ideas, skills, title fit, location preference, freshness, and project relevance."
  },
  {
    title: "Apply plans",
    description:
      "Turns each match into a resume-tailoring checklist with keywords, gaps, and project suggestions."
  },
  {
    title: "Job scout",
    description:
      "Refreshes SimplifyJobs-style sources and flags postings that are new since the last scan."
  },
  {
    title: "Local tracker",
    description:
      "Keeps saved, applied, skipped, notes, and follow-up dates in a simple local workflow."
  }
];
