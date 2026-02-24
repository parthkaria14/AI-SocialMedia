# AI Social Media Agency 🚀

An AI-powered social media management platform that helps brands create, schedule, and optimize their social media content using advanced AI agents.

![AI Social Media Agency](https://img.shields.io/badge/AI-Powered-purple?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.11+-blue?style=for-the-badge&logo=python)

## ✨ Features

### 🤖 AI Agents
- **Brand Analyzer** - Analyzes Instagram profiles to understand brand voice, target audience, and content themes
- **Content Generator** - Creates AI-powered content ideas, captions, and hashtag suggestions
- **Campaign Agent** - Generates marketing strategies, analyzes campaigns, and recommends ad platforms
- **Competitor Analyzer** - SWOT analysis, competitor comparison, and trending content identification
- **Image Generator** - Creates high-quality AI images using Pollinations.ai with optional text overlays

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
- Create content directly from ad recommendations
- Generate posts from campaign strategy calendar
- Context flows between all AI agents

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
- **Instaloader** for Instagram scraping
- **Celery + Redis** for background task scheduling

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Google Gemini API key
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
python main.py
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
│   │   ├── brand_analyzer.py        # Brand analysis & content generation
│   │   ├── campaign_agent.py        # Campaign strategies & ad recommendations
│   │   └── competitor_analyzer.py   # Competitor SWOT & trending analysis
│   ├── generators/
│   │   ├── image_generator.py       # AI image generation with text overlays
│   │   └── pollinations_v2.py       # Pollinations.ai API client
│   ├── models/
│   │   ├── database.py              # SQLAlchemy models & DB setup
│   │   └── check_posts.py           # Post validation utilities
│   ├── schedulers/
│   │   ├── celery_tasks.py          # Celery background tasks
│   │   └── social_poster.py         # Social media auto-posting
│   ├── scrapers/
│   │   └── instagram_scraper.py     # Instagram profile & post scraping
│   ├── data/
│   │   └── generated_images/        # AI-generated images
│   ├── main.py                      # FastAPI application (all routes)
│   ├── agency.db                    # SQLite database
│   ├── test_api.py                  # API integration tests
│   ├── test_system.py               # System-level tests
│   └── .env                         # Environment variables
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                 # Dashboard (home page)
│   │   ├── layout.tsx               # Root layout
│   │   ├── globals.css              # Global styles & theme
│   │   └── brand/[id]/
│   │       ├── page.tsx             # Brand detail page
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
│   ├── lib/
│   │   ├── api.ts                   # API client (Axios)
│   │   └── helpers.ts               # Utility functions
│   └── public/                      # Static assets
│
├── requirements.txt                 # Python dependencies
└── readme.md
```

## 🎨 UI/UX Features

- **Dark Theme** - Modern dark UI with glassmorphism effects
- **AI Loading Bars** - Engaging progress indicators with step-by-step feedback
- **Smooth Animations** - Fade-in effects, hover transitions, and scroll reveal
- **Responsive Design** - Works on all screen sizes

## 📝 API Endpoints

### Brands
- `GET /brands/` - List all brands
- `POST /brands/` - Create a brand
- `GET /brands/{id}` - Get brand details
- `DELETE /brands/{id}` - Delete a brand and all associated data
- `POST /brands/{id}/sync` - Sync Instagram data

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
- `GET /instagram-posts/brand/{id}` - Get scraped Instagram posts
- `GET /instagram-posts/campaign/{id}` - Get posts linked to a campaign
- `POST /instagram-posts/campaign/{id}/link` - Link posts to a campaign
- `POST /instagram-posts/campaign/{id}/unlink` - Unlink posts from a campaign

### Competitors
- `POST /competitors/analyze` - Analyze competitors (SWOT analysis)
- `POST /competitors/trending` - Identify trending competitor content

### Analytics
- `GET /analytics/brand/{id}` - Get brand analytics summary
- `GET /analytics/chart-data/{id}` - Get chart-formatted analytics data

### Strategy
- `POST /strategy/generate/{id}` - Generate marketing strategy

## 🔐 Environment Variables

### Backend (.env)
```env
# AI APIs
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key           # Optional
POLLINATIONS_API_KEY=your_pollinations_key
HUGGINGFACE_TOKEN=your_hf_token           # Optional

# Database
DATABASE_URL=sqlite:///./agency.db
REDIS_URL=redis://localhost:6379          # For Celery scheduling

# Instagram Credentials (optional - for auto-posting)
INSTAGRAM_USERNAME=
INSTAGRAM_PASSWORD=

# Twitter API (optional)
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_SECRET=

# LinkedIn (optional)
LINKEDIN_EMAIL=
LINKEDIN_PASSWORD=

# Application
SECRET_KEY=your_secret_key
DEBUG=True
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📄 License

MIT License - feel free to use this project for learning and development.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using AI-powered development
