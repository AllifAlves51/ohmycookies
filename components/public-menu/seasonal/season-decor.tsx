import type { CSSProperties, ReactNode } from "react"
import type { SeasonId } from "@/lib/seasonal-themes"

/** Seasonal decorations for the storefront hero (and a light full-page
 * layer for some seasons). Pure SVG + CSS keyframes from globals.css: no
 * client JS, deterministic markup (no hydration mismatch), and everything
 * stops under prefers-reduced-motion via [data-season-motion]. */

/** Deterministic 0..1 pseudo-random, so server and client agree. */
function rand(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

function vars(style: Record<string, string | number>) {
  return style as CSSProperties
}

// Shapes ------------------------------------------------------------------

function Bat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 20" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M24 6c1.2-2 2.6-2 3.2-.2.9-1.1 1.8-1.1 2.3.1C33 2 39 0 48 4c-5 .4-8 3-9 7-2-2-4.6-1.8-6 .6-1.6-1.6-3.8-1.6-5.2.6C26.6 10.4 25.4 9.6 24 13c-1.4-3.4-2.6-2.6-3.8-.8-1.4-2.2-3.6-2.2-5.2-.6-1.4-2.4-4-2.6-6-.6-1-4-4-6.6-9-7C9 0 15 2 18.5 5.9c.5-1.2 1.4-1.2 2.3-.1.6-1.8 2-1.8 3.2.2z"
      />
    </svg>
  )
}

function Ghost({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 48" className={className} aria-hidden>
      <path
        fill="#fbf7ff"
        d="M20 2C9.5 2 3 10 3 20v24l5.6-4.4L14 44l6-4.4 6 4.4 5.4-4.4L37 44V20C37 10 30.5 2 20 2z"
      />
      <ellipse cx="14.5" cy="20" rx="2.6" ry="3.6" fill="#2a1446" />
      <ellipse cx="25.5" cy="20" rx="2.6" ry="3.6" fill="#2a1446" />
      <ellipse cx="20" cy="29" rx="3" ry="2" fill="#2a1446" opacity=".7" />
    </svg>
  )
}

function Witch({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 56" className={className} aria-hidden>
      <g fill="currentColor">
        {/* broom */}
        <path d="M14 40.5 84 31l.5 2.4-70 9.6z" />
        <path d="M2 36c5-2 9-3.6 13-4.4l1.6 11.6C12.4 44 7.4 45 2 46.4c3-2.8 4-5.6 0-10.4z" />
        {/* cloak and body */}
        <path d="M40 38c2-9 6-17 13-21l7 2c2 6 1 13-2 19-6-3-12-2-18 0z" />
        <path d="M44 38c-4 3-10 4-16 3 5-2 9-6 12-10z" />
        {/* head + hat */}
        <circle cx="58" cy="14" r="4.4" />
        <path d="M48 11.5c5-1.4 11-1.8 18-1l-.6 2.4c-6-.4-11.6 0-17 1z" />
        <path d="M52 11c1-5 1-9 -3-12 6 1 10 5 12 11z" />
        {/* arm on the broom */}
        <path d="M56 22c3 2 6 6 8 9l-2 1.4c-2.4-3-5-6-8-8z" />
      </g>
    </svg>
  )
}

function Spider({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 26" className={className} aria-hidden>
      <g stroke="#1b0d2e" strokeWidth="1.6" fill="none" strokeLinecap="round">
        <path d="M11 12 3 6M11 14 2 14M11 16 4 22M19 12l8-6M19 14h9M19 16l7 6" />
      </g>
      <ellipse cx="15" cy="15" rx="5.5" ry="6.5" fill="#1b0d2e" />
      <circle cx="13.2" cy="13" r="1" fill="#f97316" />
      <circle cx="16.8" cy="13" r="1" fill="#f97316" />
    </svg>
  )
}

function Pumpkin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 34" className={className} aria-hidden>
      <path d="M19 6c0-3 1-5 4-6-1 2-1.6 4-1.4 6z" fill="#3f6212" />
      <ellipse cx="13" cy="20" rx="10" ry="12" fill="#ea580c" />
      <ellipse cx="27" cy="20" rx="10" ry="12" fill="#ea580c" />
      <ellipse cx="20" cy="20" rx="9" ry="13" fill="#f97316" />
      <path d="M14 18l3-3 3 3zM20 18l3-3 3 3z" fill="#2a1446" />
      <path
        d="M13 24c4 3 10 3 14 0l-2 3-2-1.6-1.6 2-1.6-2-2 2-1.4-2z"
        fill="#2a1446"
      />
    </svg>
  )
}

