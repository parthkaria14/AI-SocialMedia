# AI Social Media Agency 🚀

Complete AI-powered social media management platform that automates content creation, scheduling, analytics, and campaign management across Instagram, Twitter, and LinkedIn.

## Features ✨

### Core Features
- **🤖 AI Brand Analysis**: Automatically analyzes Instagram profiles to understand brand voice, audience, and content strategy
- **✍️ AI Content Generation**: Creates captions, hashtags, and content ideas using Google Gemini
- **🖼️ AI Image Generation**: Generates social media images using Pollinations.ai (free, unlimited)
- **📊 Analytics Dashboard**: Tracks engagement, reach, and performance metrics with interactive charts
- **📅 Content Scheduling**: Schedule posts for optimal engagement times
- **📈 Strategy Recommendations**: AI-powered marketing strategy suggestions
- **👥 Multi-Brand Management**: Manage multiple brands from one dashboard

### Campaign Management
- **📢 Campaign Creation**: Create and manage marketing campaigns with objectives, budget, and timeline
- **🎯 AI Ad Recommendations**: Get AI-powered platform recommendations based on objectives and budget
- **📊 Campaign Analytics**: Track campaign performance with detailed metrics (CTR, CPC, ROAS)
- **🔗 Post Linking**: Link Instagram posts to campaigns for attribution tracking

### Competitor Intelligence
- **👀 Competitor Analysis**: Analyze competitor profiles and identify opportunities
- **📈 Trending Content**: Find trending topics and content in your niche
- **💡 SWOT Analysis**: AI-generated strengths, weaknesses, opportunities, and threats

### Smart Agent Interconnectivity
- **🔄 Seamless Flow**: Create content directly from ad recommendations or campaign strategies
- **📋 Context Passing**: Campaign objectives and content tips automatically flow to content creation
- **⚡ One-Click Actions**: Quick actions to create campaigns, content, or posts from any insight

## Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.9+)
- **AI**: Google Gemini 2.5 Flash, Groq (fallback)
- **Database**: SQLAlchemy with SQLite/PostgreSQL
- **Scraping**: Instaloader for Instagram data

### Frontend
- **Framework**: Next.js 16 (TypeScript) with React 19
- **Styling**: Tailwind CSS v4 (dark theme with glassmorphism)
- **Icons**: Lucide React
- **Charts**: Recharts

## UI/UX Features 🎨

- **Dark Theme**: Premium dark mode with glassmorphism design
- **AI Loading Animations**: Engaging progress bars with step indicators for all AI operations
- **Smooth Transitions**: Micro-animations and hover effects throughout
- **Responsive Design**: Works on desktop, tablet, and mobile

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- Gemini API Key (required)
- Groq API Key (optional, for fallback)

### 1. Clone & Setup Backend

```bash
# Clone repository
git clone https://github.com/parthkaria14/AI-SocialMedia.git
cd AI-SocialMedia/project

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
cd backend
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env and add your API keys
```

### 2. Configure Environment

Create/edit `backend/.env`:

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional (for fallback)
GROQ_API_KEY=your_groq_api_key

# Optional (for auto-posting)
INSTAGRAM_USERNAME=your_instagram_username
INSTAGRAM_PASSWORD=your_instagram_password
```

### 3. Start Backend

```bash
cd backend
python main.py
# Runs on http://localhost:8000
```

### 4. Setup & Start Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Runs on http://localhost:3000
```

## Usage Guide

### 1. Add a Brand
1. Open http://localhost:3000
2. Click "Add Brand"
3. Enter brand name and Instagram handle
4. Wait 1-2 minutes for AI analysis

### 2. Generate Content
1. Click on a brand
2. Click "Generate Content" to get AI-powered content ideas
3. Click "Create Post" on any idea to create content
4. Generate AI image and caption

### 3. Manage Campaigns
1. Go to brand → Campaigns tab
2. Create new campaign with objectives and budget
3. Run AI Performance Analysis for insights
4. Generate AI Strategy for content calendar
5. Click "Create" on calendar items to make posts

### 4. Get Ad Recommendations
1. Go to brand → Ad Recommendations tab
2. Set campaign objectives, budget, and target metrics
3. Click "Get AI Recommendations"
4. View platform recommendations with ROI estimates
5. Click "Create Content" to start creating ads

### 5. Analyze Competitors
1. Go to brand → Competitors tab
2. Add competitor Instagram handles
3. Click "Analyze Competitors" for SWOT analysis
4. Click "Find Trending Content" for trending topics

## API Endpoints

### Brands
- `POST /brands/` - Create new brand
- `GET /brands/` - List all brands
- `GET /brands/{id}` - Get brand details
- `POST /brands/{id}/sync` - Resync brand data

### Content
- `POST /content/generate` - Generate content ideas
- `POST /content/caption` - Generate captions
- `POST /content/caption-multiplatform` - Generate for all platforms
- `POST /images/generate-single` - Generate AI image

### Campaigns
- `POST /campaigns/` - Create campaign
- `GET /campaigns/{id}` - Get campaign details
- `POST /campaigns/{id}/analyze` - Run AI analysis
- `POST /campaigns/{id}/strategy` - Generate AI strategy

### Ad Recommendations
- `POST /ads/recommend` - Get AI platform recommendations

### Competitors
- `POST /competitors/analyze` - Analyze competitors
- `POST /competitors/trending` - Get trending content

## Project Structure

```
project/
├── backend/
│   ├── agents/              # AI agents
│   │   ├── brand_analyzer.py    # Content & caption generation
│   │   ├── campaign_agent.py    # Campaign & ad recommendations
│   │   └── competitor_analyzer.py
│   ├── scrapers/            # Instagram scraper
│   ├── generators/          # Image generator
│   ├── models/              # Database models
│   └── main.py              # FastAPI app
├── frontend/
│   ├── app/                 # Next.js pages
│   │   ├── brand/[id]/      # Brand pages
│   │   │   ├── create/      # Create post
│   │   │   ├── campaigns/   # Campaign management
│   │   │   ├── analytics/   # Analytics dashboard
│   │   │   ├── ad-recommendations/
│   │   │   └── competitors/
│   ├── components/          # React components
│   │   ├── Loaders.tsx      # AI loading animations
│   │   └── BrandNavBar.tsx  # Navigation
│   └── lib/                 # API client
└── README.md
```

## Troubleshooting

### Instagram Scraping Issues
- Instagram may rate limit. Wait 10-15 minutes and try again
- Use public accounts for testing
- Avoid scraping too frequently

### API Key Errors
- Double-check `.env` file has correct keys
- Get Gemini key from: https://aistudio.google.com/apikey
- Restart backend after changing `.env`

### JSON Parse Errors
- Campaign analysis/strategy generation includes robust JSON cleaning
- If errors persist, try regenerating

### Database Reset
```bash
cd backend
rm agency.db
python main.py
```

## Free API Limits

- **Gemini**: 15 requests/min (free tier)
- **Groq**: 30 requests/min (fallback)
- **Pollinations.ai**: Unlimited image generation

## Contributing

Final year project - feel free to fork and extend!

## License

MIT License

## Credits

Built with ❤️ using:
- Google Gemini AI
- Pollinations.ai
- FastAPI
- Next.js

---

**Made for Final Year Project by Parth Karia**