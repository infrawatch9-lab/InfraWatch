import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para desenvolvimento
  app.enableCors();

  // Porta do servidor
  const port = process.env.PORT || 3000;

  await app.listen(port);
  console.log(`🚀 InfraWatch Backend rodando na porta ${port}`);
}

bootstrap();
