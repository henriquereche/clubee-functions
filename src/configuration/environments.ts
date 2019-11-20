class EnvironmentSettings {
    public mongoConnection: string;
    public mongoDatabase: string;

    constructor() {
        this.mongoConnection = process.env['MONGO_CONNECTION'];
        this.mongoDatabase = process.env['MONGO_DATABASE'];
    }
}

export const Environments = new EnvironmentSettings();