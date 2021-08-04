import { ConsentableType, ConsentableTypes, IConsentable, IEnvelopedData } from '@core/interfaces';
import { BaseController, IControllerEndpoint, Consentable } from '@core/api';
import { BackendProviderMap } from '@backend/common/providers';
import AuthStrat from '../common/authorisation';
import { enums, object } from 'superstruct';

export default class GdprController extends BaseController<BackendProviderMap> {
  getLatestDocument(): IControllerEndpoint<IConsentable<ConsentableType>> {
    return {
      authorisation: AuthStrat.none,
      validators: {
        query: object({ type: enums<ConsentableType>(ConsentableTypes) })
      },
      controller: async req => {
        return await this.ORM.createQueryBuilder(Consentable, 'consentable')
          .where('consentable.type = :type', { type: req.query.type })
          .orderBy('consentable.version', 'DESC')
          .getOne(); // Get the latest (i.e. highest version) of the document
      }
    };
  }

  // Returns one of each type of document (the highest version)
  // getAllLatestDocuments(): IControllerEndpoint<IEnvelopedData<IConsentable<ConsentableType>[]>> {
  getAllLatestDocuments(): IControllerEndpoint<IEnvelopedData<IConsentable<ConsentableType>[]>> {
    return {
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
  }

  uploadDocument(): IControllerEndpoint<void> {
    return {
      authorisation: AuthStrat.isSiteAdmin,
      middleware: this.middleware.file(2048, ['application/pdf']).single('file'),
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
          await document.upload(req.file, this.providers.blob);
          await txc.save(document);
          if (existingDocument) await txc.save(existingDocument); // Also save any changes made to existing document
        });
      }
    };
  }
}
