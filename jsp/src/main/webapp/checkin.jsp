<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="com.eventmgmt.MongoConnection, com.eventmgmt.TicketDAO" %>
<%@ page import="com.mongodb.client.MongoDatabase" %>
<%@ page import="org.bson.Document" %>
<%@ page import="java.util.Date, java.text.SimpleDateFormat, java.util.Map" %>
<%
  String ticketId = request.getParameter("id");
  boolean alreadyChecked = "1".equals(request.getParameter("already"));

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
<html><head><title>Invalid ticket</title>
<link rel="stylesheet" href="styles.css"></head>
<body><div class="card"><h1>❌ Invalid ticket</h1><p>ID <code><%= ticketId %></code> doesn't match any ticket.</p></div></body></html>
<%
      return;
  }

  Document ticket = (Document) data.get("ticket");
  Document event  = (Document) data.get("event");
  SimpleDateFormat fmt = new SimpleDateFormat("h:mm a · d MMM");
  Date checkedAt = ticket.getDate("checkedInAt");
  String when = checkedAt != null ? fmt.format(checkedAt) : "just now";
  String title = event != null ? String.valueOf(event.get("title")) : "Event";
%>
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Check-in — <%= title %></title>
  <link rel="stylesheet" href="styles.css" />
  <style>
    body { display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  </style>
</head>
<body>
  <div class="checkin <%= alreadyChecked ? "warn" : "ok" %>">
    <% if (alreadyChecked) { %>
      <div class="big">⚠️</div>
      <h1>Already checked in</h1>
      <p class="muted">This ticket was used at <%= when %>.</p>
    <% } else { %>
      <div class="big">✅</div>
      <h1>Checked in</h1>
      <p class="muted">Welcome, <%= ticket.getString("attendeeName") %></p>
    <% } %>

    <hr />

    <div class="row"><span>Event</span><strong><%= title %></strong></div>
    <div class="row"><span>Tier</span><strong><%= ticket.getString("tierName") %></strong></div>
    <div class="row"><span>Attendee</span><strong><%= ticket.getString("attendeeName") %></strong></div>
    <div class="row"><span>Email</span><strong><%= ticket.getString("attendeeEmail") %></strong></div>
    <div class="row"><span>Time</span><strong><%= when %></strong></div>
  </div>
</body>
</html>
