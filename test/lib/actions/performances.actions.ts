import Axios from 'axios';
import { Stories, CachedUser } from '../stories';
import { environment as env, UserType } from '../environment';
import { IPerformance, IPerformanceHostInfo, IPerformanceStub, IPerformancePurchase, CurrencyCode, IPerformanceUserInfo, IEnvelopedData } from '@eventi/interfaces';

export default {
// router.post<IPerf>("/performances",Perfs.createPerformance());
createPerformance: async (data:{name: string, description: string, price: number, currency: CurrencyCode}) => {
    const res = await Axios.post(`${env.baseUrl}/performances}`, data,
          env.getOptions()
        );    
        return res.data;
      },
  
// router.get<IE<IPerfS[], null>>("/performances",Perfs.readPerformances());
readPerformances: async(): Promise <IEnvelopedData<IPerformanceStub[], IPerformanceUserInfo>> => {
    const res = await Axios.get(`${env.baseUrl}/performances`,
        env.getOptions()
    );
    return res.data;
},


// router.get<IE<IPerf, IPUInfo>>("/performances/:pid", Perfs.readPerformance());
readPerformance: async (performance: IPerformance): Promise<IEnvelopedData<IPerformance, IPerformanceUserInfo>> =>{
    const res = await Axios.get (`${env.baseUrl}/performances/${performance._id}`,
    env.getOptions()
    );
    return res.data;
},


// router.get<IPHInfo>("/performances/:pid/host_info", Perfs.readPerformanceHostInfo());
readPerformanceHostInfo: async (performance: IPerformance): Promise<IPerformanceHostInfo> => {
    const res = await Axios.get (`${env.baseUrl}/performances/${performance._id}/host_info`,
    env.getOptions()
    );
    return res.data;
},
// router.put<IPerf>("/performance/:pid",Perfs.updatePerformance());
updatePerformance: async (performance: IPerformance, data:{name: string, description: string, price: number}): Promise<IPerformance> => {
    const res = await Axios.put (`${env.baseUrl}/performance/${performance._id}`,
    env.getOptions()
    );
    return res.data;
},
    

// router.post<void>("/performances/:pid/purchase",Perfs.purchase());
purchase: async(performance: IPerformance): Promise<void> => {
    const res = await Axios.post (`${env.baseUrl}/performances/${performance._id}/purchase`, performance,
    env.getOptions()
    );
    return res.data;
},


// router.delete <void>("/performance/:pid",Perfs.deletePerformance());
deletePerformance: async (performance: IPerformance): Promise <void> => {
    const res = await Axios.delete (`${env.baseUrl}/performance/${performance._id}`, 
    env.getOptions()
    );
    return res.data;
},

};