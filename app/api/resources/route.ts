import { NextRequest } from 'next/server';
import { db } from '@/lib/db/helpers';
import { validateResource } from '@/lib/utils/validation';
import { Resource, PaginatedResponse } from '@/lib/types';
import {
  successResponse,
  createdResponse,
  validationErrorResponse,
} from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { getPaginationParams } from '@/lib/api/middleware';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const featured = searchParams.get('featured') === 'true';
    const { page, pageSize } = getPaginationParams(request);

    let resources: Resource[];

    if (category && category !== 'All Categories') {
      resources = await db.resources.getByCategory(category);
    } else {
      resources = await db.resources.getAll(true);
    }

    if (featured) {
      resources = resources.filter(r => r.featured);
    }

    const total = resources.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedResources = resources.slice(startIndex, startIndex + pageSize);

    const paginatedResponse: PaginatedResponse<Resource> = {
      items: paginatedResources,
      total,
      page,
      pageSize,
      totalPages,
    };

    return successResponse(paginatedResponse);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch resources');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateResource(body);
    if (!validation.valid) {
      return validationErrorResponse(validation);
    }

    const resource = await db.resources.create({
      name: body.name,
      category: body.category,
      description: body.description,
      address: body.address,
      phone: body.phone,
      email: body.email,
      website: body.website || '',
      tags: Array.isArray(body.tags)
        ? body.tags
        : body.tags
        ? body.tags.split(',').map((t: string) => t.trim())
        : [],
      services: body.services || [],
      languages: body.languages || [],
      accessibility: body.accessibility || [],
      submittedBy: body.submittedBy,
    });

    return createdResponse(
      resource,
      'Your request has been submitted. If approved, you should see your resource up shortly.'
    );
  } catch (error) {
    return handleApiError(error, 'Failed to create resource');
  }
}
