import { STEPS } from '../../lib/validation.js'
import { Icon } from '../ui/Icon.jsx'
import { cx } from '../../lib/cx.js'

/*
  1 Delivery — 2 Payment — 3 Review
  An ordered list (the steps have an order), with aria-current="step" on
  the one you're on. Finished steps are buttons, so you can jump back to
  edit them; later steps aren't clickable until you get there.
*/
export function Stepper({ current, onGoTo }) {
  return (
    <nav aria-label="Checkout progress">
      <ol className="flex items-center">
        {STEPS.map((step, i) => {
          const done = step.number < current
          const active = step.number === current
          const circle = cx(
            'grid size-8 shrink-0 place-items-center rounded-full font-mono text-sm font-semibold',
            done && 'bg-leaf text-paper',
            active && 'bg-palm text-on-palm ring-4 ring-palm/20',
            !done && !active && 'border border-line-strong text-ink-faint',
          )
          const content = (
            <>
              <span className={circle}>{done ? <Icon name="check" className="size-4" /> : step.number}</span>
              <span className={cx('text-sm font-bold', !done && !active && 'text-ink-faint')}>
                {step.label}
                {done && <span className="sr-only"> (done, edit)</span>}
              </span>
            </>
          )
          return (
            <li key={step.number} aria-current={active ? 'step' : undefined} className={cx('flex items-center', i < STEPS.length - 1 && 'flex-1')}>
              {done ? (
                <button type="button" onClick={() => onGoTo(step.number)} className="flex min-h-11 items-center gap-2 rounded-full pr-2 hover:underline">
                  {content}
                </button>
              ) : (
                <span className="flex min-h-11 items-center gap-2 pr-2">{content}</span>
              )}
              {i < STEPS.length - 1 && (
                <span aria-hidden="true" className={cx('mx-1 h-0.5 flex-1 rounded-full sm:mx-3', done ? 'bg-leaf' : 'bg-line')} />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
