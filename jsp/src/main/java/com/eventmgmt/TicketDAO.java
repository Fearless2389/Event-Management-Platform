package com.eventmgmt;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.util.HashMap;
import java.util.Map;

public class TicketDAO {

    private final MongoDatabase db;

    public TicketDAO(MongoDatabase db) {
        this.db = db;
    }

    public Map<String, Object> loadTicketWithEvent(String ticketId) {
        if (!ObjectId.isValid(ticketId)) return null;

        MongoCollection<Document> tickets = db.getCollection("tickets");
        MongoCollection<Document> events = db.getCollection("events");

        Document ticket = tickets.find(new Document("_id", new ObjectId(ticketId))).first();
        if (ticket == null) return null;

        Document event = events.find(new Document("_id", ticket.getObjectId("eventId"))).first();

        Map<String, Object> out = new HashMap<>();
        out.put("ticket", ticket);
        out.put("event", event);
        return out;
    }
}
