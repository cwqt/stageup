import { ConsentableType, IConsentable } from "@core/interfaces";
import { api, environment as env } from '../environment';
import fd from 'form-data';

export default {
  // router.get<IConsentable<CT>>("/gdpr/documents/:type/:version", Gdpr.readLatestDocument);
  readLatestDocument: async (type: ConsentableType): Promise<IConsentable<ConsentableType>> => {
    const res = await api.get<IConsentable<ConsentableType>>(`/gdpr/documents/${type}/latest`, env.getOptions());
    return res.data;
  },

  // router.get<IConsentable<CT>[]>("/gdpr/documents/:version", Gdpr.readAllLatestDocuments);
  readAllLatestDocuments: async (): Promise<IConsentable<ConsentableType>[]> => {
    const res = await api.get<IConsentable<ConsentableType>[]>("/gdpr/documents/latest", env.getOptions());
    return res.data;
  },

  // router.post<void>("/gdpr/documents/:type/supersede", Gdpr.uploadDocument);
  uploadDocument: async (type: ConsentableType, data: fd | null) => {
    const options = env.getOptions();
    options.headers['Content-Type'] = data.getHeaders()['content-type'];
    await api.post<void>(`gdpr/documents/${type}/supersede`, data, options);
  },

  // router.put<void>("/gdpr/:hid/:pid/set-stream-compliance", Gdpr.updateStreamCompliance);
  updateStreamCompliance: async(isCompliant: boolean, hostId: string, performanceId: string): Promise<void> => {
    await api.put<void>(`gdpr/${hostId}/${performanceId}/set-stream-compliance`, { is_compliant: isCompliant }, env.getOptions());
  }
}
