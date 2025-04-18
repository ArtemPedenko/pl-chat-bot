import { Module } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { OpenaiController } from './openai.controller';
import { OpenaiGateway } from './openai.gateway';

@Module({
  providers: [OpenaiService, OpenaiGateway],
  controllers: [OpenaiController],
})
export class OpenaiModule {}
