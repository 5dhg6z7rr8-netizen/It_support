document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const errorAlert = document.getElementById('error-alert');
    const successAlert = document.getElementById('success-alert');

    // Логіка входу (index.html)
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = loginForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Вхід...';
            }
            if (errorAlert) errorAlert.style.display = 'none';

            try {
                if (!window.supabaseClient?.auth) {
                    showError('Authentication service did not load. Check your internet connection and reload the page.');
                    return;
                }

                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    showError(error.message);
                    return;
                }

                if (!data.user) {
                    showError('Не вдалося увійти. Спробуйте ще раз.');
                    return;
                }

                const { data: profile, error: profileError } = await window.supabaseClient
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .maybeSingle();

                if (profileError) {
                    showError('Увійшли, але не вдалося перевірити роль профілю: ' + profileError.message);
                    return;
                }

                if (!profile || !profile.role) {
                    showError('Увійшли, але профіль або його роль не знайдено. Перевірте, що профіль існує та має правильний role.');
                    return;
                }

                const role = profile.role.trim().toLowerCase();
                if (role === 'admin') {
                    window.location.href = 'admin.html';
                } else if (role === 'manager') {
                    window.location.href = 'manager.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            } catch (error) {
                showError(error?.message || 'Не вдалося підключитися. Перевірте з’єднання та спробуйте ще раз.');
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Увійти';
                }
            }
        });
    }

    // Логіка реєстрації (register.html)
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = registerForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Створення акаунта...';
            }
            if (errorAlert) errorAlert.style.display = 'none';
            if (successAlert) successAlert.style.display = 'none';

            try {
                if (!window.supabaseClient?.auth) {
                    showError('Authentication service did not load. Check your internet connection and reload the page.');
                    return;
                }

                const fullName = document.getElementById('full_name').value.trim();
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirm-password').value;

                if (password !== confirmPassword) {
                    showError('Паролі не збігаються!');
                    return;
                }

                const { data, error } = await window.supabaseClient.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: fullName },
                    },
                });

                if (error) {
                    showError(error.message);
                    return;
                }

                if (!data.user) {
                    showError('Акаунт не створено. Перевірте дані та спробуйте ще раз.');
                    return;
                }

                if (data.user.identities?.length === 0) {
                    showError('Акаунт із цією електронною поштою вже існує. Спробуйте увійти.');
                    return;
                }

                if (data.session) {
                    const { error: insertErr } = await window.supabaseClient
                        .from('profiles')
                        .insert([
                            { id: data.user.id, full_name: fullName, email, role: 'user' }
                        ]);

                    if (insertErr) {
                        showError('Акаунт створено, але не вдалося створити профіль: ' + insertErr.message);
                        return;
                    }

                    if (successAlert) {
                        successAlert.textContent = 'Акаунт створено! Перенаправлення до входу...';
                        successAlert.style.display = 'block';
                    }
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                } else if (successAlert) {
                    successAlert.textContent = 'Акаунт створено. Перевірте пошту та підтвердіть адресу перед входом.';
                    successAlert.style.display = 'block';
                }
            } catch (error) {
                showError(error?.message || 'Не вдалося створити акаунт. Перевірте з’єднання та спробуйте ще раз.');
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Зареєструватися';
                }
            }
        });
    }

    function showError(message) {
        if (errorAlert) {
            errorAlert.textContent = message;
            errorAlert.style.display = 'block';
        }
    }
});