import { useState, useEffect } from 'react';

import '../css/UserItem.css'

function UserItem({ item }) {
  const [currentTime, setCurrentTime] = useState(null);
  
  useEffect(() => {
    const timer = setTimeout(() => setCurrentTime(Date.now()), 0);

    return () => clearTimeout(timer);
  }, []);

  const deltaTime = (time) => {
    if (currentTime === null) return '...';

    return Math.floor((currentTime - new Date(time).getTime()) / 86400000);
  }

  return (
    <div className="checked_item">
      <img src={item.image} alt={item.name} />
      <p className="item-name">{item.name}</p>
      <p className="item-duration">Days Checked Out: {deltaTime(item.checkeoutDate)}</p>
    </div>
  )
}

export default UserItem