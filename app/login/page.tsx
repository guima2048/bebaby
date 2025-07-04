'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { getFirestoreDB } from '@/lib/firebase'

interface LoginForm {
  identifier: string
  password: string
}

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors }, setError } = useForm<LoginForm>()
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function onSubmit(data: LoginForm) {
    setLoading(true)
    try {
      if (!auth) {
        toast.error('Serviço de autenticação indisponível. Tente novamente mais tarde.')
        setLoading(false)
        return
      }
      
      const db = getFirestoreDB()
      if (!db) {
        toast.error('Serviço de banco de dados indisponível. Tente novamente mais tarde.')
        setLoading(false)
        return
      }
      let email = data.identifier
      // Se não for e-mail, tenta buscar pelo nome de usuário
      if (!/^[^@]+@[^@]+\.[^@]+$/.test(data.identifier)) {
        const q = query(collection(db, 'users'), where('username', '==', data.identifier.toLowerCase()))
        const snap = await getDocs(q)
        if (snap.empty) {
          setError('identifier', { message: 'Usuário não encontrado' })
          setLoading(false)
          return
        }
        email = snap.docs[0].data().email
      }
      const userCredential = await signInWithEmailAndPassword(auth, email, data.password)
      
      // Registrar IP de login
      try {
        await fetch('/api/record-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userCredential.user.uid
          })
        })
      } catch (error) {
        console.error('Erro ao registrar IP de login:', error)
        // Não falha o login se não conseguir registrar o IP
      }
      
      toast.success('Login realizado!')
      router.push('/explore')
    } catch (err: any) {
      toast.error('Credenciais inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-100">
      {/* Imagem de fundo */}
      <div className="absolute inset-0 z-0">
        <img
          src="/landing/baby-1.png"
          alt="Banner Bebaby"
          className="w-full h-full object-cover object-center"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-pink-900/60" />
      </div>
      {/* Formulário centralizado */}
      <div className="relative z-10 w-full max-w-md mx-auto p-8 bg-white/90 rounded-xl shadow-2xl backdrop-blur-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-pink-700 drop-shadow">Entrar</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">E-mail ou Nome de Usuário</label>
          <input type="text" className="input-field" {...register('identifier', { required: 'Campo obrigatório' })} autoComplete="username" />
          {errors.identifier && <span className="text-red-500 text-sm">{errors.identifier.message}</span>}
        </div>
        <div>
          <label className="block mb-1 font-medium">Senha</label>
          <input type="password" className="input-field" {...register('password', { required: 'Campo obrigatório' })} autoComplete="current-password" />
          {errors.password && <span className="text-red-500 text-sm">{errors.password.message}</span>}
        </div>
        <button type="submit" className="btn-primary w-full mt-4" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p className="text-center text-secondary-600 mt-6">
        Não tem conta?{' '}
        <Link href="/register" className="underline text-primary-600">Cadastre-se</Link>
      </p>
      </div>
    </div>
  )
} 