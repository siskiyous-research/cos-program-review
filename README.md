# Program Review Assistant

An AI-powered program review assistant for community colleges with **ACCJC accreditation standards integration**.

Built with Next.js 15, TypeScript, Tailwind CSS, and Google Gemini API.

## Features

✨ **AI-Powered Content Generation**
- Auto-generate section content with AI Assist
- Context-aware prompts based on program data
- Chat assistant for data exploration

📊 **Program Data Integration**
- Realistic program metrics (enrollment, completion, job placement)
- Student demographics analysis
- Trend analysis and reporting

🎓 **ACCJC Accreditation Standards**
- Automatic mapping of review sections to ACCJC Standards (I, II, III, IV)
- Compliance checklists for each standard
- Common issues & best practices feedback
- Standards context integrated into AI prompts

📋 **Review Templates**
- Annual Program Review template
- Comprehensive Program Review (Instructional)
- Comprehensive Program Review (Non-Instructional)

💾 **Review Management**
- Export full review to HTML
- Generate executive summaries
- Archive historical reviews
- Drag-and-drop file upload

## Quick Start

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn
- Google Gemini API key

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd /Users/clawdbot/.openclaw/workspace/program-review-app
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

3. **Add your Gemini API key:**
   - Get your key at: https://makersuite.google.com/app/apikey
   - Edit `.env.local` and add your API key:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   - Navigate to http://localhost:3000
   - Select a program and review type
   - Start writing your program review!

## Project Structure

```
program-review-app/
├── app/
│   ├── api/                    # Next.js API routes (backend)
│   │   ├── generate-program-data/route.ts
│   │   ├── section-assistance/route.ts
│   │   ├── chat/route.ts
│   │   └── summary/route.ts
│   ├── components/             # React components
│   │   ├── ReviewSection.tsx
│   │   ├── ProgramReviewForm.tsx
│   │   ├── Sidebar.tsx
│   │   ├── DirectorySidebar.tsx
│   │   ├── SummaryModal.tsx
│   │   ├── AccjcBadge.tsx       # ACCJC integration
│   │   ├── ComplianceChecklist.tsx
│   │   ├── AccjcFeedback.tsx
│   │   └── icons/
│   ├── layout.tsx
│   ├── page.tsx               # Main app component
│   └── globals.css
├── lib/
│   ├── accjc-standards.ts     # ACCJC utilities & mappings
│   ├── gemini-service.ts      # Gemini API service
│   ├── types.ts               # TypeScript interfaces
│   └── constants.ts           # Review templates & programs
├── public/
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── README.md
```

## ACCJC Integration

The app integrates ACCJC accreditation standards at multiple levels:

### 1. **Standards Mapping**
Each review section is automatically mapped to relevant ACCJC standards:
- Standard I: Mission, Academic Quality & Institutional Effectiveness
- Standard II: Student Learning & Support Services
- Standard III: Resources
- Standard IV: Leadership & Governance

### 2. **Section Badges**
Each review section displays which ACCJC standards it addresses, with detailed descriptions on hover.

### 3. **AI-Enhanced Prompts**
When you use "AI Assist", the prompt automatically includes:
- Relevant ACCJC standard IDs and descriptions
- Compliance checklist items
- Standards-specific guidance

### 4. **Compliance Checklists**
Interactive checklists for each standard help track compliance requirements.

### 5. **Feedback & Guidance**
Common ACCJC feedback and best practices are displayed to help avoid typical issues:
- Insufficient SLO Assessment
- Weak Connection to Institutional Mission
- Inadequate Resource Allocation
- Limited Closing the Loop Evidence
- Equity Gaps Not Addressed
- Outdated or Unclear Objectives

## How to Use

### 1. Select Program & Review Type
- Choose your program from the dropdown
- Select review type: Annual, Comprehensive (Instructional), or Comprehensive (Non-Instructional)

