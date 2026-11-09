import '../css/Inventory.css'

function ItemCard({ item }) {
  return (
    <div className="itemCard">
      <img src={item.image} alt={item.name}></img>
      <p>{ item.name }</p>
    </div>
  );
}

export default ItemCard;