import { redirect } from 'next/navigation'

/**
 * The shell layout owns the nav, store and persistence controller; every screen
 * lives under a named route. `/` has no content of its own, so it lands on the
 * import step, which is where a session without a dataset has to start.
 */
export default function Home() {
  redirect('/import')
}
