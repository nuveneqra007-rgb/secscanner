import client from './client'

export interface ScheduledScan {
  id: number
  target: string
  interval_hours: number
  is_active: boolean
  last_run_at: string | null
  created_at: string
}

export async function getScheduledScans(): Promise<ScheduledScan[]> {
  const { data } = await client.get('/scheduled-scans')
  return data
}

export async function createScheduledScan(body: { target: string, interval_hours: number }): Promise<ScheduledScan> {
  const { data } = await client.post('/scheduled-scans', body)
  return data
}

export async function deleteScheduledScan(id: number): Promise<void> {
  await client.delete(`/scheduled-scans/${id}`)
}

export async function toggleScheduledScan(id: number): Promise<ScheduledScan> {
  const { data } = await client.patch(`/scheduled-scans/${id}/toggle`)
  return data
}
