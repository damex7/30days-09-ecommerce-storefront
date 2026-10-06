import { useState } from 'react'
import { Icon } from '../ui/Icon.jsx'
import { DiscountSticker } from './Price.jsx'
import { cx } from '../../lib/cx.js'

/*
  Main image plus thumbnail buttons. The main image's alt says which
  product and which picture it is; the thumbnails are buttons named
  "Show image 2 of 4", with aria-current on the one being shown.
*/
export function Gallery({ title, images, discountPct }) {
  const [index, setIndex] = useState(0)
  const count = images.length
  const go = (i) => setIndex((i + count) % count)

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-line bg-[#f4efe6]">
        <img
          src={images[index]}
          alt={count > 1 ? `${title}, image ${index + 1} of ${count}` : title}
          className="size-full object-contain p-6"
          width="600"
          height="600"
        />
        <DiscountSticker pct={discountPct} className="absolute top-4 left-4 text-sm" />
        {count > 1 && (
          <>
            <ArrowButton side="left" onClick={() => go(index - 1)} label="Previous image" />
            <ArrowButton side="right" onClick={() => go(index + 1)} label="Next image" />
          </>
        )}
      </div>

      {count > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <li key={src} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-current={i === index ? 'true' : undefined}
                className={cx(
                  'block size-18 overflow-hidden rounded-xl border-2 bg-[#f4efe6] transition-colors',
                  i === index ? 'border-indigo dark:border-indigo-ink' : 'border-transparent hover:border-line-strong',
                )}
              >
                <img src={src} alt="" loading="lazy" className="size-full object-contain p-1" />
                <span className="sr-only">
                  Show image {i + 1} of {count}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ArrowButton({ side, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-panel/90 text-ink shadow-card hover:bg-panel',
        side === 'left' ? 'left-3' : 'right-3',
      )}
    >
      <Icon name={side} />
      <span className="sr-only">{label}</span>
    </button>
  )
}
