/**
 * Database Schema Tests
 */

import { getDatabase } from '@/lib/db/schema'
import { User, Resource } from '@/lib/types'

describe('DatabaseService', () => {
  let db: ReturnType<typeof getDatabase>

  beforeEach(() => {
    db = getDatabase()
  })

  describe('User Operations', () => {
    it('should create a user', () => {
      const user: User = {
        id: 'test-user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'resident',
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: {
            email: true,
            push: false,
            sms: false,
            events: true,
            volunteer: true,
            fundraising: true,
          },
          accessibility: {
            highContrast: false,
            textToSpeech: false,
            dyslexiaFriendly: false,
            fontSize: 'medium',
          },
        },
        karma: 0,
        badges: [],
        createdAt: new Date(),
        lastActiveAt: new Date(),
      }

      const created = db.createUser(user)
      expect(created).toEqual(user)
      expect(db.getUser(user.id)).toEqual(user)
    })

    it('should update a user', () => {
      const user: User = {
        id: 'test-user-2',
        email: 'test2@example.com',
        name: 'Test User 2',
        role: 'resident',
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: {
            email: true,
            push: false,
            sms: false,
            events: true,
            volunteer: true,
            fundraising: true,
          },
          accessibility: {
            highContrast: false,
            textToSpeech: false,
            dyslexiaFriendly: false,
            fontSize: 'medium',
          },
        },
        karma: 0,
        badges: [],
        createdAt: new Date(),
        lastActiveAt: new Date(),
      }

      db.createUser(user)
      const updated = db.updateUser(user.id, { karma: 10 })

      expect(updated?.karma).toBe(10)
    })
  })

  describe('Resource Operations', () => {
    it('should create a resource', () => {
      const resource: Resource = {
        id: 'test-resource-1',
        name: 'Test Resource',
        category: 'Food Assistance',
        description: 'Test description',
        address: '123 Test St',
        location: {
          lat: 40.4406,
          lng: -79.9959,
          address: '123 Test St',
          city: 'Pittsburgh',
          state: 'PA',
          zipCode: '15213',
        },
        phone: '412-555-0100',
        email: 'test@resource.com',
        website: 'https://test.com',
        tags: ['test'],
        featured: false,
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const created = db.createResource(resource)
      expect(created).toEqual(resource)
      expect(db.getResource(resource.id)).toEqual(resource)
    })
  })
})

