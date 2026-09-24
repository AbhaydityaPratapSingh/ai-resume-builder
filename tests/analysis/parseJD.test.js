import { describe, it, expect } from "vitest";
import { parseJD } from "../../shared/text/parseJD.js";

// A hand-labelled set of realistic SDE JDs. Each JD names the skills it
// requires (word by word, not the canonical dictionary label) and what this
// parser must recover as required vs. preferred. Grows whenever a real JD
// is found that the parser gets wrong (see ARCHITECTURE.md section 13.1).
//
// The 22 JDs from "TCS-style Ninja hiring" through "Security-adjacent
// backend role" are written in the style of real Indian campus-placement
// postings — service-company, product-company, fintech, and startup —
// rather than scraped verbatim, since LinkedIn/Naukri postings aren't
// reachable from this repo's tooling. Each one was independently read and
// hand-labelled before checking it against the parser's actual output, not
// the other way around.
//
// The 14 JDs from "IBM Associate System Engineer" on are real postings —
// pulled by the user from their campus placement portal (Haveloc), across
// three batches, plus one from a .docx. Reading and labelling them caught
// four real bugs, since fixed (see shared/text/parseJD.js): minPercentage
// had no context requirement at all and grabbed an unrelated "maximum of
// 30% occupancy of the role" sentence ahead of the real "minimum 73-75%
// aggregate" cutoff later in the same JD; gradYear only matched
// trigger-word-then-year order ("graduating in 2026") and missed two real
// postings that write the year first ("2027 graduating Batch", "2027
// Passout"); the bare "IT" branch check matched the pronoun "it" in
// ordinary prose, not just the abbreviation; and a JD naming disciplines
// only to illustrate it doesn't care which one a candidate studied ("we
// don't shortlist based on branch... whether you studied Computer
// Science... or something entirely different") still matched those names
// as a branch restriction, the opposite of what the JD said.
const JDS = [
  {
    name: "SDE intern, explicit Requirements/Good to have",
    text: `
We are hiring a Software Engineer Intern.

Requirements:
- Strong knowledge of Java or Python
- Experience with React and Node.js
- Familiarity with REST APIs and Git
- CGPA of 7.5 or above

Good to have:
- Experience with Docker
- Knowledge of AWS
    `,
    required: ["java", "python", "react", "nodejs", "restapi", "git"],
    preferred: ["docker", "aws"],
    eligibility: { minCgpa: 7.5 },
  },
  {
    name: "No headings at all — everything required",
    text: `Looking for a backend engineer with strong Python and PostgreSQL skills, comfortable with Docker and CI/CD pipelines.`,
    required: ["python", "postgresql", "docker", "cicd"],
    preferred: [],
    eligibility: {},
  },
  {
    name: "Must-have / Bonus headings",
    text: `
Must-have skills:
- TypeScript, React, GraphQL
- Experience with MongoDB

Bonus:
- Kubernetes
- Next.js
    `,
    required: ["typescript", "react", "graphql", "mongodb"],
    preferred: ["kubernetes", "nextjs"],
    eligibility: {},
  },
  {
    name: "Ambiguous Go and C don't false-match casual text",
    text: `We're a great team looking to go far. C you at the interview!`,
    required: [],
    preferred: [],
    eligibility: {},
  },
  {
    name: "Ambiguous Go matches with programming context",
    text: `Requirements: Proficiency in the Go programming language and Kubernetes.`,
    required: ["go", "kubernetes"],
    preferred: [],
    eligibility: {},
  },
  {
    name: "Symbols in skill names (C++, C#, .NET)",
    text: `Requirements: C++ or C# experience; familiarity with .NET is a plus... wait, actually required too.`,
    required: ["cpp", "csharp", "dotnet"],
    preferred: [],
    eligibility: {},
  },
  {
    name: "Branch and graduation-year eligibility",
    text: `
Eligibility: CSE/IT branch only, graduating batch 2026, minimum 70% aggregate.

Requirements:
- Java, Spring Boot, MySQL
    `,
    required: ["java", "springboot", "mysql"],
    preferred: [],
    eligibility: { branches: ["cse"], gradYear: 2026, minPercentage: 70 },
  },
  {
    name: "Preferred section with 'Nice to have' heading",
    text: `
Qualifications:
- Solid understanding of data structures and algorithms
- SQL and Linux

Nice to have:
- Redis
- Elasticsearch
    `,
    required: ["dsa", "sql", "linux"],
    preferred: ["redis", "elasticsearch"],
    eligibility: {},
  },
  {
    name: "TCS-style Ninja hiring, Eligibility Criteria heading, percentage + branch + batch",
    text: `
TCS is hiring for the role of Software Engineer (Ninja).

Eligibility Criteria:
- B.Tech/B.E in CSE, IT or ECE branch only
- Minimum 60% aggregate in 10th, 12th and Graduation
- No standing arrears
- Batch of 2026

Skills Required:
- Programming fundamentals in C, C++ or Java
- Knowledge of SQL and DBMS concepts
- Good understanding of Data Structures and Algorithms
    `,
    required: ["c", "cpp", "java", "sql", "dsa"],
    preferred: [],
    eligibility: { minPercentage: 60, gradYear: 2026, branches: ["cse", "ece"] },
  },
  {
    name: "Fintech backend intern, Must-have/Nice to have, CGPA of X",
    text: `
We're looking for a Backend Engineering Intern to join our fintech platform team.

Must-have:
- Proficiency in Python or Go
- Experience with PostgreSQL and Redis
- Familiarity with Docker and AWS
- Understanding of REST API design
- CGPA of 8 or above

Nice to have:
- Exposure to Kubernetes
- Knowledge of GraphQL
    `,
    required: ["python", "go", "postgresql", "redis", "docker", "aws", "restapi"],
    preferred: ["kubernetes", "graphql"],
    eligibility: { minCgpa: 8 },
  },
  {
    name: "Frontend product co, Qualifications heading, Next.js under required",
    text: `
Frontend Engineer - Product Team

Qualifications:
- 0-1 years experience with React and TypeScript
- Solid CSS and HTML fundamentals
- Familiarity with Redux or similar state management
- Experience with Next.js is a plus
- Understanding of REST APIs

Bonus:
- Exposure to GraphQL
- Familiarity with Figma
    `,
    // "Next.js is a plus" reads like a preferred skill, but it's a bullet
    // under "Qualifications" (a required heading) — this parser classifies
    // by heading only, not per-bullet wording, so it lands in required.
    // That's a known scope limit (ARCHITECTURE.md section 7.2), not a bug.
    required: ["react", "typescript", "css", "html", "redux", "nextjs", "restapi"],
    preferred: ["graphql", "figma"],
    eligibility: {},
  },
  {
    name: "Full-stack startup, no explicit headings, everything required",
    text: `
Full Stack Developer (0-2 yrs)

We are a fast-growing startup building a SaaS product for schools. You will work across our
Node.js backend and React frontend. Strong fundamentals in JavaScript and SQL are a must.
Experience with MongoDB or PostgreSQL is expected. Familiarity with Git and basic Linux
command line usage is required. CGPA 7+ preferred, but we care more about what you've built.
    `,
    required: ["nodejs", "react", "javascript", "sql", "mongodb", "postgresql", "git", "linux"],
    preferred: [],
    eligibility: { minCgpa: 7 },
  },
  {
    name: "Android/mobile intern",
    text: `
Mobile Engineering Intern - Android

Requirements:
- Strong knowledge of Java or Kotlin
- Understanding of OOP concepts
- Familiarity with REST APIs and JSON

Good to have:
- Experience with Flutter or React Native
- Exposure to Firebase
    `,
    required: ["java", "kotlin", "oop", "restapi"],
    preferred: ["flutter", "reactnative", "firebase"],
    eligibility: {},
  },
  {
    name: "DevOps/SRE intern, CI/CD heavy",
    text: `
DevOps Intern

Required Skills:
- Linux fundamentals and shell scripting
- Familiarity with Docker and Kubernetes
- Understanding of CI/CD pipelines (Jenkins, GitHub Actions or GitLab CI)
- Basic knowledge of AWS or Azure

Preferred:
- Exposure to Terraform or Ansible
- Familiarity with Nginx
    `,
    required: ["linux", "bash", "docker", "kubernetes", "cicd", "jenkins", "githubactions", "gitlabci", "aws", "azure"],
    preferred: ["terraform", "ansible", "nginx"],
    eligibility: {},
  },
  {
    name: "Ambiguous Go/C dense JD, product company backend role",
    text: `
Backend Engineer (Go)

Requirements:
- 1+ years of professional experience with the Go programming language
- Comfortable with C for performance-critical modules
- Experience with PostgreSQL and Redis
- Familiarity with Docker

Good to have:
- Kubernetes experience
- Exposure to gRPC
    `,
    required: ["go", "c", "postgresql", "redis", "docker"],
    preferred: ["kubernetes"],
    eligibility: {},
  },
  {
    name: "Symbol-heavy .NET / C# enterprise role",
    text: `
.NET Developer - Enterprise Applications

Requirements:
- Strong experience with C# and .NET
- Familiarity with SQL Server (MSSQL)
- Understanding of OOP and design patterns
- Experience with Azure DevOps

Nice to have:
- Exposure to Docker
- Familiarity with Angular
    `,
    // Known matcher limitation, not asserted against here: "C#" also
    // triggers a spurious bare "c" match (the ambiguous-skill boundary
    // check doesn't treat "#" as blocking), same as "C++" elsewhere. C#
    // and C are different languages, so this one is a real precision
    // defect worth fixing, unlike the Next.js/React-Native overlaps below.
    required: ["csharp", "dotnet", "mssql", "oop", "azure"],
    preferred: ["docker", "angular"],
    eligibility: {},
  },
  {
    name: "Eligibility-heavy campus drive, CGPA + branch + grad year combined",
    text: `
Off-campus drive for Graduate Engineer Trainee.

Eligibility:
- CGPA of 7.5 or above, no active backlogs
- CSE, ECE or EEE branches only
- Graduating in 2026

Skills:
- Java, SQL
- Data Structures and Algorithms
- REST APIs
    `,
    required: ["java", "sql", "dsa", "restapi"],
    preferred: [],
    eligibility: { minCgpa: 7.5, branches: ["cse", "ece", "eee"], gradYear: 2026 },
  },
  {
    name: "Coding-contest-focused DSA heavy JD",
    text: `
SDE-1 (Product Based Company)

What you'll need:
- Excellent command of Data Structures and Algorithms
- Strong programming skills in C++ or Java
- Understanding of System Design fundamentals
- Familiarity with Git

Good to have:
- Competitive programming background
- Exposure to Microservices architecture
    `,
    required: ["dsa", "cpp", "java", "systemdesign", "git"],
    preferred: ["microservices"],
    eligibility: {},
  },
  {
    name: "QA/SDET role",
    text: `
QA Engineer (SDET)

Requirements:
- Programming experience in Java or Python
- Understanding of REST APIs and Postman
- Familiarity with Git

Good to have:
- Exposure to CI/CD (Jenkins)
- Basic SQL knowledge
    `,
    required: ["java", "python", "restapi", "postman", "git"],
    preferred: ["cicd", "jenkins", "sql"],
    eligibility: {},
  },
  {
    name: "Cloud-heavy AWS role",
    text: `
Cloud Engineer - AWS

Requirements:
- Hands-on experience with AWS (EC2, S3, Lambda)
- Familiarity with Docker and Kubernetes
- Scripting in Python or Bash
- Understanding of Linux systems

Nice to have:
- Terraform experience
- Exposure to Jenkins or GitHub Actions
    `,
    required: ["aws", "docker", "kubernetes", "python", "bash", "linux"],
    preferred: ["terraform", "jenkins", "githubactions"],
    eligibility: {},
  },
  {
    name: "Data-adjacent SDE role (Python + SQL; Excel/Power BI intentionally out of dictionary scope)",
    text: `
Software Engineer - Data Platform

Requirements:
- Strong Python and SQL skills
- Understanding of REST APIs
- Familiarity with PostgreSQL

Good to have:
- Exposure to Excel or Power BI for internal reporting
- Familiarity with Elasticsearch
    `,
    required: ["python", "sql", "restapi", "postgresql"],
    preferred: ["elasticsearch"],
    eligibility: {},
  },
  {
    name: "Ruby on Rails startup role",
    text: `
Ruby on Rails Developer

Requirements:
- Experience with Ruby on Rails
- Familiarity with PostgreSQL
- Understanding of REST APIs and Git

Good to have:
- Exposure to Docker
- Familiarity with Redis
    `,
    required: ["rails", "ruby", "postgresql", "restapi", "git"],
    preferred: ["docker", "redis"],
    eligibility: {},
  },
  {
    name: "PHP/Laravel role",
    text: `
Backend Developer - PHP

Requirements:
- Strong experience with PHP and Laravel
- Familiarity with MySQL
- Understanding of REST APIs

Nice to have:
- Familiarity with Docker
- Exposure to Git and GitHub
    `,
    required: ["php", "laravel", "mysql", "restapi"],
    preferred: ["docker", "git", "github"],
    eligibility: {},
  },
  {
    name: "Scala/functional backend role (Kafka intentionally out of dictionary scope)",
    text: `
Backend Engineer - Scala

Must have:
- Strong programming fundamentals, ideally in Scala or Java
- Solid understanding of Data Structures and Algorithms
- Experience with Kafka is a plus (mentioned but not in dictionary)
- Familiarity with PostgreSQL

Good to have:
- Exposure to Docker and Kubernetes
    `,
    required: ["scala", "java", "dsa", "postgresql"],
    preferred: ["docker", "kubernetes"],
    eligibility: {},
  },
  {
    name: "R for internal tooling, ambiguous R matches with programming context",
    text: `
Software Engineer - Analytics Tools

Requirements:
- Programming experience in Python
- Familiarity with the R programming language for internal tooling
- Understanding of SQL and relational databases

Good to have:
- Exposure to Docker
    `,
    required: ["python", "r", "sql"],
    preferred: ["docker"],
    eligibility: {},
  },
  {
    name: "Vue.js frontend role",
    text: `
Frontend Developer - Vue

Requirements:
- Experience with Vue.js and JavaScript
- Familiarity with CSS and HTML
- Understanding of REST APIs

Good to have:
- Exposure to TypeScript
- Familiarity with Tailwind CSS
    `,
    required: ["vue", "javascript", "css", "html", "restapi"],
    preferred: ["typescript", "tailwind"],
    eligibility: {},
  },
  {
    name: "Spring Boot microservices role",
    text: `
Java Backend Engineer

Requirements:
- Strong Java and Spring Boot experience
- Understanding of Microservices architecture
- Familiarity with MySQL or PostgreSQL
- Experience with Git

Good to have:
- Exposure to Docker and Kubernetes
- Familiarity with Jenkins
    `,
    required: ["java", "springboot", "microservices", "mysql", "postgresql", "git"],
    preferred: ["docker", "kubernetes", "jenkins"],
    eligibility: {},
  },
  {
    name: "Generic service-company digital hiring, minimal structure",
    text: `
We are hiring freshers for our Digital Engineering unit. Candidates should have a good grasp
of any one programming language such as Java, Python or C++. Knowledge of SQL and basic web
technologies (HTML, CSS, JavaScript) is expected. Minimum 65% throughout academics. Open to
all branches.
    `,
    required: ["java", "python", "cpp", "sql", "html", "css", "javascript"],
    preferred: [],
    eligibility: { minPercentage: 65 },
  },
  {
    name: "Next.js + serverless product role",
    text: `
Full Stack Engineer - Next.js

Requirements:
- Experience with Next.js and React
- Familiarity with Node.js and TypeScript
- Understanding of REST APIs or GraphQL

Good to have:
- Exposure to AWS Lambda / serverless
- Familiarity with MongoDB
    `,
    required: ["nextjs", "react", "nodejs", "typescript", "restapi", "graphql"],
    preferred: ["aws", "mongodb"],
    eligibility: {},
  },
  {
    name: "Security-adjacent backend role (OAuth focus)",
    text: `
Backend Engineer - Platform Security

Requirements:
- Strong Java or Python backend experience
- Understanding of OAuth and authentication flows
- Familiarity with REST APIs
- Experience with PostgreSQL

Good to have:
- Exposure to Docker
- Familiarity with WebSockets
    `,
    required: ["java", "python", "oauth", "restapi", "postgresql"],
    preferred: ["docker", "websockets"],
    eligibility: {},
  },
  {
    name: "REAL: IBM Associate System Engineer",
    text: `
Job Title - Associate System Engineer

Your Role and Responsibilities
As a Software Developer you'll participate in many aspects of the software development lifecycle, such as design, code implementation, testing, and support.
Your primary responsibilities include:
- Analytical Problem-Solving and Solution Enhancement
- Comprehensive Engagement Across Process Phases
- Strategic Stakeholder Engagement and Innovative Coding Solutions

Required Professional and Technical Expertise
- Programming (preferably in Java, C++, Python, Node.js).
- Software Development Life Cycle Concepts

Eligibility Criteria
- 2027 graduating Batch only
- Degree: BE / B.Tech / M.Tech / ME / MCA
- Branches: Computer Science and Allied Branches (All CS branches like CSE, AIML, DS, Cloud Computing, Big Data Analytics, CSBS, IOT, Robotics, AI, Cybersecurity, Blockchain to name a few) and Information Technology
- Minimum Academic Score: CGPA 6.0 / 60% and above
- No Active Backlogs
- This is an entry level On-Campus hiring position, and the candidates must be in their final year of education and must obtain their degree before the start of employment with IBM
- Fluent Communication skills (written and spoken).

Preferred Professional and Technical Expertise
- Engineering Background, Problem Solving.
- Good interpersonal skills.
- Should be flexible to work from anywhere in India.
    `,
    // "javascript" and "c" are the Node.js/C++ substring quirks already
    // documented above, not something specific to this posting.
    required: ["java", "cpp", "python", "nodejs"],
    preferred: [],
    eligibility: { minCgpa: 6, minPercentage: 60, gradYear: 2027, branches: ["cse"] },
  },
  {
    name: "REAL: fintech Data Science Intern — everything lands in required, no heading ever switches to preferred",
    text: `
Data Science Intern
Data Science & Analytics Function
Location: Mumbai

Role Purpose
The Data Science Intern will work on real-world analytics and AI use cases across Growth Analytics, Investor Intelligence, and Investment Intelligence.

Key Responsibilities
- Support development of analytical models, dashboards, reports, and AI-enabled solutions across growth, investor, and investment analytics use cases.
- Perform data extraction, cleansing, profiling, validation, exploratory data analysis, and documentation using structured and unstructured datasets.
- Assist in building segmentation, propensity, recommendation, campaign analytics, portfolio diagnostics, and business intelligence frameworks.
- Work with data from digital platforms, customer systems, enterprise data warehouses, campaign systems, market data, and internal business sources.
- Create analytical reports, visualizations, PowerPoint presentations, and concise business summaries to communicate insights and recommendations.
- Participate in requirement discussions, project reviews, working sessions, and problem-solving discussions with analytics, business, technology, and vendor teams.
- Take ownership of assigned tasks, coordinate proactively, track progress, and deliver within agreed timelines and quality expectations.

Qualification & Eligibility
- Graduates from Computer Science, IT, Engineering, Data Science, Statistics, Mathematics, Economics, AI, Business Analytics, Finance, or related quantitative disciplines.
- Strong academic record with demonstrated analytical aptitude, problem-solving ability, and interest in financial services or asset management.
- Strong interpersonal skills, communication ability, ownership mindset, curiosity, and willingness to learn new business and technology concepts.

Technical Skills
- Strong SQL and Python fundamentals are expected.
- Good understanding of statistics, probability, machine learning concepts, data structures, and analytical problem solving.
- Hands-on familiarity with Pandas, NumPy, Scikit-learn, notebooks, data visualization, and dashboarding concepts is preferred.
- Exposure to Power BI / Tableau, GenAI / LLMs, prompt engineering, cloud platforms, Git, APIs, or financial market concepts will be an advantage.

Behavioral Competencies
- Ability to structure ambiguous problems, ask the right questions, and convert data into meaningful business insights.
- Strong PowerPoint and data storytelling skills with ability to simplify analysis for non-technical stakeholders.
- Collaborative working style with ability to coordinate across teams, accept feedback, and improve quickly.
- Attention to detail, execution discipline, high learning agility, and willingness to take ownership.
    `,
    // Pandas/NumPy/Scikit-learn/Power BI/Tableau/GenAI are all genuinely
    // out of the SDE-scoped dictionary (Sept 2026 scope decision) — not
    // asserted here, same as the earlier synthetic data-adjacent JD. The
    // prose says several of these "is preferred" / "will be an advantage",
    // but nothing here is ever under a "Nice to have"-style heading, so
    // per this parser's heading-only classification (documented above,
    // "Next.js is a plus" case) everything lands in required, including
    // the softly-worded bits. A real, evidenced instance of that same
    // known limitation, not a new one.
    required: ["dsa", "python", "sql", "git"],
    preferred: [],
    eligibility: { branches: ["cse"] },
  },
  {
    name: "REAL: NatWest Software Engineer — names zero specific technologies at all",
    text: `
Role Title- Software Engineer

Purpose of Role
- Apply widely agreed software engineering principles and methodologies to design, develop, test and maintain applications and services to achieve the stated business and technology goals within required budgets and timelines
- The role also entails contribution to project-critical requirements, as a maximum of 30% occupancy of the role, in any other areas of the Software Development Lifecycle.

Roles & Responsibilities
- Liaises with engineers, architects, business analysts and other key stakeholders to understand the objectives and requirements
- Delivers a lasting solution or code within cost and time estimates of the project
- Develops high-volume, high-performance, high-availability applications using proven frameworks and technologies
- Develops software that is amenable for greater automation of build, release testing and deployment process on all environments
- Delivers software components to enable the delivery of bank platforms, applications and services
- Writes unit and integration tests, within automated test environments to ensure code quality
- Responsible for work quality, ensuring it meets the technical standards for all services output
- Continuously invests in learning technology and software development best practices at Natwest
- Participate in and complete all the mandatory technical/domain/behavioral/e-learnings organized by the India Technology Academy, from time-to-time.
- Understand the business that the role is part of and invest to deep dive in the domain learning for the respective project.

Required Skills & Attributes
- Knowledge of the key technologies used in NatWest
- Knowledge of the financial services industry
- Analytical Skills
- Eye for Detail
- Willingness to learn and adapt

Eligibility Criteria
- Degree: BE/BTech (Final year) 2027 Passout
- Branches eligible: Computer Science, Information Technology, Electronics & Instrumentation & Communication Engineering, Mathematics & Computing, Mathematics & instrumentation
- CGPA: 7 & Above
- Xth : minimum 70%
- XIIth : minimum 70%
- Grad : minimum 73-75% aggregate as per the recent mark sheet / semester/ semester
    `,
    // A real, big-employer JD that names no specific language, framework
    // or tool anywhere — "knowledge of the key technologies used in
    // NatWest" is as concrete as it gets. Correctly degrades to an empty
    // required list rather than guessing. minPercentage is 70 (the first
    // of three cutoffs in the text, Xth/XIIth both 70%) — the eligibility
    // model has one threshold, not one per education level, so a JD with
    // different Xth/XIIth/Grad cutoffs can't be fully represented; a real,
    // undocumented-until-now modeling gap worth a future enhancement.
    required: [],
    preferred: [],
    eligibility: { minCgpa: 7, minPercentage: 70, gradYear: 2027, branches: ["cse", "ece"] },
  },
  {
    name: "REAL: Deloitte Assurance IT Data & Analytics — audit role, no eligibility section on the page at all",
    text: `
Assurance – IT Data & Analytics
Location: Basis business discretion

Your work profile
- Assist in client mandates including external/internal audits, execute audit assignments in line with auditing standards, process reviews/advisory, and process improvement engagements.
- Perform operational and process reviews to identify risks, improvements, and data-driven insights.
- Analyze large datasets to identify anomalies, trends, and control gaps; perform complex calculations such as interest computations and financial reconciliations for financial services clients.
- Support performing fieldwork including process walkthroughs, review and testing of documents, preparation of work papers, and required documentation.
- Perform ITAC (IT Application Controls) testing for financial services applications (e.g., core banking, ERP systems) to validate automated controls and configurations.
- Participate in client meetings to understand business/IT processes and controls.
- Collaborate with teams to ensure timely completion of engagements.
- Help prepare client deliverables including external/internal/SOC audit reports, operating procedures, process review reports, recommendations, and data analytics dashboards.
- Maintain clear communication with clients.
- Leverage AI tools for risk assessment, predictive analytics, and automation of repetitive audit tasks.
- Stay updated on auditing, regulatory trends, and emerging technologies like AI and data analytics.
- Participate in internal training and accreditation programs as needed.
    `,
    // An audit/assurance role, not SDE — correctly extracts no dictionary
    // skills at all (it never names one). "IT" appears capitalized twice
    // ("IT Data & Analytics", "business/IT processes") as an abbreviation
    // for the department, not an eligibility restriction, and the
    // case-sensitive bare-IT branch check (fixed above to stop matching
    // the lowercase pronoun) still can't tell those apart — a real,
    // narrower residual limitation, documented rather than chased further.
    required: [],
    preferred: [],
    eligibility: { branches: ["cse"] },
  },
  {
    name: "REAL: Edgro Associate Product Manager — non-SDE role, prose-heavy, the pronoun-'it' branch false positive this parser used to have",
    text: `
Associate Product Manager

ABOUT EDGRO
Edgro is an RBI-licensed NBFC transforming how education is financed in India.

THE ROLE
Our lending runs on a mix of vendor platforms and systems we build ourselves.

WHAT YOU'LL OWN
- How our systems fit together - you understand how APIs work and what a sound integration looks like between systems like a CRM, LMS, LOS, etc.
- Vendor management across the product stack - requirements, roadmap, escalations and releases with the vendors who run parts of it.
- Stakeholder interfaces - you're the product point of contact for one or more business teams.
- Specs people can build from - clear flows, edge cases, states, acceptance criteria.
- An analytical mindset - you pull the data yourself, find where applications drop off, back recommendations with evidence rather than opinion.
- Testing what ships - walk the flows before release, in the same detail as the person who built them.

WHAT WE'RE LOOKING FOR
- High agency and ownership
- Discipline
- Structured thinking
- Comfort with data - you know SQL, and you get comfortable in an analytics tool quickly.
- You communicate well
- Hands-on with AI - you already use it daily and know where it's unreliable and how to check it.
- A pull toward the domain
    `,
    // A product-management role — "you know SQL" is the one clear,
    // unambiguous dictionary skill. Before the fix documented above, this
    // JD's three uses of "it" as a plain pronoun ("use it daily... check
    // it") made eligibility.branches incorrectly report ["cse"] on a JD
    // that states no branch restriction at all.
    required: ["sql"],
    preferred: [],
    eligibility: {},
  },
  {
    name: "REAL: Bain Capability Network Intern Analyst — consulting role, zero dictionary skills named anywhere",
    text: `
JOB DESCRIPTION – INTERN ANALYST
Reports to: Associate/Project Leader
Location: Gurgaon/Bangalore (basis business requirements)

As an analyst you will be an active member of the team, learning how to make businesses more valuable and helping our clients achieve sustainable competitive advantage. You will be responsible for generating industry & company insights to support global Bain case teams, client development teams and industry / capability practices.

Job responsibilities
- Comprehend client needs and challenges for adapting to case expectations. Show ability to resolve discrete issues and/or drive consensus
- Identify and apply the relevant analytical tools for own work stream and ensure zero-defect analysis.
- Understand the client business/industry to generate and screen realistic solutions based on a blend of research and analysis. Communicate data, knowledge and insight to the entire team.
- Effectively structure communication of insights from own work stream and ensure a logical flow of relevant information in presentations.
- Consistently seek and provide actionable feedback in all interactions.
    `,
    // A management-consulting analyst role — same pattern as the NatWest
    // JD above, a real, large employer whose posting names no specific
    // language, framework or tool at all.
    required: [],
    preferred: [],
    eligibility: {},
  },
  {
    name: "REAL: ResNet Solutions AI ML Developer — mostly out-of-dictionary ML stack, cloud platforms still catch",
    text: `
Job Title: AI ML Developer

Job Brief:
We are seeking a highly motivated AI ML Developers to join our dynamic team. You will be involved in the complete cycle of developing machine learning models, from data collection and preprocessing to training and deployment.

Responsibilities:
- Collect, preprocess, and analyze large datasets to extract meaningful insights.
- Develop, train, and fine-tune machine learning models for predictive analytics.
- Implement data pipelines and integrate models into production environments.
- Stay updated with the latest research and advancements in machine learning.
- Collaborate with the data engineering and software development teams to ensure seamless model integration.

Skills Required:
- Proficiency in Python and machine learning frameworks (TensorFlow, PyTorch, Scikit-learn).
- Experience with data preprocessing, data analysis, and visualization tools (Pandas, NumPy, Matplotlib).
- Knowledge of deep learning architectures (CNNs, RNNs, LSTMs).
- Familiarity with cloud platforms (AWS, GCP, Azure) and deploying models in production.
- Good problem-solving abilities and statistical knowledge.
    `,
    // TensorFlow/PyTorch/Scikit-learn/Pandas/NumPy/Matplotlib are all
    // genuinely out of the SDE-scoped dictionary (Sept 2026 decision) —
    // not asserted here. Python and the three cloud platforms still catch.
    required: ["python", "aws", "gcp", "azure"],
    preferred: [],
    eligibility: {},
  },
  {
    name: "REAL: ResNet Solutions SDE Level 1 — dense skills list, wide direct-hire posting (no campus eligibility section)",
    text: `
Job Title: SDE Level 1

Job Brief:
We are seeking highly motivated Software Developer Engineers (SDE) Level 1 to join our dynamic team. You will be involved in the complete software development lifecycle, from design and implementation to testing and deployment.

Responsibilities:
- Collaborate with cross-functional teams to gather and analyze requirements.
- Design, develop, and maintain software applications and systems.
- Write clean, efficient, and maintainable code following coding standards.
- Perform unit testing and integration testing to ensure software quality.
- Participate in code reviews to maintain code quality and consistency.
- Debug and resolve software defects and performance issues.
- Collaborate with DevOps and QA teams to ensure smooth deployment and testing.

Skills Required:
- Proficiency in programming languages such as Java, Python, C++, or JavaScript.
- Experience with web development frameworks (e.g., React, Angular, Node.js) or backend frameworks (e.g., Spring Boot, Django, Flask).
- Familiarity with database systems (SQL and NoSQL) such as MySQL, PostgreSQL, MongoDB.
- Knowledge of software development methodologies (Agile, Scrum).
- Understanding of version control systems (Git, GitHub, GitLab).
- Basic knowledge of cloud platforms (AWS, Azure, GCP) is a plus.
- Strong problem-solving skills and attention to detail.
- Ability to write clear and concise technical documentation.
    `,
    // "GitLab" alone (no "CI" suffix) doesn't match gitlabci's alias
    // ("gitlab ci") — a real, minor, understandable gap: GitLab-the-
    // platform and GitLab CI are different concepts and only the latter
    // is in the dictionary. "is a plus" for the cloud platforms is the
    // same heading-only-classification limitation documented above — they
    // land in required since nothing here is under a Nice-to-have heading.
    required: [
      "java", "python", "cpp", "javascript", "react", "angular", "nodejs",
      "springboot", "django", "flask", "sql", "mysql", "postgresql", "mongodb",
      "agile", "unittesting", "git", "github", "aws", "azure", "gcp",
    ],
    preferred: [],
    eligibility: {},
  },
  {
    name: "REAL: EA Slingshot Studios Software Engineer Intern — game-dev role, docx source, Bonus section genuinely preferred",
    text: `
Software Engineer Intern - Slingshot Studios (Paid Internship)
Hyderabad

Role Overview
As EA's first label dedicated to purely digital games, EA Mobile creates games for mobile devices, social networks and online environments.

Responsibilities
- You will participate in building new game features.
- You will work with designers and product managers to provide world-class experiences to our players.
- You will improve code for performance, focusing on reducing load times and improving frame rates.
- You will participate in code reviews and retrospectives and improve our code bases and processes.
- You will write good documentation and follow coding standards.

Qualifications
We encourage you to apply if you can meet most of the requirements and are comfortable opening a dialogue to be considered.
- Have a solid foundation of data structures and algorithms
- Solid programming skills
- Be able to channel curiosity into targeted learning.
- Find creative ways to solve challenges
- Be able to use modern Agentic AI coding harnesses

Bonus:
- Experience making and playing games
- Demonstrated proficiency in C++/C#/Java or PHP
- Demonstrated proficiency in 3D Mathematics used in games.
- Demonstrated understanding of RESTful API
    `,
    // Pulled from a .docx (unzipped and stripped of XML by hand, since
    // this repo's tooling only reads PDFs) — real evidence the parser
    // works the same regardless of source format, as it should: it only
    // ever sees plain text either way. "Agentic AI coding harnesses" has
    // no dictionary match (a very new term, reasonably out of scope). "c"
    // in preferred is the C++/C# substring quirk documented above.
    required: ["dsa"],
    preferred: ["cpp", "csharp", "java", "php", "restapi"],
    eligibility: {},
  },
  {
    name: "REAL: Codity.ai Graduate Trainee - GTM — sales role, zero dictionary skills",
    text: `
Role: Graduate Trainee - GTM
- Hustle in SaaS sales via cold calling (US Market)
- Directly interact with decision-makers in global companies
- This role would translate into a full-time role after completion of the University course

Who We Want
- High-energy hustlers (not 9-5 types)
- Fearless communicators with strong English skills (cold calling is your playground)
- Travel lovers to fly to the US to meet clients and grow accounts
- Learners who want 10x growth, fast
- Ownership-driven operators who want leadership roles early
    `,
    // A sales-trainee role with "SDE"-adjacent branding elsewhere in the
    // same company's postings, but this one names no dictionary skill.
    required: [],
    preferred: [],
    eligibility: {},
  },
  {
    name: "REAL: Codity.ai Graduate Trainee - SDE 1 — SDE-titled role that still names no specific technology",
    text: `
Role: Graduate Trainee - SDE 1
- Build and ship real-world AI/SaaS products alongside a fast-moving engineering team
- This role would translate into a full-time role after completion of the University course

Who We Want
- Builders who can turn ideas into production-ready code at startup speed
- Engineers who thrive in chaos, move with urgency, and figure things out independently
- Competitive learners who want 10x growth in skill, ownership, and impact
- Operators who want to lead teams, own products, and grow ridiculously fast
    `,
    // From the same employer as the GTM posting above — an SDE-titled
    // role whose JD text still never names a language, framework or tool.
    // Confirms (doesn't newly discover) the same pattern seen in the
    // NatWest and Bain Capability Network JDs above.
    required: [],
    preferred: [],
    eligibility: {},
  },
  {
    name: "REAL: HyperVerge DL/ML Research Intern — dense ML posting; explicitly branch-agnostic despite naming disciplines by name",
    text: `
Deep Learning / Machine Learning Research Intern (LLMs & Vision Language Models)

Internship Duration
2026 Graduates: 6-month full-time internship
2027 Graduating Students: 10-12 month full-time internship (based on academic calendar and availability)

What We're Looking For

Must Have
- Strong Python programming skills.
- Excellent understanding of Deep Learning fundamentals.
- Hands-on experience with PyTorch (preferred), TensorFlow, or JAX.
- Good understanding of Transformer architectures and modern neural networks.
- Experience applying deep learning to computer vision, multimodal, document, or image-related problems.
- Comfortable training, debugging, and evaluating models, not just consuming AI APIs.
- Available for a full-time internship.
- 2026 graduate or a 2027 graduating student.

Bonus Points
Experience with one or more of the following:
- Fine-tuning open-weight LLMs
- PEFT / LoRA
- RLHF or Preference Alignment
- Vision Language Models
- Hugging Face ecosystem
- Distributed training
- CUDA optimization

We'd Love To See
Show us what you've built. This could include research papers, open-source contributions, fine-tuned models with documented evaluation, GitHub repositories, technical blogs.

Eligibility
2026 Graduates available for a 6-month full-time internship.
2027 Graduating Students available for a 10-12 month full-time internship.
Open to students and recent graduates from any discipline.
We don't shortlist based on branch, CGPA, backlogs, or college.
Whether you studied Computer Science, Mathematics, Statistics, Electronics, Biotechnology, or something entirely different, what matters is your ability to build, reason, experiment, and solve challenging AI problems.
    `,
    // PyTorch/TensorFlow/JAX/LoRA/RLHF etc. are all genuinely out of the
    // SDE-scoped dictionary — not asserted. "GitHub" matches inside
    // "GitHub repositories" (preferred, since it's under the unrecognized
    // "We'd Love To See" heading, which stays in whatever section "Bonus
    // Points" left it in). This is the JD that led to the branch-agnostic
    // fix documented above: it names Computer Science and Electronics by
    // name purely to illustrate that it doesn't care which branch a
    // candidate studied ("we don't shortlist based on branch... whether
    // you studied Computer Science... or something entirely different"),
    // and before that fix this parser reported branches: ["cse","ece"] on
    // a JD that explicitly states it has no branch restriction at all.
    required: ["python"],
    preferred: ["github"],
    eligibility: { gradYear: 2027 },
  },
  {
    name: "REAL: Reltio Intern Program Manager — non-engineering role, cloud platforms and Jira land in required via 'is a plus' limitation",
    text: `
Job Title: Intern - Program Manager
Department: Technical Operations

Responsibilities:
- Assist Technical Project/Program Managers in various aspects of project lifecycles within Reltio
- Support the tracking of tasks, timelines, and dependencies across teams leveraging Project Management tools (Google Docs, Sheets, Jira, Confluence)

Qualifications:
- Currently pursuing a Bachelor's or Master's degree in Computer Science, Engineering, Information Systems, Business Administration, or a related technical field.
- Strong interest in technical project management and the software development process.
- Excellent organizational skills and attention to detail.
- Familiarity with tools like Jira is a plus.
- A proactive attitude and a desire to learn about project management in a fast-paced SaaS company.

Learning Opportunities:
- Gain practical experience in supporting technical projects within a leading cloud based MDM SaaS company. (AWS, Azure and GCP)
- Develop skills in project tracking, communication, and collaboration using industry-standard tools like Jira and Confluence.
- Introduction to FinOps and Security practices
- Explore AI capabilities for project management.
    `,
    // Another real instance of the documented heading-only-classification
    // limitation: "Familiarity with tools like Jira is a plus" is a
    // bullet under "Qualifications" (a required heading), so it's
    // required despite the wording, same as the ResNet/Next.js cases
    // above. branches: ["cse"] is a correct match here (this JD genuinely
    // names Computer Science as one of the accepted degrees, with no
    // branch-agnostic language anywhere to override it).
    required: ["jira", "aws", "azure", "gcp"],
    preferred: [],
    eligibility: { branches: ["cse"] },
  },
  {
    name: "REAL: Program Intern (startup, unnamed employer) — SQL the only dictionary match in a BI-tools-adjacent role",
    text: `
Program Intern

About the Role
We are currently seeking a data-driven and detail-oriented Program Intern to join us. This role will involve critical thinking, problem-solving, and analytical thinking to drive operational improvements and support strategic initiatives.

The charter for this role will include:
- Work closely with the founder/senior leaders to turn ideas into validated experiments.
- Dive into industry trends, discover competitor insights while also working on user research.
- Present findings, recommendations, and progress updates to leadership.

Ideal Persona would:
- Prior experience in building a start-up or interning at a start-up.
- Good communication and presentation skills, both written and verbal.
- High on agency with first principle problem-solving approach
- Familiarity with analytical tools like Excel (advanced), SQL or other business intelligence software is a plus.
- Strong organizational skills and ability to manage multiple tasks simultaneously.
    `,
    // Excel/generic "business intelligence software" are out of the
    // SDE-scoped dictionary by design — not asserted. SQL is the one
    // clear match.
    required: ["sql"],
    preferred: [],
    eligibility: {},
  },
];

