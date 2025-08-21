import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/', cors: true })
export class MicroservicesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private connections: Record<string, Socket> = {};

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // Remove conexão registrada
    for (const key in this.connections) {
      if (this.connections[key].id === client.id) {
        delete this.connections[key];
        console.log(`Micro-serviço desconectado: ${key}`);
      }
    }
  }

  @SubscribeMessage('register')
  register(@MessageBody() data: { id: string }, @ConnectedSocket() client: Socket) {
    this.connections[data.id] = client;
    console.log(`Micro-serviço registrado: ${data.id}`);
  }

  @SubscribeMessage('message')
  handleMessageRest(data: { from: string; to: string; payload: any }) {
    if (data.to === 'all') {
      for (const key in this.connections) {
        this.connections[key].emit('message', { from: data.from, payload: data.payload });
      }
    } else {
      const target = this.connections[data.to];
      if (target) {
        console.log(`Enviando mensagem de ${data.from} para ${data.to}`);
        target.emit('message', { from: data.from, payload: data.payload });
      }
      else
      {
        console.error(`Micro-serviço ${data.to} não encontrado`);
        throw new Error(`Micro-serviço ${data.to} não encontrado`);
      }
    }
  }
}
