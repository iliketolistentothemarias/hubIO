# HubIO - Community Resource Hub

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

## Design

- **Color Scheme**: Beige/yellow minimalist design
- **Typography**: Poppins for body text, Merriweather for headings
- **Theme**: Dark mode support
- **Responsive**: Mobile-first design

## Admin Access

Default admin credentials:
- **Email**: admin@hubio.org
- **Password**: admin123

Access the admin dashboard at `/admin` after logging in.

## Database Schema

The application uses Supabase with the following main tables:
- `resources` - Community resources
- `events` - Community events
- `fundraising_campaigns` - Fundraising campaigns
- `volunteer_opportunities` - Volunteer opportunities
- `users` - User accounts


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
