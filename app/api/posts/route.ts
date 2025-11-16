import { NextRequest } from 'next/server';
import { db } from '@/lib/db/helpers';
import { successResponse, createdResponse } from '@/lib/api/response';
import { handleApiError, ValidationError } from '@/lib/api/error-handler';
import { PostCategory } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    let posts;
    if (category && category !== 'All') {
      posts = await db.posts.getByCategory(category);
    } else {
      posts = await db.posts.getAll();
    }

    if (posts.length === 0) {
      try {
        const { seedPosts } = await import('@/data/seed-data');
        posts = seedPosts.map(post => ({
          ...post,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
      } catch (error) {
        console.warn('Could not load seed posts:', error);
      }
    }

    return successResponse(posts);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch posts');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title || !body.content || !body.category) {
      throw new ValidationError('Title, content, and category are required');
    }

    const validCategories: PostCategory[] = [
      'Events',
      'Volunteer',
      'Announcements',
      'Business',
      'Community',
      'Help',
      'Discussion'
    ];
    if (!validCategories.includes(body.category)) {
      throw new ValidationError('Invalid category');
    }

    const post = await db.posts.create({
      authorId: body.authorId || null,
      authorName: body.authorName || 'Anonymous',
      authorAvatar: body.authorAvatar,
      title: body.title,
      content: body.content,
      category: body.category,
      tags: Array.isArray(body.tags)
        ? body.tags
        : body.tags
        ? body.tags.split(',').map((t: string) => t.trim())
        : [],
      image: body.image,
    });

    return createdResponse(post, 'Post created successfully');
  } catch (error) {
    return handleApiError(error, 'Failed to create post');
  }
}
