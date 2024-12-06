import { ConnectedSocket, WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { ChatExpert } from './entity/chat-expert';
import { Repository } from 'typeorm';

interface SocketData {
    message: string;
    room: string;
    senderID: string;
}

@WebSocketGateway()
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect{
    @WebSocketServer() server: Server;
    
    private redisPub = new Redis();
    private redisSub = new Redis();

    constructor (@InjectRepository(ChatExpert) private chatExpertRepository: Repository<ChatExpert>) {
        this.setUpRedis();
    }

    private setUpRedis() {
        this.redisSub.subscribe('chat');
        this.redisSub.on('message', (channel, message) => {
            if (channel === 'chat') {
                const data: SocketData = JSON.parse(message);
                this.handleRoomMessage(data);
            }
        });
    }

    private handleRoomMessage(data: SocketData) {
        this.server.to(data.room).emit('roomMessage', data.message, data.senderID);
    }

    handleConnection(@ConnectedSocket() client: Socket) {
        console.log(`클라이언트가 연결되었습니다. ID: ${client.id}`)
    }

    handleDisconnect(@ConnectedSocket() client: Socket) {
        console.log(`클라이언트가 해제되었습니다. ID: ${client.id}`)
    }

    @SubscribeMessage('chatMessage')
    handleChatMessage(@MessageBody() data: SocketData) {
        const from: string = data.senderID;
        const room: string = data.room;
        const sentence: string = data.message;
        var date: Date = new Date();
        const now = new Date(); // 현재 시간
        const utcNow = now.getTime() + (now.getTimezoneOffset() * 60 * 1000); // 현재 시간을 utc로 변환한 밀리세컨드값
        const koreaTimeDiff = 9 * 60 * 60 * 1000; // 한국 시간은 UTC보다 9시간 빠름(9시간의 밀리세컨드 표현)
        const koreaNow = new Date(utcNow + koreaTimeDiff);
        date = koreaNow;
        const chat = this.chatExpertRepository.create({from, room, sentence, date});
        this.chatExpertRepository.save(chat);

        console.log(`방 ${room} - 사용자 ${from}: 메시지(${sentence}) 받음: `)
        
        this.publishChatMessage(data);
    }

    private async publishChatMessage(data: SocketData) {
        await this.redisPub.publish('chat', JSON.stringify(data));
    }
    
    @SubscribeMessage('join')
    join(@MessageBody() data, @MessageBody('id') id: string, @MessageBody('room') room: string, @ConnectedSocket() client: Socket) {
        client.join(room);
        console.log(data)
        console.log(`사용자가 ${id}가 방 ${room}에 입장`)
    }
}