function Snowflake({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <g
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      >
        <path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7" />
        <path d="m9 4 3 2.4L15 4M9 20l3-2.4 3 2.4" />
      </g>
    </svg>
  )
}

function Heart({
  className,
  color = "currentColor",
}: {
  className?: string
  color?: string
}) {
  return (
    <svg viewBox="0 0 24 22" className={className} aria-hidden>
      <path
        fill={color}
        d="M12 21.4 10.3 20C4.2 14.5 0 10.8 0 6.3 0 2.7 2.8 0 6.4 0c2 0 4 1 5.6 2.5C13.6 1 15.6 0 17.6 0 21.2 0 24 2.7 24 6.3c0 4.5-4.2 8.2-10.3 13.7z"
      />
    </svg>
  )
}

function Egg({
  className,
  fill,
  stripe,
}: {
  className?: string
  fill: string
  stripe: string
}) {
  return (
    <svg viewBox="0 0 30 38" className={className} aria-hidden>
      <path
        d="M15 1C7 1 1 14 1 23c0 8 6.3 14 14 14s14-6 14-14C29 14 23 1 15 1z"
        fill={fill}
      />
      <path
        d="M2.2 19c3-2.4 5.6-2.4 8.4 0s5.6 2.4 8.6 0 5.6-2.4 8.6 0"
        stroke={stripe}
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="9" cy="28" r="1.6" fill={stripe} />
      <circle cx="15" cy="30" r="1.6" fill={stripe} />
      <circle cx="21" cy="28" r="1.6" fill={stripe} />
    </svg>
  )
}

function Flower({
  className,
  petal,
  center,
}: {
  className?: string
  petal: string
  center: string
}) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse
          key={angle}
          cx="16"
          cy="8.5"
          rx="5.4"
          ry="7.5"
          fill={petal}
          transform={`rotate(${angle} 16 16)`}
        />
      ))}
      <circle cx="16" cy="16" r="4.4" fill={center} />
    </svg>
  )
}

function Petal({ className, color }: { className?: string; color: string }) {
  return (
    <svg viewBox="0 0 16 20" className={className} aria-hidden>
      <path d="M8 0C3 4 0 9 2 14s9 7 12 2S13 4 8 0z" fill={color} />
    </svg>
  )
}

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="m12 1.5 2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 8.7l7.1-.6z"
      />
    </svg>
  )
}

// Building blocks ---------------------------------------------------------

function StarField({ count, salt }: { count: number; salt: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={vars({
            left: `${rand(i, salt) * 100}%`,
            top: `${rand(i, salt + 1) * 70}%`,
            width: rand(i, salt + 2) > 0.8 ? 3 : 2,
            height: rand(i, salt + 2) > 0.8 ? 3 : 2,
            animation: `season-twinkle ${2 + rand(i, salt + 3) * 3}s ease-in-out ${rand(i, salt + 4) * 3}s infinite`,
          })}
        />
      ))}
    </>
  )
}

/** Things drifting down the full height of their container. */
function Falling({
  count,
  salt,
  render,
  minSize = 8,
  maxSize = 18,
  minDuration = 9,
  maxDuration = 18,
  opacity = 0.9,
  distance = "260px",
}: {
  count: number
  salt: number
  render: (i: number, size: number) => ReactNode
  minSize?: number
  maxSize?: number
  minDuration?: number
  maxDuration?: number
  opacity?: number
  /** How far they fall: the hero's height, or the viewport for the
   * full-page layer. */
  distance?: string
}) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const size = minSize + rand(i, salt) * (maxSize - minSize)
        const duration =
          minDuration + rand(i, salt + 1) * (maxDuration - minDuration)
        return (
          <span
            key={i}
            className="absolute top-0"
            style={vars({
              left: `${rand(i, salt + 2) * 100}%`,
              width: size,
              height: size,
              "--drift": `${(rand(i, salt + 3) - 0.5) * 120}px`,
              "--spin": `${(rand(i, salt + 4) - 0.5) * 720}deg`,
              "--o": opacity,
              "--fall": distance,
              opacity: 0,
              animation: `season-fall ${duration}s linear ${-rand(i, salt + 5) * duration}s infinite`,
            })}
          >
            {render(i, size)}
          </span>
        )
      })}
    </>
  )
}

