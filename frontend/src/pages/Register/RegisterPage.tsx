import AuthForm from '../Login/AuthForm'
import type { DemoUser } from '../../types/auth'
import type { Route } from '../../routes/navigation'
export default function RegisterPage(props: { onSuccess: (user: DemoUser) => void; navigate: (route: Route) => void }) { return <AuthForm mode="register" {...props}/> }
