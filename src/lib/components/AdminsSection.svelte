<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  interface Admin {
    id: string
    name: string
    username: string | null
    is_super_admin: boolean
    created_at: string
  }

  interface User {
    id: number
    first_name: string
    last_name?: string
    username?: string
  }

  export let admins: Admin[] = []
  export let currentUser: User | null = null
  export let loading = false
  export let isSuperAdmin = false

  // Форма добавления администратора
  let newAdminId = ''
  let newAdminName = ''
  let newAdminUsername = ''
  let addingAdmin = false

  // Редактирование администратора
  let editingAdmin: Admin | null = null
  let editName = ''
  let editUsername = ''

  function refreshAdmins() {
    dispatch('refresh')
  }

  async function addAdmin() {
    if (!newAdminId.trim()) {
      alert('Введите ID пользователя')
      return
    }

    addingAdmin = true
    try {
      await dispatch('addAdmin', {
        targetUserId: newAdminId.trim(),
        targetUserName: newAdminName.trim() || 'Unknown',
        targetUsername: newAdminUsername.trim() || null
      })

      // Очищаем форму после успешного добавления
      newAdminId = ''
      newAdminName = ''
      newAdminUsername = ''
    } finally {
      addingAdmin = false
    }
  }

  function startEdit(admin: Admin) {
    editingAdmin = admin
    editName = admin.name
    editUsername = admin.username || ''
  }

  function cancelEdit() {
    editingAdmin = null
    editName = ''
    editUsername = ''
  }

  async function saveEdit() {
    if (!editingAdmin) return

    try {
      await dispatch('updateAdmin', {
        targetUserId: editingAdmin.id,
        updates: {
          name: editName.trim() || 'Unknown',
          username: editUsername.trim() || null
        }
      })
      cancelEdit()
    } catch (error) {
      console.error('Error updating admin:', error)
    }
  }

  async function removeAdmin(admin: Admin) {
    if (admin.is_super_admin) {
      alert('Нельзя удалить супер-администратора!')
      return
    }

    if (confirm(`Вы уверены, что хотите удалить администратора "${admin.name}"?`)) {
      try {
        await dispatch('removeAdmin', { targetUserId: admin.id })
      } catch (error) {
        console.error('Error removing admin:', error)
      }
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function isCurrentUser(admin: Admin): boolean {
    return currentUser ? admin.id === currentUser.id.toString() : false
  }
</script>

<div class="admins-section">
  <div class="section-header">
    <h3>👥 Администраторы ({admins.length})</h3>
    <button class="refresh-button" on:click={refreshAdmins} disabled={loading}>
      {loading ? '⏳' : '🔄'}
      {loading ? 'Загрузка...' : 'Обновить'}
    </button>
  </div>

  <!-- Информация о текущем пользователе -->
  {#if currentUser}
    <div class="current-user-info">
      <h4>👤 Ваш профиль</h4>
      <p><strong>Имя:</strong> {currentUser.first_name} {currentUser.last_name || ''}</p>
      <p><strong>ID:</strong> {currentUser.id}</p>
      {#if currentUser.username}
        <p><strong>Username:</strong> @{currentUser.username}</p>
      {/if}
      <p><strong>Статус:</strong> {isSuperAdmin ? '🟢 Супер-администратор' : '🔵 Администратор'}</p>
    </div>
  {/if}

  <!-- Форма добавления нового администратора (только для супер-админа) -->
  {#if isSuperAdmin}
    <div class="add-admin">
      <h4>➕ Добавить администратора</h4>
      <div class="form-group">
        <label for="adminId">ID пользователя Telegram *</label>
        <input
          type="text"
          id="adminId"
          bind:value={newAdminId}
          placeholder="123456789"
          disabled={addingAdmin}
        />
      </div>
      <div class="form-group">
        <label for="adminName">Имя</label>
        <input
          type="text"
          id="adminName"
          bind:value={newAdminName}
          placeholder="Иван Иванов"
          disabled={addingAdmin}
        />
      </div>
      <div class="form-group">
        <label for="adminUsername">Username (без @)</label>
        <input
          type="text"
          id="adminUsername"
          bind:value={newAdminUsername}
          placeholder="username"
          disabled={addingAdmin}
        />
      </div>
      <button class="add-button" on:click={addAdmin} disabled={addingAdmin || !newAdminId.trim()}>
        {addingAdmin ? 'Добавление...' : 'Добавить администратора'}
      </button>
    </div>
  {/if}

  <!-- Список администраторов -->
  {#if loading}
    <div class="loading-state">
      <p>Загрузка администраторов...</p>
    </div>
  {:else if admins.length === 0}
    <div class="empty-admins">
      <p>Нет администраторов</p>
    </div>
  {:else}
    <div class="admins-list">
      {#each admins as admin (admin.id)}
        <div class="admin-card" class:current-user={isCurrentUser(admin)}>
          <div class="admin-header">
            <div class="admin-info">
              <div class="admin-name">
                {#if editingAdmin?.id === admin.id}
                  <input
                    type="text"
                    bind:value={editName}
                    class="edit-input"
                    placeholder="Имя администратора"
                  />
                {:else}
                  <span class="name">{admin.name}</span>
                  {#if admin.is_super_admin}
                    <span class="super-admin-badge">👑 Супер-админ</span>
                  {/if}
                  {#if isCurrentUser(admin)}
                    <span class="current-user-badge">👤 Это вы</span>
                  {/if}
                {/if}
              </div>
              <div class="admin-details">
                <strong>🆔 ID:</strong>
                {admin.id}<br />
                {#if editingAdmin?.id === admin.id}
                  <strong>👤 Username:</strong>
                  <input
                    type="text"
                    bind:value={editUsername}
                    class="edit-input small"
                    placeholder="username"
                  />
                {:else}
                  <strong>👤 Username:</strong>
                  {admin.username ? `@${admin.username}` : 'Не указан'}<br />
                {/if}
                <strong>📅 Добавлен:</strong>
                {formatDate(admin.created_at)}
              </div>
            </div>

            <div class="admin-actions">
              {#if editingAdmin?.id === admin.id}
                <button class="save-button" on:click={saveEdit}>✅ Сохранить</button>
                <button class="cancel-button" on:click={cancelEdit}>❌ Отмена</button>
              {:else if isSuperAdmin && !admin.is_super_admin}
                <button class="edit-button" on:click={() => startEdit(admin)}>✏️ Изменить</button>
                <button class="remove-button" on:click={() => removeAdmin(admin)}>🗑️ Удалить</button
                >
              {:else if !admin.is_super_admin && isCurrentUser(admin)}
                <button class="edit-button" on:click={() => startEdit(admin)}>✏️ Изменить</button>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  .admins-section {
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h3 {
        margin: 0;
        color: var(--tg-theme-text-color, #000);
      }

      .refresh-button {
        background: var(--tg-theme-secondary-bg-color, #f5f5f5);
        border: 1px solid var(--tg-theme-hint-color, #ccc);
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        color: var(--tg-theme-text-color, #000);
        transition: all 0.3s ease;

        &:hover:not(:disabled) {
          background: var(--tg-theme-hint-color, #e0e0e0);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }
    }
  }

  .current-user-info {
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    padding: 20px;
    border-radius: 12px;
    border: 1px solid var(--tg-theme-hint-color, #ccc);
    margin-bottom: 20px;

    h4 {
      margin: 0 0 15px 0;
      color: var(--tg-theme-text-color, #000);
    }

    p {
      margin: 5px 0;
      color: var(--tg-theme-text-color, #000);
    }
  }

  .add-admin {
    background: var(--tg-theme-bg-color, #fff);
    padding: 20px;
    border-radius: 12px;
    border: 1px solid var(--tg-theme-hint-color, #ccc);
    margin-bottom: 20px;

    h4 {
      margin: 0 0 20px 0;
      color: var(--tg-theme-text-color, #000);
    }

    .form-group {
      margin-bottom: 15px;

      label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: var(--tg-theme-text-color, #000);
      }

      input {
        width: 100%;
        padding: 10px;
        border: 1px solid var(--tg-theme-hint-color, #ccc);
        border-radius: 8px;
        font-size: 16px;
        background: var(--tg-theme-bg-color, #fff);
        color: var(--tg-theme-text-color, #000);

        &:focus {
          outline: none;
          border-color: var(--tg-theme-link-color, #007acc);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }
    }

    .add-button {
      background: var(--tg-theme-link-color, #007acc);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover:not(:disabled) {
        opacity: 0.9;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }

  .loading-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--tg-theme-hint-color, #666);
  }

  .empty-admins {
    text-align: center;
    padding: 40px 20px;
    color: var(--tg-theme-hint-color, #666);
    font-style: italic;
  }

  .admins-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .admin-card {
    background: var(--tg-theme-secondary-bg-color, #f9f9f9);
    border: 1px solid var(--tg-theme-hint-color, #ccc);
    border-radius: 12px;
    padding: 20px;
    transition: all 0.3s ease;

    &.current-user {
      border-color: var(--tg-theme-link-color, #007acc);
      background: rgba(0, 122, 204, 0.05);
    }

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;

      .admin-info {
        flex: 1;

        .admin-name {
          margin-bottom: 10px;

          .name {
            font-size: 18px;
            font-weight: bold;
            color: var(--tg-theme-text-color, #000);
          }

          .super-admin-badge {
            display: inline-block;
            background: linear-gradient(45deg, #ffd700, #ffed4e);
            color: #8b6914;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 10px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          }

          .current-user-badge {
            display: inline-block;
            background: var(--tg-theme-link-color, #007acc);
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 10px;
          }

          .edit-input {
            padding: 5px 10px;
            border: 1px solid var(--tg-theme-hint-color, #ccc);
            border-radius: 4px;
            font-size: 16px;
            background: var(--tg-theme-bg-color, #fff);
            color: var(--tg-theme-text-color, #000);

            &:focus {
              outline: none;
              border-color: var(--tg-theme-link-color, #007acc);
            }
          }
        }

        .edit-input.small {
          font-size: 14px;
          padding: 3px 8px;
          display: inline-block;
          width: auto;
          min-width: 120px;
        }

        .admin-details {
          color: var(--tg-theme-text-color, #000);
          line-height: 1.4;
          font-size: 14px;
        }
      }

      .admin-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;

        button {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.3s ease;
          white-space: nowrap;

          &.edit-button {
            background: var(--tg-theme-secondary-bg-color, #f5f5f5);
            color: var(--tg-theme-text-color, #000);
            border: 1px solid var(--tg-theme-hint-color, #ccc);

            &:hover {
              background: var(--tg-theme-hint-color, #e0e0e0);
            }
          }

          &.remove-button {
            background: #f44336;
            color: white;

            &:hover {
              background: #d32f2f;
            }
          }

          &.save-button {
            background: #4caf50;
            color: white;

            &:hover {
              background: #45a049;
            }
          }

          &.cancel-button {
            background: var(--tg-theme-hint-color, #666);
            color: white;

            &:hover {
              background: #555;
            }
          }
        }
      }
    }
  }

  @media (max-width: 768px) {
    .admin-card .admin-header {
      flex-direction: column;
      gap: 15px;

      .admin-actions {
        flex-direction: row;
        justify-content: flex-start;
      }
    }

    .add-admin .form-group input {
      font-size: 16px; /* Предотвращает зум на iOS */
    }
  }
</style>
