/*
import { createContext, useContext } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import superjson from 'superjson'
// import { createTRPCClient, httpBatchStreamLink } from '@trpc/client'
// import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'

// import type { TRPCRouter } from '@/integrations/trpc/router'
// import { TRPCProvider } from '@/integrations/trpc/react'

function getUrl() {
  const base = (() => {
    if (typeof window !== 'undefined') return ''
    return `http://localhost:${process.env.PORT ?? 3000}`
  })()
  return `${base}/api/trpc`
}

// export const trpcClient = createTRPCClient<TRPCRouter>({
//   links: [
//     httpBatchStreamLink({
//       transformer: superjson,
//       url: getUrl(),
//     }),
//   ],
// })

export function getContext() {
  const queryClient = new QueryClient()
  // const queryClient = new QueryClient({
  //   defaultOptions: {
  //     dehydrate: { serializeData: superjson.serialize },
  //     hydrate: { deserializeData: superjson.deserialize },
  //   },
  // })

  // const serverHelpers = createTRPCOptionsProxy({
  //   client: trpcClient,
  //   queryClient: queryClient,
  // })
  const context = {
    queryClient,
    // trpc: serverHelpers,
    url: getUrl(),
  }

  return context
}

const Context = createContext(null) // <ReturnType<typeof getContext> | null>

export function useTanstackContext() {
  const context = useContext(Context)

  if (!context) {
    throw new Error(
      'useTanstackContext must be used within TanstackQueryProvider',
    )
  }

  return context
}

export default function TanstackQueryProvider({
  children,
  context,
// }: {
//   children: ReactNode
//   context: ReturnType<typeof getContext>
}) {
  const { queryClient } = context

  return (
    <Context.Provider value={context}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </Context.Provider>
  )

  // return (
  //   <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
  //     {children}
  //   </TRPCProvider>
  // )
}
*/
