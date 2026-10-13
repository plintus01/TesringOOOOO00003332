import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { cn } from "./utils/cn";
import {
  CATS,
  CITY,
  DISHES,
  HOURS,
  PHONE_PRETTY,
  PHONE_TEL,
  dishById,
  rub,
  type Cat,
  type Dish,
} from "./data";

const OPEN = 11 * 60;
const CLOSE = 23 * 60;

function cityParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Simferopol",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const pick = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const hour = Number(pick("hour") || "0");
  const minute = Number(pick("minute") || "0");
  return { mins: hour * 60 + minute, clock: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` };
}

function useCityClock() {
  const [now, setNow] = useState(() => cityParts());
  useEffect(() => {
    const id = window.setInterval(() => setNow(cityParts()), 20000);
    return () => window.clearInterval(id);
  }, []);
  return { open: now.mins >= OPEN && now.mins < CLOSE, clock: now.clock };
}

function useInView<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const IconPhone = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

function Img({ src, alt = "", className, style }: { src: string; alt?: string; className?: string; style?: CSSProperties }) {
  const [broken, setBroken] = useState(false);
  return (
    <img
      src={broken ? "images/set.jpg" : src}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}

function SetPlate({ dish }: { dish: Dish }) {
  const parts = dish.includes ?? [];
  const n = parts.length;
  const slices: { src: string; x: number; y: number; size: number }[] = [];

  const ring = (list: typeof parts, count: number, radius: number, size: number, offset: number) => {
    list.slice(0, count).forEach((part, i) => {
      const a = (i / count) * Math.PI * 2 + offset;
      slices.push({
        src: dishById(part.id)?.image ?? dish.image,
        x: 50 + Math.cos(a) * radius - size / 2,
        y: 50 + Math.sin(a) * radius - size / 2,
        size,
      });
    });
  };

  if (n <= 1) {
    ring(parts, Math.max(n, 1), 0, 62, -Math.PI / 2);
  } else if (n <= 5) {
    ring(parts, n, 30, 40, -Math.PI / 2);
  } else if (n <= 8) {
    ring(parts, n, 33, 31, -Math.PI / 2);
  } else {
    ring(parts.slice(0, 3), 3, 15, 22, Math.PI / 6);
    ring(parts.slice(3), n - 3, 35, 26, -Math.PI / 2);
  }

  return (
    <span className="set-plate" aria-hidden="true">
      <span className="set-plate-dish" />
      <span className="set-plate-area">
        {slices.map((s, i) => (
          <span
            key={`${s.src}-${i}`}
            className="roll-slice"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size}%`,
              height: `${s.size}%`,
              backgroundImage: `url(${s.src})`,
              animationDelay: `${Math.min(i, 12) * 0.06}s`,
            }}
          />
        ))}
      </span>
    </span>
  );
}

function CallLink({ label = "Позвонить", className = "btn-gold" }: { label?: string; className?: string }) {
  return (
    <a className={className} href={`tel:${PHONE_TEL}`}>
      <IconPhone />
      <span className="btn-stack">
        <small>{label}</small>
        {PHONE_PRETTY}
      </span>
    </a>
  );
}

