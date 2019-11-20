import { ObjectID } from "bson";

export class RelevanceModel {
    public _id: ObjectID;
    public Expiration: Date;
    public Collection: string;
    public Properties: object;
    public Integrated: boolean;
    public Count: number;
}