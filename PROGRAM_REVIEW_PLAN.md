# Program Review App - Deployment & Enhancement Plan

## Current Project Analysis

**Type:** Vite + React + TypeScript + Gemini API  
**Purpose:** Community college program review assistant with AI-powered guidance  
**Current Features:**
- Multiple review templates (annual, comprehensive instructional, comprehensive non-instructional)
- Gemini AI integration for section assistance & chat
- Program data generation (enrollment, completion, demographics)
- Historical review tracking
- Knowledge base integration

## Conversion Strategy: Vite → Next.js

### Why Next.js?
- Easy Vercel deployment (serverless functions, built-in edge runtime)
- Better API route handling (Gemini API calls on backend, not exposed to frontend)
- Static export option if needed
- Environment variable management
- Build optimization

### Migration Steps
1. **Project scaffolding**
   - Create new Next.js 15 project with TypeScript + Tailwind
   - Keep React component structure mostly intact
   - Move Vite config to Next.js config

2. **API routes**
   - Move Gemini service calls to `/api/` routes (backend-only)
   - Endpoints:
     - `POST /api/generate-program-data` → generateProgramData
     - `POST /api/section-assistance` → getSectionAssistance
     - `POST /api/chat` → getChatResponse
     - `POST /api/summary` → getExecutiveSummary
   - Hides API key from frontend

3. **Component migration**
   - Existing React components → `/app/components/`
   - Main app → `/app/page.tsx`
   - Minimal changes to component logic

4. **Environment setup**
   - `.env.local` for Gemini API key (local dev)
   - Vercel environment variables (production)

## ACCJC Requirements Integration

### What to Add

1. **ACCJC Standards Database**
   - Create `lib/accjc-standards.ts` with:
     - Standard I: Mission & Institutional Effectiveness
     - Standard II: Student Learning & Support Services
     - Standard III: Resources
     - Standard IV: Leadership & Governance
   - Each standard has specific requirements/criteria
   - Link them to review sections

2. **Mapping Review Sections → ACCJC Standards**
   - Example:
     - "SLO Assessment" → Standard II
     - "Effectiveness Indicators" → Standard I
     - "Budgetary Needs" → Standard III
     - "External Factors" → Standard I, IV

3. **UI Enhancements**
   - **ACCJC Badge/Indicator** - Show which standards each section addresses
   - **Compliance Checklist** - "This review addresses ACCJC requirements X, Y, Z"
   - **Feedback Integration** - When generating section assistance, reference relevant ACCJC standards
   - **Summary Report** - Executive summary includes ACCJC alignment

4. **Gemini Prompt Enhancement**
   - Modify `getSectionAssistance` to include:
     ```
     "This section addresses ACCJC Standard X: [standard text]
      Consider how your response demonstrates compliance with [specific requirement]."
     ```
   - Feedback now references ACCJC language

5. **Data Source**
   - Create `lib/accjc-requirements.json` with official ACCJC standards
   - Or fetch from ACCJC API if available (research needed)

## Deployment Plan

### GitHub Setup (Siskiyousresearch Account)
1. Create new repo: `siskiyousresearch/program-review-assistant`
2. Structure:
   ```
   program-review-assistant/
   ├── app/                      (Next.js app directory)
   ├── lib/                       (utilities, ACCJC standards, etc.)
   ├── public/                    (assets)
   ├── package.json
   ├── next.config.ts
   ├── tsconfig.json
   ├── .env.example
   └── README.md
   ```

### Vercel Deployment
1. **Account Decision:**
   - Option A: Upgrade existing Vercel account to Pro ($20/month)
   - Option B: Create new account for Siskiyousresearch
   - **Recommendation:** Pro upgrade (single account = easier management)

2. **Environment Variables (Vercel):**
   - `GEMINI_API_KEY` = [your API key]

3. **Deployment:**
   - Connect GitHub repo to Vercel
   - Auto-deploy on push to main
   - Production URL: `https://program-review.vercel.app` (or custom domain)

## Implementation Order

### Phase 1: Vite → Next.js Conversion (Priority)
1. Create Next.js project structure
2. Migrate components (minimal changes)
3. Create API routes for Gemini calls
4. Test locally (npm run dev)
5. Push to GitHub

### Phase 2: ACCJC Integration
1. Build ACCJC standards data module
2. Map review sections to standards
3. Enhance Gemini prompts with ACCJC context
4. Add UI indicators/badges
5. Build compliance checklist component

### Phase 3: Vercel Deployment
1. Upgrade/create Vercel account
2. Connect GitHub repo
3. Set environment variables
4. Deploy to production
5. Test all features (data generation, AI assistance, chat, export)

## Estimated Timeline
- **Phase 1 (Conversion):** 2-3 hours (straightforward migration)
- **Phase 2 (ACCJC Integration):** 3-4 hours (data modeling + UI + prompt tuning)
- **Phase 3 (Deployment):** 30-45 minutes (Vercel setup is fast)
- **Total:** ~6-8 hours of development

## Success Criteria
✅ App runs locally on Next.js  
✅ Gemini API calls work (no frontend key exposure)  
✅ ACCJC standards visible in UI  
✅ Feedback references ACCJC requirements  
✅ Deployed to Vercel with custom domain (optional)  
✅ All features working in production  

## Notes
- Keep component structure close to original (easier to maintain)
- ACCJC standards can be expanded/updated as needed
- Consider Supabase for storing/exporting completed reviews (Phase 4, optional)

---

**Ready to start?** I can begin Phase 1 immediately after confirming:
1. Vercel Pro upgrade decision
2. ACCJC standards source (official docs? your list?)
