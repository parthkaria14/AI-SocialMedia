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
- **Image Generator** - Creates high-quality AI images using Pollinations.ai

### 📊 Dashboard
- Multi-brand management with visual stats
- Brand profile analysis with status indicators
- Quick access to all brand features

### 📝 Content Creation
- AI-powered caption generation for any platform
- Multi-platform caption optimization (Instagram, Twitter, LinkedIn)
- AI image generation with custom prompts
- Hashtag suggestions and scheduling
- Download generated images directly

### 📈 Campaign Management
- Create and track marketing campaigns
- AI performance analysis
- AI-generated campaign strategies with content calendars
- Link Instagram posts to campaigns

### 💡 Ad Recommendations
- AI-powered platform recommendations
- Budget allocation suggestions
- Expected ROI calculations
- One-click content creation from recommendations

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

### Backend
- **FastAPI** with Python 3.11+
- **SQLAlchemy** with SQLite
- **Google Gemini 2.5 Flash** for AI generation
- **Pollinations.ai** for image generation
- **Instaloader** for Instagram scraping

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Google Gemini API key

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "GEMINI_API_KEY=your_gemini_api_key" > .env

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
│   │   ├── brand_analyzer.py    # Instagram analysis
│   │   ├── content_agent.py     # Content generation
│   │   └── campaign_agent.py    # Campaigns & ads
│   ├── data/
│   │   ├── generated_images/    # AI-generated images
│   │   └── database.db          # SQLite database
│   ├── scraping/
│   │   └── insta_scraper.py     # Instagram scraper
│   └── main.py                  # FastAPI application
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Dashboard
│   │   └── brand/[id]/
│   │       ├── page.tsx         # Brand detail
│   │       ├── create/          # Content creation
│   │       ├── campaigns/       # Campaign management
│   │       ├── analytics/       # Analytics view
│   │       ├── ad-recommendations/  # AI ad suggestions
│   │       └── competitors/     # Competitor analysis
│   ├── components/
│   │   ├── Loaders.tsx          # Loading components
│   │   ├── BrandNavBar.tsx      # Navigation
│   │   └── ContentGrid.tsx      # Content display
│   └── lib/
│       └── api.ts               # API client
```

## 🎨 UI/UX Features

- **Dark Theme** - Modern dark UI with glassmorphism effects
- **AI Loading Bars** - Engaging progress indicators with step-by-step feedback
- **Smooth Animations** - Fade-in effects and hover transitions
- **Responsive Design** - Works on all screen sizes

## 📝 API Endpoints

### Brands
- `GET /brands/` - List all brands
- `POST /brands/` - Create a brand
- `GET /brands/{id}` - Get brand details
- `POST /brands/{id}/sync` - Sync Instagram data

### Content
- `POST /content/generate` - Generate content ideas
- `POST /content/caption` - Generate captions
- `POST /content/multiplatform-captions` - Multi-platform captions

### Images
- `POST /images/generate-single` - Generate AI image

### Campaigns
- `GET /campaigns/brand/{id}` - List brand campaigns
- `POST /campaigns/` - Create campaign
- `POST /campaigns/{id}/analyze` - AI analysis
- `POST /campaigns/{id}/strategy` - AI strategy

### Analytics
- `GET /analytics/brand/{id}` - Get brand analytics

## 🔐 Environment Variables

### Backend (.env)
```
GEMINI_API_KEY=your_gemini_api_key
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
