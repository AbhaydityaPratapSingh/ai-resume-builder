// SDE-scope skill dictionary. Each entry's `aliases` are matched against JD
// and resume text with word-boundary patterns; `name` is the canonical label
// shown in the UI. Grown by hand from the analysis test set (see
// tests/analysis) and a "Report a missing skill" link in the UI (Phase 2.5+).
//
// `ambiguous: true` marks short/common-word names (Go, R, C) that only count
// as a match when they appear near supporting context — see
// requiresContext() in parseJD.js.

export const SKILLS = [
  // Languages
  { id: "javascript", name: "JavaScript", group: "Languages", aliases: ["javascript", "js"] },
  { id: "typescript", name: "TypeScript", group: "Languages", aliases: ["typescript", "ts"] },
  { id: "python", name: "Python", group: "Languages", aliases: ["python", "python3"] },
  { id: "java", name: "Java", group: "Languages", aliases: ["java"] },
  { id: "c", name: "C", group: "Languages", aliases: ["c"], ambiguous: true },
  { id: "cpp", name: "C++", group: "Languages", aliases: ["c++", "cpp"] },
  { id: "csharp", name: "C#", group: "Languages", aliases: ["c#", "csharp", "c sharp"] },
  { id: "go", name: "Go", group: "Languages", aliases: ["go", "golang"], ambiguous: true },
  { id: "rust", name: "Rust", group: "Languages", aliases: ["rust"] },
  { id: "kotlin", name: "Kotlin", group: "Languages", aliases: ["kotlin"] },
  { id: "swift", name: "Swift", group: "Languages", aliases: ["swift"] },
  { id: "r", name: "R", group: "Languages", aliases: ["r"], ambiguous: true },
  { id: "php", name: "PHP", group: "Languages", aliases: ["php"] },
  { id: "ruby", name: "Ruby", group: "Languages", aliases: ["ruby"] },
  { id: "scala", name: "Scala", group: "Languages", aliases: ["scala"] },
  { id: "dart", name: "Dart", group: "Languages", aliases: ["dart"] },
  { id: "sql", name: "SQL", group: "Languages", aliases: ["sql"] },
  { id: "html", name: "HTML", group: "Languages", aliases: ["html", "html5"] },
  { id: "css", name: "CSS", group: "Languages", aliases: ["css", "css3"] },
  { id: "bash", name: "Bash/Shell", group: "Languages", aliases: ["bash", "shell scripting", "shell script"] },

  // Frameworks / libraries
  { id: "react", name: "React", group: "Frameworks", aliases: ["react", "reactjs", "react.js"] },
  { id: "nextjs", name: "Next.js", group: "Frameworks", aliases: ["next.js", "nextjs", "next js"] },
  { id: "vue", name: "Vue", group: "Frameworks", aliases: ["vue", "vuejs", "vue.js"] },
  { id: "angular", name: "Angular", group: "Frameworks", aliases: ["angular", "angularjs"] },
  { id: "svelte", name: "Svelte", group: "Frameworks", aliases: ["svelte"] },
  { id: "nodejs", name: "Node.js", group: "Frameworks", aliases: ["node.js", "nodejs", "node js", "node"] },
  { id: "express", name: "Express", group: "Frameworks", aliases: ["express", "express.js", "expressjs"] },
  { id: "nestjs", name: "NestJS", group: "Frameworks", aliases: ["nestjs", "nest.js"] },
  { id: "django", name: "Django", group: "Frameworks", aliases: ["django"] },
  { id: "flask", name: "Flask", group: "Frameworks", aliases: ["flask"] },
  { id: "fastapi", name: "FastAPI", group: "Frameworks", aliases: ["fastapi", "fast api"] },
  { id: "spring", name: "Spring", group: "Frameworks", aliases: ["spring framework"] },
  { id: "springboot", name: "Spring Boot", group: "Frameworks", aliases: ["spring boot", "springboot"] },
  { id: "dotnet", name: ".NET", group: "Frameworks", aliases: [".net", "dotnet", "asp.net"] },
  { id: "laravel", name: "Laravel", group: "Frameworks", aliases: ["laravel"] },
  { id: "rails", name: "Ruby on Rails", group: "Frameworks", aliases: ["ruby on rails", "rails"] },
  { id: "tailwind", name: "Tailwind CSS", group: "Frameworks", aliases: ["tailwind", "tailwindcss", "tailwind css"] },
  { id: "bootstrap", name: "Bootstrap", group: "Frameworks", aliases: ["bootstrap"] },
  { id: "jquery", name: "jQuery", group: "Frameworks", aliases: ["jquery"] },
  { id: "redux", name: "Redux", group: "Frameworks", aliases: ["redux"] },
  { id: "graphql", name: "GraphQL", group: "Frameworks", aliases: ["graphql"] },
  { id: "flutter", name: "Flutter", group: "Frameworks", aliases: ["flutter"] },
  { id: "reactnative", name: "React Native", group: "Frameworks", aliases: ["react native"] },

  // Databases
  { id: "mysql", name: "MySQL", group: "Databases", aliases: ["mysql"] },
  { id: "postgresql", name: "PostgreSQL", group: "Databases", aliases: ["postgresql", "postgres"] },
  { id: "mongodb", name: "MongoDB", group: "Databases", aliases: ["mongodb", "mongo"] },
  { id: "sqlite", name: "SQLite", group: "Databases", aliases: ["sqlite"] },
  { id: "redis", name: "Redis", group: "Databases", aliases: ["redis"] },
  { id: "cassandra", name: "Cassandra", group: "Databases", aliases: ["cassandra"] },
  { id: "dynamodb", name: "DynamoDB", group: "Databases", aliases: ["dynamodb"] },
  { id: "firebase", name: "Firebase", group: "Databases", aliases: ["firebase", "firestore"] },
  { id: "elasticsearch", name: "Elasticsearch", group: "Databases", aliases: ["elasticsearch", "elastic search"] },
  { id: "oracledb", name: "Oracle DB", group: "Databases", aliases: ["oracle database", "oracle db", "oracle sql"] },
  { id: "mssql", name: "MS SQL Server", group: "Databases", aliases: ["sql server", "mssql", "ms sql"] },

  // Cloud / DevOps
  { id: "aws", name: "AWS", group: "Cloud/DevOps", aliases: ["aws", "amazon web services"] },
  { id: "azure", name: "Azure", group: "Cloud/DevOps", aliases: ["azure", "microsoft azure"] },
  { id: "gcp", name: "GCP", group: "Cloud/DevOps", aliases: ["gcp", "google cloud", "google cloud platform"] },
  { id: "docker", name: "Docker", group: "Cloud/DevOps", aliases: ["docker"] },
  { id: "kubernetes", name: "Kubernetes", group: "Cloud/DevOps", aliases: ["kubernetes", "k8s"] },
  { id: "jenkins", name: "Jenkins", group: "Cloud/DevOps", aliases: ["jenkins"] },
  { id: "githubactions", name: "GitHub Actions", group: "Cloud/DevOps", aliases: ["github actions"] },
  { id: "gitlabci", name: "GitLab CI", group: "Cloud/DevOps", aliases: ["gitlab ci", "gitlab ci/cd"] },
  { id: "terraform", name: "Terraform", group: "Cloud/DevOps", aliases: ["terraform"] },
  { id: "ansible", name: "Ansible", group: "Cloud/DevOps", aliases: ["ansible"] },
  { id: "cicd", name: "CI/CD", group: "Cloud/DevOps", aliases: ["ci/cd", "cicd", "continuous integration"] },
  { id: "linux", name: "Linux", group: "Cloud/DevOps", aliases: ["linux", "unix"] },
  { id: "nginx", name: "Nginx", group: "Cloud/DevOps", aliases: ["nginx"] },

  // Tools
  { id: "git", name: "Git", group: "Tools", aliases: ["git"] },
  { id: "github", name: "GitHub", group: "Tools", aliases: ["github"] },
  { id: "jira", name: "Jira", group: "Tools", aliases: ["jira"] },
  { id: "postman", name: "Postman", group: "Tools", aliases: ["postman"] },
  { id: "figma", name: "Figma", group: "Tools", aliases: ["figma"] },
  { id: "webpack", name: "Webpack", group: "Tools", aliases: ["webpack"] },
  { id: "vite", name: "Vite", group: "Tools", aliases: ["vite"] },
  { id: "npm", name: "npm", group: "Tools", aliases: ["npm"] },

  // Concepts
  { id: "restapi", name: "REST APIs", group: "Concepts", aliases: ["rest api", "restful api", "rest apis", "restful"] },
  { id: "microservices", name: "Microservices", group: "Concepts", aliases: ["microservices", "microservice architecture"] },
  { id: "oop", name: "OOP", group: "Concepts", aliases: ["oop", "object oriented programming", "object-oriented programming"] },
  { id: "dsa", name: "Data Structures & Algorithms", group: "Concepts", aliases: ["data structures", "algorithms", "dsa", "data structures and algorithms"] },
  { id: "systemdesign", name: "System Design", group: "Concepts", aliases: ["system design"] },
  { id: "unittesting", name: "Unit Testing", group: "Concepts", aliases: ["unit testing", "unit tests"] },
  { id: "agile", name: "Agile", group: "Concepts", aliases: ["agile", "scrum"] },
  { id: "tdd", name: "TDD", group: "Concepts", aliases: ["tdd", "test driven development", "test-driven development"] },
  { id: "oauth", name: "OAuth", group: "Concepts", aliases: ["oauth", "oauth2"] },
  { id: "websockets", name: "WebSockets", group: "Concepts", aliases: ["websocket", "websockets"] },
  { id: "multithreading", name: "Multithreading", group: "Concepts", aliases: ["multithreading", "multi-threading", "concurrency"] },
];

export function findSkill(id) {
  return SKILLS.find((s) => s.id === id) || null;
}
