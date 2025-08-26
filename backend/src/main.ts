import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { DynamicAuthGuard } from './auth/dynamic-auth.guard';
import { JwtService } from '@nestjs/jwt';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.setGlobalPrefix('api');

  const reflector = app.get(Reflector);
  const jwtService = app.get(JwtService);
  app.useGlobalGuards(new JwtAuthGuard(reflector));
  app.useGlobalGuards(new DynamicAuthGuard(reflector, jwtService));

  const config = new DocumentBuilder()
    .setTitle('InfraWatch API')
    .setDescription('API para monitoramento de infraestrutura e segurança')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
  });
}
bootstrap();
