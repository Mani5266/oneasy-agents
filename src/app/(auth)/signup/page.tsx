import { redirect } from 'next/navigation'

export default function SignupPage() {
  // Signup is handled on the login page with tab toggle
  redirect('/login')
}
