<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="com.eventmgmt.MongoConnection, com.eventmgmt.TicketDAO" %>
<%@ page import="com.mongodb.client.MongoDatabase" %>
<%@ page import="org.bson.Document" %>
<%@ page import="java.util.Date, java.text.SimpleDateFormat, java.util.Map" %>
<%
  String ticketId = request.getParameter("id");
  if (ticketId == null || ticketId.isBlank()) {
      response.setStatus(400);
      out.println("<p>Missing ticket id.</p>");
      return;
  }

  String mongoUri = application.getInitParameter("mongoUri");
  String mongoDb  = application.getInitParameter("mongoDb");
  MongoDatabase db = MongoConnection.database(mongoUri, mongoDb);
  TicketDAO dao = new TicketDAO(db);
  Map<String, Object> data = dao.loadTicketWithEvent(ticketId);

  if (data == null) {
      response.setStatus(404);
%>
<!doctype html>
<html><head><title>Ticket not found</title>
<link rel="stylesheet" href="styles.css"></head>
<body><div class="card"><h1>Ticket not found</h1><p>ID <code><%= ticketId %></code> doesn't match any ticket.</p></div></body></html>
<%
      return;
  }

  Document ticket = (Document) data.get("ticket");
  Document event  = (Document) data.get("event");
  String qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=" + ticketId;
  SimpleDateFormat fmt = new SimpleDateFormat("EEE, d MMM yyyy · h:mm a");
  String when = event != null && event.getDate("dateTime") != null ? fmt.format((Date) event.getDate("dateTime")) : "TBA";
  String title = event != null ? String.valueOf(event.get("title")) : "Event";
  String venue = event != null ? String.valueOf(event.get("venue")) : "";
  boolean checkedIn = ticket.getBoolean("checkedIn", false);
%>
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title><%= title %> — Ticket</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="ticket">
    <div class="ticket-header">
      <div class="brand">🎟️ EventHub</div>
      <% if (checkedIn) { %><div class="badge badge-checked">CHECKED IN</div><% } else { %><div class="badge">VALID</div><% } %>
    </div>
    <div class="ticket-body">
      <div class="ticket-info">
        <h1><%= title %></h1>
        <p class="muted"><%= when %></p>
        <p class="muted"><%= venue %></p>
        <hr />
        <p><strong>Attendee:</strong> <%= ticket.getString("attendeeName") %></p>
        <p><strong>Tier:</strong> <%= ticket.getString("tierName") %></p>
        <p><strong>Price:</strong> ₹<%= ticket.get("price") %></p>
        <p class="ticket-id">Ticket ID: <code><%= ticketId %></code></p>
      </div>
      <div class="ticket-qr">
        <img src="<%= qrUrl %>" alt="QR" width="240" height="240" />
        <p class="muted">Show this at entry</p>
      </div>
    </div>
    <div class="ticket-footer">
      <button onclick="window.print()" class="print-btn">🖨️ Print</button>
    </div>
  </div>
</body>
</html>
