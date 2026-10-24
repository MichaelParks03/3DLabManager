// image
// name
// where (which lab)
// list of requirements to use (certificates or scheduling link)
// discription of what it does
// animation through 3d model to show where it is OR location is adequetly hightlited 
// ticket button
// back button (goes back to products page)

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import '../css/Item.css'
import drillImage from '../assets/images/drill_image.jpg';


function Item({ product }) {
  const openTicketForm = () => {
    // <TicketForm />
    alert("clicked");
  };

  return (
    <div className="item">
      <div className="item_buttons">
        <button className="item_back_btn" href="location.href='inventory/'">
          <FontAwesomeIcon icon="fa-solid fa-arrow-left" style={{ fontSize: "15px" }} />
          Back
        </button>
        <button className="item_ticket_btn" onClick={openTicketForm}>Create Ticket</button>
      </div>
      <div className="item_container">
        <div className="item_info">
          {/* <h2 className="item_info_el">{product.name}</h2>
          <h4 className="item_info_el">{product.location}</h4>
          <h4 className="item_info_el">{product.requirements}</h4>
          <h4 className="item_info_el">{product.description}</h4> */}
          <div className="item_info_el">
            <h2>Drill</h2>
          </div>
          <div className="item_info_el">
            <h4>Location:</h4>
            <p>ERB 208</p>
          </div>
          <div className="item_info_el">
            <h4>Requirements:</h4>
            <p>None</p>
          </div>
          <div className="item_info_el">
            <h4>Description:</h4>
            <p className="description">Lorem Ipsum</p>
          </div>
        </div>
        {/* <img src="../assets/images/drill_image.jpg" alt={product.name}></img> */}
        <img src={drillImage} alt="drill"></img>

      </div>
    </div>
  )
}

export default Item