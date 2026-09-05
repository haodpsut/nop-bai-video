import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Client dùng riêng phía server.
 *
 * Cả ứng dụng đọc và ghi qua đây nên trình duyệt không bao giờ giữ key,
 * và cũng không cần cấu hình URL công khai cho môi trường docker.
 * service_role bỏ qua RLS, vì vậy tuyệt đối không import file này
 * vào bất kỳ component nào có chỉ thị 'use client'.
 */
let client: SupabaseClient | null = null

export function db(): SupabaseClient {
  if (client) return client

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY. ' +
        'Sao chép .env.example thành .env.local rồi chạy lại.'
    )
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'public' },
  })
  return client
}

/** Ném lỗi kèm ngữ cảnh thay vì trả về mảng rỗng im lặng. */
export async function lay<T>(
  moTa: string,
  truyVan: PromiseLike<{ data: T | null; error: { message: string } | null }>
): Promise<T> {
  const { data, error } = await truyVan
  if (error) throw new Error(`${moTa}: ${error.message}`)
  return (data ?? []) as T
}
