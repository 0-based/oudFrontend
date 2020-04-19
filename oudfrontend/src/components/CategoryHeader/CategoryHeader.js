import React from 'react'
import { Link } from "react-router-dom";


function CategoryHeader({ name, _id }) {
  return (
    <div className="row"
      data-testid="category-header"
    >
      <h1
        className="gray-white item-name"
        data-testid="category-title"
      >
        {name}
      </h1>
      <Link to={`genre/${name.split(' ').join('-')}?_id=${_id}&name=${name.split(' ').join('-')}`}>
        <div className="see-more"
          data-testid="category-see-all"
        >See All</div>
      </Link>
    </div>
  )
}

export default CategoryHeader