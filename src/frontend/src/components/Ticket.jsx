import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'

import '../css/Tickets.css'



function Ticket({ ticket }) {
  const [isActive, toggleIsActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentTime(Date.now()), 0);

    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    toggleIsActive(!isActive);
  }

  const deltaTime = (submittedTime) => {
    if (currentTime === null) return '...';

    return Math.floor((currentTime - new Date(submittedTime).getTime()) / 86400000);
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