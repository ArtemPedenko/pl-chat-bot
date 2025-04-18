import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OpenaiService } from './openai.service';
import { MessageDto } from './dto/message.dto';

@WebSocketGateway({
  cors: {
    origin: '*', // Настройте CORS по вашим требованиям
  },
})
export class OpenaiGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly openaiService: OpenaiService) {}

  // Обработка подключения клиента
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  // Обработка отключения клиента
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Обработка сообщений от клиента
  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() data: MessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    // Отправка сообщения в сервис OpenAI
    const response = await this.openaiService.sendMessageToAssistant(data);

    // Отправка ответа клиенту через WebSocket
    client.emit('response', response);
  }
}
