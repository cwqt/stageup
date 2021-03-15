import { api } from '../environment';
import { environment as env, UserType } from '../environment';
import {
  ISearchResponse
} from '@core/interfaces';

export default {
    
    searchResponse: async (searchQuery: string, page: number = 0, perPage: number = 10): Promise<ISearchResponse> => {
        const res = await api.get<ISearchResponse>(`/search/results?searchQuery=${searchQuery}&page=${page}&perPage=${perPage}`, env.getOptions());
        return res.data;
    }
}