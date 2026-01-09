# Code Structure & Organization

## 📁 Directory Structure

```
tsa/
├── app/                              # Next.js App Router
│   ├── api/                          # API Routes (Backend)
│   │   ├── resources/               # Resource endpoints
│   │   │   ├── route.ts            # GET, POST /api/resources
│   │   │   └── [id]/route.ts       # GET, PUT, DELETE /api/resources/:id
│   │   ├── campaigns/               # Fundraising endpoints
│   │   │   ├── route.ts            # GET, POST /api/campaigns
│   │   │   └── [id]/donate/route.ts # POST /api/campaigns/:id/donate
│   │   ├── ai/                      # AI endpoints
│   │   │   ├── chat/route.ts       # POST /api/ai/chat
│   │   │   └── recommendations/route.ts # GET /api/ai/recommendations
│   │   └── analytics/               # Analytics endpoints
│   │       └── stats/route.ts      # GET /api/analytics/stats
│   ├── dashboard/                   # User dashboard page
│   ├── directory/                   # Resource directory page
│   ├── highlights/                  # Featured resources page
│   ├── submit/                      # Submit resource page
│   ├── about/                       # About page
│   ├── login/                       # Login page
│   ├── page.tsx                     # Homepage
│   ├── layout.tsx                   # Root layout
│   └── globals.css                  # Global styles
│
├── components/                      # React Components
│   ├── AIAssistant.tsx             # AI chat interface
│   ├── Dashboard.tsx               # User dashboard
│   ├── LiquidGlass.tsx            # Glassmorphism component
│   ├── Fundraising.tsx            # Fundraising section
│   ├── CommunityBoard.tsx         # Community feed
│   ├── VolunteerOpportunities.tsx  # Volunteer section
│   ├── Testimonials.tsx           # Testimonials
│   ├── Gallery.tsx                # Image gallery
│   ├── ResourceCard.tsx           # Resource card
│   ├── AdvancedSearch.tsx         # Search component
│   ├── ResourceComparison.tsx     # Comparison tool
│   ├── InteractiveMap.tsx         # Map component
│   ├── ResourceInsights.tsx       # Analytics component
│   ├── Navigation.tsx              # Navigation bar
│   └── Footer.tsx                 # Footer
│
├── lib/                             # Core Libraries
│   ├── types/                       # TypeScript definitions
│   │   └── index.ts                # All type definitions
│   ├── db/                          # Database layer
│   │   └── schema.ts               # Database service
│   ├── auth/                        # Authentication
│   │   └── index.ts                # Auth service
│   ├── ai/                          # AI services
│   │   ├── recommendations.ts      # Recommendation engine
│   │   └── assistant.ts            # AI assistant
│   └── utils/                       # Utilities
│       ├── validation.ts           # Form validation
│       └── analytics.ts            # Analytics service
│
├── contexts/                         # React Contexts
│   ├── ThemeContext.tsx            # Dark mode
│   └── FavoritesContext.tsx       # Favorites system
│
├── data/                            # Static data
│   └── resources.ts                # Sample resources
│
└── public/                          # Static assets
```

## 🔧 Module Organization

### API Routes (`app/api/`)

Each API route follows RESTful conventions:

```typescript
// GET /api/resources
export async function GET(request: NextRequest) { ... }

// POST /api/resources
export async function POST(request: NextRequest) { ... }
```

**Pattern**:
1. Validate authentication (if required)
2. Validate input data
3. Process business logic
4. Return standardized response

### Components (`components/`)

Components are organized by feature:

- **Feature Components**: Full sections (Fundraising, CommunityBoard)
- **UI Components**: Reusable elements (LiquidGlass, ResourceCard)
- **Layout Components**: Navigation, Footer

**Naming Convention**:
- PascalCase for components
- Descriptive names (ResourceCard, not Card)

### Libraries (`lib/`)

**Types** (`lib/types/`):
- Centralized type definitions
- Single source of truth
- Easy to maintain

**Database** (`lib/db/`):
- Abstracted database operations
- Clean API
- Ready for production DB

**Auth** (`lib/auth/`):
- Authentication logic
- Session management
- Role checking

**AI** (`lib/ai/`):
- Recommendation algorithms
- Intent detection
- Response generation

**Utils** (`lib/utils/`):
- Validation functions
- Analytics tracking
- Helper functions

## 📝 Code Comments

### File Headers
Every file starts with a header comment explaining its purpose:

```typescript
/**
 * Component Name
 * 
 * Brief description of what this component does
 * and how it fits into the larger system.
 */
```

### Function Documentation
All public functions are documented:

```typescript
/**
 * Function Name
 * 
 * @param paramName - Description
 * @returns Description of return value
 */
```

### Complex Logic
Inline comments explain:
- Why, not what
- Algorithm explanations
- Business logic reasoning

## 🎯 Best Practices

### 1. Separation of Concerns
- **UI**: Components handle presentation
- **Logic**: Services handle business logic
- **Data**: Database handles persistence

### 2. Single Responsibility
Each module/function does one thing well

### 3. DRY (Don't Repeat Yourself)
Reusable utilities and components

### 4. Type Safety
Full TypeScript coverage
No `any` types in production code

### 5. Error Handling
Try-catch blocks
User-friendly error messages
Logging for debugging

## 🔄 Data Flow

```
User Action
  ↓
Component (UI)
  ↓
API Route (Validation)
  ↓
Service Layer (Business Logic)
  ↓
Database (Persistence)
  ↓
Response
  ↓
Component Update (UI)
```

## 🧪 Testing Ready

Structure supports:
- Unit tests for utilities
- Integration tests for API routes
- Component tests for UI
- E2E tests for workflows

## 📚 Documentation

- **README.md**: Project overview
- **ARCHITECTURE.md**: System design
- **FEATURES.md**: Feature list
- **CODE_STRUCTURE.md**: This file
- **DEPLOYMENT.md**: Deployment guide
- **Inline Comments**: Code documentation

---

**Well-organized, documented, and production-ready!**

