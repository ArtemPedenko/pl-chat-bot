import { Module } from '@nestjs/common';
import { OpenaiModule } from './openai/openai.module';

@Module({
  imports: [OpenaiModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
