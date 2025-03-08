import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenaiService {
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async sendMessageToAssistant(
    message: string,
    assistantId: string,
    threadId?: string,
  ) {
    try {
      let currentThreadId = threadId;
      if (!currentThreadId) {
        const thread = await this.openai.beta.threads.create();
        currentThreadId = thread.id;
      }

      await this.openai.beta.threads.messages.create(currentThreadId, {
        role: 'user',
        content: message,
      });

      const run = await this.openai.beta.threads.runs.create(currentThreadId, {
        assistant_id: assistantId,
      });

      let runStatus = await this.openai.beta.threads.runs.retrieve(
        currentThreadId,
        run.id,
      );

      while (
        runStatus.status !== 'completed' &&
        runStatus.status !== 'requires_action'
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        runStatus = await this.openai.beta.threads.runs.retrieve(
          currentThreadId,
          run.id,
        );
      }

      // Обработка вызова функции
      if (runStatus.status === 'requires_action') {
        const toolCalls =
          runStatus.required_action.submit_tool_outputs.tool_calls;

        const toolOutputs = await Promise.all(
          toolCalls.map(async (toolCall) => {
            if (toolCall.function.name === 'test') {
              const args = JSON.parse(toolCall.function.arguments);
              // Здесь вы можете обработать параметры функции
              const result = await this.handleTestFunction(
                args.orderID,
                args.article,
              );

              return {
                tool_call_id: toolCall.id,
                output: JSON.stringify(result),
              };
            }
            return {
              tool_call_id: toolCall.id,
              output: JSON.stringify({ error: 'Unknown function' }),
            };
          }),
        );

        // Отправляем результат выполнения функции обратно
        await this.openai.beta.threads.runs.submitToolOutputs(
          currentThreadId,
          run.id,
          { tool_outputs: toolOutputs },
        );

        // Продолжаем проверять статус после отправки результатов
        runStatus = await this.openai.beta.threads.runs.retrieve(
          currentThreadId,
          run.id,
        );
        while (runStatus.status !== 'completed') {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          runStatus = await this.openai.beta.threads.runs.retrieve(
            currentThreadId,
            run.id,
          );
        }
      }

      const messages =
        await this.openai.beta.threads.messages.list(currentThreadId);

      const assistantMessages = messages.data
        .filter((msg) => msg.role === 'assistant')
        .sort((a, b) => b.created_at - a.created_at);

      return {
        messages: assistantMessages,
        threadId: currentThreadId,
        functionCall:
          runStatus.status === 'completed' && assistantMessages.length > 0,
      };
    } catch (error) {
      throw new Error(`Failed to communicate with OpenAI: ${error.message}`);
    }
  }

  // Пример обработчика функции
  private async handleTestFunction(orderID: string, article: string) {
    // Здесь реализуйте логику обработки возврата
    return {
      success: true,
      orderID,
      article,
      message: `Возврат для заказа ${orderID} товара ${article} создан`,
    };
  }
}
