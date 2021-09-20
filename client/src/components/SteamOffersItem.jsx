
const SteamOffersItem = ({game, distance = 0}) => {
  const {url, title, cover_image, prices} = game;

  return (
    <a className="carousel-item" 
      href={url} target="_blank" rel="noreferrer"
      style={{
          borderLeft: `${parseInt(distance) / 2}px solid hsl(220, 13%, 18%, 80%)`,
          borderRight: `${parseInt(distance) / 2}px solid hsl(220, 13%, 18%, 80%)`,
      }}
    >
      <div className="carousel-image">
        <img src={cover_image} alt={`${title}'s cover`} />
      </div>
      <div className="steam-offers-item-info">
        <div className="steam-offers-title-genres">
          <span className="title">{title}</span>
        </div>
        <div className="steam-offers-item-price">
          <div className="steam-discount">
            <span>{prices.discount}</span>
          </div>
          <div className="steam-prices">
            <div className="base-price">
              <span>{prices.fullPrice}</span>
            </div>
            <div className="current-price">
              <span>{prices.currentPrice}</span>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}

export default SteamOffersItem;