import { getPayloadHMR } from '@payloadcms/next/utilities'
import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import React from 'react'

import config from '../../../payload.config'
import { Gutter } from '../_components/Gutter'
import { RenderParams } from '../_components/RenderParams'
import { LoginForm } from './LoginForm'
import classes from './index.module.scss'

export default async function Login() {
  const headers = getHeaders()
  const payload = await getPayloadHMR({ config })
  const { user } = await payload.auth({ headers })

  if (user) {
    redirect(`/account?message=${encodeURIComponent('You are already logged in.')}`)
  }

  return (
    <Gutter className={classes.login}>
      <RenderParams className={classes.params} />
      <h1>Log in</h1>
      <LoginForm />
    </Gutter>
  )
}
