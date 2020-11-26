import { NodeType, INode, capitalize } from "@eventi/interfaces";

const create = async <T>(nodeType: NodeType, data: T, creator_id?: string): Promise<void> => {
};

const read = async <T>(_id: string, nodeType?: NodeType): Promise<void> => {

};

const reduce = (data: INode): INode => {
  return {
    _id: data._id,
    created_at: data.created_at,
    type: data.type,
  };
};

const remove = async (_id: string, nodeType: NodeType, //txc?: Transaction
    ) => {
//   return sessionable(async (t: Transaction) => {
//     await t.run(
//       ` MATCH (n:${nodeType ? capitalize(nodeType) : "Node"} {_id:$id})
//         DETACH DELETE n`,
//       {
//         id: _id,
//       }
//     );
//   }, txc);
};

const update = async (_id: string, body: { [index: string]: any }, nodeType?: NodeType) => {
};

export default { create, read, update, reduce, remove };