function Intro({ onDone }: { onDone: () => void }) {
  const [cut, setCut] = useState(false);
  useEffect(() => {
    const a = window.setTimeout(() => setCut(true), 900);
    const b = window.setTimeout(onDone, 2000);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [onDone]);

  return (
    <div className={cn("intro", cut && "is-cut")}>
      <div className="intro-top" />
      <div className="intro-bot" />
      <div className="intro-seam" />
      <div className="intro-brand">
        <div>
          <img src="images/emblem.png" alt="" />
          <strong>KING ROLL</strong>
          <em>{CITY}</em>
        </div>
      </div>
      <button className="intro-skip" type="button" onClick={onDone}>
        Пропустить
      </button>
    </div>
  );
}

function KnifeCut({ flip = false }: { flip?: boolean }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  return (
    <div ref={ref} className={cn("knife-cut", inView && "in", flip && "is-flip")} aria-hidden="true">
      <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="kc-line">
        <line x1="0" y1="30" x2="1200" y2="30" stroke="url(#kcGrad)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <defs>
          <linearGradient id="kcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e0c48a" stopOpacity="0" />
            <stop offset="50%" stopColor="#f3e0b0" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#e0c48a" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function HugeChoice() {
  const ref = useRef<HTMLElement>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const compute = () => {
      const el = ref.current;
      if (!el) return;
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-el.getBoundingClientRect().top, 0), Math.max(total, 1));
      setP(total > 0 ? scrolled / total : 0);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section ref={ref} className="huge" id="choice" style={{ "--p": p } as CSSProperties}>
      <div className="huge-drift" aria-hidden="true">
        <span>ВЫБОР ВЫБОР ВЫБОР ВЫБОР</span>
        <span>ВЫБОР ВЫБОР ВЫБОР ВЫБОР</span>
      </div>
      <div className="huge-inner">
        <p className="huge-kicker">меню дома</p>
        <h2>
          <span>БЕЗУМНО</span>
          <span>ОГРОМНЫЙ</span>
          <span className="gold">ВЫБОР</span>
        </h2>
        <p className="huge-sub">{DISHES.length} позиций — суши, роллы, сеты, лапша. И всё это по одному звонку.</p>
        <p className="huge-menu">МЕНЮ</p>
      </div>
      <div className="huge-marquee" aria-hidden="true">
        <span>
          KING ROLL · {CITY.toUpperCase()} · 11:00—23:00 · {PHONE_PRETTY} · БЕЗУМНО ОГРОМНЫЙ ВЫБОР · МЕНЮ · KING ROLL · {CITY.toUpperCase()} · 11:00—23:00 · {PHONE_PRETTY} · БЕЗУМНО ОГРОМНЫЙ ВЫБОР · МЕНЮ ·
        </span>
      </div>
    </section>
  );
}

