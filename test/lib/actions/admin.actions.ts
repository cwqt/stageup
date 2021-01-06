import { IHost, IHostStub, IEnvelopedData, IHostOnboarding } from "@eventi/interfaces";
import Axios from "axios";
import { environment } from "../environment";


export default {
  // router.get  <IE<IHOnboarding[], void>>("/admin/onboarding", Admin.readOnboardingProcesses())
  readOnboardingProcesses: async (page:number=1):Promise<IEnvelopedData<IHostOnboarding[], void>> => {
    const res = await Axios.get<IEnvelopedData<IHostOnboarding[], void>>(`${environment.baseUrl}/admin/onboarding?page=${page}`, environment.getOptions());
    return res.data;
  },
  
  // router.put  <void> ("/admin/onboarding/:oid/:step/issues", Admin.createOnboardingStepIssues());
  createOnboardingStepIssues: async (onboarding:IHostOnboarding):Promise<void> => {
    const res = await Axios.get(`${environment.baseUrl}/admin/onboarding/${onboarding._id}/enact`, environment.getOptions());
    return res.data;
  },
  
  // router.post <void> ("/admin/onboarding/:oid/verify", Admin.verifyOnboardingProcess());
  verifyOnboardingProcess: async (onboarding:IHostOnboarding):Promise<void> => {
    const res = await Axios.get(`${environment.baseUrl}/admin/onboarding/${onboarding._id}/enact`, environment.getOptions());
    return res.data;
  },

  // router.post <void> ("/admin/onboarding/:oid/enact", Admin.enactOnboardingProcess());
  enactOnboardingProcess: async (onboarding:IHostOnboarding):Promise<void> => {
    const res = await Axios.get(`${environment.baseUrl}/admin/onboarding/${onboarding._id}/enact`, environment.getOptions());
    return res.data;
  }
}