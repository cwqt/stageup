import { timestamp, uuid } from '@core/helpers';
import { ConsentableType, ConsentableTypes, IConsentable } from '@core/interfaces';
import { BaseEntity, Column, Entity, FindOptionsWhereCondition, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import BlobProvider from '../../data-client/providers/blob.provider';

// Convenience methods for Consentable.retrieve("general_toc") to return Consentable<"general_toc">
class ConsentableEntity extends BaseEntity {
  // this level of type power should not be legal
  static retrieve<K extends ConsentableType>(
    query: Omit<FindOptionsWhereCondition<Consentable<K>>, 'type' | 'succeeded_by' | 'version'> & { type: K },
    version: number | 'latest'
  ): Promise<Consentable<K>> {
    const q: FindOptionsWhereCondition<Consentable<K>> = query as any;

    // use 'latest' as short-circruit for that with no successor
    if (version == 'latest') {
      q.superseded_at = undefined;
    } else {
      q.version = version;
    }

    return Consentable.findOne(q) as Promise<Consentable<K>>;
  }
}

@Entity()
export class Consentable<T extends ConsentableType> extends ConsentableEntity implements IConsentable<T> {
  @PrimaryColumn() _id: string;

  @Column('enum', { enum: ConsentableTypes }) type: T;
  @Column() created_at: number;
  @Column() document_identifier: string;
  @Column() document_location: string;
  @Column({ nullable: true }) superseded_at: number;

  @Column() version: number; // incremented on succession

  // linked list
  @OneToOne(() => Consentable) @JoinColumn() succeeded_by: Consentable<T>;
  @OneToOne(() => Consentable) @JoinColumn() preceeded_by: Consentable<T>;

  constructor(type: T, documentLink: string) {
    super();
    this._id = uuid(); // have an id before save
    this.created_at = timestamp();
    this.document_location = documentLink;
    this.type = type;
    this.version = 0;
  }

  async upload(document: Express.Multer.File, blob: BlobProvider) {
    const asset = await blob.upload(document);
    this.document_location = asset.location;
    this.document_identifier = asset.asset_identifier;
    return this;
  }

  superscede(documentLink: string): Consentable<T> {
    const newConsent = new Consentable<T>(this.type, documentLink);
    newConsent.version = this.version + 1;
    newConsent.preceeded_by = this;

    this.succeeded_by = newConsent;
    this.superseded_at = timestamp();

    return newConsent;
  }
}