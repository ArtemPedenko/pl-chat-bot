добавить api ключ в .env

установка

```
yarn
```

запуск

```
yarn dev
```

1 Пост запрос на

http://localhost:3000/openai/message

body:

```
{
"message": "хочу вернуть заказ"
}
```

если просит дать номер заказа
сокпировать thread_id из ответа и послать запрос с body

```
{
  "message": "1234 123",
  "threadId": "thread_H1Bvm5fNWl9eu5IQH3iJwtNH"
}
```
