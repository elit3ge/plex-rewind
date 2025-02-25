'use client'

import plexSvg from '@/assets/plex.svg'
import Loader from '@/components/Loader'
import { createPlexAuthUrl, getPlexAuthToken } from '@/utils/auth'
import { isDashboardDisabled, isRewindDisabled } from '@/utils/config'
import { fadeIn } from '@/utils/motion'
import { Library } from '@/utils/types'
import { motion } from 'framer-motion'
import { snakeCase } from 'lodash'
import { signIn, signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Page() {
  const [libraries, setLibraries] = useState<Library[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated'

  const handleLogin = async () => {
    const plexUrl = await createPlexAuthUrl()
    router.push(plexUrl)
  }

  useEffect(() => {
    const plexPinId = searchParams.get('plexPinId')

    if (plexPinId) {
      const authUser = async () => {
        setIsLoading(true)
        const plexAuthToken = await getPlexAuthToken(plexPinId)

        try {
          const res = await signIn('plex', {
            authToken: plexAuthToken,
            callbackUrl: '/',
          })

          if (res?.error) {
            console.error('Failed to sign in:', res.error)
          }
          setIsLoading(false)
        } catch (error) {
          console.error('Error during sign-in:', error)
          setIsLoading(false)
        }
      }

      authUser()
    }
  }, [searchParams])

  useEffect(() => {
    if (status === 'authenticated') {
      const getLibraries = async () => {
        setIsLoading(true)

        try {
          const res = await fetch('/api/libraries')
          const data = await res.json()

          setLibraries(data)
        } catch (error) {
          console.error('Error fetching libraries:', error)
        }

        setIsLoading(false)
      }

      getLibraries()
    } else if (status !== 'loading') {
      setIsLoading(false)
    }
  }, [status])

  if (isLoading) {
    return <Loader />
  }

  return (
    <div className='flex flex-col items-center text-center'>
      {session?.user?.image && (
        <div className='relative mb-5 size-24'>
          <Image
            src={session?.user?.image}
            alt={`${session?.user?.name} profile picture`}
            className='rounded-full object-cover'
            sizes='10rem'
            fill
            priority
          />
        </div>
      )}

      <h1 className='mb-6 flex items-center gap-4 text-4xl font-bold'>
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Image
            src={plexSvg}
            className='h-12 w-auto'
            alt='Plex logo'
            priority
          />
        </motion.div>
        <motion.span
          variants={fadeIn}
          initial='hidden'
          animate='show'
          transition={{ delay: 0.4 }}
        >
          rewind
        </motion.span>
      </h1>

      {!isLoggedIn && (
        <button
          className='button button-sm mx-auto from-yellow-500 via-yellow-600 to-neutral-700'
          onClick={() => handleLogin()}
        >
          Log in with Plex
        </button>
      )}

      {!isRewindDisabled && isLoggedIn && (
        <Link href='/rewind' className='button mb-4'>
          Get started
        </Link>
      )}
      {!isDashboardDisabled && isLoggedIn && (
        <Link
          href={`/dashboard/${snakeCase(libraries[0]?.section_name)}`}
          className={
            isRewindDisabled ? 'button' : 'text-slate-300 hover:opacity-75'
          }
        >
          Dashboard
        </Link>
      )}

      {isLoggedIn && (
        <button
          onClick={() => signOut()}
          className='mt-16 block opacity-50 hover:opacity-40'
        >
          Sign out
        </button>
      )}
    </div>
  )
}
