# UI Components Documentation

## Обзор

Базовые UI компоненты для Grand Publicador, созданные с использованием TailwindCSS и следующие дизайн-системе проекта.

## Компоненты

### Button

Переиспользуемый компонент кнопки с различными вариантами стилей.

**Props:**
- `variant` - Вариант стиля: `'primary' | 'secondary' | 'ghost' | 'danger'` (по умолчанию: `'primary'`)
- `size` - Размер: `'sm' | 'md' | 'lg'` (по умолчанию: `'md'`)
- `type` - HTML тип: `'button' | 'submit' | 'reset'` (по умолчанию: `'button'`)
- `disabled` - Отключена ли кнопка (по умолчанию: `false`)
- `fullWidth` - Занимает ли кнопка всю ширину (по умолчанию: `false`)

**Events:**
- `click` - Событие клика с объектом MouseEvent

**Пример использования:**
```vue
<UiButton variant="primary" size="md" @click="handleClick">
  Click Me
</UiButton>
```

---

### Input

Переиспользуемый компонент текстового поля с поддержкой валидации.

**Props:**
- `modelValue` - Значение поля (v-model)
- `type` - Тип input: `'text' | 'email' | 'password' | 'number' | 'tel' | 'url'` (по умолчанию: `'text'`)
- `label` - Текст метки
- `placeholder` - Placeholder текст
- `disabled` - Отключено ли поле (по умолчанию: `false`)
- `required` - Обязательное ли поле (по умолчанию: `false`)
- `error` - Текст ошибки валидации
- `hint` - Текст подсказки
- `inputId` - ID элемента (генерируется автоматически)

**Events:**
- `update:modelValue` - Обновление значения
- `blur` - Событие потери фокуса
- `focus` - Событие получения фокуса

**Пример использования:**
```vue
<UiInput
  v-model="email"
  type="email"
  label="Email"
  placeholder="your@email.com"
  required
  :error="emailError"
  hint="Enter your email address"
/>
```

---

### Card

Переиспользуемый компонент карточки с поддержкой header и footer.

**Props:**
- `title` - Заголовок карточки (отображается в header)
- `variant` - Вариант стиля: `'default' | 'bordered' | 'elevated'` (по умолчанию: `'default'`)
- `padding` - Применять ли padding к body (по умолчанию: `true`)

**Slots:**
- `default` - Основной контент карточки
- `header` - Кастомный header (если не используется prop `title`)
- `footer` - Footer карточки

**Пример использования:**
```vue
<UiCard title="Card Title" variant="elevated">
  <p>Card content goes here</p>
  
  <template #footer>
    <UiButton variant="primary">Action</UiButton>
  </template>
</UiCard>
```

---

## Дизайн-система

### Цветовая палитра

- **Primary**: Синие оттенки (от `primary-50` до `primary-950`)
- **Secondary**: Фиолетовые оттенки (от `secondary-50` до `secondary-950`)
- **Danger**: Красные оттенки для деструктивных действий

### Типографика

- **Шрифт**: Inter (Google Fonts)
- **Размеры**: sm, base, lg, xl, 2xl, 3xl, 4xl

### Border Radius

- **telegram**: `12px` - Telegram-стиль скругления углов

### Spacing

Используется стандартная шкала Tailwind (0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32, ...)

---

## Расширение компонентов

Для создания новых компонентов следуйте этим принципам:

1. **TypeScript**: Используйте строгую типизацию для props и events
2. **Композиция**: Используйте `computed` для динамических классов
3. **Доступность**: Добавляйте ARIA атрибуты где необходимо
4. **Telegram-стиль**: Используйте `rounded-telegram` для скругления углов
5. **Консистентность**: Следуйте существующим паттернам именования и структуры

---

**Дата создания:** 2025-12-05  
**Версия:** 1.0.0
