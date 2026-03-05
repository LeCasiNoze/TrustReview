import { createSupabaseServer } from './supabase-server'
import { redirect } from 'next/navigation'

export async function getUserServer() {
  const supabase = await createSupabaseServer()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

export async function requireUserServer() {
  const user = await getUserServer()
  
  if (!user) {
    redirect('/login')
  }
  
  return user
}
