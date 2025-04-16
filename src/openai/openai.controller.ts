import { Controller, Post, Body, Req, Get } from '@nestjs/common';
import { OpenaiService } from './openai.service';

@Controller('openai')
export class OpenaiController {
  constructor(private readonly openaiService: OpenaiService) {}

  @Post('message')
  async sendMessage(@Body() body: { message: string; id?: string | number }) {
    const { message, id } = body;

    return this.openaiService.sendMessageToAssistant(message, id);
  }

  @Get('headers')
  getHeaders(@Req() request: Request) {
    return {
      headers: request.headers,
    };
  }
}
