import { BLOB_PROVIDER } from './../../../../../libs/shared/src/api/data-client/tokens';
import { Connection } from 'typeorm';
import { Consentable, IControllerEndpoint, POSTGRES_PROVIDER, Middleware, Blobs } from '@core/api';
import { ConsentableType, ConsentableTypes, IConsentable, IEnvelopedData } from '@core/interfaces';
import { enums, object } from 'superstruct';
import { Inject, Service } from 'typedi';
import { ModuleController } from '@core/api';

import AuthStrat from '../../common/authorisation';
import { GdprService } from './gdpr.service';

@Service()
export class GdprController extends ModuleController {
  constructor(
    private gdprService: GdprService,
    @Inject(POSTGRES_PROVIDER) private ORM: Connection,
    @Inject(BLOB_PROVIDER) private blobs: Blobs
  ) {
    super();
  }

  getLatestDocument: IControllerEndpoint<IConsentable<ConsentableType>> = {
    authorisation: AuthStrat.none,
    validators: {
      query: object({ type: enums<ConsentableType>(ConsentableTypes) })
    },
    controller: async req => this.gdprService.readConsentable(req.query.type as ConsentableType, 'latest')
  };

  // Returns one of each type of document (the highest version)
  getAllLatestDocuments: IControllerEndpoint<IEnvelopedData<IConsentable<ConsentableType>[]>> = {
    authorisation: AuthStrat.isSiteAdmin,
    controller: async req => {
      const documents = await this.ORM.createQueryBuilder(Consentable, 'consentable')
        .distinctOn(['consentable.type']) // Will only get one of each type
        .orderBy('consentable.type', 'DESC') // puts the documents in order of type and then order of version (to get the highest version of each type)
        .addOrderBy('consentable.version', 'DESC')
        .getMany();

      // Edge case for when we don't yet have any documents (i.e. in early days).
      // Ensures that one of each type of document is returned (non-existent documents will just return the type)
      const allDocumentTypes = ConsentableTypes.map(documentType => {
        const existingDocument = documents.find(document => document.type == documentType);
        return existingDocument ? existingDocument : <Consentable<ConsentableType>>{ type: documentType };
      });

      return { data: allDocumentTypes };
    }
  };

  uploadDocument: IControllerEndpoint<void> = {
    authorisation: AuthStrat.isSiteAdmin,
    middleware: Middleware.file(2048, ['application/pdf']).single('file'),
    validators: {
      query: object({ type: enums<ConsentableType>(ConsentableTypes) })
    },
    controller: async req => {
      // Get the highest version existing document (if it exists)
      const existingDocument = await this.ORM.createQueryBuilder(Consentable, 'consentable')
        .where('consentable.type = :type', { type: req.query.type })
        .orderBy('consentable.version', 'DESC')
        .getOne();

      // Simultaneously create new consent and upload document
      await this.ORM.transaction(async txc => {
        const document = existingDocument // if document exists we supersede it. Else we create a new one
          ? existingDocument.superscede(req.body.summary)
          : new Consentable(<ConsentableType>req.query.type, req.body.summary);
        // Then we upload the file and update the document location/identifier
        await document.upload(req.file, this.blobs);
        await txc.save(document);
        if (existingDocument) await txc.save(existingDocument); // Also save any changes made to existing document
      });
    }
  };
}
