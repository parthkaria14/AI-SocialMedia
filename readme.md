# AI Social Media Agency 🚀

An AI-powered social media management platform that helps brands create, schedule, and optimize their social media content using advanced AI agents — with novel research contributions in brand-conditioned image generation and pre-publication engagement prediction.

![AI Social Media Agency](https://img.shields.io/badge/AI-Powered-purple?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.11+-blue?style=for-the-badge&logo=python)

## ✨ Features

### 🤖 AI Agents
- **Orchestrator** - Manages workflows and coordinates context between specialized AI agents using shared memory
- **Brand Analyzer** - Analyzes Instagram profiles to understand brand voice, target audience, and content themes
- **Content Generator** - Creates AI-powered content ideas, captions, and hashtag suggestions
- **Campaign Agent** - Generates marketing strategies, analyzes campaigns, and recommends ad platforms
- **Competitor Analyzer** - SWOT analysis, competitor comparison, and trending content identification
- **Image Generator** - Creates high-quality AI images using Pollinations.ai with optional text overlays

### 🔬 Research Modules (Novel Contributions)

#### Module 1 — Brand-Conditioned Image Generation + CLIP Ranking
| Feature | Baseline | This Module (Brand-Conditioned) |
|---|---|---|
| Prompt Structure | Generic subject description | Aesthetic-first directive + subject |
| Style Grounding | Pure text-to-image | **img2img style transfer** (uses brand's top post) |
| Candidates | 1 | N (configurable) |
| Selection | None | CLIP cosine similarity ranking |
| CLIP score | ~0.20–0.27 | ~0.40–0.60+ |

- **Brand-DNA Extraction** — Extracts color palettes, photography styles, and mood from scraped historical posts
- **Prompt Architecture** — Restructures prompt to prioritize brand aesthetic directives before subject matter
- **Style Reference Grounding** — Automatically fetches the brand's highest engagement-rate image to use as an `img2img` structural anchor
- **CLIP Ranking** — Scores visual alignment with `openai/clip-vit-base-patch32` text-image embeddings
- **Dual Comparison UI** — Generates both baseline and conditioned images simultaneously for side-by-side empirical research, featuring automated delta scoring and one-click downloading.

#### Module 2 — Pre-Publication Engagement Rate Predictor
- **Self-supervised** Ridge regression trained on scraped historical posts (no external labels)
- **12 features** including cyclical hour/day encoding (sin/cos), hashtag density, caption length, content type flags, follower bucket
- **Outputs**: predicted ER, confidence interval, optimal posting hour/day, feature importances, LOO-CV metrics
- **Paper metrics**: R², MAE, RMSE via leave-one-out cross-validation

> Both research modules are accessible via the **Research tab** on each brand's detail page and via dedicated `/research/*` API endpoints.

### 📊 Dashboard
- Multi-brand management with visual stats
- Brand profile analysis with status indicators
- Quick access to all brand features
- Create and delete brands

### 📝 Content Creation
- AI-powered caption generation for any platform
- Multi-platform caption optimization (Instagram, Twitter, LinkedIn)
- AI image generation with custom prompts and text overlays
- Hashtag suggestions and scheduling
- Download generated images directly

### 📈 Campaign Management
- Create, update, and delete marketing campaigns
- Campaign status management (draft, active, paused, completed)
- AI performance analysis
- AI-generated campaign strategies with content calendars
- Link Instagram posts to campaigns
- Campaign performance metrics tracking

### 💡 Ad Recommendations
- AI-powered platform recommendations
- Budget allocation suggestions
- Expected ROI calculations
- One-click content creation from recommendations

### 🔍 Competitor Analysis
- Instagram competitor comparison with metrics
- SWOT analysis (Strengths, Weaknesses, Opportunities, Threats)
- Trending content identification
- Strategic recommendations based on competitive landscape

### 📅 Post Scheduling
- Create and manage draft/scheduled posts
- Celery-based background task scheduling
- Social media auto-posting via Instagram API

### 🔗 Agent Interconnectivity
- **Multi-Agent Orchestrator** - Centralized workflow management
- **Shared Memory** - Context naturally flows between all AI agents
- Create content directly from ad recommendations
- Generate posts from campaign strategy calendar

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** with App Router
- **React 19**
- **Tailwind CSS v4** with custom dark theme
- **Lucide React** for icons
- **Recharts** for analytics visualization
- **Axios** for HTTP requests
- **date-fns** for date formatting

### Backend
- **FastAPI** with Python 3.11+
- **SQLAlchemy** with SQLite
- **Google Gemini 2.5 Flash** for AI generation
- **Pollinations.ai** for image generation
- **Apify** (primary) + **Instaloader** (fallback) for Instagram scraping
- **NumPy** for research module computations (Ridge regression, CLIP scoring)
- **HuggingFace Transformers** (optional) for CLIP scoring
- **Celery + Redis** for background task scheduling

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Google Gemini API key
- Apify API token(s) (`APIFY_TOKEN_1` … `APIFY_TOKEN_6`)
- Redis (optional, for post scheduling)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Create .env file (see Environment Variables section below)
cp .env.example .env

# Run the server
uvicorn main:app --reload
```

Backend runs at: `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Run development server
npm run dev
```

Frontend runs at: `http://localhost:3000`

## 📁 Project Structure

```
project/
├── backend/
│   ├── agents/
│   │   ├── base_agent.py            # Base agent class
│   │   ├── brand_analyzer.py        # Brand analysis & content generation
│   │   ├── campaign_agent.py        # Campaign strategies & ad recommendations
│   │   ├── competitor_analyzer.py   # Competitor SWOT & trending analysis
│   │   ├── orchestrator.py          # Multi-agent orchestrator workflows
│   │   └── shared_memory.py         # Shared memory for context passing
│   ├── generators/
│   │   ├── image_generator.py           # AI image generation (baseline)
│   │   ├── brand_conditioned_generator.py  # 🔬 Research: CLIP-ranked brand-conditioned gen
│   │   ├── engagement_predictor.py       # 🔬 Research: Pre-pub ER predictor
│   │   └── pollinations_v2.py           # Pollinations.ai API client
│   ├── models/
│   │   ├── database.py              # SQLAlchemy models & DB setup
│   │   └── check_posts.py           # Post validation utilities
│   ├── schedulers/
│   │   ├── celery_tasks.py          # Celery background tasks
│   │   └── social_poster.py         # Social media auto-posting
│   ├── scrapers/
│   │   ├── apify_scraper.py         # 🥇 Primary: Apify Instagram scraper (2-phase)
│   │   ├── apify_token_manager.py   # Multi-token rotation & usage tracking
│   │   └── instagram_scraper.py     # 🥈 Fallback: Instaloader scraper
│   ├── data/
│   │   └── generated_images/        # AI-generated images
│   ├── main.py                      # FastAPI application (all routes)
│   ├── agency.db                    # SQLite database
│   └── .env                         # Environment variables
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                 # Dashboard (home page)
│   │   ├── layout.tsx               # Root layout
│   │   ├── globals.css              # Global styles & theme
│   │   └── brand/[id]/
│   │       ├── page.tsx             # Brand detail page (Overview / Content / Research tabs)
│   │       ├── create/              # Content creation page
│   │       ├── campaigns/           # Campaign management page
│   │       ├── analytics/           # Analytics dashboard
│   │       ├── ad-recommendations/  # AI ad suggestions page
│   │       └── competitors/         # Competitor analysis page
│   ├── components/
│   │   ├── BrandNavBar.tsx          # Shared brand navigation bar
│   │   ├── ContentGrid.tsx          # Content display grid
│   │   ├── CreateBrandModal.tsx     # Brand creation modal
│   │   └── Loaders.tsx              # AI loading components
│   ├── hooks/
│   │   └── useScrollReveal.ts       # Scroll animation hook
│   └── lib/
│       ├── api.ts                   # API client (includes research endpoints)
│       └── helpers.ts               # Utility functions
│
├── requirements.txt                 # Python dependencies
└── readme.md
```

## 🎨 UI/UX Features

- **Dark Theme** - Modern dark UI with glassmorphism effects
- **AI Loading Bars** - Engaging progress indicators with step-by-step feedback
- **Smooth Animations** - Fade-in effects, hover transitions, and scroll reveal
- **Research Tab** - Live Brand-DNA inspection + pre-publication engagement prediction UI
- **Responsive Design** - Works on all screen sizes

## 📝 API Endpoints

### Brands
- `GET /brands/` - List all brands
- `POST /brands/` - Create a brand
- `GET /brands/{id}` - Get brand details
- `DELETE /brands/{id}` - Delete a brand and all associated data
- `POST /brands/{id}/sync` - Sync Instagram data (Apify primary, instaloader fallback)

### Content
- `POST /content/generate` - Generate content ideas
- `POST /content/caption` - Generate platform-optimized caption
- `POST /content/caption-multiplatform` - Generate captions for multiple platforms

### Posts
- `POST /posts/` - Create a post (draft or scheduled)
- `GET /posts/brand/{id}` - Get all posts for a brand

### Images
- `POST /images/generate` - Batch generate images for content ideas
- `POST /images/generate-single` - Generate single AI image
- `GET /api/images/{filename}` - Serve generated image files

### Campaigns
- `POST /campaigns/` - Create a campaign
- `GET /campaigns/brand/{id}` - List brand campaigns
- `PUT /campaigns/{id}` - Update campaign details
- `DELETE /campaigns/{id}` - Delete a campaign
- `PATCH /campaigns/{id}/status` - Update campaign status
- `GET /campaigns/{id}/performance` - Get campaign performance metrics
- `POST /campaigns/{id}/analyze` - AI performance analysis
- `POST /campaigns/{id}/strategy` - AI campaign strategy generation
- `POST /campaigns/ad-recommendations` - AI ad platform recommendations

### Instagram Posts
- `GET /brands/{id}/instagram-posts` - Get scraped Instagram posts
- `GET /campaigns/{id}/instagram-posts` - Get posts linked to a campaign
- `POST /campaigns/{id}/link-posts` - Link posts to a campaign
- `POST /campaigns/{id}/unlink-posts` - Unlink posts from a campaign

### Competitors
- `POST /competitors/analyze` - Analyze competitors (SWOT analysis)
- `POST /competitors/trending` - Identify trending competitor content

### Analytics
- `GET /analytics/brand/{id}` - Get brand analytics summary
- `GET /analytics/chart-data/{id}` - Get chart-formatted analytics data

### Strategy
- `POST /strategy/generate/{id}` - Generate marketing strategy

### 🔬 Research Endpoints
- `GET /research/brand-dna/{id}` - Extract and return Brand-DNA (style tokens, color mood, CLIP anchor)
- `POST /research/images/baseline` - Baseline image generation + CLIP score (for comparison)
- `POST /research/images/brand-conditioned` - Brand-conditioned multi-candidate generation ranked by CLIP
- `POST /research/engagement/predict` - Pre-publication engagement rate prediction with LOO-CV

## 🔐 Environment Variables

### Backend (.env)
```env
# AI APIs
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key           # Optional
POLLINATIONS_API_KEY=your_pollinations_key
HUGGINGFACE_TOKEN=your_hf_token           # Optional (for CLIP scoring)

# Apify (primary Instagram scraper — supports up to 6 token rotation)
APIFY_TOKEN_1=your_apify_token_1
APIFY_TOKEN_2=your_apify_token_2          # Optional
APIFY_TOKEN_3=your_apify_token_3          # Optional

# Database
DATABASE_URL=sqlite:///./agency.db
REDIS_URL=redis://localhost:6379          # For Celery scheduling

# Instagram Credentials (optional - for instaloader fallback auth)
INSTAGRAM_USERNAME=
INSTAGRAM_PASSWORD=

# Twitter API (optional)
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_SECRET=

# Application
SECRET_KEY=your_secret_key
DEBUG=True
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🔬 Research Paper Notes

### Scraper Architecture
- **Primary**: Apify two-phase actor pipeline (`instagram-profile-scraper` + `instagram-post-scraper`) — engagement-accurate with verified `videoPlayCount`
- **Fallback**: Instaloader — triggers automatically if Apify fails or returns `None`
- Token manager rotates across up to 6 Apify accounts at $4.70/month usage threshold

### Research Contribution Measurement
Run the following to generate before/after data for your paper:
```bash
# Baseline image + CLIP score
POST /research/images/baseline

# Brand-conditioned + CLIP score
POST /research/images/brand-conditioned

# Engagement prediction with LOO-CV
POST /research/engagement/predict  (run_loo_cv: true)
```

## 📄 License

MIT License - feel free to use this project for learning and development.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using AI-powered development
