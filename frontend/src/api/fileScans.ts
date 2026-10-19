import client from './client'
import type { FileScan, PaginatedFileScans } from '../types'

export async function createFileScan(file: File): Promise<FileScan> {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await client.post('/file-scans', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return data
}

export async function getFileScan(id: number): Promise<FileScan> {
  const { data } = await client.get(`/file-scans/${id}`)
  return data
}

export async function getFileScans(page = 1, pageSize = 10): Promise<PaginatedFileScans> {
  const { data } = await client.get('/file-scans', { params: { page, page_size: pageSize } })
  return data
}

export async function deleteFileScan(id: number): Promise<void> {
  await client.delete(`/file-scans/${id}`)
}
