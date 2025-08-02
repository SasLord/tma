<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  export let activeSection: 'orders' | 'admins' = 'orders'

  function setActiveSection(section: 'orders' | 'admins') {
    activeSection = section
    dispatch('sectionChange', { section })
  }
</script>

<div class="admin-layout">
  <nav class="admin-nav">
    <h1>🔐 Административная панель</h1>
    <div class="nav-tabs">
      <button class:active={activeSection === 'orders'} on:click={() => setActiveSection('orders')}>
        📋 Заказы
      </button>
      <button class:active={activeSection === 'admins'} on:click={() => setActiveSection('admins')}>
        👥 Админы
      </button>
    </div>
  </nav>

  <main class="admin-content">
    <slot {activeSection} />
  </main>
</div>

<style lang="scss">
  .admin-layout {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .admin-nav {
    margin-bottom: 30px;

    h1 {
      text-align: center;
      color: var(--tg-theme-text-color, #000);
      margin-bottom: 20px;
    }

    .nav-tabs {
      display: flex;
      justify-content: center;
      gap: 10px;
      border-bottom: 2px solid var(--tg-theme-hint-color, #e0e0e0);
      padding-bottom: 0;

      button {
        background: none;
        border: none;
        padding: 12px 24px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        border-radius: 8px 8px 0 0;
        transition: all 0.3s ease;
        color: var(--tg-theme-hint-color, #666);
        position: relative;

        &:hover {
          background: var(--tg-theme-secondary-bg-color, #f5f5f5);
          color: var(--tg-theme-text-color, #000);
        }

        &.active {
          background: var(--tg-theme-bg-color, #fff);
          color: var(--tg-theme-link-color, #007acc);
          border: 2px solid var(--tg-theme-hint-color, #e0e0e0);
          border-bottom: 2px solid var(--tg-theme-bg-color, #fff);
          margin-bottom: -2px;
        }
      }
    }
  }

  .admin-content {
    background: var(--tg-theme-bg-color, #fff);
    border: 2px solid var(--tg-theme-hint-color, #e0e0e0);
    border-top: none;
    border-radius: 0 0 12px 12px;
    padding: 30px;
    min-height: 500px;
  }

  @media (max-width: 768px) {
    .admin-layout {
      padding: 15px;
    }

    .admin-nav .nav-tabs {
      flex-direction: column;

      button {
        border-radius: 8px;
        margin-bottom: 5px;

        &.active {
          border: 2px solid var(--tg-theme-link-color, #007acc);
          margin-bottom: 5px;
        }
      }
    }

    .admin-content {
      border: 1px solid var(--tg-theme-hint-color, #e0e0e0);
      border-radius: 12px;
      padding: 20px;
    }
  }
</style>
