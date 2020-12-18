import { BaseEntity, Column, Entity, EntityManager, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { IHostOnboardingProcess } from "@eventi/interfaces/lib/Host.model";

// @Entity()
// export class HostOnboarding extends BaseEntity implements IHostOnboardingProcess {
//     @PrimaryGeneratedColumn() _id: number;

//     constructor() {
//         super();
//     }
// }