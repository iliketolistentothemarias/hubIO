export interface Grant {
  id: string
  title: string
  organization: string
  description: string
  category: string
  amount: string
  eligibility: string[]
  requirements: string[]
  status: 'open' | 'closing-soon' | 'closed'
  applications: number
  verified: boolean
}

export const mockGrants: Grant[] = [
  {
    id: 'mock-1',
    title: 'Small Business Startup Grant',
    organization: 'Local Economic Development',
    description: 'Grants up to $25,000 for new small businesses in the community. Focus on job creation and local economic growth.',
    category: 'Business',
    amount: 'Up to $25,000',
    eligibility: ['New businesses', 'Under 2 years old', 'Local ownership'],
    requirements: ['Business plan', 'Financial projections', 'Community impact statement'],
    status: 'open',
    applications: 45,
    verified: true,
  },
  {
    id: 'mock-2',
    title: 'Community Garden Initiative Grant',
    organization: 'Environmental Foundation',
    description: 'Funding for community garden projects that promote food security and environmental education.',
    category: 'Community',
    amount: '$5,000 - $15,000',
    eligibility: ['Non-profits', 'Community groups', 'Schools'],
    requirements: ['Project proposal', 'Budget', 'Community support letters'],
    status: 'open',
    applications: 23,
    verified: true,
  },
  {
    id: 'mock-3',
    title: 'Youth Education Scholarship',
    organization: 'Education Foundation',
    description: 'Scholarships for local students pursuing higher education. Multiple awards available.',
    category: 'Education',
    amount: '$2,000 - $10,000',
    eligibility: ['High school seniors', 'Local residents', 'GPA 3.0+'],
    requirements: ['Transcript', 'Essay', 'Letters of recommendation'],
    status: 'open',
    applications: 78,
    verified: true,
  },
]
