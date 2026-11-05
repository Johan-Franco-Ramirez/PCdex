import AuthForm from './AuthForm'
import type { AuthUser } from '../../services/api'
import type { Route } from '../../routes/navigation'
export default function LoginPage(props: { onSuccess: (user: AuthUser) => void; navigate: (route: Route) => void }) { return <AuthForm mode="login" {...props}/> }
