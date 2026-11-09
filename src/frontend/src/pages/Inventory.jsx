import { useState } from 'react'

import ItemCard from '../components/ItemCard'

import '../css/Inventory.css'

import appleImage from '../assets/images/apple.avif'
import defaultImage from '../assets/images/default-icon.jpg'
import drillImage from '../assets/images/drill_image.jpg'
import profileImage from '../assets/images/tmp_profile_image.jpeg'

const ITEMS = [
  { id: 1, name: 'Apple', image: appleImage },
  { id: 2, name: 'Banana', image: defaultImage },
  { id: 3, name: 'Orange', image: drillImage },
  { id: 4, name: 'Pineapple', image: profileImage },
  { id: 1, name: 'Apple', image: appleImage },
  { id: 2, name: 'Banana', image: defaultImage },
  { id: 3, name: 'Orange', image: drillImage },
  { id: 4, name: 'Pineapple', image: profileImage },
  { id: 1, name: 'Apple', image: appleImage },
  { id: 2, name: 'Banana', image: defaultImage },
  { id: 3, name: 'Orange', image: drillImage },
  { id: 4, name: 'Pineapple', image: profileImage },
];

function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const filteredResults = ITEMS.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="inventory">
      <div className="inventory_container">
        {filteredResults.map((item) => (
          // TODO: add link to item page
            <ItemCard
            key={item.id}
            item={item}
            />
        ))}
      </div>
    </div>
  )
}

export default Inventory