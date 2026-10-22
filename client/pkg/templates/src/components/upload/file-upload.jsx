/* eslint-disable react/prop-types */

import { useEffect, useMemo, useRef } from 'react'

import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/upload/dropzone'
import { useStorageUpload } from '@/hooks/use-storage-upload'

export function FileUpload({
  allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'],
  autoUpload = false,
  className,
  maxFiles = 1,
  maxFileSize = 4_000_000,
  onUploadComplete,
  render,
}) {
  const upload = useStorageUpload({
    allowedMimeTypes,
    maxFiles,
    maxFileSize,
  })
  const {
    errors,
    files,
    isSuccess,
    loading,
    onUpload,
    successes,
    uploadedFiles,
  } = upload
  const completedFilesRef = useRef('')
  const hasFileErrors = useMemo(
    () => files.some((file) => file.errors.length > 0),
    [files],
  )

  useEffect(() => {
    if (!autoUpload || loading || files.length === 0 || hasFileErrors) return
    if (errors.length > 0 || successes.length >= files.length) return
    void onUpload()
  }, [
    autoUpload,
    errors.length,
    files.length,
    hasFileErrors,
    loading,
    onUpload,
    successes.length,
  ])

  useEffect(() => {
    if (!onUploadComplete || !isSuccess || files.length === 0) return
    const completionKey = uploadedFiles.map((file) => file.path).join('|')
    if (completedFilesRef.current === completionKey) return

    const publicUrls = uploadedFiles.map((file) => file.url).filter(Boolean)

    onUploadComplete(publicUrls, uploadedFiles)
    completedFilesRef.current = completionKey
  }, [files.length, isSuccess, onUploadComplete, uploadedFiles])

  if (render) {
    return (
      <div className={className ?? 'w-full'}>
        <input className="sr-only" {...upload.getInputProps()} />
        {render(upload)}
      </div>
    )
  }

  return (
    <div className={className ?? 'w-full'}>
      <Dropzone {...upload}>
        <DropzoneEmptyState />
        <DropzoneContent />
      </Dropzone>
    </div>
  )
}

export const FileUploadDemo = FileUpload
