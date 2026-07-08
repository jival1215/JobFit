export type ResumeBulletChange = {
  current: string;
  suggestion: string;
  reason: string;
};

export type JobMatch = {
  id: string;
  backendId?: string;
  company: string;
  title: string;
  location: string;
  type: "Internship" | "Co-op" | "New Grad";
  score: number;
  matchScore?: number;
  deterministicScore?: number;
  aiRecruiterRelatednessScore?: number;
  aiRecruiterReasoning?: string;
  aiRecruiterEvidence?: string[];
  aiRecruiterConcerns?: string[];
  aiRecruiterProvider?: string;
  recommendation: "Apply" | "Maybe" | "Skip";
  source: string;
  posted: string;
  matchedSkills: string[];
  missingSkills: string[];
  summary: string;
  personalizedSummary?: string;
  matchExplanation?: string;
  improvements: string[];
  improvementTips?: string[];
  applicationLink?: string;
  applyUrl?: string;
  applyPlan?: string;
  resumeChanges?: string[];
  resumeKeywords?: string[];
  suggestedExperience?: string[];
  resumeBulletChanges?: ResumeBulletChange[];
  aiEnhanced?: boolean;
  aiProvider?: string;
  scoreBreakdown?: string;
  isNew?: boolean;
  status?: string;
  notes?: string;
  appliedDate?: string;
  followUpDate?: string;
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
    ],
    applicationLink: "https://www.pfizer.com/about/careers",
    applyUrl: "https://www.pfizer.com/about/careers",
    resumeChanges: [
      "Move the Pfizer AI document intelligence project into your top project or experience slot.",
      "Rewrite one bullet to include Python, SQL, RAG, dashboards, and document workflows together.",
      "Add a measurable outcome such as documents processed, time saved, or accuracy improved."
    ],
    resumeKeywords: ["Python", "SQL", "RAG", "document intelligence", "dashboards", "healthcare data"],
    suggestedExperience: [
      "Highlight Pfizer AI document intelligence as the closest domain match.",
      "Mention any stakeholder-facing dashboard or automation work."
    ],
    resumeBulletChanges: [
      {
        current: "Built an AI document intelligence dashboard using Python, SQL, and retrieval workflows.",
        suggestion: "Rewrite this bullet to name RAG, document intelligence, dashboard impact, and a measurable result if truthful.",
        reason: "This bullet is the clearest match for an AI Data Science role in healthcare or document automation."
      }
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
    ],
    applicationLink: "https://careers.jpmorgan.com/us/en/students/programs",
    applyUrl: "https://careers.jpmorgan.com/us/en/students/programs",
    resumeChanges: [
      "Put SQL, reporting, and dashboard work near the top of your skills and project bullets.",
      "Rewrite the RiskLens project to sound like a finance/risk analytics use case.",
      "Add business metrics such as reduced manual review, clearer reporting, or faster decisions."
    ],
    resumeKeywords: ["SQL", "Python", "Power BI", "risk analytics", "reporting", "financial data"],
    suggestedExperience: [
      "Lead with the RiskLens ML dashboard if applying to a risk or finance team.",
      "Highlight any economics coursework or analysis projects."
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
    ],
    applicationLink: "https://www.databricks.com/company/careers/university-recruiting",
    applyUrl: "https://www.databricks.com/company/careers/university-recruiting",
    resumeChanges: [
      "Rename or frame FlightTracker as a data pipeline project, not just an app.",
      "Add language around ingestion, transformation, schemas, APIs, and databases.",
      "If truthful, add Spark or Databricks coursework, labs, or a small project."
    ],
    resumeKeywords: ["Python", "SQL", "ETL", "APIs", "databases", "Spark", "Databricks"],
    suggestedExperience: [
      "Highlight FlightTracker data ingestion and database design.",
      "Mention any API integration or scheduled data refresh work."
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
    ],
    applicationLink: "https://careers.adobe.com/us/en/students",
    applyUrl: "https://careers.adobe.com/us/en/students",
    resumeChanges: [
      "Add a bullet that connects AI/RAG tools with API integration and user-facing demos.",
      "Mention times you explained technical outputs to non-technical users or stakeholders.",
      "If truthful, add deployment, prototype, or demo details."
    ],
    resumeKeywords: ["Python", "LLM", "RAG", "APIs", "customer-facing", "cloud deployment"],
    suggestedExperience: [
      "Lead with AI/RAG tooling and any customer-oriented technical explanation.",
      "Highlight projects where someone could interact with or evaluate your tool."
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
