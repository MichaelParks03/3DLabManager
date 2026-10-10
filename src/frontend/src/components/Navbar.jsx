import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import SearchBar from './Search';
import "../css/Navbar.css"

function Navbar() {
  const { pathname } = useLocation();
  const loggedIn = true;

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className='navbar-el' style={{fontWeight : 'bold', fontSize : '25px'}}>3D.</Link>
        {pathname !== '/' && <SearchBar />}
      </div>
      <div className="navbar-links">
        <Link to="/" className="navbar-el">Home</Link>
        <Link to="/labs" className="navbar-el">Labs</Link>
        <Link to="/tickets" className="navbar-el">Tickets</Link>
        { loggedIn ? (
            <Link to="/account" className="navbar-el">
              <FontAwesomeIcon icon="fa-solid fa-circle-user" style={{fontSize : "25px"}}/>
            </Link>
          ) : (
          <Link to="/login" className="navbar-el">
            <FontAwesomeIcon icon="fa-solid fa-arrow-right-to-bracket" style={{fontSize : "25px"}} />
          </Link>
          )
        }
      </div>
      <div className='navbar-underline'></div>
    </nav>
  )
}

export default Navbar