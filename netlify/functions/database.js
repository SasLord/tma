import { supabase, initializeTables } from './supabase-config.js'

// Инициализация базы данных
export async function initDatabase() {
  try {
    console.log('🔧 Initializing Supabase database connection...')

    // Инициализируем таблицы
    const initialized = await initializeTables()

    if (initialized) {
      console.log('✅ Supabase database initialized successfully')
    } else {
      console.log('⚠️ Supabase database initialization completed with warnings')
    }

    return true
  } catch (error) {
    console.error('❌ Failed to initialize database:', error)
    return false
  }
}

// Сохранение заказа
export async function saveOrder(orderData) {
  try {
    await initDatabase()

    const user = orderData.user || {}
    const orderRecord = {
      user_id: user.id?.toString() || 'unknown',
      user_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown',
      username: user.username || null,
      total_price: orderData.totalPrice || 0,
      platform: orderData.platform || 'unknown',
      status: 'new',
      services: orderData.services || []
    }

    const { data, error } = await supabase.from('orders').insert(orderRecord).select().single()

    if (error) {
      console.error('❌ Error saving order to Supabase:', error)
      throw error
    }

    console.log(`✅ Order saved to Supabase with ID: ${data.id}`)
    return data.id
  } catch (error) {
    console.error('❌ Failed to save order:', error)
    throw error
  }
}

// Получение всех заказов
export async function getAllOrders() {
  try {
    await initDatabase()

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching orders from Supabase:', error)
      throw error
    }

    console.log(`📊 Found ${data.length} orders in Supabase`)
    return data || []
  } catch (error) {
    console.error('❌ Failed to get orders:', error)
    return []
  }
}

// Получение заказа по ID
export async function getOrderById(orderId) {
  try {
    await initDatabase()

    const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`📝 Order ${orderId} not found`)
        return null
      }
      console.error('❌ Error fetching order from Supabase:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('❌ Failed to get order by ID:', error)
    return null
  }
}

// Очистка всех заказов
export async function clearAllOrders() {
  try {
    await initDatabase()

    // Сначала получаем количество записей
    const { count, error: countError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Error counting orders:', countError)
      throw countError
    }

    // Удаляем все записи
    const { error } = await supabase.from('orders').delete().neq('id', 0) // Удаляем все записи

    if (error) {
      console.error('❌ Error clearing orders from Supabase:', error)
      throw error
    }

    console.log(`✅ Cleared ${count || 0} orders from Supabase`)
    return { success: true, cleared: count || 0 }
  } catch (error) {
    console.error('❌ Failed to clear orders:', error)
    return { success: false, error: error.message }
  }
}

// Проверка, является ли пользователь администратором
export async function isAdmin(userId) {
  try {
    if (!userId) return false

    await initDatabase()

    const userIdStr = userId.toString()

    const { data, error } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', userIdStr)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`📝 Admin check: User ${userIdStr} not found`)
        return false
      }
      console.error('❌ Error checking admin status:', error)
      return false
    }

    const isAdminUser = !!data
    console.log(`📊 Admin check for user ${userIdStr}: ${isAdminUser}`)
    return isAdminUser
  } catch (error) {
    console.error('❌ Failed to check admin status:', error)
    return false
  }
}

// Получение всех администраторов
export async function getAllAdmins() {
  try {
    await initDatabase()

    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching admins from Supabase:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('❌ Failed to get admins:', error)
    return []
  }
}

// Добавление нового администратора
export async function addAdmin(userId, userName, username, addedBy) {
  try {
    await initDatabase()

    const userIdStr = userId?.toString()
    if (!userIdStr) {
      throw new Error('User ID is required')
    }

    // Проверяем, не существует ли уже такой администратор
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', userIdStr)
      .single()

    if (existingAdmin) {
      console.log(`⚠️ Admin ${userIdStr} already exists`)
      return null // Администратор уже существует
    }

    // Добавляем нового администратора
    const { data, error } = await supabase
      .from('admins')
      .insert({
        user_id: userIdStr,
        name: userName || `Admin ${userIdStr}`,
        username: username || null,
        is_super_admin: userIdStr === '1155907659'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error adding admin to Supabase:', error)
      throw error
    }

    console.log(`✅ Admin ${userIdStr} added to Supabase`)
    return data
  } catch (error) {
    console.error('❌ Failed to add admin:', error)
    return null
  }
}

// Удаление администратора
export async function removeAdmin(userId, removedBy) {
  try {
    await initDatabase()

    const userIdStr = userId?.toString()
    if (!userIdStr) {
      throw new Error('User ID is required')
    }

    // Нельзя удалить супер-администратора
    if (userIdStr === '1155907659') {
      return { success: false, error: 'Cannot remove super admin' }
    }

    const { error } = await supabase.from('admins').delete().eq('user_id', userIdStr)

    if (error) {
      console.error('❌ Error removing admin from Supabase:', error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Admin ${userIdStr} removed from Supabase`)
    return { success: true, deleted: true }
  } catch (error) {
    console.error('❌ Failed to remove admin:', error)
    return { success: false, error: error.message }
  }
}

// Обновление администратора
export async function updateAdmin(userId, updates, updatedBy) {
  try {
    await initDatabase()

    const userIdStr = userId?.toString()
    if (!userIdStr) {
      throw new Error('User ID is required')
    }

    const { data, error } = await supabase
      .from('admins')
      .update({
        name: updates.name,
        username: updates.username,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userIdStr)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating admin in Supabase:', error)
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: 'Admin not found' }
    }

    console.log(`✅ Admin ${userIdStr} updated in Supabase`)
    return { success: true, updated: true, data }
  } catch (error) {
    console.error('❌ Failed to update admin:', error)
    return { success: false, error: error.message }
  }
}

// Обновление статуса заказа
export async function updateOrderStatus(orderId, status) {
  try {
    await initDatabase()

    const { data, error } = await supabase
      .from('orders')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating order status in Supabase:', error)
      return false
    }

    console.log(`✅ Order ${orderId} status updated to: ${status}`)
    return true
  } catch (error) {
    console.error('❌ Failed to update order status:', error)
    return false
  }
}

// Закрытие базы данных (не нужно для Supabase)
export function closeDatabase() {
  console.log('✅ Supabase connection closed (no-op)')
}

// Функция проверки, является ли пользователь супер-администратором
export async function isSuperAdmin(userId) {
  try {
    if (!userId) return false

    await initDatabase()

    const userIdStr = userId.toString()

    const { data, error } = await supabase
      .from('admins')
      .select('is_super_admin')
      .eq('user_id', userIdStr)
      .single()

    if (error) {
      console.log(`📝 Super admin check: User ${userIdStr} not found`)
      return false
    }

    return data?.is_super_admin === true
  } catch (error) {
    console.error('❌ Failed to check super admin status:', error)
    return false
  }
}
