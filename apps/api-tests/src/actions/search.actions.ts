import { api } from '../environment';
import { environment as env, UserType } from '../environment';
import { ISearchResponse } from '@core/interfaces';

export default {
  search: async (searchQuery: string, page: number, perPage: number): Promise<ISearchResponse> => {
    const res = await api.get<ISearchResponse>(
      `/search?query=${searchQuery}&page=${page}&per_page=${perPage}`,
      env.getOptions()
    );
    return res.data;
  }
};
