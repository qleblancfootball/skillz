import { useState } from 'react'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1753561940654-2188b680c6d7?q=80&w=872&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'

export default function ImageWithFallback({
  src,
  alt,
  style,
  fallbackSrc = FALLBACK_IMAGE,
}) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc)

  return (
    <img
      src={imgSrc || fallbackSrc}
      alt={alt}
      style={style}
      onError={() => setImgSrc(fallbackSrc)}
    />
  )
}