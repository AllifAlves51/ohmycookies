export function PromoBanner({ photoUrl }: { photoUrl: string | null }) {
  return (
    <div className="bg-secondary relative min-h-56 overflow-hidden rounded-2xl">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />
      <div className="relative flex h-full min-h-56 flex-col justify-center gap-2 p-6 text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.webp"
          alt="OhMyCookies"
          className="mb-2 size-14 rounded-full bg-white object-contain p-1"
        />
        <h3 className="text-2xl leading-tight font-bold">
          Seu momento pede
          <br />
          um cookie.
        </h3>
        <p className="max-w-xs text-sm text-white/90">
          Cookies artesanais, feitos com muito amor e ingredientes
          selecionados.
        </p>
      </div>
    </div>
  )
}
