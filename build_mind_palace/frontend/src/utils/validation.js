export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAuthForm(mode, form) {
  if (mode === 'register') {
    const username = form.username.trim();
    if (username.length < 3 || username.length > 30) {
      return 'Потребителското име трябва да бъде между 3 и 30 символа.';
    }
  }

  if (!emailPattern.test(form.email.trim())) {
    return 'Въведете валиден имейл адрес.';
  }

  if (form.password.length < 6) {
    return 'Паролата трябва да бъде поне 6 символа.';
  }

  return '';
}

export function validateSpaceForm(form) {
  const title = form.title.trim();
  if (title.length < 2 || title.length > 120) {
    return 'Заглавието трябва да бъде между 2 и 120 символа.';
  }

  if (form.description.trim().length > 2000) {
    return 'Описанието не може да бъде по-дълго от 2000 символа.';
  }

  return '';
}

export function validateLocationForm(form) {
  const title = form.title.trim();
  if (title.length < 2 || title.length > 100) {
    return 'Заглавието на мястото трябва да бъде между 2 и 100 символа.';
  }

  return '';
}

export function validateContentForm(form) {
  const value = form.value.trim();
  if (!value) {
    return 'Добавете съдържание преди запис.';
  }

  if (value.length > 5000) {
    return 'Съдържанието не може да бъде по-дълго от 5000 символа.';
  }

  return '';
}
