import { timestamp } from '@core/helpers';
import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

// singleton table just to store the state of the seeding / potentially
// some other metadata down the line

@Entity()
export class Configuration extends BaseEntity {
  @PrimaryColumn() _id: number;
  @Column() is_seeded: boolean;
  @Column() started_at: number;

  constructor() {
    super();
    this._id = 0;
    this.is_seeded = false;
    this.started_at = timestamp();
  }

  async start() {
    this.started_at = timestamp();
    return this.save();
  }
}
