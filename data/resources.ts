import { Resource } from '@/lib/types'
import {
  pittsburghDirectoryResources,
  communityAnimalShelterResource,
} from '@/data/pittsburgh-directory'

export const resources: Resource[] = [
  ...pittsburghDirectoryResources,
  communityAnimalShelterResource,
]

import { additionalResources } from './resources-extended'

export const allResources: Resource[] = [...resources, ...additionalResources]

export const categories = [
  'All Categories',
  'Food Assistance',
  'Housing',
  'Health Services',
  'Youth Services',
  'Senior Services',
  'Education',
  'Employment',
  'Legal Services',
  'Support Services',
  'Community Programs',
  'Family Services',
]

export const allTags = Array.from(new Set(allResources.flatMap((r) => r.tags))).sort()