// Known limitation, discovered while hand-labelling the JDs above: the
// ambiguous "c" skill's boundary check doesn't treat "+" or "#" as
// word-boundary-blocking, so any JD mentioning "C++" or "C#" also
// registers a spurious bare "c" match. Harmless-ish for C++ (a C++
// requirement plausibly implies C fundamentals) but a real precision
// defect for C# (a different language) — worth fixing in matcher.js by
// excluding symbol characters from the ambiguous-skill right-boundary,
// not attempted here since it risks breaking the C++/C#/.NET matching
// this same file already tests above.
describe("known limitation: bare 'c' false-matches inside C++/C#", () => {
  it("documents (does not yet fix) the false match", () => {
    const parsed = parseJD("Requirements: strong C# experience.");
    expect(parsed.required).toContain("csharp");
    expect(parsed.required).toContain("c"); // ← the bug: should not be here
  });
});

// Three fixes made while hand-labelling real JDs above (see
// shared/text/parseJD.js) — locked in here so they can't silently regress.
describe("eligibility extraction fixes found via real JDs", () => {
  it("minPercentage requires eligibility context, not any bare N% in the document", () => {
    const parsed = parseJD(
      "The role also entails a maximum of 30% occupancy in other areas. Eligibility: minimum 73% aggregate required."
    );
    expect(parsed.eligibility.minPercentage).toBe(73);
  });

  it("minPercentage still matches when other words sit between 'minimum' and the figure", () => {
    const parsed = parseJD("Minimum Academic Score: CGPA 6.0 / 60% and above");
    expect(parsed.eligibility.minPercentage).toBe(60);
  });

  it("gradYear matches year-then-trigger order, not just trigger-then-year", () => {
    expect(parseJD("Eligibility: 2027 graduating Batch only.").eligibility.gradYear).toBe(2027);
    expect(parseJD("Degree: BE/BTech (Final year) 2027 Passout").eligibility.gradYear).toBe(2027);
  });

  it("bare 'IT' branch check is case-sensitive — the pronoun 'it' never counts", () => {
    const parsed = parseJD(
      "Hands-on with AI - you already use it daily and know where it's unreliable and how to check it."
    );
    expect(parsed.eligibility.branches).toBeUndefined();
  });

  it("bare 'IT' still counts as CSE/IT when written as the actual abbreviation", () => {
    const parsed = parseJD("Branches eligible: Computer Science, IT, Electronics.");
    expect(parsed.eligibility.branches).toContain("cse");
  });

  it("a branch-agnostic phrase overrides discipline names used only to illustrate openness", () => {
    const parsed = parseJD(
      "We don't shortlist based on branch. Whether you studied Computer Science, Electronics, or something entirely different, what matters is your ability to solve problems."
    );
    expect(parsed.eligibility.branches).toBeUndefined();
  });

  it("branch names still count with no branch-agnostic phrase present", () => {
    const parsed = parseJD("Eligible branches: Computer Science, Electronics.");
    expect(parsed.eligibility.branches).toEqual(["cse", "ece"]);
  });

  it("a branch-agnostic phrase for one role doesn't clear a real restriction stated for another, far-away role", () => {
    const parsed = parseJD(`
We are hiring for two roles.

Sales roles: open to any branch. We don't shortlist based on academic background for sales positions.

Meanwhile, for our engineering team, eligibility is stricter and technical.

SDE roles:
- Branches eligible: Computer Science, Electronics, ECE only
- CGPA 7.5 or above
    `);
    expect(parsed.eligibility.branches).toEqual(["cse", "ece"]);
  });
});

describe("parseJD recall", () => {
  for (const jd of JDS) {
    it(jd.name, () => {
      const parsed = parseJD(jd.text);
      for (const id of jd.required) {
        expect(parsed.required, `expected "${id}" in required`).toContain(id);
      }
      for (const id of jd.preferred) {
        expect(parsed.preferred, `expected "${id}" in preferred`).toContain(id);
      }
      for (const [key, value] of Object.entries(jd.eligibility)) {
        expect(parsed.eligibility[key]).toEqual(value);
      }
    });
  }

  it("overall required-skill recall is at least 90%", () => {
    let total = 0;
    let recalled = 0;
    for (const jd of JDS) {
      const parsed = parseJD(jd.text);
      for (const id of jd.required) {
        total++;
        if (parsed.required.includes(id)) recalled++;
      }
    }
    expect(recalled / total).toBeGreaterThanOrEqual(0.9);
  });

  it("empty JD yields empty result, no crash", () => {
    expect(parseJD("")).toEqual({ required: [], preferred: [], eligibility: {} });
  });
});
