import { timestamp, uuid } from '@core/helpers';
import { ConsentableType, ConsentableTypes, IConsentable } from '@core/interfaces';
import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import BlobProvider from '../../data-client/providers/blob.provider';

@Entity()
export class Consent<T extends ConsentableType> extends BaseEntity implements IConsentable<T> {
  @PrimaryColumn() _id: string;

  @Column('enum', { enum: ConsentableTypes }) type: T;
  @Column() created_at: number;
  @Column() document_identifier: string;
  @Column() document_location: string;
  @Column({ nullable: true }) superseded_at: number;

  @Column() version: number; // incremented on succession

  // linked list
  @OneToOne(() => Consent) @JoinColumn() succeeded_by: Consent<T>;
  @OneToOne(() => Consent) @JoinColumn() preceeded_by: Consent<T>;

  constructor(documentLink: string) {
    super();
    this._id = uuid(); // have an id before save
    this.created_at = timestamp();
    this.document_location = documentLink;
    this.version = 0;
  }

  async upload(document: Express.Multer.File, blob: BlobProvider) {
    const asset = await blob.upload(document);
    this.document_location = asset.location;
    this.document_identifier = asset.asset_identifier;
    return this;
  }

  superscede(documentLink: string): Consent<T> {
    const newConsent = new Consent<T>(documentLink);
    newConsent.version = this.version + 1;
    newConsent.preceeded_by = this;

    this.succeeded_by = newConsent;
    this.superseded_at = timestamp();

    return newConsent;
  }
}