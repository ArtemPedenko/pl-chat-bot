import { Module } from '@nestjs/common';
import { OpenaiModule } from './openai/openai.module';
import { YandexModule } from './yandex/yandex.module';

@Module({
  imports: [OpenaiModule, YandexModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
