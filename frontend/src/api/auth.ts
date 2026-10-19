import client from './client'
import type { LoginResponse, User, RegisterRequest } from '../types'

export async function login(username: string, password: string): Promise<LoginResponse> {
  const { data } = await client.post('/auth/login', { username, password })
  return data
}

export async function register(body: RegisterRequest): Promise<User> {
  const { data } = await client.post('/auth/register', body)
  return data
}

export async function getMe(): Promise<User> {
  const { data } = await client.get('/auth/me')
  return data
}