/** Things floating up from the bottom of their container. */
function Rising({
  count,
  salt,
  render,
  minSize = 10,
  maxSize = 22,
  opacity = 0.85,
}: {
  count: number
  salt: number
  render: (i: number) => ReactNode
  minSize?: number
  maxSize?: number
  opacity?: number
}) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const size = minSize + rand(i, salt) * (maxSize - minSize)
        const duration = 6 + rand(i, salt + 1) * 6
        return (
          <span
            key={i}
            className="absolute bottom-0"
            style={vars({
              left: `${rand(i, salt + 2) * 100}%`,
              width: size,
              height: size,
              "--drift": `${(rand(i, salt + 3) - 0.5) * 80}px`,
              "--o": opacity,
              opacity: 0,
              animation: `season-rise ${duration}s ease-out ${-rand(i, salt + 4) * duration}s infinite`,
            })}
          >
            {render(i)}
          </span>
        )
      })}
    </>
  )
}

function Bobbing({
  className,
  delay = 0,
  tilt = -4,
  duration = 4,
  children,
}: {
  className: string
  delay?: number
  tilt?: number
  duration?: number
  children: ReactNode
}) {
  return (
    <span
      className={`absolute ${className}`}
      style={vars({
        "--tilt": `${tilt}deg`,
        animation: `season-bob ${duration}s ease-in-out ${delay}s infinite`,
      })}
    >
      {children}
    </span>
  )
}

function FlyingBat({
  top,
  duration,
  delay,
  scale,
}: {
  top: string
  duration: number
  delay: number
  scale: number
}) {
  return (
    <span
      className="absolute left-0 text-white/80"
      style={vars({
        top,
        "--s": scale,
        animation: `season-fly ${duration}s linear ${delay}s infinite`,
      })}
    >
      <span
        className="block"
        style={{ animation: "season-flap .32s ease-in-out infinite" }}
      >
        <Bat className="h-4 w-10" />
      </span>
    </span>
  )
}

// Heroes ----------------------------------------------------------------

function HalloweenHero() {
  return (
    <>
      <StarField count={26} salt={1} />
      {/* moon */}
      <span
        className="absolute top-5 right-[9%] size-28 rounded-full bg-amber-100/30 blur-2xl"
        style={{ animation: "season-glow 6s ease-in-out infinite" }}
      />
      <span className="absolute top-8 right-[12%] size-16 rounded-full bg-[radial-gradient(circle_at_35%_35%,#fffbe8,#fde68a)] shadow-[0_0_40px_10px_rgba(253,230,138,.25)]">
        <span className="absolute top-4 left-3 size-3 rounded-full bg-amber-200/70" />
        <span className="absolute top-9 left-8 size-2 rounded-full bg-amber-200/70" />
        <span className="absolute top-3 left-9 size-1.5 rounded-full bg-amber-200/70" />
      </span>
      {/* witch crossing the sky */}
      <span
        className="absolute top-10 left-0 text-white/90"
        style={vars({
          "--s": 1,
          animation: "season-fly 26s linear -6s infinite",
        })}
      >
        <Witch className="h-11 w-20 drop-shadow-[0_0_6px_rgba(255,255,255,.35)]" />
      </span>
      <FlyingBat top="22%" duration={14} delay={-2} scale={0.9} />
      <FlyingBat top="38%" duration={18} delay={-9} scale={0.65} />
      <FlyingBat top="14%" duration={21} delay={-15} scale={0.5} />
      {/* spider on its thread */}
      <span
        className="absolute top-0 left-[14%] flex flex-col items-center"
        style={{ animation: "season-dangle 5s ease-in-out infinite" }}
      >
        <span className="h-12 w-px bg-white/40" />
        <Spider className="h-6 w-7" />
      </span>
      <Bobbing className="bottom-6 left-[30%] h-12 w-10" duration={5}>
        <Ghost className="size-full opacity-90" />
      </Bobbing>
      <Bobbing className="bottom-2 left-[3%] h-9 w-11" duration={6} tilt={-2}>
        <Pumpkin className="size-full" />
      </Bobbing>
      <Bobbing
        className="right-[4%] bottom-1 h-7 w-8"
        duration={5.5}
        delay={-1.5}
        tilt={3}
      >
        <Pumpkin className="size-full" />
      </Bobbing>
    </>
  )
}

