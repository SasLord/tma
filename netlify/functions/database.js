const Database = require('better-sqlite3')

// Путь к базе данных в временной директории Netlify
const DB_PATH = '/tmp/orders.db'

let db = null

// Инициализация базы данных
function initDatabase() {
  if (db) return db

  try {
    // Создаем базу данных
    db = new Database(DB_PATH)

    // Включаем WAL режим для лучшей производительности
    db.pragma('journal_mode = WAL')

    // Создаем таблицы
    createTables()

    console.log('✅ Database initialized successfully')
    return db
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

// Создание таблиц
function createTables() {
  // Таблица заказов
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      user_name TEXT,
      username TEXT,
      total_price INTEGER NOT NULL,
      platform TEXT,
      status TEXT DEFAULT 'new',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Таблица услуг в заказе
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      service_id TEXT NOT NULL,
      service_name TEXT NOT NULL,
      service_price INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders (id)
    )
  `)

  // Таблица администраторов
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE NOT NULL,
      user_name TEXT,
      username TEXT,
      added_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Добавляем первого администратора (ваш ID)
  const insertAdmin = db.prepare(`
    INSERT OR IGNORE INTO admins (user_id, user_name, username) 
    VALUES (?, ?, ?)
  `)
  insertAdmin.run('1155907659', 'Main Admin', 'admin')

  console.log('✅ Database tables created')
}

// Сохранение заказа
function saveOrder(orderData) {
  if (!db) initDatabase()

  const transaction = db.transaction(() => {
    // Вставляем заказ
    const insertOrder = db.prepare(`
      INSERT INTO orders (user_id, user_name, username, total_price, platform)
      VALUES (?, ?, ?, ?, ?)
    `)

    const user = orderData.user || {}
    const result = insertOrder.run(
      user.id?.toString() || 'unknown',
      `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown',
      user.username || null,
      orderData.totalPrice || 0,
      orderData.platform || 'unknown'
    )

    const orderId = result.lastInsertRowid

    // Вставляем услуги
    const insertService = db.prepare(`
      INSERT INTO order_services (order_id, service_id, service_name, service_price)
      VALUES (?, ?, ?, ?)
    `)

    for (const service of orderData.services || []) {
      insertService.run(orderId, service.id, service.name, service.price)
    }

    return orderId
  })()

  console.log(`✅ Order saved with ID: ${transaction}`)
  return transaction
}

// Получение всех заказов
function getAllOrders() {
  if (!db) initDatabase()

  const query = db.prepare(`
    SELECT 
      o.*,
      GROUP_CONCAT(
        os.service_name || ' - ' || os.service_price || '₽', 
        '\n'
      ) as services_list
    FROM orders o
    LEFT JOIN order_services os ON o.id = os.order_id
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `)

  return query.all()
}

// Получение заказа по ID
function getOrderById(orderId) {
  if (!db) initDatabase()

  const orderQuery = db.prepare('SELECT * FROM orders WHERE id = ?')
  const servicesQuery = db.prepare('SELECT * FROM order_services WHERE order_id = ?')

  const order = orderQuery.get(orderId)
  if (!order) return null

  const services = servicesQuery.all(orderId)
  return { ...order, services }
}

// Проверка, является ли пользователь администратором
function isAdmin(userId) {
  if (!db) initDatabase()

  const query = db.prepare('SELECT COUNT(*) as count FROM admins WHERE user_id = ?')
  const result = query.get(userId?.toString())
  return result.count > 0
}

// Добавление нового администратора
function addAdmin(userId, userName, username, addedBy) {
  if (!db) initDatabase()

  const insertAdmin = db.prepare(`
    INSERT OR REPLACE INTO admins (user_id, user_name, username, added_by)
    VALUES (?, ?, ?, ?)
  `)

  insertAdmin.run(userId?.toString(), userName, username, addedBy?.toString())
  console.log(`✅ Admin added: ${userId}`)
}

// Получение всех администраторов
function getAllAdmins() {
  if (!db) initDatabase()

  const query = db.prepare('SELECT * FROM admins ORDER BY created_at ASC')
  return query.all()
}

// Обновление статуса заказа
function updateOrderStatus(orderId, status) {
  if (!db) initDatabase()

  const query = db.prepare('UPDATE orders SET status = ? WHERE id = ?')
  const result = query.run(status, orderId)
  return result.changes > 0
}

// Закрытие базы данных (для очистки ресурсов)
function closeDatabase() {
  if (db) {
    db.close()
    db = null
    console.log('✅ Database closed')
  }
}

module.exports = {
  initDatabase,
  saveOrder,
  getAllOrders,
  getOrderById,
  isAdmin,
  addAdmin,
  getAllAdmins,
  updateOrderStatus,
  closeDatabase
}
