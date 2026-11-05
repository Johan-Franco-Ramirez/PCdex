import AuthForm from '../Login/AuthForm'
import type { AuthUser } from '../../services/api'
import type { Route } from '../../routes/navigation'
export default function RegisterPage(props: { onSuccess: (user: AuthUser) => void; navigate: (route: Route) => void }) { return <AuthForm mode="register" {...props}/> }
