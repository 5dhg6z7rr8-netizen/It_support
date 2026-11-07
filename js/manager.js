// js/manager.js
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Перевірка авторизації та ролі менеджера
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

    if (!profile || (profile.role !== 'manager' && profile.role !== 'admin')) {
        alert('Доступ заборонено! Потрібні права менеджера.');
        window.location.href = 'dashboard.html';
        return;
    }

    // 2. Завантаження даних для моніторингу
    await loadManagerData();

});

async function loadManagerData() {
    const tbody = document.getElementById('manager-requests-tbody');
    if (!tbody) return;

    const { data: requests, error } = await window.supabaseClient
        .from('repair_requests')
        .select('*, profiles:user_id(full_name)')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Помилка завантаження: ${error.message}</td></tr>`;
        return;
    }

    if (!requests || requests.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Заявок немає.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    requests.forEach((req, index) => {
        const date = new Date(req.created_at).toLocaleDateString('uk-UA');
        const applicantName = req.profiles ? req.profiles.full_name : 'Невідомо';
        const statusBadge = getStatusBadge(req.status);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${req.id || index + 1}</td>
            <td>${date}</td>
            <td><strong>${escapeHtml(applicantName)}</strong></td>
            <td>${escapeHtml(req.equipment_type)} (${escapeHtml(req.location)})</td>
            <td><span style="text-transform: uppercase; font-size: 0.8rem; font-weight: bold;">${req.priority || 'medium'}</span></td>
            <td>${statusBadge}</td>
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

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}