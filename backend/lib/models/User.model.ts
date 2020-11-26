// import { NodeType, IUser, IUserStub, IUserPrivate, DataModel } from "@eventi/interfaces";
// import bcrypt from "bcrypt";
// import Node from "../Node.model";

// type TUser = IUserPrivate | IUser | IUserStub;

// const create = async (user: IUserStub, password: string): Promise<IUser> => {
//   let u = user as IUserPrivate;
//   u.salt = await bcrypt.genSalt(10);
//   u.pw_hash = await bcrypt.hash(password, u.salt);

//   let data = await Node.create<IUserPrivate>(NodeType.User, u);
//   return reduce<IUser>(data, DataModel.Full);
// };

// const read = async <T extends TUser>(
//   _id: string,
//   dataModel: DataModel = DataModel.Stub
// ): Promise<T> => {
//   let data;
//   switch (dataModel) {
//     case DataModel.Stub:
//     case DataModel.Full:
//     case DataModel.Private: {
//       data = await Node.read<IUserPrivate>(_id, NodeType.User);
//     }
//   }
  
//   return reduce<T>(data, dataModel);
// };

// //hack the typing to give me what I want, since IUserPrivate has all props
// // e.g. User.reduce<IUser>(privateUser, DataModel.Full) --> IUser;
// const reduce = <K extends TUser>(data: TUser, dataModel: DataModel = DataModel.Stub): K => {
//   switch (dataModel) {
//     case DataModel.Stub: {
//       let r: IUserStub = {
//         ...Node.reduce(data),
//         name: (<IUserStub>data).name,
//         username: (<IUserStub>data).username,
//         avatar: (<IUserStub>data).avatar,
//       };
//       return r as K;
//     }

//     case DataModel.Full: {
//       let d = <IUser>data;
//       let r: IUser = {
//         ...reduce<IUserStub>(data, DataModel.Stub),
//         email_address: d.email_address,
//         is_verified: d.is_verified,
//         is_new_user: d.is_new_user,
//         is_admin: d.is_admin,
//         bio: d.bio,
//         cover_image: d.cover_image,
//       };
//       return r as K;
//     }

//     case DataModel.Private: {
//       let d = <IUserPrivate>data;
//       let r: IUserPrivate = {
//         ...reduce<IUser>(data, DataModel.Full),
//         salt: d.salt,
//         pw_hash: d.pw_hash,
//       };
//       return r as K;
//     }
//   }
// };

// const remove = async (_id: string, txc?: Transaction) => {
//   return await Node.remove(_id, NodeType.User, txc);
// };

// const update = async (_id: string, updates: Partial<Pick<IUser, "name" | "bio">>): Promise<IUser> => {
//   return {} as IUser;
// };

// export default { create, read, reduce, remove, update };
