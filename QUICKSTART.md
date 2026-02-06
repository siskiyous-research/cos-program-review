# Quick Start Checklist

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies (2 min)
```bash
cd /Users/clawdbot/.openclaw/workspace/program-review-app
npm install
```

### Step 2: Add API Key (1 min)
1. Get your Gemini API key: https://makersuite.google.com/app/apikey
2. Create `.env.local`:
   ```bash
   echo "GEMINI_API_KEY=paste_your_key_here" > .env.local
   ```

### Step 3: Run Development Server (1 min)
```bash
npm run dev
```

### Step 4: Test in Browser (1 min)
- Open http://localhost:3000
- Should see: "Program Review Assistant" with program selector
- Select a program and try the features

---

## ✅ Feature Checklist

Once running, verify each feature works:

### Core Functionality
- [ ] Page loads without errors
- [ ] Program selector works (try different programs)
- [ ] Review type selector works
- [ ] Program data appears in sidebar

### AI Features
- [ ] Chat assistant works (type a message)
- [ ] "AI Assist" button generates text
- [ ] "Generate Executive Summary" button works
- [ ] "Export Full Review" opens HTML file

### ACCJC Features
- [ ] Purple ACCJC badges appear on sections
- [ ] Hovering badge shows standards info
- [ ] Compliance checklist shows in main content

### Data Management
- [ ] Can add text to knowledge base
- [ ] Knowledge base "Save" button works
- [ ] Can drag files into archive sidebar (optional)

---

## 🐛 If Something Breaks

| Problem | Solution |
|---------|----------|
| `Module not found` | Run `npm install` again |
| `GEMINI_API_KEY is not set` | Check `.env.local` exists and has your key |
| `Cannot GET /` | Make sure dev server is running (`npm run dev`) |
| API calls fail with 500 | Check your Gemini API key is valid |
| Page is blank | Check browser console (F12) for errors |
| Buttons don't work | Reload page (F5) or restart dev server |

---

## 📦 Project Files Overview

```
program-review-app/
├── app/                 # Main app code
│   ├── api/            # 4 API routes (backend)
│   ├── components/     # 12 React components
│   ├── page.tsx       # Main app (start here to understand)
│   └── layout.tsx
├── lib/                # Utilities
│   ├── accjc-standards.ts  # ACCJC mappings
│   ├── gemini-service.ts   # Gemini API calls
│   ├── types.ts           # TypeScript types
│   └── constants.ts       # Templates
├── .env.example        # Environment template
├── .env.local          # Your API key (don't commit!)
├── package.json        # Dependencies
├── README.md          # Full documentation
├── DEPLOYMENT.md      # Vercel deployment guide
└── CONVERSION_SUMMARY.md  # Detailed conversion info
```

---

## 🚀 Ready to Deploy?

When ready, follow **DEPLOYMENT.md** for:
1. Push to GitHub
2. Connect to Vercel
3. Add `GEMINI_API_KEY` in Vercel dashboard
4. Click Deploy

---

## 📞 Quick Reference

### Build Commands
```bash
npm run dev      # Development server (localhost:3000)
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Check code quality
```

### Important Paths
- Main app: `app/page.tsx`
- Components: `app/components/`
- API: `app/api/*/route.ts`
- Utils: `lib/`

### Environment
- API Key needed: `GEMINI_API_KEY`
- Store in: `.env.local` (never in GitHub)
- File created from: `.env.example`

---

## ✨ That's It!

Your Program Review Assistant is now running locally with full ACCJC integration.

**Questions?** See README.md or DEPLOYMENT.md
