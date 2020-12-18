export interface ISigningKey {
    _id: number;
    created_at:number;
    rsa256_key: string;
    mux_key_id: string;
}