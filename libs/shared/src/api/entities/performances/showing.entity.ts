import { Performance, Ticket } from '@core/api';
import { uuid } from '@core/helpers';
import { DtoCreateShowing, IShowing } from '@core/interfaces';
import {
  BaseEntity,
  Column,
  DeleteDateColumn,
  Entity,
  EntityManager,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn
} from 'typeorm';
import { transact } from '../../typeorm-patches';

@Entity()
export class Showing extends BaseEntity implements IShowing {
  @PrimaryColumn() _id: string;
  @Column() start_datetime: number;
  @Column() end_datetime: number;
  @ManyToOne(() => Performance, performance => performance.showings) performance: Performance;
  @OneToMany(() => Ticket, ticket => ticket.showing, { onDelete: 'CASCADE', cascade: true }) tickets: Ticket[];

  constructor(showing: DtoCreateShowing) {
    super();
    this._id = uuid();
    this.start_datetime = showing.start_datetime;
    this.end_datetime = showing.end_datetime;
    this.tickets = [];
  }

  async setup(performance: Performance, txc?: EntityManager) {
    return transact(async t => {
      this.performance = performance;
      t.save(this);
    }, txc);
  }

  toFull() {
    return {
      tickets: this.tickets?.filter(t => !t.is_cancelled).map(t => t.toStub()) || [],
    }
  }
}