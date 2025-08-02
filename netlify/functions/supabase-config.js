import { createClient } from '@supabase/supabase-js'

// Конфигурация Supabase
const SUPABASE_URL = 'https://haxfixzzcomsayyajyuq.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhheGZpeHp6Y29tc2F5eWFqeXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NzE5NjcsImV4cCI6MjA2ODQ0Nzk2N30.n1CIoeMGNXfwMCcYRe5ryUMn6VjAu6MHQ1rw2wDoFpM'
const SUPABASE_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhheGZpeHp6Y29tc2F5eWFqeXVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg3MTk2NywiZXhwIjoyMDY4NDQ3OTY3fQ.gty92p5RJpCTgEbHMFTqGap-jJpUsfq0T08lj3lIPqI'

// Создаем клиент с service_role для администраторских операций
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Функция для инициализации таблиц
export async function initializeTables() {
  try {
    console.log('🔧 Initializing Supabase tables...')

    // Проверяем существование таблицы orders
    const { error: ordersError } = await supabase.from('orders').select('id').limit(1)

    if (ordersError && ordersError.code === 'PGRST116') {
      console.log('⚠️ Orders table does not exist. Please run the SQL setup script in Supabase.')
    } else if (ordersError) {
      console.error('❌ Error checking orders table:', ordersError)
    } else {
      console.log('✅ Orders table exists')
    }

    // Проверяем существование таблицы admins
    const { error: adminsError } = await supabase.from('admins').select('id').limit(1)

    if (adminsError && adminsError.code === 'PGRST116') {
      console.log('⚠️ Admins table does not exist. Please run the SQL setup script in Supabase.')
    } else if (adminsError) {
      console.error('❌ Error checking admins table:', adminsError)
    } else {
      console.log('✅ Admins table exists')
      // Добавляем супер-администратора, если его нет
      await ensureSuperAdmin()
    }

    return true
  } catch (error) {
    console.error('❌ Failed to initialize tables:', error)
    return false
  }
}

// Функция для обеспечения существования супер-администратора
async function ensureSuperAdmin() {
  const SUPER_ADMIN_ID = '1155907659'

  try {
    const { data: existingAdmin, error } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', SUPER_ADMIN_ID)
      .single()

    if (error && error.code === 'PGRST116') {
      // Таблица не существует, создаем SQL для неё
      return
    }

    if (!existingAdmin) {
      const { error: insertError } = await supabase.from('admins').insert({
        user_id: SUPER_ADMIN_ID,
        name: 'Super Admin',
        username: 'super_admin',
        is_super_admin: true,
        created_at: new Date().toISOString()
      })

      if (insertError) {
        console.error('❌ Error creating super admin:', insertError)
      } else {
        console.log('✅ Super admin created')
      }
    } else {
      console.log('✅ Super admin already exists')
    }
  } catch (error) {
    console.error('❌ Error ensuring super admin:', error)
  }
}
