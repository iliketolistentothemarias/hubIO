export interface Business {
  id: string
  name: string
  category: string
  description: string
  address: string
  phone: string
  website: string
  email: string
  rating: number
  reviewCount: number
  hours: string
  verified: boolean
  featured: boolean
  tags: string[]
  offers?: string[]
  image?: string
}

export const mockBusinesses: Business[] = [
  {
    id: 'mock-1',
    name: 'Downtown Coffee Co.',
    category: 'Food & Beverage',
    description: 'Local coffee shop serving artisanal coffee and fresh pastries. Family-owned since 2010. We source our beans from sustainable farms and roast them in-house every morning. Our pastries are baked fresh daily by our in-house baker.',
    address: '123 Main Street',
    phone: '(555) 123-4567',
    website: 'https://downtowncoffee.com',
    email: 'info@downtowncoffee.com',
    rating: 4.8,
    reviewCount: 234,
    hours: 'Mon-Fri: 6am-8pm, Sat-Sun: 7am-9pm',
    verified: true,
    featured: true,
    tags: ['Coffee', 'Pastries', 'WiFi', 'Pet Friendly'],
    offers: ['10% off for students', 'Free coffee on your birthday'],
  },
  {
    id: 'mock-2',
    name: 'Green Thumb Garden Center',
    category: 'Retail',
    description: 'Full-service garden center with plants, tools, and expert gardening advice. We carry over 500 varieties of plants, from native wildflowers to exotic tropicals, plus all the supplies you need to help them thrive.',
    address: '456 Garden Way',
    phone: '(555) 234-5678',
    website: 'https://greenthumb.com',
    email: 'info@greenthumb.com',
    rating: 4.9,
    reviewCount: 189,
    hours: 'Daily: 8am-6pm',
    verified: true,
    featured: false,
    tags: ['Plants', 'Garden Supplies', 'Expert Advice'],
    offers: ['Spring sale: 20% off all plants'],
  },
  {
    id: 'mock-3',
    name: 'Tech Repair Pro',
    category: 'Services',
    description: 'Expert phone, tablet, and computer repair. Fast turnaround, warranty included. Our certified technicians have over 10 years of combined experience and can fix everything from cracked screens to logic board failures.',
    address: '789 Tech Plaza',
    phone: '(555) 345-6789',
    website: 'https://techrepairpro.com',
    email: 'repair@techrepairpro.com',
    rating: 4.7,
    reviewCount: 156,
    hours: 'Mon-Sat: 9am-6pm',
    verified: true,
    featured: false,
    tags: ['Phone Repair', 'Computer Repair', 'Warranty'],
  },
]
