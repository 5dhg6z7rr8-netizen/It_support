// js/dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Перевіряємо авторизацію та отримуємо користувача
    const { data: { user }, error: userError } = await window.supabaseClient.auth.getUser();

    if (userError || !user) {
        window.location.href = 'index.html';
        return;
    }

    // Відображаємо пошту або ім'я користувача в шапці (за бажанням)
    const greetingEl = document.getElementById('user-greeting');
    if (greetingEl) {
        greetingEl.textContent = user.email;
    }

    // Завантажуємо заявки користувача з таблиці repair_requests
    await loadUserRequests(user.id);

    // Налаштування пошуку та фільтрації
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');

    if (searchInput) searchInput.addEventListener('input', filterRequests);
    if (statusFilter) statusFilter.addEventListener('change', filterRequests);
});

async function loadUserRequests(userId) {
    const tbody = document.getElementById('requests-tbody');
    if (!tbody) return;

    // Запит до бази даних Supabase. Завдяки RLS користувач отримає лише свої заявки
    const { data: requests, error } = await window.supabaseClient
        .from('repair_requests')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Помилка завантаження: ${error.message}</td></tr>`;
        return;
    }

    if (!requests || requests.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">У вас поки немає створених заявок.</td></tr>`;
        return;
    }

    renderTable(requests);
}

function renderTable(requests) {
    const tbody = document.getElementById('requests-tbody');
    tbody.innerHTML = '';

    requests.forEach((req, index) => {
        const date = new Date(req.created_at).toLocaleDateString('uk-UA');
        
        // Перетворюємо статус у гарний бейдж згідно з дизайн-системою
        const statusBadge = getStatusBadge(req.status);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${req.id || index + 1}</td>
            <td>${date}</td>
            <td><strong>${escapeHtml(req.title)}</strong><br><small style="color: var(--text-muted);">${escapeHtml(req.equipment_type || '')}</small></td>
            <td>${escapeHtml(req.description)}</td>
            <td>${statusBadge}</td>
            <td>${escapeHtml(req.admin_comment || '—')}</td>
        `;
        tbody.appendChild(tr);
    });
}

function getStatusBadge(status) {
    const statuses = {
        'new': '<span class="badge badge-new">Нова</span>',
        'in_progress': '<span class="badge badge-in_progress">У роботі</span>',
        'waiting': '<span class="badge badge-waiting">Очікування</span>',
        'completed': '<span class="badge badge-completed">Завершена</span>',
        'rejected': '<span class="badge badge-rejected">Відхилена</span>'
    };
    return statuses[status] || `<span class="badge">${status}</span>`;
}

function filterRequests() {
    // Функція для фільтрації та пошуку за бажанням (можна розширити логіку)
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}