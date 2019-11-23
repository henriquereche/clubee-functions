import { AzureFunction, Context } from "@azure/functions"
import { MongoProvider } from "../src/providers/mongo.provider";
import { RelevanceModel } from "../src/models/relevance.model";
import { ObjectID } from "bson";

const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
    context.log(
        'Event-Relevance-Update started.', 
        new Date().toISOString()
    );

    const connection = await MongoProvider.getDatabaseConnection();
    const relevances = await connection.collection<RelevanceModel>('RelevanceCount')
        .find({ Collection: 'Event', Integrated: false })
        .toArray();

    for(const relevance of relevances) {
        try {
            if (relevance.Properties['Id']) {

                // Update exact establishment relevance.
                await connection.collection('Event')
                    .updateOne(
                        { '_id': new ObjectID(relevance.Properties['Id']) },
                        { '$inc': { 'Relevance': relevance.Count } }
                    );
    
            } else {
                let filter = { '$and': [] };
    
                // Geoespatial filter.
                if (relevance.Properties['Longitude'] && relevance.Properties['Latitude']) {
                    filter['$and'].push({
                        'Location.Coordinates' : {
                            '$nearSphere': { 
                                '$geometry': { 
                                    'type': 'Point', 
                                    'coordinates': [
                                        parseFloat(relevance.Properties['Longitude']),
                                        parseFloat(relevance.Properties['Latitude'])
                                    ]
                                }, 
                                '$maxDistance': parseInt(relevance.Properties['Meters'])
                            }
                        }
                    });
                }

                // Establishment filter.
                if (relevance.Properties['EstablishmentId']) {
                    filter['$and'].push({
                        'EstablishmentId': new ObjectID(relevance.Properties['EstablishmentId'])
                    });
                }
            
                // Genre filter.
                if (relevance.Properties['Genre']) {
                    filter['$and'].push({
                        'Genres': parseInt(relevance.Properties['Genre'])
                    });
                }

                // Name and Description filter.
                if (relevance.Properties['Query']) {
                    filter['$and'].push({ 
                        '$or': [
                            { 'Name': { $regex: `.*${relevance.Properties['Query']}*.`, $options: 'im' } },
                            { 'Description': { $regex: `.*${relevance.Properties['Query']}*.`, $options: 'im' } }
                        ]
                    });
                }
    
                // Updates a range of establishments.
                await connection.collection('Event')
                    .updateMany(
                        filter,
                        { '$inc': { 'Relevance': relevance.Count } }
                    );
            }
    
            // Set RelevanceCount as integrated.
            await connection.collection('RelevanceCount')
                .updateOne(
                    { '_id': new ObjectID(relevance._id) },
                    { '$set': { 'Integrated': true } }
                );
        } catch (ex) {
            context.log(
                'Event-Relevance-Update execution failed.', 
                new Date().toISOString(), 
                ex
            );
        }
    }

    context.log(
        'Event-Relevance-Update finished.', 
        new Date().toISOString()
    );
};

export default timerTrigger;
