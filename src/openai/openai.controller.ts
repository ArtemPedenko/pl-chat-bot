import { Controller, Post, Body } from '@nestjs/common';
import { OpenaiService } from './openai.service';

@Controller('openai')
export class OpenaiController {
  constructor(private readonly openaiService: OpenaiService) {}

  @Post('message')
  async sendMessage(@Body() body: { message: string; id?: string }) {
    const { message, id } = body;

    return this.openaiService.sendMessageToAssistant(message, id);
  }
}
