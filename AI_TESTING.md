# AI Testing Guide

## Что было добавлено

### 1. AI Pipeline (TypeScript)
- **Файл**: `src/lib/ai/evaluationPipeline.ts`
- **Функции**:
  - `generatePersonaOptions()` - генерация опций персон
  - `refinePersona()` - уточнение выбранной персоны
  - `generateNextQuestion()` - генерация следующего вопроса
  - `evaluateResponse()` - оценка ответа пользователя
  - `summarizeScore()` - итоговая оценка
  - `metricsToTips()` - конвертация метрик в советы
  - `metricsToScore()` - конвертация метрик в балл (0-10)

### 2. API Endpoints
- **`/api/ai/evaluate`** (POST) - оценка ответа пользователя
  - Body: `{ agentMessage, userResponse }`
  - Returns: `{ metrics, tips, score }`

- **`/api/ai/generate-question`** (POST) - генерация следующего вопроса
  - Body: `{ persona, dialogueHistory, score }`
  - Returns: `{ question, refinedPrompt }`

- **`/api/ai/personas`** (GET/POST) - получение списка персон
  - Returns: `{ personas }`

- **`/api/ai/summarize`** (POST) - итоговая оценка сессии
  - Body: `{ metricsHistory }`
  - Returns: `{ summary }`

### 3. Интеграция с Training Session
- Страница `src/app/training/session/page.tsx` теперь использует AI API
- Fallback на mock данные при ошибках
- Логирование всех операций

## Логирование

Все операции логируются с префиксами:
- `[AI Pipeline INFO/ERROR/DEBUG]` - логи из evaluationPipeline.ts
- `[API /api/ai/... INFO/ERROR]` - логи из API endpoints
- `[Training Session]` - логи из клиентской части

Логи выводятся в консоль браузера (клиент) и терминал (сервер).

## Как тестировать

1. **Откройте браузер**: http://localhost:3000

2. **Перейдите к тренировке**:
   - Нажмите "Start Training" или перейдите на `/training/session`

3. **Проверьте логи**:
   - **В терминале** (сервер): смотрите логи API запросов
   - **В консоли браузера** (F12): смотрите логи клиентской части

4. **Тестовый сценарий**:
   - Введите ответ в поле транскрипции
   - Нажмите "Submit Response"
   - Оцените понимание (0-10)
   - Нажмите "See Result"
   - Проверьте логи в консоли браузера и терминале
   - Нажмите "Continue" для следующего раунда
   - Проверьте генерацию следующего вопроса

## Примеры логов

### Сервер (терминал):
```
[API /api/ai/evaluate INFO] 2024-01-01T12:00:00.000Z - Received evaluation request
[AI Pipeline INFO] 2024-01-01T12:00:00.001Z - Evaluating user response
[API /api/ai/evaluate INFO] 2024-01-01T12:00:00.002Z - Evaluation complete
```

### Клиент (консоль браузера):
```
[Training Session] Submitting rating { currentRound: 0, userEstimate: 7 }
[Training Session] Calling AI evaluation API
[Training Session] AI evaluation received { score: 7.5, tipsCount: 3 }
```

## Структура метрик

Метрики оценки включают:
- `perception_match` (0-1) - соответствие восприятия
- `paraphrasing` (0-1) - качество перефразирования
- `clarification` (0-1) - использование уточнений
- `emotional_alignment` (0-1) - эмоциональное соответствие
- `misunderstanding` (boolean) - наличие недопонимания
- `comments` (string) - комментарии

## Fallback механизм

Если AI API недоступен или возвращает ошибку:
- Автоматически используются mock данные
- В консоли появляется предупреждение
- Приложение продолжает работать