function ChristmasLights() {
  const colors = ["#f87171", "#facc15", "#4ade80", "#60a5fa", "#f472b6"]
  return (
    <svg
      viewBox="0 0 400 40"
      preserveAspectRatio="none"
      className="absolute inset-x-0 top-0 h-10 w-full"
      aria-hidden
    >
      <path
        d="M0 6 Q50 30 100 8 T200 8 T300 8 T400 6"
        stroke="#0b2016"
        strokeWidth="1.5"
        fill="none"
      />
      {Array.from({ length: 16 }, (_, i) => {
        const x = 12 + i * 25
        const t = (x % 100) / 100
        const y = 7 + Math.sin(t * Math.PI) * 14
        return (
          <circle
            key={i}
            cx={x}
            cy={y + 4}
            r="3.4"
            fill={colors[i % colors.length]}
            style={{
              animation: `season-twinkle ${1.4 + (i % 3) * 0.5}s ease-in-out ${(i % 4) * 0.35}s infinite`,
              filter: `drop-shadow(0 0 4px ${colors[i % colors.length]})`,
            }}
          />
        )
      })}
    </svg>
  )
}

function ChristmasHero() {
  return (
    <>
      <ChristmasLights />
      <Falling
        count={34}
        salt={7}
        minSize={6}
        maxSize={14}
        minDuration={4}
        maxDuration={8}
        render={() => <Snowflake className="size-full text-white" />}
      />
      <span
        className="absolute top-12 right-[12%] text-yellow-300"
        style={{ animation: "season-glow 3s ease-in-out infinite" }}
      >
        <Star className="size-7 drop-shadow-[0_0_10px_rgba(253,224,71,.8)]" />
      </span>
      {/* pine silhouettes */}
      <svg
        viewBox="0 0 400 60"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-14 w-full"
        aria-hidden
      >
        <path
          fill="#062417"
          d="M0 60V40l12-14 10 12 14-30 16 32 10-12 16 22 14-26 18 30 12-16 14 20 16-34 18 34 10-14 16 18 14-28 18 30 12-12 14 16 16-32 18 32 10-12 16 20 14-24 16 26 12-10 16 18V60z"
        />
      </svg>
    </>
  )
}

function EasterHero() {
  const eggs = [
    {
      cls: "bottom-4 left-[6%] h-12 w-9",
      fill: "#c4b5fd",
      stripe: "#7c3aed",
      d: 0,
    },
    {
      cls: "bottom-8 left-[24%] h-9 w-7",
      fill: "#fbcfe8",
      stripe: "#db2777",
      d: -1.2,
    },
    {
      cls: "bottom-5 right-[22%] h-11 w-8",
      fill: "#a7f3d0",
      stripe: "#059669",
      d: -2.1,
    },
    {
      cls: "bottom-10 right-[6%] h-9 w-7",
      fill: "#fde68a",
      stripe: "#d97706",
      d: -0.6,
    },
  ]
  return (
    <>
      <Falling
        count={14}
        salt={11}
        minSize={6}
        maxSize={10}
        opacity={0.8}
        render={(i) => (
          <Star
            className={`size-full ${i % 2 ? "text-amber-300" : "text-white"}`}
          />
        )}
      />
      {eggs.map((egg, i) => (
        <Bobbing
          key={i}
          className={egg.cls}
          delay={egg.d}
          tilt={i % 2 ? 6 : -6}
        >
          <Egg
            className="size-full drop-shadow-sm"
            fill={egg.fill}
            stripe={egg.stripe}
          />
        </Bobbing>
      ))}
    </>
  )
}

function ValentinesHero() {
  const tones = ["#fecdd3", "#fda4af", "#ffffff", "#fb7185"]
  return (
    <>
      <StarField count={12} salt={3} />
      <Rising
        count={18}
        salt={5}
        render={(i) => (
          <Heart className="size-full" color={tones[i % tones.length]} />
        )}
      />
      <Bobbing className="top-8 right-[10%] size-14" duration={3.2} tilt={-8}>
        <Heart
          className="size-full drop-shadow-[0_0_14px_rgba(251,113,133,.7)]"
          color="#fecdd3"
        />
      </Bobbing>
    </>
  )
}

