import { AfterInsert, AfterRemove, AfterUpdate, Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ChatExpert {
  @PrimaryGeneratedColumn('increment')
  key: number;

  @Column()
  from: string;

  @Column()
  room: string;

  @Column()
  sentence: string;

  @Column()
  date: Date;
}