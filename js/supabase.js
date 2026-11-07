// js/supabase.js

const SUPABASE_URL = 'https://njafmelcxilvkszmukzq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_aaVrXHDAkcx4WCu3jiEEqw_sZ1jYs8v';

// Ініціалізація клієнта Supabase
if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    throw new Error('Supabase SDK did not load. Check your internet connection and reload the page.');
}

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('click', async (event) => {
    const logoutButton = event.target.closest('#logout-btn');
    if (!logoutButton) return;

    event.preventDefault();
    logoutButton.setAttribute('aria-disabled', 'true');

    try {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) throw error;

        window.location.href = 'index.html';
    } catch (error) {
        logoutButton.removeAttribute('aria-disabled');
        alert('Помилка виходу: ' + (error?.message || 'Спробуйте ще раз.'));
    }
});