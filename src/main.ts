import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // app.enableCors({
  //   origin: 'http://localhost:3000', //'*'
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  //   credentials: true,
  // });

  const port = process.env.PORT;

  const app = await NestFactory.create(AppModule);
  await app.listen(port);
}
bootstrap();
