export const Illustration = ({ name, alt, caption, priority = false }) => (
  <figure className="soran-figure">
    <picture className="soran-illustration-light">
      <source media="(max-width: 640px)" srcSet={`/images/${name}-mobile.svg`} width="600" height="720" />
      <img src={`/images/${name}.svg`} alt={alt} width="1200" height="650" loading={priority ? "eager" : "lazy"} decoding="async" />
    </picture>
    <picture className="soran-illustration-dark">
      <source media="(max-width: 640px)" srcSet={`/images/${name}-mobile-dark.svg`} width="600" height="720" />
      <img src={`/images/${name}-dark.svg`} alt={alt} width="1200" height="650" loading={priority ? "eager" : "lazy"} decoding="async" />
    </picture>
    {caption && <figcaption>{caption}</figcaption>}
  </figure>
);
