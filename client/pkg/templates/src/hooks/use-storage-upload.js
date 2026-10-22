import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'


function toAccept(allowedMimeTypes) {
  return Object.fromEntries(allowedMimeTypes.map((mimeType) => [mimeType, []]))
}

function toUploadFile(file, errors = []) {
  return {
    errors,
    file,
    name: file.name,
    preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
    size: file.size,
    type: file.type,
  }
}

async function uploadFile(file) {
  const body = new FormData()
  body.append('file', file.file)
  const response = await fetch(`${'/api'}/storage/upload`, {
    method: 'POST', credentials: 'include', body,
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message || 'Không thể tải ảnh lên.')
  return result
}

export function useStorageUpload({
  allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp'],
  maxFileSize = 4_000_000,
  maxFiles = 1,
}) {
  const [files, setFileState] = useState([])
  const [errors, setErrors] = useState([])
  const [loading, setLoading] = useState(false)
  const [successes, setSuccesses] = useState([])
  const [uploadedFiles, setUploadedFiles] = useState([])
  const filesRef = useRef([])

  const setFiles = useCallback((nextFiles) => {
    setFileState((currentFiles) => {
      const resolvedFiles = typeof nextFiles === 'function' ? nextFiles(currentFiles) : nextFiles
      const retainedPreviews = new Set(resolvedFiles.map((file) => file.preview).filter(Boolean))
      currentFiles.forEach((file) => {
        if (file.preview && !retainedPreviews.has(file.preview)) URL.revokeObjectURL(file.preview)
      })
      return resolvedFiles
    })
    setErrors([])
    setSuccesses([])
    setUploadedFiles([])
  }, [])

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    const nextFiles = [
      ...acceptedFiles.map((file) => toUploadFile(file)),
      ...rejectedFiles.map(({ errors: fileErrors, file }) => toUploadFile(file, fileErrors)),
    ]
    setFiles(nextFiles)
  }, [setFiles])

  const dropzone = useDropzone({
    accept: toAccept(allowedMimeTypes),
    maxFiles,
    maxSize: Math.min(maxFileSize, 4_000_000),
    multiple: maxFiles > 1,
    noClick: true,
    onDrop,
  })

  const onUpload = useCallback(async () => {
    const validFiles = files.filter((file) => file.errors.length === 0)
    if (!validFiles.length || loading) return

    setLoading(true)
    setErrors([])
    setSuccesses([])
    setUploadedFiles([])

    try {
      const results = await Promise.all(validFiles.map(async (selectedFile) => {
        try {
          return {
            success: await uploadFile(selectedFile),
          }
        } catch (error) {
          return { error: { message: error.message, name: selectedFile.name } }
        }
      }))

      setErrors(results.flatMap((result) => result.error ? [result.error] : []))
      const uploaded = results.flatMap((result) => result.success ? [result.success] : [])
      setSuccesses(uploaded.map((file) => file.originalName))
      setUploadedFiles(uploaded)
    } catch (cause) {
      setErrors(validFiles.map((file) => ({
        message: cause instanceof Error ? cause.message : 'Không thể tải ảnh lên.',
        name: file.name,
      })))
    } finally {
      setLoading(false)
    }
  }, [files, loading])

  useEffect(() => {
    filesRef.current = files
  }, [files])

  useEffect(() => () => {
    filesRef.current.forEach((file) => {
      if (file.preview) URL.revokeObjectURL(file.preview)
    })
  }, [])

  const isSuccess = useMemo(
    () => files.length > 0 && errors.length === 0 && successes.length === files.length,
    [errors.length, files.length, successes.length],
  )

  return {
    ...dropzone,
    errors,
    files,
    isSuccess,
    loading,
    maxFiles,
    maxFileSize: Math.min(maxFileSize, 4_000_000),
    onUpload,
    setErrors,
    setFiles,
    successes,
    uploadedFiles,
  }
}
