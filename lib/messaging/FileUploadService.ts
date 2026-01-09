/**
 * File Upload Service for Messaging
 * 
 * Handles file and image uploads for messages using Supabase Storage
 */

import { supabase } from '@/lib/supabase/client'

export interface UploadedFile {
  url: string
  name: string
  size: number
  type: string
}

class FileUploadService {
  private readonly BUCKET_NAME = 'message-attachments'
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  private readonly ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    ...this.ALLOWED_IMAGE_TYPES
  ]

  /**
   * Upload an image file
   */
  async uploadImage(file: File): Promise<UploadedFile> {
    // Validate file
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('Invalid image type. Allowed types: JPEG, PNG, GIF, WebP')
    }

    if (file.size > this.MAX_IMAGE_SIZE) {
      throw new Error(`Image size exceeds ${this.MAX_IMAGE_SIZE / 1024 / 1024}MB limit`)
    }

    return this.uploadFile(file, 'images')
  }

  /**
   * Upload a file attachment
   */
  async uploadAttachment(file: File): Promise<UploadedFile> {
    // Validate file
    if (!this.ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error('File type not allowed')
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit`)
    }

    return this.uploadFile(file, 'files')
  }

  /**
   * Upload file to Supabase Storage
   */
  private async uploadFile(file: File, folder: string): Promise<UploadedFile> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Generate unique filename
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(7)
      const extension = file.name.split('.').pop()
      const filename = `${folder}/${user.id}/${timestamp}-${randomStr}.${extension}`

      // Upload file
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(data.path)

      return {
        url: publicUrl,
        name: file.name,
        size: file.size,
        type: file.type
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract path from URL
      const url = new URL(fileUrl)
      const path = url.pathname.split(`/${this.BUCKET_NAME}/`)[1]

      if (!path) throw new Error('Invalid file URL')

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([path])

      if (error) throw error
    } catch (error) {
      console.error('Error deleting file:', error)
      throw error
    }
  }

  /**
   * Compress image before upload (client-side)
   */
  async compressImage(file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)

      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string

        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = height * (maxWidth / width)
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = width * (maxHeight / height)
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'))
                return
              }

              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })

              resolve(compressedFile)
            },
            file.type,
            quality
          )
        }

        img.onerror = () => {
          reject(new Error('Failed to load image'))
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
    })
  }

  /**
   * Get file icon based on type
   */
  getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'
    if (fileType.includes('zip') || fileType.includes('compressed')) return '🗜️'
    if (fileType.includes('text')) return '📃'
    return '📎'
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }
}

export const fileUploadService = new FileUploadService()

