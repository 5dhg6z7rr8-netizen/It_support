// js/admin.js
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Перевіряємо, чи користувач має права адміністратора
    const { data: { user }, error: userError } = await window.supabaseClient.auth.getUser();
    if (userError || !user) {
        window.location.href = 'index.html';
        return;
    }

    const { data: profile } = await window.supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'admin') {
        alert('Доступ заборонено! Потрібні права адміністратора.');
        window.location.href = 'dashboard.html';
        return;
    }

    // 2. Завантажуємо заявки та статистику
    await loadAdminData();

});

async function loadAdminData() {
    const tbody = document.getElementById('admin-requests-tbody');
    if (!tbody) return;

    // Отримуємо всі заявки разом із даними про профілі (авторів)
    const { data: requests, error } = await window.supabaseClient
        .from('repair_requests')
        .select('*, profiles:user_id(full_name, email)')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">Помилка: ${error.message}</td></tr>`;
        return;
    }

    if (!requests || requests.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">Немає заявок у системі.</td></tr>`;
        return;
    }

    // Оновлюємо лічильники статистики
    updateStats(requests);

    // Рендеримо таблицю адміністратора
    tbody.innerHTML = '';
    requests.forEach((req, index) => {
        const date = new Date(req.created_at).toLocaleDateString('uk-UA');
        const applicantName = req.profiles ? req.profiles.full_name : 'Невідомо';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${req.id || index + 1}</td>
            <td>${date}</td>
            <td><strong>${escapeHtml(applicantName)}</strong><br><small style="color: var(--text-muted);">${escapeHtml(req.location || '')}</small></td>
            <td>${escapeHtml(req.equipment_type || '')}</td>
            <td>${escapeHtml(req.title)}<br><small>${escapeHtml(req.description)}</small></td>
            <td>
                <select class="form-control priority-select" data-id="${req.id}" style="padding: 0.25rem; font-size: 0.8rem;">
                    <option value="low" ${req.priority === 'low' ? 'selected' : ''}>Низький</option>
                    <option value="medium" ${req.priority === 'medium' ? 'selected' : ''}>Середній</option>
                    <option value="high" ${req.priority === 'high' ? 'selected' : ''}>Високий</option>
                    <option value="critical" ${req.priority === 'critical' ? 'selected' : ''}>Критичний</option>
                </select>
            </td>
            <td>
                <select class="form-control status-select" data-id="${req.id}" style="padding: 0.25rem; font-size: 0.8rem;">
                    <option value="new" ${req.status === 'new' ? 'selected' : ''}>Нова</option>
                    <option value="in_progress" ${req.status === 'in_progress' ? 'selected' : ''}>У роботі</option>
                    <option value="waiting" ${req.status === 'waiting' ? 'selected' : ''}>Очікування</option>
                    <option value="completed" ${req.status === 'completed' ? 'selected' : ''}>Завершена</option>
                    <option value="rejected" ${req.status === 'rejected' ? 'selected' : ''}>Відхилена</option>
                </select>
            </td>
            <td>
                <button class="btn save-btn" data-id="${req.id}" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">Зберегти</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Додаємо обробники подій на кнопки збереження змін
    document.querySelectorAll('.save-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            const row = e.target.closest('tr');
            const newStatus = row.querySelector('.status-select').value;
            const newPriority = row.querySelector('.priority-select').value;

            const { error: updateError } = await window.supabaseClient
                .from('repair_requests')
                .update({ 
                    status: newStatus, 
                    priority: newPriority,
                    updated_at: new Date()
                })
                .eq('id', id);

            if (updateError) {
                alert('Помилка оновлення: ' + updateError.message);
            } else {
                alert('Заявку успішно оновлено!');
                loadAdminData();
            }
        });
    });
}

function updateStats(requests) {
    const newCount = requests.filter(r => r.status === 'new').length;
    const progressCount = requests.filter(r => r.status === 'in_progress' || r.status === 'waiting').length;
    const completedCount = requests.filter(r => r.status === 'completed').length;

    if (document.getElementById('stat-new')) document.getElementById('stat-new').textContent = newCount;
    if (document.getElementById('stat-progress')) document.getElementById('stat-progress').textContent = progressCount;
    if (document.getElementById('stat-completed')) document.getElementById('stat-completed').textContent = completedCount;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}