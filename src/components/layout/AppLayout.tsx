import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function AppLayout() {
  return (
    <div className="min-h-dvh flex flex-col bg-[#f0f2f5]">
      <Navbar />
      <main className="flex-1 w-full pb-20 md:pb-0">
        <Outlet />
      </main>
    </div>
  )
}
