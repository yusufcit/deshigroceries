'use client'

import { useCallback, useRef, useState } from 'react'
import { UploadCloud, CheckCircle2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

/** Must mirror the server-side rules in src/lib/supabase/storage.ts. */
const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const MAX_MB = 10

interface PendingUpload {
  /** Local object URL for the preview */
  previewUrl: string
  progress: number
}

/**
 * Uploads a single product image DIRECTLY to Supabase Storage.
 *
 * Flow: file → POST /api/admin/uploads/presign (admin-only) → short-lived
 * signed URL → XHR PUT straight to Supabase → onChange(publicUrl).
 * The image bytes never pass through the Next.js server.
 */
export function ProductImageUpload({
  value,
  onChange,
}: {
  /** Current public URL from a previous upload (or null). */
  value: string | null
  onChange: (publicUrl: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<PendingUpload | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const upload = useCallback(
    async (file: File) => {
      if (!ACCEPTED_MIME.includes(file.type)) {
        toast.error('Unsupported file type. Use JPG, PNG, WebP or AVIF.')
        return
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        toast.error(`File is too large. Maximum is ${MAX_MB} MB.`)
        return
      }

      const previewUrl = URL.createObjectURL(file)
      setPending({ previewUrl, progress: 0 })

      try {
        const res = await fetch('/api/admin/uploads/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentType: file.type, size: file.size }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Failed to prepare upload')

        // PUT the file bytes directly to Supabase Storage (progress via XHR).
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('PUT', data.signedUrl)
          xhr.setRequestHeader('Content-Type', file.type)
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setPending({ previewUrl, progress: Math.round((e.loaded / e.total) * 100) })
            }
          }
          xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Upload failed')))
          xhr.onerror = () => reject(new Error('Network error during upload'))
          xhr.send(file)
        })

        onChange(data.publicUrl)
        toast.success('Image uploaded')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Upload failed')
      } finally {
        URL.revokeObjectURL(previewUrl)
        setPending(null)
      }
    },
    [onChange]
  )

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const file = Array.from(files)[0]
      if (file) void upload(file)
    },
    [upload]
  )
return (
    <div>
      {value ? (
        /* Already uploaded — show preview + remove/replace */
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Uploaded product" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary)]">
              <CheckCircle2 className="h-4 w-4" /> Uploaded
            </p>
            <p className="mt-0.5 truncate text-xs text-gray-500" title={value}>
              {value}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-xs font-semibold text-[var(--primary)] hover:underline"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : pending ? (
        /* Uploading — preview + progress */
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pending.previewUrl} alt="Uploading preview" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="text-xs font-bold text-white">{pending.progress}%</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-[var(--primary)] transition-all"
                style={{ width: `${pending.progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">Uploading to Supabase… {pending.progress}%</p>
          </div>
        </div>
      ) : (
        /* Drop zone */
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
            isDragging
              ? 'border-[var(--primary)] bg-[var(--primary-lighter)]'
              : 'border-gray-300 hover:border-[var(--primary)] hover:bg-gray-50'
          }`}
        >
          <UploadCloud className="mb-2 h-8 w-8 text-[var(--primary)]" />
          <p className="text-sm font-medium text-gray-700">
            Drag &amp; drop an image here, or{' '}
            <span className="font-semibold text-[var(--primary)]">browse files</span>
          </p>
          <p className="mt-1 text-xs text-gray-400">JPG, PNG, WebP or AVIF — up to {MAX_MB} MB</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
      )}
    </div>
  )
}