### 2. Review Program Data
- Check the sidebar to see your program's metrics
- Use the chat assistant to explore data and ask questions

### 3. Add Knowledge Base
- Paste relevant data (survey results, budget notes, etc.)
- This context is used by AI for better responses

### 4. Complete Each Section
- Read the section description
- Write initial notes or bullet points
- Click "AI Assist" to expand your notes into professional paragraphs
- The AI considers your program data and ACCJC standards

### 5. Export & Summarize
- **Export Full Review**: Opens a formatted HTML document
- **Generate Executive Summary**: Creates a 300-400 word summary of your entire review

## API Routes

All API routes are backend-only (API key is never exposed to frontend):

### POST /api/generate-program-data
Generates realistic program data using Gemini.
- Input: `{ programName: string }`
- Output: `{ ok: true, data: ProgramData }`

### POST /api/section-assistance
Generates AI assistance for a review section **with ACCJC context**.
- Input: `{ sectionId, sectionTitle, sectionDescription, programData, userNotes, knowledgeBaseData }`
- Output: `{ ok: true, assistance: string }`

### POST /api/chat
Handles chat messages with program context.
- Input: `{ message, chatHistory, programData, knowledgeBaseData }`
- Output: `{ ok: true, response: string }`

### POST /api/summary
Generates an executive summary of the program review.
- Input: `{ fullReviewText, historicalData, knowledgeBaseData }`
- Output: `{ ok: true, summary: string }`

## Environment Variables

Required for production/deployment:

```env
# Google Gemini API
GEMINI_API_KEY=your_api_key_here
```

## Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Code Quality

- TypeScript strict mode enabled
- No `any` types (strict type checking)
- Tailwind CSS for all styling (no custom CSS files)
- Component-based architecture

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on deploying to Vercel.

### Quick Deploy to Vercel

1. **Push to GitHub** (must be public or Vercel has access)
2. **Connect GitHub to Vercel**: https://vercel.com/import
3. **Set environment variables** in Vercel dashboard:
   - `GEMINI_API_KEY`
4. **Deploy!**

Vercel will automatically build and deploy on every push to main.

## Troubleshooting

### API Key Error
- Ensure `GEMINI_API_KEY` is set in `.env.local`
- Verify the key is valid at: https://makersuite.google.com/app/apikey
- Restart the dev server after changing .env.local

### Build Errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node version: `node --version` (should be 18+)
- Verify all imports use correct paths: `@/lib/*`, `@/app/*`

### AI Responses Not Working
- Check browser console for error messages
- Verify API route is being called: check Network tab in DevTools
- Ensure user notes are provided before clicking AI Assist

## Architecture Notes

### Backend-Only API Key
- The `GEMINI_API_KEY` is stored only on the server
- All Gemini calls go through Next.js API routes
- Frontend has zero access to the API key
- Safe for deployment to public URLs

### ACCJC Context Integration
The app builds ACCJC context for every AI prompt:
```typescript
buildAccjcContext(sectionId) → formatted ACCJC standards text
getMappedStandards(sectionId) → applicable standard IDs
getComplianceChecklist(standardId) → compliance items
```

### Component Architecture
- **Client components** use `'use client'` directive
- **API routes** run on the server (backend)
- **Type safety** throughout with TypeScript
- **State management** with React hooks (useState, useContext)

## Future Enhancements

- [ ] Export to Word/PDF format
- [ ] Peer review workflow
- [ ] Admin dashboard for college leaders
- [ ] Real-time collaboration
- [ ] Historical trend analysis
- [ ] Automated compliance scoring
- [ ] Integration with college SIS
- [ ] Email delivery of summaries

## Support

For issues or questions:
1. Check this README
2. Review DEPLOYMENT.md for deployment issues
3. Check the browser console for error messages
4. Verify GEMINI_API_KEY is set correctly

## License

Internal use for College of the Siskiyous

## Contributors

- Claude (Sonnet 4.5) - Full-stack development
- JT - Project management & deployment
