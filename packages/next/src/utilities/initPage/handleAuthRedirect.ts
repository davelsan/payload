import { redirect } from 'next/navigation.js'
import qs from 'qs'

import { isAdminAuthRoute, isAdminRoute } from './shared.js'

export const handleAuthRedirect = ({
  config,
  redirectUnauthenticatedUser,
  route,
  searchParams,
}: {
  config
  redirectUnauthenticatedUser: boolean | string
  route: string
  searchParams: { [key: string]: string | string[] }
}) => {
  const {
    admin: {
      routes: { login: loginRouteFromConfig },
    },
    routes: { admin: adminRoute },
  } = config

  if (!isAdminAuthRoute(config, route, adminRoute)) {
    if (searchParams && 'redirect' in searchParams) delete searchParams.redirect

    const redirectRoute = encodeURIComponent(
      route + Object.keys(searchParams ?? {}).length
        ? `${qs.stringify(searchParams, { addQueryPrefix: true })}`
        : undefined,
    )

    const adminLoginRoute = `${adminRoute}${loginRouteFromConfig}`

    const customLoginRoute =
      typeof redirectUnauthenticatedUser === 'string' ? redirectUnauthenticatedUser : undefined

    const loginRoute = isAdminRoute(route, adminRoute)
      ? adminLoginRoute
      : customLoginRoute || loginRouteFromConfig

    const parsedLoginRouteSearchParams = qs.parse(loginRoute.split('?')[1] ?? '')

    const searchParamsWithRedirect = `${qs.stringify(
      {
        ...parsedLoginRouteSearchParams,
        ...(redirectRoute ? { redirect: redirectRoute } : {}),
      },
      { addQueryPrefix: true },
    )}`

    redirect(`${loginRoute.split('?')[0]}${searchParamsWithRedirect}`)
  }
}
