import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OpenaiService {
  private readonly openai: OpenAI;
  private readonly assistantId = process.env.OPENAI_ASSISTANT_ID;

  constructor(private readonly prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async sendMessageToAssistant(message: string, id: string) {
    let thread = await this.prisma.thread.findUnique({
      where: {
        id: id,
      },
    });

    // Если трэд не найден, создаем новый
    if (!thread) {
      const newThread = await this.openai.beta.threads.create();

      if (!newThread) {
        throw new Error('Не удалось создать новый трэд');
      }

      thread = await this.prisma.thread.create({
        data: {
          id: id,
          threadId: newThread.id,
        },
      });
    }

    await this.openai.beta.threads.messages.create(thread.threadId, {
      role: 'user',
      content: message,
    });

    // Use createAndPoll to handle waiting for completion
    const run = await this.openai.beta.threads.runs.createAndPoll(
      thread.threadId,
      {
        assistant_id: this.assistantId,
      },
    );

    // Handle function calls if needed
    if (run.status === 'requires_action') {
      const toolCalls = run.required_action.submit_tool_outputs.tool_calls;

      await this.prisma.message.create({
        data: {
          id: toolCalls[0].id,
          threadId: thread.threadId,
          content:
            'Функция transferToManager была вызвана с аргументами: ' +
            JSON.stringify(toolCalls),
        },
      });

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
        thread.threadId,
        run.id,
        { tool_outputs: toolOutputs },
      );

      return {
        id: toolCalls[0].id,
        threadId: thread.threadId,
        message: 'Чат переведен на менеджера',
      };
    }

    const messagesList = await this.openai.beta.threads.messages.list(
      thread.threadId,
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
      thread.threadId,
      lastAssistantMessageId,
    );

    const firstContent: any = assistantMessage.content[0];
    let contentValue = 'Нет текстового содержимого';
    if ('text' in firstContent) {
      contentValue = firstContent.text.value.replace(
        /\[[^\]]*\]|\【[^】]*\】/g,
        '',
      );
    }

    await this.prisma.message.create({
      data: {
        id: assistantMessage.id,
        threadId: thread.threadId,
        content: contentValue,
      },
    });

    return {
      message: contentValue,
      threadId: thread.threadId,
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
