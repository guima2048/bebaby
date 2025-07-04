'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  status: 'draft' | 'published' | 'scheduled'
  publishedAt?: string
  scheduledFor?: string
  createdAt: string
  updatedAt: string
  featuredImage?: string
  author: string
}

// Função utilitária para tratar datas do Firestore
function parseFirestoreDate(date: any): Date | null {
  if (!date) { return null; }
  if (typeof date === 'string' || typeof date === 'number') {
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof date === 'object' && 'seconds' in date) {
    return new Date(date.seconds * 1000);
  }
  return null;
}

function formatDate(date: any) {
  const d = parseFirestoreDate(date);
  if (!d) { return 'Data não definida'; }
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    status: 'draft' as 'draft' | 'published' | 'scheduled',
    scheduledFor: '',
    featuredImage: '',
    author: ''
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    console.log('[DEBUG] Chamando fetchPosts...')
    try {
      const response = await fetch('/api/blog')
      
      if (response.ok) {
        const posts = await response.json()
        setPosts(posts)
        console.log('[DEBUG] Posts carregados:', posts)
      } else {
        const errorText = await response.text()
        console.error('[DEBUG] Erro ao carregar posts (response not ok):', errorText)
        toast.error('Erro ao carregar posts')
      }
    } catch (error) {
      console.error('[DEBUG] Erro ao carregar posts (catch):', error)
      toast.error('Erro ao carregar posts')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.content) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (formData.status === 'scheduled' && !formData.scheduledFor) {
      toast.error('Selecione uma data para agendamento')
      return
    }

    try {
      const postData: any = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        status: formData.status,
        featuredImage: formData.featuredImage,
        author: formData.author
      }

      if (formData.status === 'scheduled' && formData.scheduledFor) {
        postData.scheduledFor = new Date(formData.scheduledFor).toISOString()
      }

      const response = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      })

      if (response.ok) {
        const newPost = await response.json()
        setPosts(prev => [newPost, ...prev])
        setShowForm(false)
        resetForm()
        toast.success('Post criado com sucesso')
      } else {
        let errorMsg = 'Erro ao criar post';
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) errorMsg = errorData.error;
        } catch {}
        toast.error(errorMsg)
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao criar post')
    }
  }

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingPost || !formData.title || !formData.content) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (formData.status === 'scheduled' && !formData.scheduledFor) {
      toast.error('Selecione uma data para agendamento')
      return
    }

    try {
      const postData: any = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        status: formData.status,
        featuredImage: formData.featuredImage,
        author: formData.author
      }

      if (formData.status === 'scheduled' && formData.scheduledFor) {
        postData.scheduledFor = new Date(formData.scheduledFor).toISOString()
      }

      const response = await fetch(`/api/blog/${editingPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      })

      if (response.ok) {
        const updatedPost = await response.json()
        setPosts(prev => prev.map(post => 
          post.id === editingPost.id ? updatedPost : post
        ))
        setShowForm(false)
        setEditingPost(null)
        resetForm()
        toast.success('Post atualizado com sucesso')
      } else {
        toast.error('Erro ao atualizar post')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao atualizar post')
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Tem certeza que deseja excluir este post?')) {
      return
    }

    try {
      const response = await fetch(`/api/blog/${postId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPosts(prev => prev.filter(post => post.id !== postId))
        toast.success('Post excluído com sucesso')
      } else {
        toast.error('Erro ao excluir post')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao excluir post')
    }
  }

  const handleEditPost = (post: BlogPost) => {
    console.log('[DEBUG] Editando post:', post)
    setEditingPost(post)
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      status: post.status,
      scheduledFor: post.scheduledFor ? new Date(post.scheduledFor).toISOString().slice(0, 16) : '',
      featuredImage: post.featuredImage || '',
      author: post.author || ''
    })
    setImagePreview(post.featuredImage && typeof post.featuredImage === 'string' && post.featuredImage.length > 0 ? post.featuredImage : null)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      status: 'draft',
      scheduledFor: '',
      featuredImage: '',
      author: ''
    })
    setImagePreview(null)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingPost(null)
    resetForm()
    setImagePreview(null)
  }

  const handleImageUpload = async (file: File) => {
    if (!file) { return; }

    // Validações
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Máximo 10MB.')
      return
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use JPG, PNG, WebP ou GIF.')
      return
    }

    setUploadingImage(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-blog-image', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setFormData(prev => ({ ...prev, featuredImage: result.url }))
        setImagePreview(result.url)
        toast.success('Imagem enviada com sucesso!')
      } else {
        let errorMsg = 'Erro ao enviar imagem';
        try {
          const error = await response.json();
          errorMsg = `[${response.status}] ${error.error || error.message || errorMsg}`;
        } catch (e) {
          errorMsg = `[${response.status}] Erro desconhecido do servidor`;
        }
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error('Erro ao enviar imagem')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const removeImage = () => {
    setFormData(prev => ({ ...prev, featuredImage: '' }))
    setImagePreview(null)
  }

  const getStatusBadge = (post: BlogPost) => {
    switch (post.status) {
      case 'published':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Publicado</span>
      case 'scheduled':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Agendado</span>
      default:
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Rascunho</span>
    }
  }

  const getDateDisplay = (post: BlogPost) => {
    if (post.status === 'scheduled' && post.scheduledFor) {
      return `Agendado para: ${formatDate(post.scheduledFor)}`
    }
    if (post.status === 'published' && post.publishedAt) {
      return `Publicado em: ${formatDate(post.publishedAt)}`
    }
    return `Atualizado em: ${formatDate(post.updatedAt)}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciar Blog</h1>
            <p className="text-gray-600 mt-2">Criar, editar e gerenciar posts do blog</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
          >
            + Novo Post
          </button>
        </div>
      </div>

      {/* Formulário de Criação/Edição */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingPost ? 'Editar Post' : 'Criar Novo Post'}
          </h2>
          
          <form onSubmit={editingPost ? handleUpdatePost : handleCreatePost}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' | 'scheduled' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="draft">Rascunho</option>
                  <option value="published">Publicado</option>
                  <option value="scheduled">Agendado</option>
                </select>
              </div>
            </div>

            {formData.status === 'scheduled' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data e Hora do Agendamento *
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledFor}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledFor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required={formData.status === 'scheduled'}
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foto de Capa
              </label>
              
              {/* Preview da imagem */}
              {(imagePreview || formData.featuredImage) && (
                <div className="mb-3">
                  <img
                    src={imagePreview || formData.featuredImage}
                    alt="Preview da imagem"
                    className="w-full max-w-md h-48 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Remover imagem
                  </button>
                </div>
              )}

              {/* Upload de arquivo */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fazer upload de arquivo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploadingImage}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                {uploadingImage && (
                  <p className="text-sm text-blue-600 mt-1">Enviando imagem...</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Formatos aceitos: JPG, PNG, WebP, GIF. Máximo 10MB.
                </p>
                {imagePreview ? (
                  <div className="mt-2 relative">
                    <img src={imagePreview} alt="Preview" className="h-32 rounded shadow border object-contain" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-1 right-1 bg-white border border-gray-300 rounded-full p-1 text-gray-600 hover:text-red-600"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mt-2">Nenhuma imagem selecionada para este post.</p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resumo
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Breve descrição do post..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conteúdo *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Conteúdo completo do post..."
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Autor *</label>
              <input
                type="text"
                value={formData.author}
                onChange={e => setFormData(prev => ({ ...prev, author: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
              >
                {editingPost ? 'Atualizar Post' : 'Criar Post'}
              </button>
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Posts */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Post
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{post.title}</div>
                      <div className="text-sm text-gray-500">{post.excerpt}</div>
                      <div className="text-xs text-gray-400">/{post.slug}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(post)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getDateDisplay(post)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditPost(post)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Excluir
                      </button>
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-900"
                      >
                        Ver
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {posts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum post encontrado.</p>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Total: {posts.length} post(s)
      </div>
    </div>
  )
} 