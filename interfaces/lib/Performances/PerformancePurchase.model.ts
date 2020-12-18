export interface IPerformancePurchase {
    _id: number;
    created_at:number;
    payment_id: number; // reference to stripe or something
    expiry: number; //UNIX epoch
    key_id: string; // Signing Key ID
    token: string; //the token itself to watch said video
}