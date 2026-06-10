import Image from "next/image"

type Props = {
  src?: string
  alt?: string
}

export function HeroBaseImage({
  src = "/images/harsh.png",
  alt = "Base layer",
}: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="100vw"
      className="object-cover z-[1]"
      preload
    />
  )
}
