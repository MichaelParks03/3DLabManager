import Ticket from "../components/Ticket"

import "../css/Tickets.css"

function Tickets() {
  const tickets = [
    { id: '1', ticket_name: "ticket1", user: "user1", desc:"lorem Ipsum", equipment:"robot arm", time_submitted: new Date("October 1, 2026")},
    { id: '2', ticket_name: "ticket2", user: "user2", desc:"lorem Ipsum2", equipment:"wires", time_submitted: new Date("October 5, 2026")},
    { id: '3', ticket_name: "ticket3", user: "user3", desc:"lorem Ipsum3", equipment:"tv", time_submitted: new Date("October 12, 2026")}
  ]

  return (
    <div className="tickets">
      <div className="tickets-container">
        <h2 className="tickets-h2">Tickets:</h2>
        {tickets.map((ticket) => (
          <Ticket 
            key={ticket.id}
            ticket={ticket} 
          />
          // {ticket.id}
        ))}
      </div>
    </div>
  )
}

export default Tickets