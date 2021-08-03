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
  getAllLatestDocuments(): IControllerEndpoint<IEnvelopedData<IConsentable<ConsentableType>[]>> {
    return {
      authorisation: AuthStrat.isSiteAdmin,
      controller: async req => {
        const documents = await this.ORM.createQueryBuilder(Consentable, 'consentable')
          .distinctOn(['consentable.type']) // Will only get one of each type
          .orderBy('consentable.type', 'DESC') // puts the documents in order of type and then order of version (to get the highest version of each type)
          .addOrderBy('consentable.version', 'DESC')
          .getMany();

        return { data: documents };
      }
    };
  }

  uploadDocument(): IControllerEndpoint<void> {
    return {
      authorisation: AuthStrat.isSiteAdmin,
      middleware: this.middleware.file(2048, ['application/pdf']).single('file'),
      controller: async req => {
        console.log('REQUEST LOL', req);
        return null;
      }
    };
  }
}
