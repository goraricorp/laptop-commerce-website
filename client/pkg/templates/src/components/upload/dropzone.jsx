/* eslint-disable react/prop-types, react-refresh/only-export-components */

import { createContext, useCallback, useContext } from 'react'
import { CheckCircle, File, Upload, X } from 'lucide-react'

import { Spinner } from '@/components/element/spinner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const DropzoneContext = createContext(null)

export function formatBytes(bytes, decimals = 2) {
  if (!bytes) return '0 byte'
  const units = ['byte', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1000)), units.length - 1)
  return `${Number.parseFloat((bytes / (1000 ** index)).toFixed(Math.max(decimals, 0)))} ${units[index]}`
}

export function Dropzone({ children, className, getInputProps, getRootProps, ...upload }) {
  const invalid = (upload.isDragActive && upload.isDragReject)
    || (upload.errors.length > 0 && !upload.isSuccess)
    || upload.files.some((file) => file.errors.length > 0)

  return (
    <DropzoneContext.Provider value={upload}>
      <div
        {...getRootProps({
          className: cn(
            'rounded-lg border-2 border-dashed bg-card p-6 text-center text-foreground transition-colors',
            upload.isSuccess && 'border-solid border-primary',
            upload.isDragActive && 'border-primary bg-primary/10',
            invalid && 'border-destructive bg-destructive/10',
            className,
          ),
        })}
      >
        <input {...getInputProps()} />
        {children}
      </div>
    </DropzoneContext.Provider>
  )
}

export function DropzoneContent({ className }) {
  const {
    errors,
    files,
    isSuccess,
    loading,
    maxFiles,
    maxFileSize,
    onUpload,
    setFiles,
    successes,
  } = useDropzoneContext()
  const exceedMaxFiles = files.length > maxFiles

  const removeFile = useCallback((fileName) => {
    setFiles(files.filter((file) => file.name !== fileName))
  }, [files, setFiles])

  if (isSuccess) {
    return (
      <div className={cn('flex items-center justify-center gap-2', className)}>
        <CheckCircle className="size-4 text-primary" />
        <p className="text-sm text-primary">Đã tải lên {files.length} ảnh thành công</p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {files.map((file) => {
        const uploadError = errors.find((error) => error.name === file.name)
        const uploaded = successes.includes(file.name)

        return (
          <div className="flex items-center gap-4 border-b py-3 first:mt-4 last:mb-4" key={file.name}>
            {file.type.startsWith('image/') ? (
              <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                <img alt={file.name} className="size-full object-cover" src={file.preview} />
              </div>
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted">
                <File className="size-4" />
              </div>
            )}

            <div className="flex min-w-0 grow flex-col items-start">
              <p className="max-w-full truncate text-sm" title={file.name}>{file.name}</p>
              {file.errors.length > 0 ? (
                <p className="text-left text-xs text-destructive">
                  {file.errors.map((error) => error.code === 'file-too-large'
                    ? `Ảnh vượt quá ${formatBytes(maxFileSize)} (hiện tại ${formatBytes(file.size)})`
                    : error.message).join(', ')}
                </p>
              ) : loading && !uploaded ? (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Spinner className="size-3" />Đang tải ảnh lên…</p>
              ) : uploadError ? (
                <p className="text-left text-xs text-destructive">Tải ảnh thất bại: {uploadError.message}</p>
              ) : uploaded ? (
                <p className="text-xs text-primary">Đã tải ảnh lên</p>
              ) : (
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              )}
            </div>

            {!loading && !uploaded ? (
              <Button
                aria-label={`Xóa ${file.name}`}
                className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => removeFile(file.name)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
        )
      })}

      {exceedMaxFiles ? (
        <p className="mt-2 text-left text-sm text-destructive">
          Chỉ được chọn tối đa {maxFiles} ảnh. Vui lòng bỏ bớt {files.length - maxFiles} ảnh.
        </p>
      ) : null}

      {files.length > 0 && !exceedMaxFiles ? (
        <Button
          className="mt-2 self-center"
          disabled={files.some((file) => file.errors.length > 0) || loading}
          onClick={() => void onUpload()}
          type="button"
          variant="outline"
        >
          {loading ? <Spinner className="size-4" /> : <Upload className="size-4" />}
          {loading ? 'Đang tải lên…' : 'Tải ảnh lên'}
        </Button>
      ) : null}
    </div>
  )
}

export function DropzoneEmptyState({ className }) {
  const { isSuccess, maxFiles, maxFileSize, open } = useDropzoneContext()
  if (isSuccess) return null

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <Upload className="size-5 text-muted-foreground" />
      <p className="text-sm">Tải lên {maxFiles > 1 ? `tối đa ${maxFiles} ảnh` : 'một ảnh'}</p>
      <div className="flex flex-col items-center gap-1">
        <p className="text-xs text-muted-foreground">
          Kéo thả hoặc{' '}
          <button className="cursor-pointer underline transition hover:text-foreground" onClick={open} type="button">
            chọn ảnh
          </button>
        </p>
        {maxFileSize !== Number.POSITIVE_INFINITY ? (
          <p className="text-xs text-muted-foreground">Dung lượng tối đa: {formatBytes(maxFileSize)}</p>
        ) : null}
      </div>
    </div>
  )
}

export function useDropzoneContext() {
  const context = useContext(DropzoneContext)
  if (!context) throw new Error('Các thành phần vùng tải ảnh phải nằm trong Dropzone.')
  return context
}
