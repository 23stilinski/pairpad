'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Image {
  id: string
  image: string
  is_primary: boolean
  image_type?: string
  caption?: string
}

interface ImageGalleryProps {
  images: Image[]
  spaceName: string
  isOwner: boolean
  onImageManager: () => void
  onImageGallery: (index?: number) => void
}

export default function ImageGallery({
  images,
  spaceName,
  isOwner,
  onImageManager,
  onImageGallery
}: ImageGalleryProps) {
  return (
    <>
      {/* Primary Image Section */}
      <Card className="mb-6 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Primary Photo</CardTitle>
          {isOwner && (
            <Button
              onClick={onImageManager}
              variant="outline"
              size="sm"
            >
              Manage Images
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-6">
          {images && images.length > 0 ? (
            <div className="relative">
              {/* Primary Image Display */}
              <div className="relative w-full h-96 bg-gray-100 rounded-2xl overflow-hidden">
                <img
                  src={images.find(img => img.is_primary)?.image || images[0]?.image}
                  alt={spaceName}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => onImageGallery()}
                />

                {/* View Gallery overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer"
                     onClick={() => onImageGallery()}>
                  <div className="bg-white bg-opacity-95 text-[#484848] px-6 py-3 rounded-xl font-medium shadow-lg">
                    🔍 View Full Gallery ({images.length} photos)
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-96 bg-gray-100 rounded-2xl flex items-center justify-center">
              <div className="text-center text-gray-500">
                <svg className="mx-auto h-16 w-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-semibold mb-2">No photos yet</p>
                <p className="text-sm mb-4">Upload photos to showcase your space</p>
                {isOwner && (
                  <button
                    onClick={onImageManager}
                    className="bg-[#5d41ab] text-white px-6 py-3 rounded-xl hover:bg-[#4c2d87] transition-colors font-medium"
                  >
                    Upload Photos
                  </button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Gallery Section */}
      {images && images.length > 0 && (
        <Card className="mb-6 overflow-hidden">
          <CardHeader>
            <CardTitle>Photo Gallery ({images.length} photos)</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className="relative group cursor-pointer"
                  onClick={() => onImageGallery(index)}
                >
                  <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                    <img
                      src={image.image}
                      alt={`${spaceName} - Photo ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Primary badge */}
                    {image.is_primary && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                        Primary
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="bg-white bg-opacity-95 text-[#484848] px-3 py-2 rounded-lg font-medium text-sm">
                        View
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() => onImageGallery()}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
              >
                <span>View Gallery</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M7 7l10 10M17 7v4M17 7h-4" />
                </svg>
              </button>
              {isOwner && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageManager();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
                >
                  <span>Manage</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}