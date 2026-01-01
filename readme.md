# AI Social Media Agency 🚀

Complete AI-powered social media management platform that automates content creation, scheduling, and analytics across Instagram, Twitter, and LinkedIn.

## Features ✨

- **🤖 AI Brand Analysis**: Automatically analyzes Instagram profiles to understand brand voice, audience, and content strategy
- **✍️ AI Content Generation**: Creates captions, hashtags, and content ideas using Google Gemini Pro
- **🖼️ AI Image Generation**: Generates social media images using Pollinations.ai (free, unlimited)
- **📊 Analytics Dashboard**: Tracks engagement, reach, and performance metrics
- **📅 Content Scheduling**: Schedule posts for optimal engagement times
- **🔄 Auto-Posting**: Automated posting to Instagram, Twitter, LinkedIn
- **📈 Strategy Recommendations**: AI-powered marketing strategy suggestions
- **👥 Multi-Brand Management**: Manage multiple brands from one dashboard

## Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **AI**: Google Gemini Pro, Groq
- **Database**: SQLAlchemy (SQLite/PostgreSQL)
- **Task Queue**: Celery + Redis
- **Image Gen**: Pollinations.ai API
- **Scraping**: Instaloader, Instagrapi

### Frontend
- **Framework**: Next.js 14 (TypeScript)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- Redis (for task queue)
- Gemini API Key

### 1. Clone & Setup Backend

```bash
# Clone repository
git clone <your-repo>
cd ai-social-agency

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env and add your API keys
```

### 2. Configure Environment

Edit `.env` file:

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional (for posting)
INSTAGRAM_USERNAME=your_instagram_username
INSTAGRAM_PASSWORD=your_instagram_password
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_SECRET=your_twitter_access_secret

# Database
DATABASE_URL=sqlite:///./agency.db
REDIS_URL=redis://localhost:6379
```

### 3. Start Backend

```bash
# Terminal 1: Start API server
cd backend
python main.py
# Runs on http://localhost:8000

# Terminal 2: Start Celery worker (optional, for scheduling)
celery -A schedulers.celery_tasks worker --loglevel=info

# Terminal 3: Start Redis (required for Celery)
redis-server
```

### 4. Setup Frontend

```bash
# In new terminal
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
2. Click "Generate Content"
3. View AI-generated content ideas
4. Click "Create Post" on any idea

### 3. Create & Schedule Posts

1. Generate or write caption
2. Generate AI image (optional)
3. Add hashtags
4. Schedule post or save as draft

### 4. View Analytics

1. Go to brand page
2. Click "Analytics" tab
3. View engagement metrics and performance

## API Endpoints

### Brands
- `POST /brands/` - Create new brand
- `GET /brands/` - List all brands
- `GET /brands/{id}` - Get brand details
- `POST /brands/{id}/sync` - Resync brand data

### Content
- `POST /content/generate` - Generate content ideas
- `POST /content/caption` - Generate captions
- `POST /images/generate` - Generate images

### Posts
- `POST /posts/` - Create post
- `GET /posts/brand/{id}` - Get brand posts

### Analytics
- `GET /analytics/brand/{id}` - Get brand analytics

### Strategy
- `POST /strategy/generate/{id}` - Generate marketing strategy

## Project Structure

```
ai-social-agency/
├── backend/
│   ├── agents/              # AI agents (brand analyzer)
│   ├── scrapers/            # Instagram scraper
│   ├── generators/          # Image generator
│   ├── schedulers/          # Post scheduler & Celery tasks
│   ├── models/              # Database models
│   ├── api/                 # API routes
│   └── main.py              # FastAPI app
├── frontend/
│   ├── app/                 # Next.js pages
│   ├── components/          # React components
│   └── lib/                 # API client
├── data/                    # Generated images & data
├── requirements.txt
└── README.md
```

## Testing

### Test Backend
```bash
python test_system.py
```

### Test API
```bash
python test_api.py
```

## Deployment

### Backend (Railway/Render)
1. Connect GitHub repo
2. Set environment variables
3. Deploy from `main` branch

### Frontend (Vercel)
1. Import project from GitHub
2. Set `NEXT_PUBLIC_API_URL` to backend URL
3. Deploy

## Free API Limits

- **Gemini Pro**: 60 requests/min
- **Groq**: 30 requests/min  
- **Pollinations.ai**: Unlimited image generation
- **Twitter API**: 1500 tweets/month (free tier)
- **Instagram**: Rate limited by platform

## Troubleshooting

### Instagram Scraping Issues
- Instagram may rate limit. Wait 10-15 minutes and try again
- Use public accounts for testing
- Avoid scraping too frequently

### API Key Errors
- Double-check `.env` file has correct keys
- Get Gemini key from: https://makersuite.google.com/app/apikey
- Restart backend after changing `.env`

### Database Issues
```bash
# Reset database
rm agency.db
python test_system.py
```

## Future Enhancements

- [ ] Video generation with AI
- [ ] Multi-agent workflow orchestration
- [ ] A/B testing for posts
- [ ] Competitor analysis
- [ ] Advanced analytics dashboard
- [ ] Mobile app
- [ ] Chrome extension
- [ ] Influencer collaboration tools

## Contributing

This is a final year project. Feel free to fork and extend!

## License

MIT License

## Credits

Built with ❤️ using:
- Google Gemini Pro
- Pollinations.ai
- FastAPI
- Next.js

---

**Made for Final Year Project**