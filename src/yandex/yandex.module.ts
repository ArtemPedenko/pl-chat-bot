import { Module } from '@nestjs/common';
import { YandexService } from './yandex.service';
import { YandexController } from './yandex.controller';

@Module({
  providers: [YandexService],
  controllers: [YandexController],
})
export class YandexModule {}
