export function UserAvatar({
  name,
  avatarUrl,
  className = "size-10",
}: {
  name: string
  avatarUrl: string | null
  className?: string
}) {
  return (
    <div
      className={`bg-primary text-primary-foreground flex shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold ${className}`}
      title={name}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} className="size-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  )
}
