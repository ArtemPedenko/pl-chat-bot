import {
  ValidationPipe,
  Controller,
  Post,
  Body,
  Req,
  Get,
} from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { MessageDto, MessageResponseDto } from './dto/message.dto';
import { ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';

@Controller('openai')
export class OpenaiController {
  constructor(private readonly openaiService: OpenaiService) {}

  @ApiOperation({
    summary: 'Отправка сообщения в ассистента',
  })
  @ApiResponse({
    status: 200,
    type: MessageResponseDto,
  })
  @Post('message')
  async sendMessage(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    body: MessageDto,
  ) {
    return this.openaiService.sendMessageToAssistant(body);
  }

  @ApiExcludeEndpoint()
  @Get('headers')
  getHeaders(@Req() request: Request) {
    return {
      headers: request.headers,
    };
  }
}
