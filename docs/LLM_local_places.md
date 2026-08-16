# Интеграция локально добавленных точек с LLM

Кратко: фронтенд теперь отправляет опциональное поле `local_places` в тело запроса `POST /api/v1/search`.
Чтобы крупные модели (ChatGPT, Gemini, Claude) учитывали эти точки при ранжировании/генерации ответа, нужно принять `local_places` на бэкенде и включить их в контекст (prompt) для LLM.

Пример серверной обработки (Node.js + Express, OpenAI как пример):

```js
// POST /api/v1/search
app.post('/api/v1/search', async (req, res) => {
  const { query, lang, session_id, local_places } = req.body;

  // 1) Соберите релевантную информацию о local_places (строка с кратким описанием)
  const localSummary = (local_places || []).slice(0, 20).map(p => `- ${p.name} (${p.district || p.address || 'без адреса'})${p.tags?.length ? ' — ' + p.tags.join(', ') : ''}`).join('\n');

  // 2) Создайте prompt для LLM с явным указанием приоритетов
  const prompt = `Ты — помощник по локальным заведениям. У пользователя запрос: "${query}".\n\n` +
    (localSummary ? `У пользователя есть локальные точки (отрегулируй релевантность в пользу этих точек при совпадениях):\n${localSummary}\n\n` : '') +
    `Найди до 5 самых релевантных мест и дай краткий ответ с причинами выбора и ссылками.`;

  // 3) Вызов LLM (пример — OpenAI Chat completions)
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: 'You are a helpful assistant.' }, { role: 'user', content: prompt }],
    max_tokens: 500,
  });

  const text = completion.choices?.[0]?.message?.content || '';
  res.json({ matched: true, rec: text });
});
```

Рекомендации безопасности и UX:
- Не доверяйте полю `local_places` полностью — используйте его как подсказку, но валидируйте данные на сервере при необходимости.
- Ограничьте длину и количество записей, чтобы не перегружать prompt (например, до 20 записей).
- Для приватности укажите пользователю, что локальные точки используются только для ранжирования ответов на его устройстве/сессии.

Как проверить локально:
1. Откройте фронтенд, добавьте точку на `/vendor`.
2. Откройте `/chat` и запросите что-то по этой точке; бэкенд должен вернуть ответ, учитывающий `local_places`.

Если хотите, я могу подготовить пример кода для вашего бекенда (на Node/Go/Python) или помочь встроить OpenAI/Google/Anthropic вызовы в ваш сервер.
