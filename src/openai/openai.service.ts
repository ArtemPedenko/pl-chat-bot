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

    await this.openai.beta.threads.messages.create(currentThreadId, {
      role: 'user',
      content: message,
    });

    // Use createAndPoll to handle waiting for completion
    const run = await this.openai.beta.threads.runs.createAndPoll(
      currentThreadId,
      {
        assistant_id: this.assistantId,
      },
    );

    // Handle function calls if needed
    if (run.status === 'requires_action') {
      const toolCalls = run.required_action.submit_tool_outputs.tool_calls;

      console.log(toolCalls);

      return {
        threadId: currentThreadId,
        message: {
          content: [
            {
              text: {
                value:
                  'Функция transferToManager была вызвана с аргументами: ' +
                  JSON.stringify(toolCalls),
              },
            },
          ],
        },
      };

      const toolOutputs = await Promise.all(
        toolCalls.map(async (toolCall) => {
          if (toolCall.function.name === 'transferToManager') {
            const args = JSON.parse(toolCall.function.arguments);
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

      // Use submitToolOutputsAndPoll to handle waiting after submitting tool outputs
      await this.openai.beta.threads.runs.submitToolOutputsAndPoll(
        currentThreadId,
        run.id,
        { tool_outputs: toolOutputs },
      );
    }

    const messagesList = await this.openai.beta.threads.messages.list(
      currentThreadId,
      {
        limit: 1, // Запрашиваем только одно сообщение
        order: 'desc', // В порядке убывания (самое новое первым)
      },
    );

    // Находим ID последнего сообщения от ассистента
    const lastAssistantMessageId = messagesList.data.find(
      (msg) => msg.role === 'assistant',
    )?.id;

    if (!lastAssistantMessageId) {
      throw new Error('Не удалось получить ответ от ассистента');
    }

    // Получаем полное сообщение по ID
    const assistantMessage = await this.openai.beta.threads.messages.retrieve(
      currentThreadId,
      lastAssistantMessageId,
    );

    return {
      message: assistantMessage,
      threadId: currentThreadId,
      functionCall: run.status === 'completed',
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
