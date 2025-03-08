import { Controller, Post, Body } from '@nestjs/common';
import { OpenaiService } from './openai.service';

@Controller('openai')
export class OpenaiController {
  constructor(private readonly openaiService: OpenaiService) {}

  @Post('message')
  async sendMessage(
    @Body() body: { message: string; assistantId: string; threadId?: string },
  ) {
    const { message, threadId } = body;

    const assistantId = 'asst_sgCW0R53kIDzFjTTrpFQLgxN';

    const response = await this.openaiService.sendMessageToAssistant(
      message,
      assistantId,
      threadId,
    );
    return {
      response,
    };
  }
}
