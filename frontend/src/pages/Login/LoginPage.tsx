import AuthForm from './AuthForm'
import type { DemoUser } from '../../types/auth'
import type { Route } from '../../routes/navigation'
export default function LoginPage(props: { onSuccess: (user: DemoUser) => void; navigate: (route: Route) => void }) { return <AuthForm mode="login" {...props}/> }
