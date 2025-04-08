import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenaiService {
  private readonly openai: OpenAI;
  private readonly assistantId = process.env.OPENAI_ASSISTANT_ID;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async sendMessageToAssistant(message: string, threadId?: string) {
    let currentThreadId = threadId;
    if (!currentThreadId) {
      const thread = await this.openai.beta.threads.create();

      currentThreadId = thread.id;
    }

    const createThreat = await this.openai.beta.threads.messages.create(
      currentThreadId,
      {
        role: 'user',
        content: message,
      },
      { stream: false },
    );

    if (!createThreat) {
      throw new Error('Не удалось отправить сообщение');
    }

    const run = await this.openai.beta.threads.runs.create(currentThreadId, {
      assistant_id: this.assistantId,
      stream: false,
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

      console.log(toolCalls);

      const toolOutputs = await Promise.all(
        toolCalls.map(async (toolCall) => {
          if (toolCall.function.name === 'transferToManager') {
            const args = JSON.parse(toolCall.function.arguments);
            // Здесь вы можете обработать параметры функции
            const result = await this.transferToManager(args);

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

    console.log(messages);

    return messages;

    const assistantMessages = messages.data
      .filter((msg) => msg.role === 'assistant')
      .sort((a, b) => b.created_at - a.created_at);

    return {
      messages: assistantMessages,
      threadId: currentThreadId,
      functionCall:
        runStatus.status === 'completed' && assistantMessages.length > 0,
    };
  }

  // Пример обработчика функции
  private async transferToManager(args: any) {
    return {
      success: true,
      message: JSON.stringify(args),
    };
  }
}
