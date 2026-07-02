'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../utils/supabase/server'

export async function register(formData) {
  const supabase = await createClient()

  const email = formData.get('email')
  const password = formData.get('password')

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Si la sesión es nula significa que Supabase requiere verificación de correo
  if (data?.user && data?.session === null) {
    return { success: true, message: '¡Registro exitoso! Revisa tu bandeja de entrada para verificar tu cuenta.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
