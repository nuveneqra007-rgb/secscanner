import client from './client'
import type { Scan, ScanCreate, PaginatedScans } from '../types'

export async function createScan(body: ScanCreate): Promise<Scan> {
  const { data } = await client.post('/scans', body)
  return data
}

export async function getScan(id: number): Promise<Scan> {
  const { data } = await client.get(`/scans/${id}`)
  return data
}

export async function getScans(page = 1, pageSize = 10): Promise<PaginatedScans> {
  const { data } = await client.get('/scans', { params: { page, page_size: pageSize } })
  return data
}

export async function deleteScan(id: number): Promise<void> {
  await client.delete(`/scans/${id}`)
}

export async function getScanStats(): Promise<any[]> {
  const { data } = await client.get('/scans/stats')
  return data
}
