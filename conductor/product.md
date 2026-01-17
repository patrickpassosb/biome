# Initial Concept
Biome is an AI-powered personal training intelligence system designed to help everyone—from regular people to elite athletes—improve their gym performance and maintain a healthy, progressive lifestyle through smart data analysis and long-term memory.

# Product Definition

## Core Vision: The Biome AI Agent
The heart of Biome is a sophisticated **AI Agent system** (Coach, Analyst, and Orchestrator) that acts as a highly personalized coach. It democratizes high-level training intelligence by knowing the user deeply:
- **Personal Profile:** Biological markers (sex, age, weight), personal life context, and specific health/performance goals maintained as a "Bio."
- **Intelligent Guidance:** Proactive feedback and insights derived from workout data (CSVs) using DuckDB analytics.
- **Efficiency & Safety:** Contract-driven AI (Gemini) proposing, validating, and revising weekly plans to ensure every session is optimal.
- **Long-term Memory:** Firestore-backed persistent storage of training reflections and findings for multi-session context.

## Target Audience
- **General People:** Regular individuals looking to improve their health and gym performance without needing a human coach.
- **Strength Athletes & Coaches:** Advanced users who require deep data insights, automated programming, and historical trend analysis.

## Primary Goals
- **Accelerated Performance for Everyone:** Using AI to bypass common training pitfalls and maximize gym results.
- **Data-Driven Personalization:** An agent that understands your biography and historical data to provide unique guidance.
- **Injury Prevention & Longevity:** Identifying risks through data trends and suggesting adjustments.
- **Avoid "Plateau Years":** Providing a clear, data-backed path for long-term progress.

## Key Features
- **Phased AI Coaching:** Orchestrated agents (Analyst -> Coach) that synthesize data into actionable weekly plans.
- **Automated Analytics Pipeline:** Seamless ingestion of training data for volume, RPE, and frequency trends.
- **Persistent Training Memory:** A central memory store that retains key coaching findings and athlete history.
- **Contract-Driven Consistency:** Strict adherence to JSON schemas for AI outputs to ensure system reliability and valid planning.
- **Performance Dashboards:** Clear visual interfaces (Next.js) to review metrics and the agent's coaching logic.