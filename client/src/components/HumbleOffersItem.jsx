const HumbleOffersItem = ({ game, distance }) => {
  const { url, title, cover_image, prices } = game;

  return (
    <a
      className="carousel-item humble-offers-item"
      href={url}
      target="_blank"
      rel="noreferrer"
      style={{
        borderLeft: `${parseInt(distance) / 2}px solid hsl(220, 13%, 18%, 80%)`,
        borderRight: `${
          parseInt(distance) / 2
        }px solid hsl(220, 13%, 18%, 80%)`,
      }}
    >
      <div className="carousel-image">
        <img src={cover_image} alt={`${title}'s cover`} />
      </div>
      <div className="humble-offers-item-info">
        <div className="humble-game-title">
          <span>
            {typeof title === "string" && title.length >= 40
              ? title.substr(0, 40) + " ..."
              : title}
          </span>
        </div>
        <div className="humble-prices">
          <div className="humble-discount">
            <span>{prices.discount}</span>
          </div>
          <div className="current-price">
            <span>{prices.currentPrice}</span>
          </div>
        </div>
      </div>
    </a>
  );
};

export default HumbleOffersItem;
