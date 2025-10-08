import { ClerkProvider as ClerkNextJSProvider } from '@clerk/nextjs'
import { shadcn, dark, neobrutalism } from '@clerk/themes'

type ClerkProviderProps = React.ComponentProps<typeof ClerkNextJSProvider>

export function ClerkProvider({ children, appearance, ...props }: ClerkProviderProps) {
  return (
    <ClerkNextJSProvider
      appearance={{
        theme: neobrutalism,
        ...appearance,
      }}
      {...props}
    >
      {children}
    </ClerkNextJSProvider>
  )
}
