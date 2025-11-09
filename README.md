# HubIO - Community Resource Hub

A comprehensive, award-winning full-stack web application for the 2025-26 Washington TSA Webmaster competition. HubIO serves as a complete community resource platform connecting residents of South Fayette & Pittsburgh with local resources, events, volunteer opportunities, and fundraising campaigns.

## 🏆 Features

### Core Functionality
- **Interactive Resource Directory** - Search, filter, and discover 250+ community resources
- **Event Management** - Browse and RSVP to community events
- **Volunteer Opportunities** - Find and apply for volunteer positions
- **Fundraising Campaigns** - Support local causes and track donations
- **Community Board** - Engage with neighbors through posts and discussions
- **AI-Powered Recommendations** - Smart suggestions based on user interests

### Advanced Features
- **Admin Dashboard** - Full CRUD operations for managing all content
- **Real-time Analytics** - Track community engagement and impact
- **Interactive Map** - Visualize resources and events geographically
- **Favorites System** - Save and organize favorite resources
- **Resource Comparison** - Compare multiple resources side-by-side
- **Accessibility Features** - Text-to-speech, high-contrast mode, multilingual support

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **UI Components**: Shadcn UI, Radix UI
- **Backend**: Supabase (PostgreSQL)
- **Database**: Supabase with real-time capabilities
- **Fonts**: Poppins (sans-serif), Merriweather (serif)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account (for database)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/hubio.git
cd hubio
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
hubio/
├── app/                    # Next.js app router pages
│   ├── admin/             # Admin dashboard
│   ├── api/                # API routes
│   ├── directory/         # Resource directory
│   └── ...
├── components/             # React components
│   ├── ui/                # Shadcn UI components
│   └── ...
├── lib/                   # Utilities and services
│   ├── supabase/          # Supabase client and database
│   ├── auth/              # Authentication
│   └── ...
├── data/                  # Sample data
└── contexts/              # React contexts
```

## 🎨 Design

- **Color Scheme**: Beige/yellow minimalist design
- **Typography**: Poppins for body text, Merriweather for headings
- **Theme**: Dark mode support
- **Responsive**: Mobile-first design

## 🔐 Admin Access

Default admin credentials:
- **Email**: admin@hubio.org
- **Password**: admin123

Access the admin dashboard at `/admin` after logging in.

## 📊 Database Schema

The application uses Supabase with the following main tables:
- `resources` - Community resources
- `events` - Community events
- `fundraising_campaigns` - Fundraising campaigns
- `volunteer_opportunities` - Volunteer opportunities
- `users` - User accounts

## 🚢 Deployment

### Build for production:
```bash
npm run build
npm start
```

### Deploy to Vercel:
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## 📝 License

This project is created for the 2025-26 Washington TSA Webmaster competition.

## 👥 Contributors

Built for the TSA Webmaster competition by the HubIO team.

---

**HubIO** - Connecting communities with resources, support, and opportunities for growth.
