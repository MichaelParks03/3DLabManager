import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'

import '../css/Tickets.css'



function Ticket({ ticket }) {
  const [isActive, toggleIsActive] = useState(false);

  const handleClick = () => {
    toggleIsActive(!isActive);
  }

  const deltaTime = (submitted_time) => {
    const current_time = new Date()

    return current_time.getDate() - submitted_time.getDate()
  }

  return (
    <button onClick={handleClick} className={`tickets-element`}>
      <p><b>Id:</b>          {ticket.id}</p>
      <p><b>Ticket Name:</b> {ticket.ticket_name}</p>
      <p><b>User:</b>        {ticket.user}</p>
      <p><b>Days Open:</b>   {deltaTime(ticket.time_submitted)}</p>
      { isActive ? 
        <FontAwesomeIcon className="tickets-dropdown-arrow" icon="fa-solid fa-angle-up" style={{fontSize : "25px"}}/>
      : 
        <FontAwesomeIcon className="tickets-dropdown-arrow" icon="fa-solid fa-angle-down" style={{fontSize : "25px"}}/>
      }

      {isActive && (
        <div className="tickets-description">
          <b>Description:</b>
          <div className="tickets-description-text">{ticket.desc}</div>
        </div>
      )}
    </button>
  )
}

export default Ticket