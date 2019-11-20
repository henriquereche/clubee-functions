import { MongoClient, Db } from "mongodb";
import { Environments } from "../configuration/environments";

export class MongoProvider {
    public static async getDatabaseConnection() : Promise<Db> {
        const client = await MongoClient.connect(Environments.mongoConnection);
        return client.db(Environments.mongoDatabase);
    }
}