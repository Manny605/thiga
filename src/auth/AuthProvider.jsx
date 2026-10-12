import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { fetchProfile } from '../lib/profile'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  // Démarre à true : entre la résolution de la session et le premier rendu de
  // l'effet ci-dessous, `profile` vaut null sans que ce soit une réponse. Sans
  // ce drapeau, les gardes de route liraient « connecté sans profil » et
  // redirigeraient à tort.
  const [profileLoading, setProfileLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      // Si l'URL de retour n'est pas autorisée côté Supabase, le lien atterrit
      // sur l'accueil, qui renvoie un connecté vers son portail : on ramène
      // l'utilisateur sur la page où il choisit son nouveau mot de passe.
      if (event === 'PASSWORD_RECOVERY' && window.location.pathname !== '/nouveau-mot-de-passe') {
        window.location.assign('/nouveau-mot-de-passe')
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id

  useEffect(() => {
    let active = true

    if (!userId) {
      setProfile(null)
      setProfileLoading(false)
      return undefined
    }

    setProfileLoading(true)
    fetchProfile(userId)
      .then((data) => { if (active) setProfile(data) })
      .catch(() => { if (active) setProfile(null) })
      .finally(() => { if (active) setProfileLoading(false) })

    return () => { active = false }
  }, [userId, reloadKey])

  /** À appeler après une modification du nom/de la ville dans les paramètres. */
  const refreshProfile = useCallback(() => setReloadKey((k) => k + 1), [])

  const value = useMemo(() => {
    /** Inscription ; `data` alimente le trigger `handle_new_user` (role, full_name, phone, city, trade). */
    // Le lien de confirmation ramène sur la connexion, qui redirige un compte
    // tout juste confirmé vers son espace. L'URL doit figurer parmi les
    // « Redirect URLs » de Supabase Auth, sinon Supabase renvoie au Site URL.
    const signUp = (email, password, data) =>
      supabase.auth.signUp({
        email,
        password,
        options: { data, emailRedirectTo: `${window.location.origin}/connexion` },
      })

    const signIn = (email, password) =>
      supabase.auth.signInWithPassword({ email, password })

    const signOut = () => supabase.auth.signOut()

    return {
      session,
      user: session?.user ?? null,
      profile,
      loading,
      profileLoading,
      /** Session *et* profil résolus : les gardes de route peuvent décider. */
      ready: !loading && !profileLoading,
      isAuthenticated: !!session,
      isSuspended: profile?.status === 'suspended',
      /** Mot de passe temporaire défini par l'admin : à remplacer avant d'entrer dans son espace. */
      mustChangePassword: !!session?.user?.user_metadata?.must_change_password,
      refreshProfile,
      signUp,
      signIn,
      signOut,
    }
  }, [session, profile, loading, profileLoading, refreshProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>')
  return ctx
}