function Bunting() {
  const colors = [
    "#ef4444",
    "#f59e0b",
    "#22c55e",
    "#3b82f6",
    "#a855f7",
    "#ec4899",
  ]
  return (
    <span
      className="absolute inset-x-0 top-0 block origin-top"
      style={{ animation: "season-sway 4s ease-in-out infinite" }}
    >
      <svg
        viewBox="0 0 400 46"
        preserveAspectRatio="none"
        className="h-11 w-full"
        aria-hidden
      >
        <path
          d="M-4 4 Q200 30 404 4"
          stroke="#fde68a"
          strokeWidth="1.2"
          fill="none"
        />
        {Array.from({ length: 18 }, (_, i) => {
          const x = 4 + i * 22.5
          const t = x / 400
          const y = 4 + Math.sin(t * Math.PI) * 13
          return (
            <path
              key={i}
              d={`M${x - 9} ${y} L${x + 9} ${y} L${x} ${y + 17} Z`}
              fill={colors[i % colors.length]}
              opacity=".95"
            />
          )
        })}
      </svg>
    </span>
  )
}

function JuneHero() {
  return (
    <>
      <StarField count={20} salt={9} />
      <Bunting />
      <Rising
        count={22}
        salt={13}
        minSize={3}
        maxSize={6}
        opacity={1}
        render={(i) => (
          <span
            className="block size-full rounded-full"
            style={{
              background: i % 3 ? "#fbbf24" : "#fb923c",
              boxShadow: "0 0 6px 2px rgba(251,146,60,.6)",
            }}
          />
        )}
      />
      <span
        className="absolute bottom-0 left-1/2 h-16 w-40 -translate-x-1/2 rounded-[50%] bg-orange-500/40 blur-2xl"
        style={{ animation: "season-glow 2.4s ease-in-out infinite" }}
      />
    </>
  )
}

function MothersDayHero() {
  const petals = ["#f9a8d4", "#fbcfe8", "#f472b6", "#ffffff"]
  return (
    <>
      <Falling
        count={20}
        salt={17}
        minSize={9}
        maxSize={15}
        render={(i) => (
          <Petal className="size-full" color={petals[i % petals.length]} />
        )}
      />
      <Bobbing className="bottom-4 left-[5%] size-12" duration={5}>
        <Flower className="size-full" petal="#f472b6" center="#fde68a" />
      </Bobbing>
      <Bobbing className="right-[8%] bottom-8 size-9" duration={4.4} delay={-1}>
        <Flower className="size-full" petal="#f9a8d4" center="#fef3c7" />
      </Bobbing>
      <Bobbing className="top-6 right-[24%] size-7" duration={4.8} delay={-2}>
        <Flower className="size-full" petal="#e879f9" center="#fde68a" />
      </Bobbing>
    </>
  )
}

const HEROES: Record<SeasonId, () => ReactNode> = {
  halloween: HalloweenHero,
  christmas: ChristmasHero,
  easter: EasterHero,
  valentines: ValentinesHero,
  june: JuneHero,
  mothers_day: MothersDayHero,
}

export function SeasonHeroDecor({ season }: { season: SeasonId }) {
  const Hero = HEROES[season]
  return (
    <div
      data-season-motion
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <Hero />
    </div>
  )
}

/** A sparse full-page layer for the seasons where it reads well (snow,
 * hearts, petals). Kept faint so the menu stays readable. */
export function SeasonAmbient({ season }: { season: SeasonId }) {
  let content: ReactNode = null
  if (season === "christmas") {
    content = (
      <Falling
        count={16}
        salt={23}
        minSize={5}
        maxSize={10}
        minDuration={14}
        maxDuration={24}
        opacity={0.5}
        distance="105vh"
        render={() => <Snowflake className="size-full text-sky-200" />}
      />
    )
  } else if (season === "mothers_day") {
    content = (
      <Falling
        count={10}
        salt={29}
        minSize={8}
        maxSize={12}
        minDuration={16}
        maxDuration={26}
        opacity={0.45}
        distance="105vh"
        render={(i) => (
          <Petal className="size-full" color={i % 2 ? "#f9a8d4" : "#fbcfe8"} />
        )}
      />
    )
  } else if (season === "halloween") {
    content = (
      <Falling
        count={8}
        salt={31}
        minSize={8}
        maxSize={12}
        minDuration={18}
        maxDuration={30}
        opacity={0.35}
        distance="105vh"
        render={() => <Star className="size-full text-orange-400" />}
      />
    )
  }

  if (!content) return null

  return (
    <div
      data-season-motion
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {content}
    </div>
  )
}
