package com.eventmgmt;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;

public final class MongoConnection {
    private static volatile MongoClient client;

    private MongoConnection() {}

    public static MongoDatabase database(String uri, String dbName) {
        if (client == null) {
            synchronized (MongoConnection.class) {
                if (client == null) {
                    client = MongoClients.create(uri);
                }
            }
        }
        return client.getDatabase(dbName);
    }
}
