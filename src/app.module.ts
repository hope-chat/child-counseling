import { Module } from '@nestjs/common';
import { SocketGateway } from './socket/socket.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatExpert } from './socket/entity/chat-expert';
const secretConfig = require('../secret_config.js')

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: secretConfig.USER,
      password: secretConfig.PASSWORD,
      database: secretConfig.TEMP_PROJECT_DB3,
      entities: [ChatExpert],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([ChatExpert])
  ],
  controllers: [],
  providers: [SocketGateway],
})
export class AppModule {}