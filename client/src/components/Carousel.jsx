import {useState, createRef} from "react";

import {MdNavigateNext, MdNavigateBefore} from "react-icons/md";

const Carousel = (props) => {
  const {items, render, keyName} = props;
  const [position, setPosition] = useState(0);
  const sliderRef = createRef();
  
  function updatePosition(e) {
    setPosition(sliderRef.current.scrollLeft);
  }

  function slidePrev() {
    const slider = sliderRef.current;

    if(slider.scrollLeft - slider.offsetWidth < 0) {
      slider.scroll(0, 0);
    } else {
      slider.scroll(position - slider.offsetWidth, 0);
    }
  }

  function slideNext() {
    const slider = sliderRef.current;
    const maxLength = (items.length - 1) * (slider.offsetWidth);

    if(slider.scrollLeft + slider.offsetWidth > maxLength) {
      slider.scroll(maxLength, 0);
    } else {
      sliderRef.current.scroll(position + sliderRef.current.offsetWidth, 0);
    }
  }

  return (
    <div className="carousel-container">
      <div 
        ref={sliderRef} 
        className="carousel-slider"
        onScroll={updatePosition}
      >
        {items.map((item) => (
          render(item,  typeof item  === "string" ? item : (item[keyName] || item["_id"])))
        )}
      </div>
      <div className="carousel-control">
        <div 
          className="carousel-prev"
          onClick={slidePrev}
        >
          <MdNavigateBefore />
        </div>
        <div 
          className="carousel-next"
          onClick={slideNext}
        >
          <MdNavigateNext />
        </div>
      </div>
    </div>
  )
}

export default Carousel;