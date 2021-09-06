import { Connection } from 'typeorm';
import {
  Consentable,
  IControllerEndpoint,
  POSTGRES_PROVIDER,
  BLOB_PROVIDER,
  Middleware,
  Blobs,
  Validators,
  Auth,
  UploadersConsent,
  Host,
  Performance
} from '@core/api';
import {
  ConsentableType,
  ConsentableTypes,
  HostPermission,
  HTTP,
  IConsentable,
  IEnvelopedData
} from '@core/interfaces';
import { enums, object } from 'superstruct';
import { Inject, Service } from 'typedi';
import { ModuleController } from '@core/api';
import { ErrorHandler } from '../../common/error';

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

  readLatestDocument: IControllerEndpoint<IConsentable<ConsentableType>> = {
    authorisation: AuthStrat.none,
    validators: {
      params: Validators.Objects.IDocumentRequest
    },
    controller: async req =>
      this.gdprService.readConsentable(req.params.type as ConsentableType, req.params.version as number | 'latest')
  };

  // Returns one of each type of document (the highest version)
  readAllLatestDocuments: IControllerEndpoint<IConsentable<ConsentableType>[]> = {
    authorisation: AuthStrat.isSiteAdmin,
    controller: async req => {
      const documents = await Consentable.retrieveAll(req.params.version as number | 'latest');
      // Edge case for when we don't yet have any documents (i.e. in early days).
      // Ensures that one of each type of document is returned (non-existent documents will just return undefined)
      const allDocumentTypes = ConsentableTypes.map(documentType => {
        const existingDocument = documents.find(document => document.type == documentType);
        return existingDocument ? existingDocument : <Consentable<ConsentableType>>{ type: documentType };
      });

      return allDocumentTypes;
    }
  };

  uploadDocument: IControllerEndpoint<void> = {
    authorisation: AuthStrat.isSiteAdmin,
    middleware: Middleware.file(2048, ['application/pdf']).single('file'),
    validators: {
      params: object({ type: enums<ConsentableType>(ConsentableTypes) })
    },
    controller: async req => {
      // Get the highest version existing document (if it exists)
      const existingDocument = await Consentable.retrieve({ type: <ConsentableType>req.params.type }, 'latest');

      // Simultaneously create new consent and uploads document
      await this.ORM.transaction(async txc => {
        const document = existingDocument // if document exists we supersede it. Else we create new
          ? existingDocument.superscede(req.body.summary)
          : new Consentable(<ConsentableType>req.params.type, req.body.summary);
        // Then we upload the file and update the document location/identifier
        await document.upload(req.file, this.blobs);
        await txc.save(document);
        if (existingDocument) await txc.save(existingDocument); // Save changes made to prior existing document
      });
    }
  };

  updateStreamCompliance: IControllerEndpoint<void> = {
    authorisation: AuthStrat.hasHostPermission(HostPermission.Admin),
    controller: async req => {
      const hostId = req.params.hid;
      const perfId = req.params.pid;

      if (!req.body.is_compliant) {
        throw new ErrorHandler(HTTP.Forbidden, '@@error.stream_compliance_not_accepted');
      }

      const host = await Host.findOne({ _id: hostId });
      const perf = await Performance.findOne({ _id: perfId });

      const toc = await Consentable.retrieve({ type: 'general_toc' }, 'latest');

      await this.ORM.transaction(async txc => {
        const consent = new UploadersConsent(toc, host, perf);
        txc.save(consent);
      });
    }
  };
}
