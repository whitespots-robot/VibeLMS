# Production Server Fixes for Docker Compose

## Проблемы, которые были исправлены:

### 1. Database Initialization Errors
- **Проблема**: Дублирование записей в system_settings вызывало ошибки constraint violation
- **Решение**: Добавлен `onConflictDoNothing()` в создание системных настроек
- **Файл**: `server/storage.ts:209`

### 2. API Endpoints Failing
- **Проблема**: Методы storage бросали ошибки без обработки
- **Решение**: Добавлена обработка ошибок в `getCourses()`, `getPublicCourses()`, `getSystemSetting()`
- **Файлы**: `server/storage.ts:298-337, 655-664`

### 3. WebSocket Connection Issues
- **Проблема**: WebSocket соединения не устанавливались в Docker
- **Решение**: Добавлен WebSocketServer в production сервер
- **Файл**: `server/index.prod.ts:111-133`

### 4. CORS и Proxy Headers
- **Проблема**: Неправильная конфигурация для Docker окружения
- **Решение**: Добавлены CORS заголовки и trust proxy
- **Файл**: `server/index.prod.ts:50-64`

### 5. Static Files Serving
- **Проблема**: Отсутствие fallback для статических файлов
- **Решение**: Улучшена обработка статических файлов с fallback HTML
- **Файл**: `server/vite.prod.ts:21-38`

### 6. Docker Health Checks
- **Проблема**: Отсутствие проверки здоровья приложения
- **Решение**: Добавлены health checks и curl в Docker образ
- **Файлы**: `Dockerfile:23`, `docker-compose.yml:22-27`

## Команды для развертывания:

1. **Пересборка Docker образа:**
```bash
docker compose build --no-cache
```

2. **Запуск с новыми исправлениями:**
```bash
docker compose up -d
```

3. **Создание тестовых данных:**
```bash
docker compose exec app node createdata.js
```

4. **Проверка логов:**
```bash
docker compose logs -f app
```

## Проверка работоспособности:

- Health check: `curl http://212.192.2.38/api/health`
- Public courses: `curl http://212.192.2.38/api/public/courses`
- System settings: `curl http://212.192.2.38/api/settings/allow_student_registration`

## Ключевые улучшения:

- Устойчивая инициализация базы данных
- Правильная обработка ошибок в API
- WebSocket поддержка для real-time функций
- Улучшенная конфигурация для Docker
- Health checks для мониторинга
- Fallback механизмы для статических файлов

После пересборки и перезапуска production сервер должен корректно работать с авторизацией и публичными курсами.