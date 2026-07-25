import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

export default function Layout() {
  const { pathname } = useLocation()

  // Corps en bloc obligatoire. Avec une flèche à corps concis
  // — useEffect(() => window.scrollTo(0, 0), [pathname]) — l'effet renvoie
  // la valeur de scrollTo, que React prend pour une fonction de nettoyage
  // et tente d'appeler au démontage : « destroy is not a function ».
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col bg-sand-50">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
