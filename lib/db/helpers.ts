import { query } from './client';
import { User, Post, Resource } from '../types';
import bcrypt from 'bcryptjs';

export const db = {
  users: {
    async create(email: string, name: string, password: string, role: string = 'volunteer') {
      const passwordHash = await bcrypt.hash(password, 10);
      const result = await query<User>(
        `INSERT INTO users (email, name, password_hash, role) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [email, name, passwordHash, role]
      );
      return result.rows[0];
    },

    async findByEmail(email: string) {
      const result = await query<User>(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    },

    async findById(id: string) {
      const result = await query<User>(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    },

    async verifyPassword(email: string, password: string) {
      const result = await query<User & { password_hash: string }>(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      const user = result.rows[0];
      if (!user) return null;

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) return null;

      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    },

    async updateLastActive(userId: string) {
      await query(
        'UPDATE users SET last_active_at = NOW() WHERE id = $1',
        [userId]
      );
    },

    async updateRole(userId: string, role: string) {
      const result = await query<User>(
        'UPDATE users SET role = $1 WHERE id = $2 RETURNING *',
        [role, userId]
      );
      return result.rows[0];
    },

    async getAll() {
      const result = await query<User>('SELECT * FROM users ORDER BY created_at DESC');
      return result.rows;
    }
  },

  posts: {
    async create(post: {
      authorId?: string | null;
      authorName: string;
      authorAvatar?: string;
      title: string;
      content: string;
      category: string;
      tags?: string[];
      image?: string;
    }) {
      const result = await query<Post>(
        `INSERT INTO posts (author_id, author_name, author_avatar, title, content, category, tags, image)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          post.authorId || null,
          post.authorName,
          post.authorAvatar || null,
          post.title,
          post.content,
          post.category,
          post.tags || [],
          post.image || null
        ]
      );
      return result.rows[0];
    },

    async getAll(limit: number = 50) {
      const result = await query<Post>(
        'SELECT * FROM posts ORDER BY created_at DESC LIMIT $1',
        [limit]
      );
      return result.rows;
    },

    async getById(id: string) {
      const result = await query<Post>(
        'SELECT * FROM posts WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    },

    async getByCategory(category: string, limit: number = 50) {
      const result = await query<Post>(
        'SELECT * FROM posts WHERE category = $1 ORDER BY created_at DESC LIMIT $2',
        [category, limit]
      );
      return result.rows;
    },

    async like(postId: string, userId: string) {
      await query(
        'INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT (post_id, user_id) DO NOTHING',
        [postId, userId]
      );
      await query(
        'UPDATE posts SET likes = (SELECT COUNT(*) FROM post_likes WHERE post_id = $1) WHERE id = $1',
        [postId]
      );
    },

    async unlike(postId: string, userId: string) {
      await query(
        'DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      );
      await query(
        'UPDATE posts SET likes = (SELECT COUNT(*) FROM post_likes WHERE post_id = $1) WHERE id = $1',
        [postId]
      );
    }
  },

  resources: {
    async create(resource: {
      name: string;
      category: string;
      description: string;
      address: string;
      phone: string;
      email: string;
      website?: string;
      tags?: string[];
      services?: string[];
      languages?: string[];
      accessibility?: string[];
      submittedBy?: string;
    }) {
      const result = await query<Resource>(
        `INSERT INTO resources (
          name, category, description, address, phone, email, website, 
          tags, services, languages, accessibility, submitted_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          resource.name,
          resource.category,
          resource.description,
          resource.address,
          resource.phone,
          resource.email,
          resource.website || null,
          resource.tags || [],
          resource.services || [],
          resource.languages || [],
          resource.accessibility || [],
          resource.submittedBy || null
        ]
      );
      return result.rows[0];
    },

    async getAll(verified: boolean = false) {
      const result = await query<Resource>(
        verified
          ? 'SELECT * FROM resources WHERE verified = true ORDER BY created_at DESC'
          : 'SELECT * FROM resources ORDER BY created_at DESC'
      );
      return result.rows;
    },

    async getById(id: string) {
      const result = await query<Resource>(
        'SELECT * FROM resources WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    },

    async getByCategory(category: string) {
      const result = await query<Resource>(
        'SELECT * FROM resources WHERE category = $1 AND verified = true ORDER BY created_at DESC',
        [category]
      );
      return result.rows;
    },

    async verify(id: string) {
      const result = await query<Resource>(
        'UPDATE resources SET verified = true WHERE id = $1 RETURNING *',
        [id]
      );
      return result.rows[0];
    }
  },

  events: {
    async create(event: any) {
      const result = await query(
        `INSERT INTO events (
          title, description, date, end_date, location, organizer, 
          organizer_id, capacity, category, tags, image, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          event.title,
          event.description,
          event.date,
          event.endDate || null,
          event.location,
          event.organizer,
          event.organizerId || null,
          event.capacity || null,
          event.category,
          event.tags || [],
          event.image || null,
          event.status || 'upcoming'
        ]
      );
      return result.rows[0];
    },

    async getUpcoming(limit: number = 50) {
      const result = await query(
        `SELECT * FROM events 
         WHERE date > NOW() AND status = 'upcoming' 
         ORDER BY date ASC 
         LIMIT $1`,
        [limit]
      );
      return result.rows;
    },

    async getById(id: string) {
      const result = await query(
        'SELECT * FROM events WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    }
  }
};
