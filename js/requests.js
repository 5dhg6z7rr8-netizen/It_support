document.addEventListener('DOMContentLoaded', () => {
    const requestForm = document.getElementById('request-form');
    const successAlert = document.getElementById('success-alert');
    const errorAlert = document.getElementById('error-alert');

    if (requestForm) {
        requestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = requestForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Надсилання...';
            }
            if (errorAlert) errorAlert.style.display = 'none';

            try {
                const { data: { user }, error: userError } = await window.supabaseClient.auth.getUser();

                if (userError || !user) {
                    if (userError) throw userError;
                    window.location.href = 'index.html';
                    return;
                }

                const { data: profile, error: profileError } = await window.supabaseClient
                    .from('profiles')
                    .select('id')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profileError) throw profileError;

                if (!profile) {
                    const { error: insertProfileError } = await window.supabaseClient
                        .from('profiles')
                        .insert({
                            id: user.id,
                            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Користувач',
                            email: user.email,
                            role: 'user',
                        });

                    if (insertProfileError) throw insertProfileError;
                }

                const { error: requestError } = await window.supabaseClient
                    .from('repair_requests')
                    .insert([{
                        user_id: user.id,
                        title: document.getElementById('title').value,
                        equipment_type: document.getElementById('equipment_type').value,
                        inventory_number: document.getElementById('inventory_number').value,
                        location: document.getElementById('location').value,
                        description: document.getElementById('description').value,
                        status: 'new',
                    }]);

                if (requestError) throw requestError;

                if (successAlert) {
                    successAlert.style.display = 'block';
                }
                requestForm.reset();
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } catch (error) {
                if (errorAlert) {
                    errorAlert.textContent = 'Помилка створення заявки: ' + (error?.message || 'Перевірте з’єднання та спробуйте ще раз.');
                    errorAlert.style.display = 'block';
                }
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Надіслати заявку';
                }
            }
        });
    }
});