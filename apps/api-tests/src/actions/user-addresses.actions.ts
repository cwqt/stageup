import { api } from '../environment';
import { environment as env } from '../environment';
import { IUser, IAddress, Idless } from '@eventi/interfaces';

export default {
  //router.post <IAddress> ("/users/uid/addresses", Users.createAddress());
  createAddress: async (user: IUser, data: Idless<IAddress>): Promise<IAddress> => {
    const res = await api.post<IAddress>(`/users/${user._id}/addresses`, data, env.getOptions());
    return res.data;
  },

  //router.get <IAddress[]> ("/users/:uid/addresses", Users.readAddresses());
  readAddresses: async (user: IUser): Promise<IAddress[]> => {
    const res = await api.get<IAddress[]>(`/users/${user._id}/addresses`, env.getOptions());
    return res.data;
  },

  //router.put <IAddress> ("/users/:uid/addresses/:aid", Users.updateAddress());
  updateAddress: async (
    user: IUser,
    address: IAddress,
    data: { city: string; iso_country_code: string; postcode: string; street_name: string; street_number: number }
  ): Promise<IAddress> => {
    const res = await api.post<IAddress>(`/users/${user._id}/addresses/${address._id}`, data, env.getOptions());
    return res.data;
  },

  //router.delete <void> ("/users/:uid/addresses/:aid", Users.deleteAddress());
  deleteAddress: async (user: IUser, address: IAddress): Promise<void> => {
    const res = await api.post(`/users/${user._id}/addresses/${address._id}`, env.getOptions());
    return res.data;
  }
};
