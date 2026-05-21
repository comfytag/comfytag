import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import SavedEventsClient from './SavedEventsClient'

export default function SavedPage() {
  return (
    <>
      <Navbar />
      <SavedEventsClient />
      <Footer />
    </>
  )
}