export default function App() {
  const [phase, setPhase] = useState<"draw" | "cut" | "done">("draw");
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cat, setCat] = useState<"all" | Cat>("all");
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [cutting, setCutting] = useState(false);
  const [railPos, setRailPos] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);
  const { open, clock } = useCityClock();

  useEffect(() => {
    document.body.style.overflow = navOpen || activeId || phase !== "done" ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [navOpen, activeId, phase]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveId(null);
        setNavOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const update = () => {
      const mid = window.innerWidth / 2;
      rail.querySelectorAll<HTMLElement>(".sign-card").forEach((card) => {
        const r = card.getBoundingClientRect();
        card.classList.toggle("is-cut", Math.abs(r.left + r.width / 2 - mid) < r.width * 0.42);
      });
      const max = rail.scrollWidth - rail.clientWidth;
      setRailPos(max > 4 ? rail.scrollLeft / max : 1);
    };
    update();
    rail.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      rail.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const featured = DISHES.filter((d) => d.featured);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DISHES.filter((d) => {
      if (cat !== "all" && d.cat !== cat) return false;
      if (!q) return true;
      return `${d.name} ${d.kicker} ${d.lore}`.toLowerCase().includes(q);
    });
  }, [cat, query]);

  const active = DISHES.find((d) => d.id === activeId);
  const openDish = (dish: Dish) => setActiveId(dish.id);

  const chooseCat = (id: "all" | Cat) => {
    setCat(id);
    setCutting(true);
    window.setTimeout(() => setCutting(false), 480);
  };

  return (
    <div className={cn("page", phase !== "draw" && "is-live")}>
      <div className="progress" style={{ width: `${scrolled ? 100 : 0}%` }} />

      {phase !== "done" && <Intro onDone={() => setPhase("done")} />}

      <header className={cn("nav", (scrolled || navOpen) && "is-on", navOpen && "is-open")}>
        <a className="brand" href="#top" onClick={() => setNavOpen(false)}>
          <img src="images/emblem.png" alt="" />
          <span>
            KING
            <br />
            ROLL
          </span>
        </a>
        <nav className="nav-links" aria-label="Разделы">
          <a href="#sign">Фирменные</a>
          <a href="#menu">Меню</a>
          <a href="#call">Звонок</a>
        </nav>
        <div className="nav-right">
          <a className="nav-phone" href={`tel:${PHONE_TEL}`}>
            {PHONE_PRETTY}
          </a>
          <button
            className="burger"
            type="button"
            aria-label={navOpen ? "Закрыть меню" : "Открыть меню"}
            onClick={() => setNavOpen((v) => !v)}
          >
            <i />
            <i />
            <i />
          </button>
        </div>
      </header>

      {navOpen && (
        <div className="mnav">
          <a href="#sign" onClick={() => setNavOpen(false)}>
            Фирменные
          </a>
          <a href="#menu" onClick={() => setNavOpen(false)}>
            Меню
          </a>
          <a href="#call" onClick={() => setNavOpen(false)}>
            Звонок
          </a>
          <a className="mnav-phone" href={`tel:${PHONE_TEL}`}>
            {PHONE_PRETTY}
          </a>
        </div>
      )}

      <section className="hero grain" id="top">
        <img className="hero-bg" src="images/knife-hero.jpg" alt="Нож режет ролл" />
        <div className="hero-shade" />
        <div className="vert">
          <span>
            {CITY} · {HOURS} · только звонок
          </span>
        </div>
        <div className="hero-copy">
          <p className="kicker">
            <span className={cn("dot", !open && "is-off")} />
            {open ? "Сейчас открыто · до 23:00" : "Сейчас закрыто · откроемся в 11:00"}
            <span>
              {clock} · {CITY}
            </span>
          </p>
          <h1 className="brand-hero">
            KING
            <br />
            ROLL
          </h1>
          <svg className="hero-blade" viewBox="0 0 460 36" fill="none" aria-hidden="true">
            <path d="M8 18h70" stroke="#e0c48a" strokeWidth="6" />
            <path d="M78 18h300" stroke="#f3e0b0" strokeWidth="1.4" />
            <path d="M378 18l70-2.2-70 2.2 70 2.2-70-2.2Z" fill="#f3e0b0" />
          </svg>
          <p className="hero-lead">Суши-дом Армянска. Доставка по городу. Связаться можно только по номеру.</p>
          <div className="hero-meta">
            <span>Ежедневно {HOURS}</span>
            <span>Доставка по {CITY}у</span>
            <span>Без форм и корзины</span>
          </div>
          <div className="cta-row">
            <CallLink label="Единственный способ" />
            <a className="btn-ghost" href="#menu">
              Открыть меню
            </a>
          </div>
        </div>
        <aside className="hero-card">
          <small>{open ? "Линия открыта" : "До открытия"}</small>
          <strong>{HOURS}</strong>
          <p>Заказ принимает человек. Назовите блюдо — кухня услышит его только из трубки.</p>
          <a href={`tel:${PHONE_TEL}`}>{PHONE_PRETTY}</a>
        </aside>
      </section>

      <KnifeCut />

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          <span>
            KING ROLL · {CITY.toUpperCase()} · 11:00—23:00 · {PHONE_PRETTY} · БЕЗУМНО ОГРОМНЫЙ ВЫБОР · МЕНЮ · <b>✦</b>
          </span>
          <span>
            KING ROLL · {CITY.toUpperCase()} · 11:00—23:00 · {PHONE_PRETTY} · БЕЗУМНО ОГРОМНЫЙ ВЫБОР · МЕНЮ · <b>✦</b>
          </span>
        </div>
      </div>

      <section className="craft" id="craft">
        <div className="watermark">РЕЗ</div>
        <div className="wrap craft-grid">
          <div>
            <p className="sec-kicker">01 — Дом</p>
            <h2 className="sec-title">
              Не лента. <em>Лезвие.</em>
            </h2>
            <p className="lede">
              KING ROLL готовит в Армянске каждый день с 11:00 до 23:00. Роллы, сеты, лапша и горячее — на этом сайте можно разглядеть и прочитать. Заказать можно только голосом, по одному номеру.
            </p>
            <div className="facts">
              <div className="fact">
                <b>11–23</b>
                <span>ежедневно, без выходных</span>
              </div>
              <div className="fact">
                <b>1</b>
                <span>номер на весь город</span>
              </div>
              <div className="fact">
                <b>{DISHES.length}</b>
                <span>позиций в карте дома</span>
              </div>
            </div>
          </div>
          <div className="mosaic">
            <img className="m1" src="images/king-roll.jpg" alt="Шеф режет ролл" />
            <img className="m2" src="images/philadelphia.jpg" alt="Фирменный ролл" />
            <img className="m3" src="images/mega-set.jpg" alt="Большой сет" />
          </div>
        </div>
      </section>

      <KnifeCut flip />

      <section className="sign" id="sign">
        <div className="sign-head">
          <div>
            <p className="sec-kicker">02 — Первый рез</p>
            <h2 className="sec-title">
              С чего начинают <em>вечер</em>
            </h2>
            <p className="sign-sub">Позиции, которые берут чаще всего. Состав по каждой внутри.</p>
            <span className="swipe-hint" aria-hidden="true">
              листайте вбок →
            </span>
          </div>
          <div className="rail-nav">
            <button
              type="button"
              aria-label="Назад"
              disabled={railPos <= 0.005}
              onClick={() => railRef.current?.scrollBy({ left: -Math.min(520, window.innerWidth * 0.84), behavior: "smooth" })}
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Дальше"
              disabled={railPos >= 0.995}
              onClick={() => railRef.current?.scrollBy({ left: Math.min(520, window.innerWidth * 0.84), behavior: "smooth" })}
            >
              →
            </button>
          </div>
        </div>
        <div className="rail-wrap">
          <div className="rail" ref={railRef}>
            {featured.map((dish, i) => (
              <article key={dish.id} className="sign-card">
                <button type="button" className="photo" onClick={() => openDish(dish)}>
                  {dish.includes?.length ? <SetPlate dish={dish} /> : <Img src={dish.image} alt={dish.name} />}
                </button>
                <div className="body">
                  <span className="idx">
                    0{i + 1} / {dish.kicker}
                  </span>
                  <h3>{dish.name}</h3>
                  <p>{dish.lore}</p>
                  <div className="row">
                    <span className="price">{rub(dish.price)}</span>
                    <button className="add" type="button" onClick={() => openDish(dish)}>
                      Читать
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="rail-progress" aria-hidden="true">
            <i style={{ width: `${Math.max(railPos * 100, 6)}%` }} />
          </div>
        </div>
      </section>

      <HugeChoice />

      <section className="menu" id="menu">
        <div className="wrap">
          <div className="menu-head">
            <p className="sec-kicker">03 — Меню</p>
            <h2 className="sec-title">
              Безумно огромный <em>выбор</em>
            </h2>
            <p className="lede">Нажмите карточку, прочитайте и позвоните. Другого способа заказать нет.</p>
          </div>
          <label className="find-wrap">
            <span className="sr-only">Поиск по меню</span>
            <input
              className="find"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Найти: дракон, соба, филадельфия…"
            />
          </label>
          <div className="cats" role="tablist" aria-label="Разделы меню">
            {CATS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={cn("cat", cat === c.id && "is-on")}
                onClick={() => chooseCat(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className={cn("menu-stage", cutting && "is-cutting")}>
            {visible.length === 0 ? (
              <p className="lede">Такого реза нет. Позвоните — оператор подскажет близкое.</p>
            ) : (
              <div className="tiles" key={`${cat}-${query}`}>
                {visible.map((dish, i) => (
                  <button
                    key={dish.id}
                    type="button"
                    className={cn("tile", dish.id === "nuggets" && "is-solo", dish.includes?.length && "is-set")}
                    style={{ animationDelay: `${Math.min(i, 16) * 0.045}s` } as CSSProperties}
                    onClick={() => openDish(dish)}
                  >
                    {dish.includes?.length ? (
                      <SetPlate dish={dish} />
                    ) : (
                      <Img src={dish.image} alt="" style={{ objectPosition: "center" }} />
                    )}
                    <span className="tile-shade" />
                    <span className="tile-slash" aria-hidden="true" />
                    <span className="tile-meta">
                      <em>{dish.kicker}</em>
                      <strong>{dish.name}</strong>
                      <b>{rub(dish.price)}</b>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="menu-note">
            Цены — с карты доставки. Если оператор назовёт другую, верна цена в трубке. Состав длинных позиций тоже подтверждается только голосом. Связаться можно лишь по {PHONE_PRETTY}.
          </p>
        </div>
      </section>

      <section className="callblock" id="call">
        <div className="wrap call-grid">
          <div>
            <p className="sec-kicker">04 — Только номер</p>
            <h2 className="sec-title">
              Продиктуйте. <em>Мы режем.</em>
            </h2>
            <p className="lede">
              Здесь нет корзины, формы и мессенджера. Доставка по Армянску живёт в одном звонке: с 11:00 до 23:00, каждый день. Назовите блюдо, адрес и время.
            </p>
            <div className="facts">
              <div className="fact">
                <b>11:00</b>
                <span>открываем линию</span>
              </div>
              <div className="fact">
                <b>23:00</b>
                <span>последний звонок</span>
              </div>
              <div className="fact">
                <b>{CITY}</b>
                <span>доставка по городу</span>
              </div>
            </div>
          </div>
          <aside className="poster">
            <p className="sec-kicker">{open ? "Линия открыта" : "Откроемся в 11:00"}</p>
            <div className="hours">
              11:00
              <br />
              23:00
            </div>
            <a className="giant-phone" href={`tel:${PHONE_TEL}`}>
              {PHONE_PRETTY}
            </a>
            <p>Армянск. Ежедневно. Других способов заказать нет.</p>
            <CallLink label="Позвонить сейчас" />
          </aside>
        </div>
      </section>

      <footer className="foot">
        <div>
          <strong>KING ROLL</strong>
          <div>
            {CITY} · {HOURS}
          </div>
        </div>
        <a href={`tel:${PHONE_TEL}`}>{PHONE_PRETTY}</a>
        <div>© {new Date().getFullYear()} · доставка суши</div>
      </footer>

      <div className="mobbar">
        <a href="#menu">Меню</a>
        <a className="mob-call" href={`tel:${PHONE_TEL}`}>
          {PHONE_PRETTY}
        </a>
      </div>

      {phase === "done" && !active && (
        <a className="fab" href={`tel:${PHONE_TEL}`}>
          <span className="pulse" />
          <IconPhone />
          Звонить
        </a>
      )}

      {active && (
        <div className="sheet-back" onClick={() => setActiveId(null)}>
          <article
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={active.name}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={cn("sheet-shot", active.id === "nuggets" && "is-solo", active.includes?.length && "is-set")}>
              {active.includes?.length ? (
                <SetPlate dish={active} />
              ) : (
                <Img src={active.image} alt={active.name} />
              )}
              <span className="sheet-blade" aria-hidden="true" />
            </div>
            <div className="sheet-copy">
              <div className="sheet-top">
                <span className="k">{active.kicker}</span>
                <button className="x" type="button" onClick={() => setActiveId(null)} aria-label="Закрыть">
                  ×
                </button>
              </div>
              <h2>{active.name}</h2>
              <div className="price">{rub(active.price)}</div>
              <p className="lore-text">{active.lore}</p>
              {active.includes && active.includes.length > 0 && (
                <ol className="includes">
                  {active.includes.map((part, index) => (
                    <li key={`${part.name}-${index}`}>
                      <img src={dishById(part.id)?.image ?? active.image} alt="" />
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <em>{part.name}</em>
                    </li>
                  ))}
                </ol>
              )}
              <p className="menu-note">Звонки ежедневно {HOURS}. Другого канала нет.</p>
              <CallLink label="Заказать это голосом" />
            </div>
          </article>
        </div>
      )}
    </div>
  );
}